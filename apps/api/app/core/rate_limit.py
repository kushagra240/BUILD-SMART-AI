from datetime import UTC, datetime, timedelta
from typing import ClassVar

from fastapi import HTTPException, Request, status


class RateLimiter:
    """In-memory sliding window rate limiter per client IP."""

    _requests: ClassVar[dict[str, list[datetime]]] = {}

    @classmethod
    def check_rate_limit(
        cls, request: Request, max_requests: int = 10, window_seconds: int = 60
    ) -> None:
        client_ip = request.client.host if request.client else "unknown"
        now = datetime.now(UTC)
        cutoff = now - timedelta(seconds=window_seconds)

        timestamps = cls._requests.get(client_ip, [])
        valid_timestamps = [t for t in timestamps if t > cutoff]

        if len(valid_timestamps) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
            )

        valid_timestamps.append(now)
        cls._requests[client_ip] = valid_timestamps

    @classmethod
    def reset(cls) -> None:
        """Clear all rate limit records (useful for test setup)."""
        cls._requests.clear()


class PerIpAccountLockout:
    """Per-account and per-IP login failure lockout manager.

    Prevents account lockout Denial of Service (DoS) attacks where an attacker
    attempts repeated bad passwords to lock out legitimate users from other IPs.
    """

    # Key: (normalized_email, client_ip) -> list of failure datetimes
    _failed_attempts: ClassVar[dict[tuple[str, str], list[datetime]]] = {}
    MAX_FAILED_ATTEMPTS: ClassVar[int] = 5
    LOCKOUT_DURATION: ClassVar[timedelta] = timedelta(minutes=15)

    @classmethod
    def check_lockout(cls, email: str, client_ip: str) -> None:
        key = (email.strip().lower(), client_ip)
        now = datetime.now(UTC)
        cutoff = now - cls.LOCKOUT_DURATION

        attempts = cls._failed_attempts.get(key, [])
        recent_attempts = [t for t in attempts if t > cutoff]
        cls._failed_attempts[key] = recent_attempts

        if len(recent_attempts) >= cls.MAX_FAILED_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Account is temporarily locked for this IP "
                    "due to repeated failed login attempts."
                ),
            )

    @classmethod
    def record_failure(cls, email: str, client_ip: str) -> None:
        key = (email.strip().lower(), client_ip)
        now = datetime.now(UTC)
        cutoff = now - cls.LOCKOUT_DURATION

        attempts = cls._failed_attempts.get(key, [])
        recent_attempts = [t for t in attempts if t > cutoff]
        recent_attempts.append(now)
        cls._failed_attempts[key] = recent_attempts

    @classmethod
    def record_success(cls, email: str, client_ip: str) -> None:
        key = (email.strip().lower(), client_ip)
        if key in cls._failed_attempts:
            del cls._failed_attempts[key]

    @classmethod
    def reset(cls) -> None:
        """Reset all lockout state (for test setup)."""
        cls._failed_attempts.clear()
