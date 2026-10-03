import pytest
from app.core.rate_limit import PerIpAccountLockout, RateLimiter
from fastapi import HTTPException, Request


def create_mock_request(client_ip: str) -> Request:
    scope = {
        "type": "http",
        "client": (client_ip, 50000),
        "headers": [],
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


def test_per_ip_account_lockout_isolated_by_ip() -> None:
    PerIpAccountLockout.reset()
    email = "test@example.com"

    # Fail 5 times on IP A
    for _ in range(5):
        PerIpAccountLockout.record_failure(email, "1.1.1.1")

    # IP A should be locked out
    with pytest.raises(HTTPException) as exc_info:
        PerIpAccountLockout.check_lockout(email, "1.1.1.1")
    assert exc_info.value.status_code == 400

    # IP B should NOT be locked out for the same email
    PerIpAccountLockout.check_lockout(email, "2.2.2.2")


def test_lockout_resets_on_success() -> None:
    PerIpAccountLockout.reset()
    email = "user@example.com"
    ip = "3.3.3.3"

    for _ in range(4):
        PerIpAccountLockout.record_failure(email, ip)

    PerIpAccountLockout.record_success(email, ip)
    # Should not raise any exception
    PerIpAccountLockout.check_lockout(email, ip)
