# Task board

Single coordination file for all agents and humans. Keep edits tiny and separate from code changes so merges stay clean.

## How to use

1. Pick a task in your lane whose dependencies are `done`. Set Status to `claimed`, put your tool and model in "Claimed by" with the date, commit that one-line edit on your branch (`chore(tasks): claim T21`), and push so others see it.
2. Work only on that task. When finished, set Status to `review` and add the PR link. The human sets `done` after merge and green CI.
3. If blocked, set `blocked`, write the reason in "Needs human" or "Found issues", and pick another task.
4. Never edit another agent's claimed row. If a claim is stale (more than 24 hours with no commits), ask the human before taking it.

Statuses: `todo`, `claimed`, `in-progress`, `review`, `blocked`, `done`.
Rules for everything below live in `AGENTS.md`. Acceptance criteria are minimums, not suggestions.

## Dependency overview

```
T01 data package ──> T10 migration+seed ──> T21 rates repo ──> T22 pricing ──> T27 wire estimate ──> T44/T45 UI on real data ──> T51 e2e
T20 engine design (needs engineer review) ──> T24 BOQ/category tables ──> T22/T27 real numbers
T40..T43 frontend (mock-based) run in parallel with all backend work
T50, T53, T55 devops/qa run in parallel
```

## L1 Data and rates

| ID | Task | Depends | Status | Claimed by | Acceptance |
|---|---|---|---|---|---|
| T01 | Place the rates package in `data/rates/` (schema, load, roles, csv, validate.py, README). Add source PDFs to `.gitignore` (keep checksums only). | none | review | Antigravity (Gemini 3.8 Flash), 9 Nov 2026 | `python data/rates/validate.py` prints `0 ERROR` (output pasted); no CSV value edited; `git status` clean of PDFs |
| T02 | Extract missing SSR items: shuttering/centering (ch.6 items 26.xx), interior emulsion and putty (35.xx), drainage and piping items (41-43). Add rows with page numbers and `parse_status`; bump dataset to v1.1.0. | T01 | todo | | validate.py 0 ERROR; every new row has `ssr_page`; ambiguous rows are REVIEW not guessed; list of what was added vs not found |
| T03 | Resolve quantity-norm REVIEW rows (20) and the 7 REVIEW work items by reading the PDF pages; document Statement C-1 column meanings from the page header. | T01 | todo | | each fixed row cites page; remaining unsure rows stay REVIEW; C-1 columns documented in `data/rates/README.md` |
| T04 | OCR `doc2.pdf` (likely electrical schedule) into the rates schema as `electrical_item_ssr` or equivalent. | T01 | todo | | all rows `REVIEW` until a human samples 20 rows against the PDF; error rate of the sample reported |
| T05 | Produce a review sheet of the 231 automatic WPI mappings, weak ones first, with a column for a human decision. Do not mark anything `reviewed=true`. | T01 | todo | | CSV for humans; no automated acceptance |
| T06 | Loader and validator for `price_quote` and `real_project` CSV imports (empty tables exist). Reject rows without evidence file, date, collector, GST flag. | T01 | todo | | tests with fake fixtures named `*_fake_*`; real rows never auto-generated |

## L2 Backend platform

| ID | Task | Depends | Status | Claimed by | Acceptance |
|---|---|---|---|---|---|
| T10 | Alembic migration that creates the `rates` schema from `sql/schema.sql`; idempotent `make seed-rates` that loads the CSVs; run in CI against Postgres 16. | T01 | todo | | CI green; row counts asserted in tests (895, 986, 91, 9, 371, 92, 21, 840); re-running seed does not duplicate |
| T11 | Read-only DB role and connection for the rates schema; API never writes to it. | T10 | todo | | test that an INSERT through the API connection fails |
| T12 | Write security events to `audit_log` (login ok/fail, lockout, token reuse, password change); hashed IPs, no secrets. | none | todo | | tests assert rows written; no token or full email in rows |
| T13 | Fix `gap_inr` in `get_estimate_by_id`; set `model_version_id` (or its engine-version replacement); make `/meta/options` data-driven from `rates.zone` and one shared category list. | T10 | todo | | tests for each; OpenAPI regenerated; frontend types regenerated |
| T14 | Return `MISSING_DATA` (HTTP 422) from the estimate endpoint when the engine raises `MissingDataError`; map error envelope. | T21 | todo | | test with a missing zone factor returns code and the missing keys |
| T15 | Wire FastAPI Estimates Route to the Math Engine (`POST /api/v1/projects/{project_id}/estimates` calls `calculate_estimate`, handles 422 `MISSING_DATA`). | T21, T22 | done | Antigravity | 200 on success, 422 on missing data; OpenAPI response mapped |
| T16 | Account deletion endpoint and password reset (Should-have). | none | todo | | deletion removes the user's projects and estimates; reset always returns 202 |
| T17 | Backend PDF Export Service (ReportLab) and `GET /api/v1/projects/{project_id}/estimates/{estimate_id}/pdf` from the saved estimate. | T15 | done | Antigravity | text-extraction test matches stored figures; MOCK/DEV notice present when applicable; A4 |

