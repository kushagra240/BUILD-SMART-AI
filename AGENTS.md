# AGENTS.md: BuildSmart AI

Read this file completely before touching anything. It applies to every AI agent and every tool (Antigravity, OpenCode, Copilot, Claude Code, Codex, Cursor, others) and to humans.
Detailed context lives in the skill at `.agents/skills/buildsmart-ai/` (copy or symlink it into whatever skills folder your tool reads). Load its `SKILL.md` now, and its `references/` files when your task touches that area.

## 1. What this project is (60 seconds)

BuildSmart AI estimates preliminary construction cost for small residential houses in Pune, India, and recommends materials. A user enters built-up area, floors, rooms, location zone, quality tier and an optional budget. The system returns a cost with a low-high range and a confidence label, a 9-category breakdown, material recommendations, a PDF report, and saved history.

**Core design decision:** the estimate is computed bottom-up like a real estimator would: work items x quantities x sourced rates, adjusted for geography and rules, grouped into 9 categories. Machine learning is a secondary layer (ranges, calibration against real projects). It is NOT the primary source of numbers, because no real labelled Pune cost dataset exists.

Stack: React + TypeScript + Vite + Tailwind (apps/web); FastAPI + SQLAlchemy async + Alembic + PostgreSQL (apps/api); scikit-learn (ml/); sourced rates database in the `rates` schema (data/rates/); GitHub Actions CI.

Scope: residential only, Pune and surroundings, standard materials (no brands), preliminary estimates. Out of scope: structural design, floor plans or 3D, live supplier prices, permits, commercial buildings, native mobile apps.

## 2. Non-negotiable rules (the honesty contract)

1. **Never invent data.** No prices, rates, quantities, percentages, multipliers, accuracy figures, citations, URLs, dataset rows, or library APIs. If a value is unknown, write `TODO(data)` and report it.
2. **Missing data means refuse, not default.** If an engine input is NULL or `TODO(data)`, the code must fail with an explicit error naming the missing value. No silent fallbacks, no "reasonable defaults".
3. **Every number is traceable.** Each rate carries `source_id`, page and status. Each estimate stores the dataset version and model/engine version used.
4. **Metrics are measured, never promised.** Accuracy is reported only from a script's output, on real projects only, and appears in a model card. Generated or synthetic data never produces a headline accuracy number.
5. **Label anything not real.** Stub or demo results use `is_mock=true` and a visible MOCK or DEV badge. Mock numbers must look obviously fake (round placeholders), never realistic-looking prices.
6. **Evidence, not claims.** Report only what you ran. Paste real command output; never retype or summarise logs as if they were output. "Done" requires proof (section 7).
7. **Never weaken a check to get green.** No skipping tests, loosening lint/type rules, lowering audit levels, or deleting assertions. If a check is wrong, explain why and ask.
8. **Verify before using a library.** Read the installed version's docs or source. Pin versions and commit lockfiles. Do not code against remembered APIs.
9. **Secrets.** Never commit `.env`, keys, tokens, or database URLs. Never paste secrets into chats or logs. Use the `.env.example` pattern.
10. **Stay in your lane** (section 5). Do not edit files owned by another lane. Ask via the task board.
11. **Ask when ambiguous.** Stop and ask rather than guess. Record decisions in `docs/decisions/` as a short ADR.
12. **Out-of-scope items stay out** (section 1).

Stop and ask the human if you are about to: change the DB schema outside the migration process, add a dependency, change a public API contract, alter the rates data, delete files, rewrite history, change CI, or spend more than the task's scope.

## 3. Bootstrap checklist (do this at the start of every session)

Environment note: the owner develops on **Windows (PowerShell)**. There is usually **no local PostgreSQL or Docker**, so database tests error locally with connection refused. **GitHub Actions CI is the referee** for DB tests. Use PowerShell-safe commands (`Select-String`, not `grep`) in anything you hand to the human.

```
git status
git log -5 --oneline
git fetch; git status -sb          # are you behind origin/main?
```
Then:
1. Read `docs/TASKS.md`. Find your lane. Claim exactly one task by editing its row (status `claimed`, your tool name, date) in a tiny commit on your branch. If a task is already claimed, pick another.
2. Read the skill's `references/status-and-known-issues.md` and compare with reality. The status there is a snapshot, not truth. Verify by running things.
3. Run the baseline checks for your area (section 6) and note anything already failing BEFORE you change code.
4. Check the latest CI result on `main`. If it is red, fixing it is priority zero (only the DevOps lane or the human may touch `.github/`).

