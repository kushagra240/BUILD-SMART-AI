# Status and known issues (SNAPSHOT, 7 Nov 2026)

This snapshot was assembled from earlier agent reports and one independent code analysis, **not from a fresh run**. Treat every line as "reported". Verify by running the commands in section 8 before building on it. Update this file when you change reality (docs lane or the lane that changed it).

Contents: 1 done, 2 mocked, 3 missing, 4 known bugs, 5 environment, 6 CI, 7 open decisions, 8 how to re-verify, 9 inconsistencies to fix.

## 1. Done (reported, with evidence at the time)

- Monorepo skeleton, Ruff, mypy (strict), ESLint (max warnings 0), TypeScript strict, Vitest, pre-commit, Makefile, docker-compose (Postgres), `.gitignore`.
- GitHub Actions CI with three jobs; last confirmed fully green on commit `b5e5d97` after dependency upgrades (Vite 6.4.4, Vitest 3.2.7, typescript-eslint 8.71.1).
- Backend: auth (register, login, refresh, logout, me), rotating refresh tokens with reuse detection, lockout, per-IP rate limiting, trusted-proxy IP handling, dummy-hash timing equalisation, error envelope, request IDs, security headers, CORS allow-list.
- Projects CRUD with soft delete and object-level authorisation (404 for foreign resources); estimates stored immutably; health endpoints; Alembic migration 0001 (6 tables; citext extension); OpenAPI export and generated TypeScript types.
- Tests: auth flows, token reuse, IDOR, validation envelope, rate limiter, estimate stub guard (backend); formatters, mock API, static-page axe tests (frontend).
- Frontend visuals: landing, auth screens, wizard, results, methodology, 404, materials guide, PDF preview page (all on mock data).
- Sourced rates database v1.0.0 placed in `data/rates/` and validated with `python data/rates/validate.py` (result: `0 ERROR, 5 WARN, 40 OK`). Database schema, migration, seed, engine, and database loading do not exist yet.

## 2. Mocked or simulated

- Cost prediction: stub, area x fixed round tier rate, fixed shares, placeholder materials, always "Medium" confidence, `model.version = DEV-MOCK`. `is_mock=true`; `?is_mock=false` returns 501.
- Frontend estimate flow: runs in-browser on `mockApi.ts`, never calls the estimate API. Saved projects and detail pages are hard-coded. Save and PDF buttons are cosmetic.
- `/meta/options` returns hard-coded zones, tiers and types.
- Login and register: mock by default (`VITE_USE_MOCK=true`); real calls exist behind the flag.

## 3. Missing

Real Pune cost data and any quote or real-project records; BOQ template and quantity formulas; the bottom-up engine; rates schema in the app database (migration and seed); `rates/` repository; ML pipeline and any model artifact (`ml/` has placeholder tests only; `make train` points at nothing); material engine; PDF service and `/report.pdf`; audit-log writes; password reset; profile and account deletion; frontend wiring to projects and estimates APIs; auth context, route guards, silent refresh, real logout; Playwright e2e; Lighthouse and real-browser accessibility; frontend Dockerfile and deploy workflow; deployment.

## 4. Known bugs and defects (from code analysis; confirm each, then fix in the owning lane)

Backend (L2/L3): `get_estimate_by_id` returns `gap_inr: 0` regardless of the saved budget; `model_version_id` never set on estimates; zone and floors do not affect the stub; `audit_log` unused; `slowapi` listed as a dependency but unused (custom limiter in use); `make train` broken; `MODEL_PATH` declared but unused.
Frontend (L5): see `frontend-design.md` section 7; additionally the preview total and results total disagree because of different rate tables.
Data (L1): see `rates-database-and-engine.md` section 3 and 9.

## 5. Environment

- Owner uses Windows and PowerShell; Antigravity as the main IDE agent, plus OpenCode with free and Copilot models. No Docker or local PostgreSQL, so DB tests error locally; CI is the referee. Do not "fix" local connection errors by switching to SQLite.
- An earlier local run created a SQLite file `test.db` that was committed and later removed. Make sure no test path falls back to SQLite.
- Figma MCP needs a paid plan; design input arrives as screenshots plus the tokens in `frontend-design.md`.
- Free-tier models drift from instructions more than strong ones. Keep tasks small and demand evidence.

## 6. CI

Jobs: `python-lint-and-test` (install, ruff, mypy, pytest with Postgres 16 service, pip-audit), `node-lint-and-test` (npm ci, lint, typecheck, vitest, build, `npm audit --omit=dev --audit-level=high`), `gitleaks-secret-scan`. Known remaining npm findings are dev-only (Tailwind v3 toolchain: braces, chokidar, micromatch, fast-glob; vitest mocker moderate) and moderate `react-router` advisories (SPA, no SSR). Check the latest run on `main` before anything else.

## 7. Open decisions (need the human)

D-02 category mapping (Labour as sum of labour parts); D-05 database host; range method (basis range versus empirical, `rates-database-and-engine.md` section 5); who reviews quantity formulas (civil engineer); whether to keep Chart.js, React Query and React Hook Form; what "standard" and "premium" mean item by item (tier specification table); whether to adopt the branch and PR workflow (D-08).

## 8. How to re-verify (run these; paste output)

```
git status ; git log -10 --oneline
git ls-files | Select-String -Pattern "node_modules|__pycache__|\.pyc$|\.env$|\.egg-info|\.db$"     # must print nothing
python -m ruff check . ; python -m mypy ml apps/api ; python -m pytest        # DB tests need Postgres (CI)
cd apps/web ; npm ci ; npm run lint ; npm run typecheck ; npm test -- --run ; npm run build
python data/rates/validate.py                                                  # after the package is placed
Select-String -Path apps\api\tests\conftest.py,pyproject.toml -Pattern sqlite -SimpleMatch -CaseSensitive:$false
Select-String -Path apps\web\src\pages\WizardPage.tsx -Pattern "pune_west"      # should disappear when fixed
```
Then open the latest GitHub Actions run for `main` and read all three jobs.

## 9. Inconsistencies to eliminate (single source of truth)

- **Category names:** backend (Foundation, Structure, Masonry, Roofing, Flooring, Plumbing, Electrical, Finishing, Labour), frontend mock (site preparation and foundation, RCC structure, masonry and plaster, flooring and wall tiles, doors and windows, electrical, plumbing and sanitary, painting and finishes, contingency), methodology page (a third variant). Use the backend list, served from `/meta/options` or one shared constant.
- **Rate tables:** backend stub (1000/2000/3000 per sq ft), frontend mock (1550/1900/2500 with multipliers), wizard preview copy (2000/2400/3100). All are fake. Remove them; the only legitimate rates are in the `rates` schema.
- **README versus decisions:** README sections 8 to 11 describe an ML-first design; the bottom-up decision (D-01) supersedes them. Rewrite those sections (lane L6 docs task).
- **Docs claiming more than the code:** methodology page and `docs/methodology.md` describe a trained model and metrics that do not exist. Correct them to match reality.