## L3 Estimation engine

| ID | Task | Depends | Status | Claimed by | Acceptance |
|---|---|---|---|---|---|
| T20 | Write `docs/engine_design.md`: which tables feed each category, how each `rate_rule` is applied, labour split, indicative-update policy, error contract, and the full ASSUMPTIONS list (quantities for a 2-floor RCC house) with **empty values** and an engineer question per row. | T01 | todo | | zero invented numbers; each assumption names the SSR items it prices; human can hand it to an engineer |
| T21 | `engine/contracts.py` (`EstimationInput`, `EstimationResult`, `MissingDataError`) and `rates/repository.py` (typed, read-only). | T10 | todo | | tests against the loaded rates; `MissingDataError` lists every missing key; no SQL writes |
| T22 | Item pricing with `rate_rule` application and a per-item audit trail; golden test from a hand-priced 3-item BOQ supplied by the human. | T21, H3 | todo | | golden test passes with human numbers; rules read values from the database, not code |
| T23 | `rounding.py` (largest remainder) with property tests. | none | todo | | categories always sum exactly to the total for random valid inputs |
| T24 | BOQ template and `item -> category` tables as reviewed data, loaded from CSV with `reviewed_by` and date. | H3 | blocked | | unreviewed rows refuse to price |
| T25 | Range and confidence method per the human's decision (`rates-database-and-engine.md` section 5). | H7 | blocked | | method documented; labels capped without real validation |
| T26 | Rule-based material recommendations using `material_rate_ssr` and a reviewed tier specification table. | H3, T24 | blocked | | explainable reason per category; no brands; missing spec refuses |
| T27 | Replace the stub in `estimation.py` with the engine; keep `is_mock=true` until a result is computed entirely from sourced and reviewed data; stub-unreachable test stays. | T21, T22, T23, T14 | blocked | | end-to-end test; stub numbers cannot appear when `is_mock=false` |

## L4 ML and calibration (infrastructure only until real data exists)

| ID | Task | Depends | Status | Claimed by | Acceptance |
|---|---|---|---|---|---|
| T30 | Ingestion and validation for real-project records (schema in `real_project`); rejects rows without source, date, data_type. | T01 | todo | | tests with fake fixtures only |
| T31 | Evaluation harness: MAE, MAPE, RMSE, R-squared; real versus derived reported separately; slice metrics; **refuses to print a headline metric** if real rows are below a configured minimum. | none | todo | | fixture-based tests; refusal tested |
| T32 | Model card JSON format and registry insert code (no training). | none | todo | | card includes data version, composition by `data_type`, metrics, SHA-256 |
| T33 | Calibration design note: how engine-versus-actual errors will be modelled once enough real projects exist. | T30 | todo | | doc only; no numbers claimed |

## L5 Frontend

