from collections import OrderedDict
from datetime import UTC, datetime, timedelta
from typing import ClassVar

from fastapi import HTTPException, Request, status

from app.core.config import settings


def get_client_ip(request: Request) -> str:
    """Extract real client IP address.

    Only reads X-Forwarded-For if the immediate connection host is present in TRUSTED_PROXIES
    to prevent header spoofing attacks.
    """
    direct_ip = request.client.host if request.client else "127.0.0.1"
    trusted_list = [
        ip.strip() for ip in settings.TRUSTED_PROXIES.split(",") if ip.strip()
    ]

    # If direct connection is not a trusted proxy, ignore X-Forwarded-For
    if direct_ip not in trusted_list and "*" not in trusted_list:
        return direct_ip

    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        ips = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()]
        if ips:
            return ips[0]

    return direct_ip


class RateLimiter:
    """In-memory sliding window rate limiter per client IP with cap and expiration."""

    _requests: ClassVar[OrderedDict[str, list[datetime]]] = OrderedDict()
    MAX_TRACKED_IPS: ClassVar[int] = 10_000

    @classmethod
    def _prune_expired(cls, now: datetime, window_seconds: int) -> None:
        cutoff = now - timedelta(seconds=window_seconds)
        expired_ips = [
            ip for ip, timestamps in cls._requests.items()
            if not timestamps or timestamps[-1] <= cutoff
        ]
        for ip in expired_ips:
            cls._requests.pop(ip, None)

    @classmethod
    def check_rate_limit(
        cls, request: Request, max_requests: int = 10, window_seconds: int = 60
    ) -> None:
        client_ip = get_client_ip(request)
        now = datetime.now(UTC)
        cutoff = now - timedelta(seconds=window_seconds)

        timestamps = cls._requests.get(client_ip, [])
        valid_timestamps = [t for t in timestamps if t > cutoff]

        if len(valid_timestamps) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                headers={"Retry-After": str(window_seconds)},
            )

        if client_ip not in cls._requests:
            if len(cls._requests) >= cls.MAX_TRACKED_IPS:
                cls._prune_expired(now, window_seconds)
            while len(cls._requests) >= cls.MAX_TRACKED_IPS:
                cls._requests.popitem(last=False)

        valid_timestamps.append(now)
        cls._requests[client_ip] = valid_timestamps
        cls._requests.move_to_end(client_ip)

    @classmethod
    def reset(cls) -> None:
        """Clear all rate limit records (useful for test setup)."""
        cls._requests.clear()


class PerAccountLockout:
    """Global per-account in-memory lockout tracker for non-existent or un-instantiated accounts.

    NOTE ON LIMITATION:
    - Registered user accounts use database columns `failed_login_count` and `locked_until`
      on the `users` table so lockout state persists across server restarts.
    - Non-existent emails use this in-memory `_failed_attempts` dictionary so attackers cannot
      probe non-existent email accounts without hitting the identical HTTP 429 Retry-After response.
      To prevent denial-of-service through unbounded growth, entries expire after LOCKOUT_DURATION
      and total tracked accounts are capped at MAX_TRACKED_ACCOUNTS using LRU eviction.
    """

    _failed_attempts: ClassVar[OrderedDict[str, list[datetime]]] = OrderedDict()
    MAX_FAILED_ATTEMPTS: ClassVar[int] = 5
    LOCKOUT_DURATION: ClassVar[timedelta] = timedelta(minutes=15)
    MAX_TRACKED_ACCOUNTS: ClassVar[int] = 10_000

    @classmethod
    def _prune_expired(cls, now: datetime) -> None:
        """Prune any accounts whose attempts have all expired beyond LOCKOUT_DURATION."""
        cutoff = now - cls.LOCKOUT_DURATION
        expired_keys = [
            email for email, attempts in cls._failed_attempts.items()
            if not attempts or attempts[-1] <= cutoff
        ]
        for key in expired_keys:
            cls._failed_attempts.pop(key, None)

    @classmethod
    def _enforce_cap(cls, now: datetime) -> None:
        """Prune expired entries and evict oldest if capacity is reached."""
        if len(cls._failed_attempts) >= cls.MAX_TRACKED_ACCOUNTS:
            cls._prune_expired(now)
        while len(cls._failed_attempts) >= cls.MAX_TRACKED_ACCOUNTS:
            cls._failed_attempts.popitem(last=False)

    @classmethod
    def is_locked_out(cls, email: str) -> bool:
        key = email.strip().lower()
        now = datetime.now(UTC)
        cutoff = now - cls.LOCKOUT_DURATION

        attempts = cls._failed_attempts.get(key)
        if attempts is None:
            return False

        recent_attempts = [t for t in attempts if t > cutoff]
        if not recent_attempts:
            cls._failed_attempts.pop(key, None)
            return False

        cls._failed_attempts[key] = recent_attempts
        cls._failed_attempts.move_to_end(key)
        return len(recent_attempts) >= cls.MAX_FAILED_ATTEMPTS

    @classmethod
    def get_remaining_lockout_seconds(cls, email: str) -> int:
        key = email.strip().lower()
        now = datetime.now(UTC)
        cutoff = now - cls.LOCKOUT_DURATION

        attempts = cls._failed_attempts.get(key)
        if not attempts:
            return int(cls.LOCKOUT_DURATION.total_seconds())

        recent_attempts = [t for t in attempts if t > cutoff]
        if not recent_attempts:
            cls._failed_attempts.pop(key, None)
            return int(cls.LOCKOUT_DURATION.total_seconds())

        cls._failed_attempts[key] = recent_attempts
        cls._failed_attempts.move_to_end(key)
        oldest = min(recent_attempts)
        remaining = int((oldest + cls.LOCKOUT_DURATION - now).total_seconds())
        return max(remaining, 1)

    @classmethod
    def record_failure(cls, email: str) -> None:
        key = email.strip().lower()
        now = datetime.now(UTC)
        cutoff = now - cls.LOCKOUT_DURATION

        if key not in cls._failed_attempts:
            cls._enforce_cap(now)
            cls._failed_attempts[key] = []
        else:
            cls._failed_attempts.move_to_end(key)

        attempts = [t for t in cls._failed_attempts[key] if t > cutoff]
        attempts.append(now)
        cls._failed_attempts[key] = attempts

    @classmethod
    def record_success(cls, email: str) -> None:
        key = email.strip().lower()
        cls._failed_attempts.pop(key, None)

    @classmethod
    def reset(cls) -> None:
        """Reset all lockout state (for test setup)."""
        cls._failed_attempts.clear()

