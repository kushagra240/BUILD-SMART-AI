# Architecture and contracts

Contents: 1 layers, 2 request flow, 3 app database, 4 API surface, 5 estimate response v1, 6 error envelope, 7 rates interface, 8 engine module layout (proposed), 9 generated artifacts, 10 environment variables.

## 1. Layers

```
Browser (React SPA, access token in memory, refresh token in HttpOnly cookie)
   -> same-origin /api proxy (Vercel rewrite in production; Vite proxy in dev)
FastAPI
   core/        config, security, deps, errors, middleware, rate_limit
   api/v1/      auth, projects, estimates, meta, health routers
   schemas/     Pydantic request/response models (extra="forbid", strict bounds)
   services/    auth_service, project_service, estimation (stub today)
   engine/      bottom-up estimator (lane L3; proposed layout below)
   rates/       read-only repository over the `rates` schema (lane L3)
   models/ db/  SQLAlchemy 2.x async models and session
PostgreSQL
   public schema  users, refresh_tokens, projects, estimates, model_versions, audit_log  (Alembic)
   rates schema   sourced reference data (read-only for the API; see rates-database-and-engine.md)
```
Principles: separation of concerns, immutable estimates, default-deny auth, all money as integers (INR) in storage, one error envelope, contracts generated from code.

## 2. Request flow for an estimate (target state)

1. SPA posts validated inputs to `POST /api/v1/projects/{id}/estimates` with the bearer token.
2. API authenticates, checks the project belongs to the user (404 otherwise), validates input (ranges come from `/meta/options`, never duplicated by hand).
3. `estimation` service calls `engine.estimate(EstimationInput) -> EstimationResult`. The engine reads rates through `rates/` only.
4. If any required value is missing, the engine raises `MissingDataError` listing every missing key. The API returns HTTP 422 with code `MISSING_DATA`. It never falls back.
5. The result is saved as an immutable `estimates` row: inputs snapshot, outputs, engine version, rates dataset version, `is_mock`.
6. Response returns; the PDF is generated later from the saved row.

## 3. App database (public schema, migration 0001)

- `users`: citext unique email, Argon2id hash, role, lockout fields, timestamps.
- `refresh_tokens`: SHA-256 token hash only, `family_id`, `revoked_at`, `replaced_by`, user agent, hashed IP.
- `projects`: owner, name, notes, soft delete (`deleted_at`).
- `estimates`: immutable; inputs and outputs as JSONB, `total_p50/p10/p90` as bigint, confidence label, breakdown, materials, drivers, budget status, `is_mock` (default true), `model_version_id` (currently never set: known bug).
- `model_versions`: registry, one active row via partial unique index.
- `audit_log`: table exists; **nothing writes to it yet**.

Rule: schema changes only through Alembic migrations created by lane L2. Single head. No `create_all` in production paths.

## 4. API surface (`/api/v1`)

| Method | Path | Notes |
|---|---|---|
| POST | /auth/register, /auth/login, /auth/refresh, /auth/logout | refresh uses the cookie |
| GET, PATCH | /auth/me | |
| GET, POST | /projects | paginated list (limit cap 100) |
| GET, PATCH, DELETE | /projects/{id} | soft delete; 404 for foreign or deleted |
| POST | /projects/{id}/estimates | stub today; `?is_mock=false` returns 501 until the engine is wired |
| GET | /estimates/{id} | saved snapshot |
| GET | /meta/options, /meta/model | zones, tiers, valid ranges; active model info |
| GET | /health/live, /health/ready | readiness checks DB |
Planned, not built: `/estimates/{id}/report.pdf`, password reset, profile deletion.

## 5. Estimate response v1 (frozen shape; values come from the engine, never hard-coded)

```json
{
  "id": "uuid",
  "total": {"p50": 0, "p10": 0, "p90": 0, "currency": "INR"},
  "confidence": {"label": "Low|Medium|High", "reason": "string"},
  "breakdown": [{"category": "Foundation", "amount": 0, "share_pct": 0.0}],
  "materials": [{"category": "cement", "primary": {}, "alternative": {}, "reason": "string"}],
  "budget": {"status": "within|tight|below_minimum|not_provided", "gap_inr": 0},
  "drivers": [{"label": "string", "impact_pct": 0.0}],
  "model": {"version": "string", "dataset_version": "string", "mode": "dev|production"},
  "is_mock": true,
  "disclaimer": "string",
  "created_at": "iso8601"
}
```
Breakdown amounts are integers that sum exactly to `total.p50` (largest-remainder rounding). Adding fields is allowed through an RFC; removing or renaming is breaking. Every category name must come from one shared list (see section 9 of `status-and-known-issues.md`: three conflicting lists exist today).

## 6. Error envelope

```json
{"error": {"code": "VALIDATION_ERROR|UNAUTHORIZED|NOT_FOUND|TOO_MANY_REQUESTS|MISSING_DATA|INTERNAL_SERVER_ERROR",
           "message": "string", "details": null, "request_id": "string"}}
```
Every response carries `X-Request-ID`. 404 (not 403) for other users' resources.

## 7. Rates interface (contract C2)

Read-only access to the `rates` schema: tables `work_item_ssr`, `material_rate_ssr`, `labour_rate_ssr`, `minimum_wage`, `quantity_norm`, `transport_trip_cost`, `lead_charge_raw`, `rate_rule`, `wpi_item`, `wpi_series`, `material_wpi_map`, `zone`, `data_source`, `dataset_version`, `parameter`; views `v_work_item`, `v_wpi_latest`, `v_material_rate_indicative`, `v_minimum_wage_vs_ssr`. Empty tables for later data: `price_quote`, `real_project`. The API's database user should have SELECT only (see `data/rates/sql/roles.sql`). Every engine result records the active `dataset_version.version_id`.

## 8. Engine module layout (proposed; L3 may refine through an ADR)

```
apps/api/app/engine/
  contracts.py        EstimationInput, EstimationResult, MissingDataError   (owned by L3)
  boq.py              house work-item template and quantity formulas (ASSUMPTIONS until engineer review)
  pricing.py          price an item: rate lookup, rules (floor lift, depth, lead), labour split
  categories.py       item -> 9-category mapping (engineer-reviewed table)
  adjust.py           optional indicative index update (labelled), zone factors (refuse if NULL)
  range.py            range method (see rates-database-and-engine.md, section 5)
  materials.py        rule-based material recommendations
  rounding.py         largest-remainder allocation
apps/api/app/rates/   repository.py (typed read-only queries over the rates schema)
apps/api/tests/engine/  unit, property-based and golden tests
```

## 9. Generated artifacts (never hand-edit)

- `docs/api/openapi.json`: `python apps/api/export_openapi.py`
- `apps/web/src/types/api.generated.ts`: from `apps/web`: `npx openapi-typescript ../../docs/api/openapi.json -o src/types/api.generated.ts`
- Lockfiles: regenerate with `npm install` / the Python tool, never merge by hand.

## 10. Environment variables (documented in `.env.example`)

`DATABASE_URL, JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE, ACCESS_TOKEN_TTL_MIN, REFRESH_TOKEN_TTL_DAYS, ALLOWED_ORIGINS, COOKIE_SECURE, ENVIRONMENT, MODEL_PATH, LOG_LEVEL, TRUSTED_PROXIES, RATE_LIMIT_*`; web: `VITE_USE_MOCK`, API base URL. Never commit real values.
