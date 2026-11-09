---
name: buildsmart-ai
description: Full project context, design decisions, data rules, architecture contracts, current status and parallel-work protocol for the BuildSmart AI repository (construction cost estimation and material recommendation for Pune homes). Use this skill whenever you work on anything in this repo, even a small edit, a CI fix, a UI tweak, a rates-data change, the estimation engine, ML, auth, docs or tests. Read it BEFORE writing code, and also whenever the user mentions BuildSmart, rates database, SSR, BOQ, estimator, lanes, or the task board.
---

# BuildSmart AI: project skill

This skill gives any agent the context needed to work on BuildSmart AI safely and in parallel with other agents. `AGENTS.md` (repo root) holds the binding rules and the parallel protocol. This file explains what we are building and why. Deep dives live in `references/`.

## When to read what

| If your task touches... | Read |
|---|---|
| API shape, DB tables, module boundaries, what lanes agree on | `references/architecture-and-contracts.md` |
| The sourced rates tables, the bottom-up engine, quantities, ML role | `references/rates-database-and-engine.md` |
| Login, tokens, rate limits, security checklist | `references/auth-security.md` |
| Any UI, design tokens, pages, mocks | `references/frontend-design.md` |
| What is done, what is mocked, known bugs, open decisions | `references/status-and-known-issues.md` |
| Which task to pick, who owns what | `docs/TASKS.md` |

Read only what you need, but always read `status-and-known-issues.md` once per session, because it lists traps.

## The product in plain language

A homeowner or small contractor in Pune enters house details. We return a cost range, a 9-category breakdown, material suggestions, a PDF and saved history. The estimate is built like a quantity surveyor builds one: list the work items a house needs, multiply by quantities, price each with government-published rates, adjust for rules and location, add everything up.

The 9 categories: Foundation, Structure, Masonry, Roofing, Flooring, Plumbing, Electrical, Finishing, Labour.

## Why bottom-up and not "just ML"

There is no public dataset of Pune house specifications with true total costs. A model trained on invented totals would give confident wrong numbers. So:

1. **Rates are real and sourced** (Maharashtra PWD State Schedule of Rates 2022-23, minimum-wage notifications, price indices). Each row has source, page, status.
2. **Quantities come from engineering formulas** that a civil engineer must review. Until reviewed they are ASSUMPTIONS, not facts.
3. **ML is a calibration and range layer**, trained only when real projects exist, and judged only on real projects. Generated data may test code, never prove accuracy.
4. **The engine refuses** to price when a required input is missing.

This is a deliberate strength, not a limitation. Present it that way.

## Things that are true right now (verify before relying on them)

- Backend auth, projects CRUD, DB schema, security middleware and CI exist and were green on the last confirmed commit.
- The estimate endpoint is a **stub** with fake round numbers, flagged `is_mock=true`. `?is_mock=false` returns 501.
- The frontend wizard and results page ran on a **mock API** in the browser. Real-API wiring is partial.
- The sourced rates database (895 work items, 986 material rates, 91 labour rates, 371 quantity norms, wage and index tables) was built and tested on PostgreSQL 16 outside the repo. It must be placed in `data/rates/` and loaded via an Alembic migration plus a seed command.
- No real Pune cost data, no trained model, no PDF service, no deployment yet.
Details and known bugs: `references/status-and-known-issues.md`.

## Decision log (read before proposing alternatives)

| ID | Decision | Status |
|---|---|---|
| D-01 | Bottom-up costing engine is primary; ML is secondary calibration and range | Agreed; needs guide confirmation |
| D-02 | Category mapping: 8 non-labour categories = non-labour part of items; **Labour = sum of labour components** across items, so categories sum to the total without double counting | Recommended; **pending human decision** |
| D-03 | Rates live in a separate PostgreSQL schema `rates`, read-only for the API | Agreed |
| D-04 | Keep our own auth (Argon2id + rotating refresh tokens); do not switch to Clerk or Supabase Auth now | Agreed |
| D-05 | Database host: Supabase or Railway/Render Postgres, decided at deploy time; code stays plain PostgreSQL | Open |
| D-06 | Tailwind stays on v3 until the UI work is finished (v4 upgrade is breaking) | Agreed |
| D-07 | PDF generated server-side with ReportLab plus matplotlib from the saved estimate | Agreed |
| D-08 | Agents work on branches and open PRs; the human merges | Recommended for parallel work |
| D-09 | Indicative price updating uses WPI (base 2022-23 = 100) only as a labelled indicative factor, never as truth | Agreed |
| D-10 | Headline accuracy is reported only against real projects or contractor/dealer quotes | Agreed |

## Glossary

- **SSR**: Schedule of Rates. Here, the Maharashtra PWD State Schedule of Rates 2022-23, statewide, excluding GST, with 50 m initial lead included.
- **Completed item rate**: a composite price for finished work (materials, labour, overheads) per unit. `labour_rate` is the labour part.
- **BOQ**: bill of quantities. The list of work items with quantities and rates.
- **DSR**: CPWD Delhi Schedule of Rates (cross-check source, not yet obtained).
- **WPI**: Wholesale Price Index (national). Used only for indicative updating.
- **Lead / lift**: transport distance beyond the included 50 m / vertical movement for upper floors. SSR adds charges for both.
- **P10 / P50 / P90**: low / median / high estimate. P50 is the headline, P10 to P90 the range.
- **Zone (min wage)**: Zone I = municipal corporations (Pune, Pimpri-Chinchwad), II = class A/B/C councils and cantonments, III = others.
- **TODO(data)**: an explicit marker for a missing sourced value. Code must treat it as "refuse".
- **is_mock**: flag on estimates produced by stub or demo code. Must be true for anything not computed from sourced data.
- **Lane**: a slice of the repo owned by one agent at a time (see AGENTS.md section 5).

## How to work well here

1. Bootstrap per AGENTS.md section 3. Claim one task on the board.
2. Read the reference file for your area. Check the code before trusting any status text.
3. Write the failing test first when you can. Keep changes inside your lane's files.
4. Never type a business number you cannot point to a source for.
5. Run the lane checks, paste real output, open a PR, hand off in the exact format from AGENTS.md section 8.

## Asking for help

If you need something only the human can provide (a decision, a real quote, a civil engineer's review, a secret, a merge), put it in `docs/TASKS.md` under "Needs human" with the exact question and what you will do meanwhile. Do not block silently, and do not guess.
