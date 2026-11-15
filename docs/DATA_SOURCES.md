# Data Sources & Provenance Register — BuildSmart AI

Every data source used to train, benchmark, or reference material rates for BuildSmart AI must be catalogued in this document.

## Principles
1. **Provenance on every source:** record URL/document title, access date, license/publishing authority, and how it is used.
2. **No invented citations:** verify each URL before adding. Only sources actually opened and read are marked verified.
3. **Data Type Labels:**
   - `real_project`: Actual completed or ongoing Pune residential construction record.
   - `published_rate_derived`: Sourced from Schedule of Rates (PMC SoR) or verified domain portals.
   - `synthetic`: Algorithmic/formula-generated noise augmentation (clearly tagged).

---

## Current Estimation Baseline (15 Nov 2026)

- **Base rates:** Maharashtra PWD State Schedule of Rates 2022-23 (Civil), recorded as `SRC-01` in `data/rates`. Work-item, material and labour rates are extracted with page references and a recorded PDF hash.
- **Pune calibration:** a flat **`2.85x`** multiplier in `apps/api/app/services/estimation.py`. This is a code-level planning assumption, not a published rate and not yet a `price_quote` or `real_project` row.
- **Tier modifiers:** economy `1.0`, standard `1.15`, premium `1.35` for flooring, finishing, plumbing and electrical materials. These are coarse placeholders, not a sourced quality-tier specification.
- **Output meaning:** **indicative planning baselines**, not verified market rates or contractor quotations.
- **Pending (`TODO(data)`):** verified Pune contractor per-sq-ft rates by tier, a quality-tier specification table, real project records, and validation of the `2.85x` factor and tier modifiers.
- **Not used for estimates:** SRC-002, SRC-003 and SRC-004 remain unverified; no production estimate is derived from them.

---

## Provenance Table

| Source ID | Name / Publisher | Document / URL | Access Date | Data Type | Usage Description | Verification Status |
|-----------|------------------|----------------|-------------|-----------|-------------------|---------------------|
| SRC-001 | Maharashtra PWD | State Schedule of Rates 2022-23 (Civil), effective 25 Jul 2022 | `TODO(data)` | `published_rate_derived` | Baseline work-item, material and labour unit rates; extracted into `data/rates` as `SRC-01` | READ (PDF file name and SHA-256 recorded in `data/rates/csv/data_source.csv`) |
| SRC-002 | HouseWise Pune | HouseWise Construction Rate Index | `TODO(data)` | `published_rate_derived` | Per-sq-ft quality tier benchmarks | unverified |
| SRC-003 | InfraLens | InfraLens Regional Cost Report | `TODO(data)` | `published_rate_derived` | Zone location multipliers | unverified |
| SRC-004 | Local Contractor Records | Anonymized Real Projects (Target ≥40) | `TODO(data)` | `real_project` | Validation & evaluation holdout set | unverified |

> **Note:** `SRC-001` is the only source currently used to price estimates; its PDF file name and SHA-256 are recorded in `data/rates/csv/data_source.csv`. SRC-002 to SRC-004 remain unverified and their values are `TODO(data)`. The `2.85x` Pune calibration factor and the tier modifiers are not yet sourced rows; they are planning assumptions pending real-project and contractor-quote validation.

---

## Change Log
- **2026-09-30**: Initialized Data Sources provenance registry.
- **2026-10-02**: Audited dataset per Step B. Marked all sources as unverified and unverified reference values as `TODO(data)`.
- **2026-11-15**: Locked in the production data state: PWD SSR 2022-23 as the base, flat `2.85x` Pune calibration factor, coarse tier placeholders, and `TODO(data)` for verified Premium-tier and real-project sourcing.
