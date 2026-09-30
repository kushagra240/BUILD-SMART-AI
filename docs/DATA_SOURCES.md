# Data Sources & Provenance Register — BuildSmart AI

Every data source used to train, benchmark, or reference material rates for BuildSmart AI must be catalogued in this document.

## Principles
1. **Provenance on every source:** record URL/document title, access date, license/publishing authority, and how it is used.
2. **No invented citations:** verify each URL before adding.
3. **Data Type Labels:**
   - `real_project`: Actual completed or ongoing Pune residential construction record.
   - `published_rate_derived`: Sourced from Schedule of Rates (PMC SoR) or verified domain portals.
   - `synthetic`: Algorithmic/formula-generated noise augmentation (clearly tagged).

---

## Provenance Table

| Source ID | Name / Publisher | Document / URL | Access Date | Data Type | Usage Description | Verification Status |
|-----------|------------------|----------------|-------------|-----------|-------------------|---------------------|
| SRC-001 | Pune Municipal Corporation (PMC) | Schedule of Rates (SoR) | 2026-09-30 | `published_rate_derived` | Baseline material & labour unit rates | Verified |
| SRC-002 | HouseWise Pune | HouseWise Construction Rate Index | `TODO(data)` | `published_rate_derived` | Per-sq-ft quality tier benchmarks | Pending verification |
| SRC-003 | InfraLens | InfraLens Regional Cost Report | `TODO(data)` | `published_rate_derived` | Zone location multipliers | Pending verification |
| SRC-004 | Local Contractor Records | Anonymized Real Projects (Target ≥40) | Continuous | `real_project` | Validation & evaluation holdout set | In progress |

---

## Change Log
- **2026-09-30**: Initialized Data Sources provenance registry.
