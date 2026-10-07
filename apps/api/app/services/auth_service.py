import secrets
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.rate_limit import PerAccountLockout
from app.core.security import (
    create_access_token,
    generate_opaque_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User

# Cryptographically valid Argon2id hash generated at startup using the active PasswordHasher
# parameters. Ensures ph.verify executes the full Argon2id key derivation (~40ms), equalizing
# login timing between registered and unknown emails to prevent account enumeration.
DUMMY_HASH = hash_password(secrets.token_hex(32))
MAX_FAILED_LOGINS = 5
LOCKOUT_MESSAGE = (
    "Account is temporarily locked due to repeated failed login attempts. Please try again later."
)


def ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


async def register_user(db: AsyncSession, email: str, password: str, full_name: str) -> User:
    """Register a new user with Argon2id password hashing."""
    normalized_email = email.strip().lower()

    stmt = select(User).where(User.email == normalized_email)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    pwd_hash = hash_password(password)
    user = User(
        email=normalized_email,
        password_hash=pwd_hash,
        full_name=full_name.strip(),
        role="user",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def login_user(
    db: AsyncSession,
    email: str,
    password: str,
    user_agent: str | None = None,
    ip_hash: str | None = None,
) -> tuple[str, str, User]:
    """Authenticate user with per-account lockout protection.

    Returns (access_token, raw_refresh_token, user).
    """
    normalized_email = email.strip().lower()
    now = datetime.now(UTC)

    # 1. Check existing user in database
    stmt = select(User).where(User.email == normalized_email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    # 2. Check if locked out (either via DB persistent locked_until or in-memory tracker)
    is_locked = False
    retry_after = 900  # Default 15 minutes in seconds

    if user:
        locked_until_utc = ensure_utc(user.locked_until)
        if locked_until_utc and locked_until_utc > now:
            is_locked = True
            retry_after = max(int((locked_until_utc - now).total_seconds()), 1)

    if not is_locked and PerAccountLockout.is_locked_out(normalized_email):
        is_locked = True
        retry_after = PerAccountLockout.get_remaining_lockout_seconds(normalized_email)

    if is_locked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=LOCKOUT_MESSAGE,
            headers={"Retry-After": str(retry_after)},
        )

    # 3. Non-existent email -> dummy password comparison to equalize timing, then 401
    if not user:
        verify_password(DUMMY_HASH, password)
        PerAccountLockout.record_failure(normalized_email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # 4. Registered user wrong password -> update DB failed_login_count & locked_until
    if not verify_password(user.password_hash, password):
        PerAccountLockout.record_failure(normalized_email)
        user.failed_login_count += 1
        if user.failed_login_count >= MAX_FAILED_LOGINS:
            user.locked_until = now + timedelta(minutes=15)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # 5. Password correct -> reset DB & in-memory lockout counters
    PerAccountLockout.record_success(normalized_email)
    user.failed_login_count = 0
    user.locked_until = None
    user.last_login_at = now

    # Issue access token & rotating refresh token
    access_token = create_access_token(user.id, role=user.role)
    raw_refresh_token = generate_opaque_token()
    token_h = hash_token(raw_refresh_token)
    family_id = uuid.uuid4()
    expires_at = now + timedelta(days=settings.REFRESH_TOKEN_TTL_DAYS)

    refresh_entity = RefreshToken(
        user_id=user.id,
        family_id=family_id,
        token_hash=token_h,
        expires_at=expires_at,
        user_agent=user_agent,
        ip_hash=ip_hash,
    )
    db.add(refresh_entity)
    await db.commit()
    await db.refresh(user)

    return access_token, raw_refresh_token, user


async def refresh_access_token(
    db: AsyncSession,
    raw_refresh_token: str,
    user_agent: str | None = None,
    ip_hash: str | None = None,
) -> tuple[str, str, User]:
    """Rotate refresh token; if reuse is detected, revoke the whole family."""
    if not raw_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )

    token_h = hash_token(raw_refresh_token)
    stmt = select(RefreshToken).where(RefreshToken.token_hash == token_h)
    res = await db.execute(stmt)
    token_entity = res.scalar_one_or_none()

    if not token_entity:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    now = datetime.now(UTC)

    # REUSE DETECTION: if token is already revoked, revoke whole token family
    if token_entity.revoked_at is not None:
        revoke_family_stmt = (
            update(RefreshToken)
            .where(
                RefreshToken.family_id == token_entity.family_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=now)
        )
        await db.execute(revoke_family_stmt)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token reuse detected. Token family revoked.",
        )

    expires_at_utc = ensure_utc(token_entity.expires_at)
    if expires_at_utc and expires_at_utc < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    # Token is valid -> revoke current token and issue new one in family
    new_token_id = uuid.uuid4()
    token_entity.revoked_at = now
    token_entity.replaced_by = new_token_id

    new_raw_refresh_token = generate_opaque_token()
    new_token_h = hash_token(new_raw_refresh_token)
    expires_at = now + timedelta(days=settings.REFRESH_TOKEN_TTL_DAYS)

    new_token_entity = RefreshToken(
        id=new_token_id,
        user_id=token_entity.user_id,
        family_id=token_entity.family_id,
        token_hash=new_token_h,
        expires_at=expires_at,
        user_agent=user_agent,
        ip_hash=ip_hash,
    )
    db.add(new_token_entity)

    # Fetch user
    user_stmt = select(User).where(User.id == token_entity.user_id, User.is_active.is_(True))
    user_res = await db.execute(user_stmt)
    user = user_res.scalar_one_or_none()

    if not user:
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not active",
        )

    new_access_token = create_access_token(user.id, role=user.role)
    await db.commit()

    return new_access_token, new_raw_refresh_token, user


async def logout_user(db: AsyncSession, raw_refresh_token: str | None) -> None:
    """Revoke refresh token family on logout."""
    if not raw_refresh_token:
        return

    token_h = hash_token(raw_refresh_token)
    stmt = select(RefreshToken).where(RefreshToken.token_hash == token_h)
    res = await db.execute(stmt)
    token_entity = res.scalar_one_or_none()

    if token_entity:
        now = datetime.now(UTC)
        revoke_family_stmt = (
            update(RefreshToken)
            .where(
                RefreshToken.family_id == token_entity.family_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=now)
        )
        await db.execute(revoke_family_stmt)
        await db.commit()


async def update_user_profile(
    db: AsyncSession, user: User, full_name: str | None, password: str | None
) -> User:
    """Update user's full name or password."""
    if full_name:
        user.full_name = full_name.strip()
    if password:
        user.password_hash = hash_password(password)
    await db.commit()
    await db.refresh(user)
    return user
