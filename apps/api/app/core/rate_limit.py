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
    """In-memory sliding window rate limiter per client IP."""

    _requests: ClassVar[dict[str, list[datetime]]] = {}

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

        valid_timestamps.append(now)
        cls._requests[client_ip] = valid_timestamps

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
      Limitation: In-memory state for non-existent emails resets if the application
      process restarts.
    """

    _failed_attempts: ClassVar[dict[str, list[datetime]]] = {}
    MAX_FAILED_ATTEMPTS: ClassVar[int] = 5
    LOCKOUT_DURATION: ClassVar[timedelta] = timedelta(minutes=15)

    @classmethod
    def is_locked_out(cls, email: str) -> bool:
        key = email.strip().lower()
        now = datetime.now(UTC)
        cutoff = now - cls.LOCKOUT_DURATION

        attempts = cls._failed_attempts.get(key, [])
        recent_attempts = [t for t in attempts if t > cutoff]
        cls._failed_attempts[key] = recent_attempts
        return len(recent_attempts) >= cls.MAX_FAILED_ATTEMPTS

    @classmethod
    def get_remaining_lockout_seconds(cls, email: str) -> int:
        key = email.strip().lower()
        now = datetime.now(UTC)
        cutoff = now - cls.LOCKOUT_DURATION

        attempts = cls._failed_attempts.get(key, [])
        recent_attempts = [t for t in attempts if t > cutoff]
        if recent_attempts:
            oldest = min(recent_attempts)
            remaining = int((oldest + cls.LOCKOUT_DURATION - now).total_seconds())
            return max(remaining, 1)
        return int(cls.LOCKOUT_DURATION.total_seconds())

    @classmethod
    def record_failure(cls, email: str) -> None:
        key = email.strip().lower()
        now = datetime.now(UTC)
        cutoff = now - cls.LOCKOUT_DURATION

        attempts = cls._failed_attempts.get(key, [])
        recent_attempts = [t for t in attempts if t > cutoff]
        recent_attempts.append(now)
        cls._failed_attempts[key] = recent_attempts

    @classmethod
    def record_success(cls, email: str) -> None:
        key = email.strip().lower()
        if key in cls._failed_attempts:
            del cls._failed_attempts[key]

    @classmethod
    def reset(cls) -> None:
        """Reset all lockout state (for test setup)."""
        cls._failed_attempts.clear()