## 4. Repository map

```
apps/api/            FastAPI backend (auth, projects, estimates, meta, health)
  app/core/ db/ models/ schemas/ api/v1/ services/ engine/ rates/
  alembic/  tests/
apps/web/            React SPA (pages, components, services, types, mocks)
ml/                  training and evaluation pipeline (infrastructure only until real data exists)
data/rates/          sourced rates database (schema.sql, csv/, validate.py, README)
data/reference/      older reference CSVs (mostly TODO(data); superseded by data/rates)
docs/                decisions/ (ADRs), api/openapi.json, TASKS.md, engine_design.md, methodology.md
.github/workflows/   CI
AGENTS.md  README.md  Makefile  docker-compose.yml  pyproject.toml
```
`README.md` is the product spec but is **partly outdated** (it describes an ML-first design; the bottom-up engine decision came later). Where `README.md` and the skill disagree, the skill and `docs/decisions/` win; flag the drift in your handoff.

## 5. Parallel work protocol

Several agents may work at the same time. These rules prevent collisions.

### 5.1 Lanes and file ownership

| Lane | Owns (only this lane edits) | Reads, never edits |
|---|---|---|
| **L1 Data and Rates** | `data/rates/**`, `data/reference/**`, `docs/DATA_SOURCES.md`, rates extraction scripts | everything else |
| **L2 Backend platform** | `apps/api/app/{core,db,models,schemas,api}/**`, `apps/api/app/services/{auth,project}*`, `apps/api/alembic/**`, their tests | rates schema, engine |
| **L3 Estimation engine** | `apps/api/app/engine/**`, `apps/api/app/rates/**` (read-only repository over the rates schema), `apps/api/tests/engine/**`, `docs/engine_design.md` | schemas (consumes), rates data |
| **L4 ML and calibration** | `ml/**` | engine output contract |
| **L5 Frontend** | `apps/web/**` | OpenAPI contract |
| **L6 DevOps, security, QA** | `.github/**`, Dockerfiles, `docker-compose.yml`, `Makefile`, `e2e/**`, `docs/decisions/**`, security audits | app code (comments via PR review only) |

Files that are **shared** and need an RFC (a short note in `docs/TASKS.md` under "Shared change requests", approved by the human): root `pyproject.toml`, `apps/web/package.json` dependencies, `.env.example`, `docs/api/openapi.json` (generated; never hand-edit), Alembic head, `docs/decisions/`.

### 5.2 Contracts between lanes (agree first, then build in parallel)

