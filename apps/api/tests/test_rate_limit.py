from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException, Request

from app.core.rate_limit import PerAccountLockout, RateLimiter, get_client_ip


def create_mock_request(client_ip: str, headers: dict[str, str] | None = None) -> Request:
    headers_dict = headers or {}
    raw_headers = [
        (k.lower().encode("utf-8"), v.encode("utf-8")) for k, v in headers_dict.items()
    ]
    scope = {
        "type": "http",
        "client": (client_ip, 50000),
        "headers": raw_headers,
    }
    return Request(scope)


def test_rate_limiter_allows_under_limit() -> None:
    RateLimiter.reset()
    req = create_mock_request("1.2.3.4")
    for _ in range(5):
        RateLimiter.check_rate_limit(req, max_requests=10, window_seconds=60)


def test_rate_limiter_blocks_over_limit() -> None:
    RateLimiter.reset()
    req = create_mock_request("1.2.3.4")
    for _ in range(10):
        RateLimiter.check_rate_limit(req, max_requests=10, window_seconds=60)

    with pytest.raises(HTTPException) as exc_info:
        RateLimiter.check_rate_limit(req, max_requests=10, window_seconds=60)

    assert exc_info.value.status_code == 429


def test_attacker_rotating_ips_cannot_exceed_n_attempts_on_one_account() -> None:
    """An attacker rotating IPs attempting bad passwords on one target email.

    Must be stopped by per-account lockout after N=5 attempts regardless of IP rotation.
    """
    PerAccountLockout.reset()
    target_email = "victim@example.com"

    # Attacker rotates 5 different IPs
    attacker_ips = ["1.1.1.1", "2.2.2.2", "3.3.3.3", "4.4.4.4", "5.5.5.5"]
    for _ip in attacker_ips:
        assert not PerAccountLockout.is_locked_out(target_email)
        PerAccountLockout.record_failure(target_email)

    # Attempt 6 from a brand new 6th IP (6.6.6.6) MUST indicate account is locked out
    assert PerAccountLockout.is_locked_out(target_email)
    assert PerAccountLockout.get_remaining_lockout_seconds(target_email) > 0


def test_legitimate_user_not_locked_out_permanently() -> None:
    """Legitimate user lockout expires after lockout period or upon successful credentials."""
    PerAccountLockout.reset()
    email = "user@example.com"

    for _ in range(5):
        PerAccountLockout.record_failure(email)

    # Account is locked out
    assert PerAccountLockout.is_locked_out(email)

    # Lockout expires / is cleared on success
    PerAccountLockout.record_success(email)
    assert not PerAccountLockout.is_locked_out(email)


def test_trusted_proxy_x_forwarded_for_resolution() -> None:
    """Verify X-Forwarded-For is read only from trusted proxies."""
    # From trusted proxy 127.0.0.1 -> read X-Forwarded-For
    req_trusted = create_mock_request("127.0.0.1", {"X-Forwarded-For": "203.0.113.195, 127.0.0.1"})
    assert get_client_ip(req_trusted) == "203.0.113.195"

    # From untrusted proxy 198.51.100.1 -> ignore X-Forwarded-For header
    req_untrusted = create_mock_request("198.51.100.1", {"X-Forwarded-For": "203.0.113.195"})
    assert get_client_ip(req_untrusted) == "198.51.100.1"


def test_per_account_lockout_expires_stale_accounts() -> None:
    """Stale failed login entries older than LOCKOUT_DURATION are automatically purged."""
    PerAccountLockout.reset()
    stale_email = "stale@example.com"
    old_time = datetime.now(UTC) - timedelta(minutes=20)

    # Manually inject stale attempt
    PerAccountLockout._failed_attempts[stale_email] = [old_time] * 5
    assert stale_email in PerAccountLockout._failed_attempts

    # is_locked_out must recognize expiration, remove stale entry from tracker, and return False
    assert not PerAccountLockout.is_locked_out(stale_email)
    assert stale_email not in PerAccountLockout._failed_attempts


def test_per_account_lockout_capping_and_lru_eviction() -> None:
    """Tracker enforces MAX_TRACKED_ACCOUNTS cap and evicts oldest entries."""
    PerAccountLockout.reset()
    original_cap = PerAccountLockout.MAX_TRACKED_ACCOUNTS
    try:
        PerAccountLockout.MAX_TRACKED_ACCOUNTS = 3

        # Add 3 accounts
        PerAccountLockout.record_failure("user1@example.com")
        PerAccountLockout.record_failure("user2@example.com")
        PerAccountLockout.record_failure("user3@example.com")
        assert len(PerAccountLockout._failed_attempts) == 3

        # Adding 4th account must evict user1
        PerAccountLockout.record_failure("user4@example.com")
        assert len(PerAccountLockout._failed_attempts) == 3
        assert "user1@example.com" not in PerAccountLockout._failed_attempts
        assert "user4@example.com" in PerAccountLockout._failed_attempts
    finally:
        PerAccountLockout.MAX_TRACKED_ACCOUNTS = original_cap

