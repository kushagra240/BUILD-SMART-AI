from fastapi import APIRouter, Cookie, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.rate_limit import RateLimiter
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    UserUpdateRequest,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

REFRESH_COOKIE_NAME = "buildsmart_refresh"


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Set opaque refresh token in HttpOnly cookie."""
    is_prod = settings.ENVIRONMENT == "production"
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/api/v1/auth",
        max_age=settings.REFRESH_TOKEN_TTL_DAYS * 24 * 3600,
    )


def clear_refresh_cookie(response: Response) -> None:
    """Clear refresh token cookie."""
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/v1/auth",
        httponly=True,
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    req: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Register a new user account."""
    RateLimiter.check_rate_limit(request)
    return await auth_service.register_user(
        db, email=req.email, password=req.password, full_name=req.full_name
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate user, return JWT access token, set HttpOnly refresh cookie."""
    RateLimiter.check_rate_limit(request)
    user_agent = request.headers.get("User-Agent")
    client_ip = request.client.host if request.client else "unknown"

    access_token, raw_refresh_token, _user = await auth_service.login_user(
        db,
        email=req.email,
        password=req.password,
        user_agent=user_agent,
        ip_hash=client_ip,
    )

    set_refresh_cookie(response, raw_refresh_token)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_TTL_MIN * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    response: Response,
    buildsmart_refresh: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Rotate refresh token using HttpOnly cookie, returning a new access token."""
    RateLimiter.check_rate_limit(request)
    user_agent = request.headers.get("User-Agent")
    client_ip = request.client.host if request.client else "unknown"

    raw_token = buildsmart_refresh or ""

    new_access_token, new_raw_refresh_token, _user = await auth_service.refresh_access_token(
        db,
        raw_refresh_token=raw_token,
        user_agent=user_agent,
        ip_hash=client_ip,
    )

    set_refresh_cookie(response, new_raw_refresh_token)
    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_TTL_MIN * 60,
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    response: Response,
    buildsmart_refresh: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Revoke refresh token family and clear auth cookie."""
    if buildsmart_refresh:
        await auth_service.logout_user(db, buildsmart_refresh)
    clear_refresh_cookie(response)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    """Get current authenticated user profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Update current authenticated user's profile or password."""
    return await auth_service.update_user_profile(
        db, user=current_user, full_name=req.full_name, password=req.password
    )