| ID | Task | Depends | Status | Claimed by | Acceptance |
|---|---|---|---|---|---|
| T40 | Apply Figma tokens: Tailwind theme, CSS variables, fonts with fallbacks, base components. Work from the screenshots and the token list. | none | review | OpenCode (DeepSeek V4.1 Flash) | tokens match `frontend-design.md` exactly; lint, typecheck, tests, build pass; screenshot comparison in the PR |
| T41 | Single category list and one mock layer aligned to OpenAPI v1; delete the three conflicting rate tables; fake numbers are round placeholders with a visible badge. | none | review | OpenCode (Big Pickle), 2026-11-14 | grep finds one category source; mock response validates against generated types |
| T42 | Auth context, route guards for `/app/*`, silent refresh (single-flight), real logout, remove the hard-coded user. | none | review | Antigravity, 2026-11-14 | tests for guard redirect, refresh on 401, logout calls API |
| T43 | Wizard with 4 steps using `/meta/options`; remove hard-coded zone and rooms; send only fields the API supports. | T41 | review | Antigravity, 2026-11-14 | wizard tests; no literal zone ids in components |
| T44 | Reconcile Estimate Types and Update Results Page with every v1 section (range, confidence, doughnut with table toggle, breakdown, materials, budget, drivers, badge, versions, disclaimer). | T41 | done | Antigravity | render tests; badge shown whenever `is_mock` true; contrast not claimed without real-browser check |
| T45 | Projects list and detail from the API: rename, delete, compare two estimates. Remove hard-coded arrays. | T42 | review | Antigravity, 2026-11-14 | integration tests against mocks that match OpenAPI |
| T46 | Wire PDF Export Button on Results Page. | T44, T17 | done | Antigravity | triggers blob download of generated PDF; download button tests pass |
| T47 | Decide and execute: use or remove `chart.js`, `react-query`, `react-hook-form` (record as an ADR). | none | review | Antigravity, 2026-11-14 | no unused dependencies remain; ADR-002 recorded |
| T48 | Collapsible estimate sidebar and MOCK material-characteristics preview with images. | T44 | claimed | Figma Make, 2026-11-14 | sidebar expands/collapses; preview is visibly MOCK; no ratings/reviews; lint, typecheck, tests, build pass |

## L6 DevOps, security, QA, docs

| ID | Task | Depends | Status | Claimed by | Acceptance |
|---|---|---|---|---|---|
| T50 | CI additions: rates `validate.py`, seed and rates tests; PR template with the Definition-of-Done checklist; document branch protection for `main`. | T01 | todo | | CI green; PR template present |
| T51 | Playwright e2e: first on mock mode, then real API when available (register, login, estimate, results, delete). | T42 | todo | | passes in CI; artifacts on failure |
| T52 | Rewrite README sections 8 to 11 and the methodology docs to match decision D-01; remove claims of a trained model or accuracy. Sync `docs/DATA_SOURCES.md` with `data_source`. | none | todo | | no statement in docs that the code does not support |
| T53 | Dockerfiles for api and web, full-stack compose, fresh-clone quick start verified by someone who did not write it. | none | todo | | quick start works in 10 minutes; instructions tested |
| T54 | Deployment plan: Vercel (web, `/api` rewrite), Railway or Render (api), Supabase or managed Postgres, secrets, backups, one tested restore. | T53 | todo | | written plan with free-tier limits verified from current provider pages |
| T55 | Security checklist report: each item has a proof file or test, or is marked NOT DONE; real-browser CSP and cookie checks after deploy. | none | todo | | no item marked done without evidence |

## Shared change requests (RFC)

| ID | Requested by | Change | Why | Decision |
|---|---|---|---|---|
| RFC-01 | L5 (OpenCode) | Add `recharts` and `framer-motion` to `apps/web/package.json` | Results-page cost-breakdown chart and reduced-motion-aware fade-ins; pinned in the lockfile | pending human approval |

## Needs human

| ID | Question or action | Blocks |
|---|---|---|
| H1 | Verify the 2026 special allowance digits against PDF page 3, entry 11; set `allowance_verified=true` | wage figures |
| H2 | Decide D-02 (Labour as the sum of labour parts) | T24, T27 |
| H3 | Have a civil engineer or experienced contractor review the BOQ item list, quantity assumptions, category mapping and tier specs; supply one hand-priced mini-BOQ for the golden test | T22, T24, T26 |
| H4 | Collect: 3 dealer quotes each for cement, steel, sand, bricks, tiles, paint; 3 contractor per-sq-ft rates by tier; real project costs (target 40 or more) | validation, T25 |
| H5 | Download CPWD DSR 2023 and Analysis of Rates from the official portal | cross-check |
| H6 | Confirm the branch and PR workflow (D-08) | all lanes |
| H7 | Approve the range method | T25 |
| H8 | Review and merge PRs; set statuses to `done` after green CI | all |

## Found issues (outside the finder's lane)

| ID | Found by | Lane to fix | Description | Evidence |
|---|---|---|---|---|
| | | | | |
