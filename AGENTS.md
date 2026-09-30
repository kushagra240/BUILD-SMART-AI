# Agent Instructions — BuildSmart AI

Read `README.md` §2 (Non-negotiable principles) and §22 (Antigravity playbook) before executing any task in this repository.

## Non-Negotiable Core Rules
1. **No Invented Data:** Never fabricate prices, rates, datasets, benchmarks, metrics, citations, URLs, or library APIs. Mark missing data as `TODO(data)` and log questions in `docs/decisions/`.
2. **Metrics are Measured:** Headline figures must come from output scripts, not hard-coded constants.
3. **Provenance on Data:** Every data row must include `source`, `source_date`, and `data_type` (`real_project` | `published_rate_derived` | `synthetic`).
4. **Verify Dependencies:** Check current documentation or installed code before writing logic against dependencies.
5. **Phase-by-Phase Plan & Execution:** Work on one phase at a time. Plan first, request approval, then implement, test, lint, and report.
6. **No Scope Creep:** Strictly respect §3 of `README.md`.
7. **Security by Default:** Follow §14 of `README.md`. No secrets in git, use Argon2id for password hashing, strict validation schemas.