- **C1 API contract:** `docs/api/openapi.json`, generated from FastAPI by L2. L5 generates TypeScript types from it and builds against mocks that match it. The estimate response shape is frozen as "v1" (see the skill's `architecture-and-contracts.md`). Changes need an RFC.
- **C2 Rates contract:** the `rates` schema tables and views are read-only. L3 reads them through `apps/api/app/rates/` only. The API's DB role for `rates` has SELECT only. Schema changes belong to L1 and need an RFC.
- **C3 Engine contract:** `EstimationInput` and `EstimationResult` Pydantic models in `apps/api/app/engine/contracts.py`, owned by L3. L2 and L4 import them; nobody else edits them.
- **C4 Design tokens:** `apps/web/tailwind.config` and `src/styles/tokens.css`, owned by L5.

### 5.3 Git workflow

- Work on a branch named `lane/<L#>-<task-id>-<slug>`, e.g. `lane/L3-T14-boq-template`. One task per branch.
- Small commits, conventional messages (`feat(engine): ...`, `fix(api): ...`, `docs: ...`, `test: ...`, `chore: ...`).
- Before pushing: `git fetch` and `git rebase origin/main`. Resolve conflicts only in files you own; if the conflict is in someone else's file, stop and ask.
- Open a pull request into `main`. The human merges. Do not push to `main` directly unless the human explicitly says so for that task.
- **Alembic has exactly one head.** Only L2 creates migrations. Others request one in the task board. If two migrations collide, the later one is renumbered during rebase.
- **Never hand-edit generated files** (`api.generated.ts`, `openapi.json`, lockfiles). Regenerate them with the documented command.
- **Lockfile conflicts:** regenerate with the package manager after rebasing; never merge lockfile hunks by hand.
- If you find a bug outside your lane, add a row to the task board "Found issues"; do not fix it yourself.

### 5.4 Merge order when lanes depend on each other
L1 data -> L3 engine (needs rates) -> L2 wiring (endpoint calls engine) -> L5 real-API wiring -> L6 e2e. L2 auth and projects, L5 UI, L6 CI can proceed immediately in parallel with each other.

## 6. Commands (the referee)

Run what applies to your lane before every push, and paste the real output in your handoff.

| Area | Commands (from the paths shown) |
|---|---|
| Python lint and types | repo root: `python -m ruff check .` then `python -m mypy ml apps/api` |
| Python tests | repo root: `python -m pytest` (DB tests need PostgreSQL; locally they error with connection refused, which is expected, so rely on CI) |
| Rates data | `python data/rates/validate.py` must print `0 ERROR` |
| Web | `apps/web`: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run build` |
| Audits | `pip-audit`; `npm audit --omit=dev --audit-level=high` in `apps/web`; gitleaks runs in CI |

CI jobs: `python-lint-and-test` (ruff, mypy, pytest against a Postgres 16 service, pip-audit), `node-lint-and-test` (eslint, tsc, vitest, build, npm audit), `gitleaks-secret-scan`. All three must be green on your branch before you call the task done.

## 7. Definition of done (every task)

A task is done only when ALL of these are shown, not asserted:
- [ ] The acceptance criteria in `docs/TASKS.md` are met, point by point.
- [ ] Lane checks pass; real output pasted.
- [ ] Tests exist for new behaviour, including at least one failure-path test.
- [ ] No new lint/type suppressions, no skipped tests.
- [ ] No hard-coded business numbers in code (rates, percentages, quantities come from the rates database or config with a source).
- [ ] No secrets, caches, build output or generated junk committed (`git status` is clean of them).
- [ ] CI is green for the branch (paste the run result), or you state "cannot see CI".
- [ ] `docs/TASKS.md` row updated (status `review`), and any docs you made stale are updated.

## 8. Handoff report (end of every task; paste exactly this structure)

```
TASK: <id and title>   LANE: <L#>   TOOL/MODEL: <name>   BRANCH: <name>   COMMIT: <git log -1 hash>
WHAT CHANGED: <files, 3-8 lines>
EVIDENCE: <pasted real output of lane checks; CI status or "cannot see">
ACCEPTANCE: <each criterion: met / not met / partly, with proof>
TODO(data) TOUCHED: <list or none>
ASSUMPTIONS MADE: <list or none; each needs human or engineer review>
FOUND ISSUES (outside lane): <list or none>
UNCERTAIN / NOT VERIFIED: <be specific>
NEXT SUGGESTED TASK: <id>
```
Do not write "no open uncertainties". There are always some. List them.

## 9. Failure patterns seen on this project (do not repeat)

- Claiming data was "sourced" when no source had been opened.
- Retyped or summarised command output presented as real output; commit hashes that were not copied from `git log`.
- Saying CI "should pass" without checking it; testing on SQLite while claiming Postgres coverage.
- Realistic-looking stub prices; three different rate tables and three different category name sets in one codebase.
- Hard-coded values in UI that look like inputs (zone fixed to one value, fake logged-in user).
- Claiming accessibility compliance from jsdom axe tests (colour contrast cannot run there).
- Declaring a task complete while the main behaviour was still mocked.
- Overwriting or deleting someone else's file during packaging or cleanup. Check before you copy over anything.

## 10. Communication style for the human

The owner is a student under time pressure with reviews. Explain results plainly, say what is real and what is mock, lead with what the human must do or check next, and never bury bad news. Short and precise beats long and impressive.

## Appendix: Legacy rules (from earlier AGENTS.md)

The following rules from the previous `AGENTS.md` contain specific constraints not fully subsumed above:
- **Reference to README playbook:** Read `README.md` §2 (Non-negotiable principles) and §22 (Antigravity playbook) before executing any task in this repository.
- **Data Provenance Details:** Every data row must include `source`, `source_date`, and `data_type` (`real_project` | `published_rate_derived` | `synthetic`).
- **Phase-by-Phase Execution:** Work on one phase at a time. Plan first, request approval, then implement, test, lint, and report.
- **Security Specifics:** Follow §14 of `README.md`. Use Argon2id for password hashing, strict validation schemas.

