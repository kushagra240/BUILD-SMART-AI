# Authentication and security

Contents: 1 implemented design, 2 known limits, 3 checklist status, 4 next hardening, 5 rules for contributors.

## 1. Implemented design (backend, as last reported; verify in code)

- **Passwords:** Argon2id via `argon2-cffi`, library defaults, per-user salt. Minimum length 10 plus a small weak-password denylist. Rehash-on-login is not implemented.
- **Access token:** JWT, 15 minutes, HS256 explicitly, claims `sub, role, iss, aud, iat, exp` validated. Kept in memory on the client, never in localStorage.
- **Refresh token:** opaque 48-byte value, stored only as SHA-256, sent as an `HttpOnly; SameSite=Lax` cookie scoped to the auth path (`Secure` in production). **Rotation on every refresh.** Presenting a revoked token revokes the whole token family (`family_id`). Tested.
- **Account lockout:** 5 failed attempts lock the account 15 minutes. Registered users: persisted in `users.failed_login_count` and `locked_until`. Unknown emails: in-memory tracker with a cap and expiry (resets on restart). The lockout response is HTTP 429 with `Retry-After`, identical whether or not the email exists.
- **Timing equalisation:** a dummy Argon2 verification runs for unknown emails so response time does not reveal which accounts exist.
- **Rate limiting:** custom in-memory sliding window, 10 requests per minute per IP, on register, login and refresh.
- **Client IP:** `X-Forwarded-For` is honoured only when the direct peer is in `TRUSTED_PROXIES`.
- **Transport and headers:** CORS allow-list from `ALLOWED_ORIGINS`; middleware sets CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options.
- **Authorisation:** every project and estimate query filters by the owner; foreign or soft-deleted resources return 404.
- **Validation:** Pydantic with `extra="forbid"` and strict bounds; database CHECK constraints back them up.
- **Errors:** one envelope, request IDs on everything.

## 2. Known limits (state them honestly, do not hide them)

- Rate-limit and unknown-email lockout state are in memory: reset on restart and not shared across instances. A shared store (Redis or the database) is needed before multi-instance deployment.
- Per-account lockout lets an attacker who knows an email lock that user out for 15 minutes. Accepted for now; a softer progressive delay is a later option.
- `audit_log` table exists but nothing writes to it.
- No email verification, no password reset, no account deletion endpoint.
- The frontend has no route guards, no silent refresh, and logout may not call the API (see status file).
- The model-artifact checksum verification is not built (no model exists yet).
- Dependency audits in CI cover production dependencies for npm (`--omit=dev`); dev-only findings (Tailwind v3 toolchain, others) remain and are documented.

## 3. Checklist status (OWASP-aligned; "DONE" means evidence exists)

Done: default-deny auth dependencies, object-level authorisation, strict schemas, parameterised queries only, CORS allow-list, security headers, Secure/HttpOnly cookies, rotation with reuse detection, per-IP rate limits, lockout, secrets via environment, gitleaks in CI, `pip-audit` and `npm audit` in CI, pagination caps.
Not done or unverified: audit logging, password reset, account deletion and privacy page, shared-store throttling, HTTPS verification in a real deployment, real-browser accessibility and CSP checks, model-artifact verification, load test.

## 4. Next hardening (suggested order)

1. Write security events to `audit_log` (login success/failure, lockout, token reuse, password change). No secrets or full emails in logs; hash IPs.
2. Move throttling and lockout state to a shared store.
3. Rehash on login when Argon2 parameters change.
4. Add email verification and password reset only if the schedule allows.
5. Account deletion that removes the user's data, and a privacy page.
6. Real-browser CSP and cookie checks after deployment.

## 5. Rules for contributors

- Do not add a new auth mechanism or switch providers without an ADR and the human's approval (decision D-04).
- Never log tokens, passwords, hashes or full emails. Never return distinguishing errors for "wrong email" versus "wrong password".
- Any new endpoint must declare its auth dependency, check ownership for object access, validate input with a strict schema, and have a test for the unauthorised and foreign-owner cases.
- Any new dependency needs justification and must pass `pip-audit` or `npm audit` thresholds.
- Never commit `.env` or secrets. If a secret leaks into git history, tell the human immediately so it can be rotated.
