# Production deployment

Last verified: 2026-11-15 against the live deployments below. Re-verify after any
platform change; this file records wiring, not promises.

| Piece | Location |
|---|---|
| Frontend | Vercel, project root `apps/web` — https://build-smart-ai-vert.vercel.app |
| API | Render, root `apps/api` (Dockerfile) — https://build-smart-ai-42f1.onrender.com |
| Database | Render managed PostgreSQL, reached with an async SQLAlchemy URL |

## How the browser reaches the API

Two supported paths, both valid because CORS always allows the deployed frontend:

1. **Direct (current):** `VITE_API_URL=https://build-smart-ai-42f1.onrender.com`
   in the Vercel dashboard. The bundle calls Render directly; the auth cookie is a
   third-party cookie, so it is issued with `SameSite=None; Secure`.
2. **Same-origin proxy:** leave `VITE_API_URL` unset. The client falls back to
   `/api/v1`, the Vite dev server proxies it to `localhost:8000`, and
   `apps/web/vercel.json` rewrites `/api/*` to the Render service. The cookie is
   then first-party, which survives browsers that restrict third-party cookies
   (notably Safari).

`apps/web/src/services/apiClient.ts` normalises `VITE_API_URL` and ignores values
that are not usable absolute URLs, falling back to path 2. This exists because the
variable was once pasted into the dashboard as a markdown link
(`[https://host](https://host)`), which silently turned every request into a
relative path answered by Vercel with 404/405.

## Required Render environment

```
ENVIRONMENT=production          # enables the fail-closed config checks
DEBUG=false                     # false keeps SQL parameters out of the logs
JWT_SECRET=<openssl rand -hex 32>
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/DB
TRUSTED_PROXIES=127.0.0.1,::1   # internal/private peers are trusted automatically
```

`ALLOWED_ORIGINS` is optional: `https://build-smart-ai-vert.vercel.app` and the
scoped Vercel preview pattern are baked into `apps/api/app/core/config.py`.
Setting it (`CORS_ORIGINS` is accepted as an alias) only adds extra origins;
`http://localhost:*` entries are ignored in production and `*` is always fatal.

With `ENVIRONMENT=production` the API refuses to start if it still has the
development JWT secret, a localhost `DATABASE_URL`, `DEBUG=true`, a wildcard
origin, or a non-`https` origin.

## Post-deploy checklist

- `GET /health/ready` returns `{"status":"ready","database":"ok"}`.
- `OPTIONS /api/v1/auth/register` from the Vercel origin returns 200 with
  `access-control-allow-origin: https://build-smart-ai-vert.vercel.app` and
  `access-control-allow-credentials: true`.
- `POST /api/v1/auth/login` sets `buildsmart_refresh` with `HttpOnly; Secure;
  SameSite=None` (it will read `SameSite=lax` if `ENVIRONMENT` is not
  `production` on Render).
- Register and log in from the deployed frontend, then reload the page: the
  session must survive the reload, which proves the refresh cookie round-trips.
- A JWT signed with the public development secret must be rejected by
  `GET /api/v1/auth/me`.
