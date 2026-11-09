# Rates database and the bottom-up engine

Contents: 1 sources, 2 tables, 3 caveats you must respect, 4 engine design, 5 range and confidence, 6 what can be priced today, 7 quantity formulas rule, 8 tests, 9 open data items.

## 1. Sources (all opened and read; hashes in `data_source`)

| ID | Document | Used for | Status |
|---|---|---|---|
| SRC-01 | Maharashtra PWD State Schedule of Rates 2022-23 (Civil), 624 pages, effective 25 Jul 2022 | work items, material rates, labour rates, quantity norms, transport, general-note rules | READ |
| SRC-02 | Minimum wage notification, construction/roads/building operations, 7 Jun 2023 | basic monthly wages by zone and skill | READ |
| SRC-03 | Special allowance notification, 5 Aug 2026 (Jul-Dec 2026) | allowance, entry 11 | **HAND-READ from a scanned Marathi table; unverified by a human** |
| SRC-04 | Wholesale Price Index monthly file, Oct 2026 release, base 2022-23 = 100, Apr-23 to Sep-26 | indicative updating | READ (last two months provisional) |
| SRC-05 | PWD file "DRAFT 20-7-2022" (322 scanned pages, probably electrical) | electrical items | NOT EXTRACTED (needs OCR) |
Web price pages (InfraLens and similar) were checked once for sanity only. They disagree by 10 to 40 percent and are **never** data.

## 2. Tables (schema `rates`, PostgreSQL 16, tested)

| Table | Rows | Meaning |
|---|---|---|
| work_item_ssr | 895 | building items: `completed_rate`, `labour_rate`, `unit`, `chapter_no`, `chapter_name`, `ssr_page`, `parse_status` (OK, OK_VARIANT, REVIEW) |
| material_rate_ssr | 986 | material rates ex-GST with `unit_norm`, `row_quality`, `is_building_relevant` |
| labour_rate_ssr | 91 | PWD day rates 2022-23 (mason 677, semi-skilled 648, helper 615 and so on) |
| minimum_wage | 9 | Zone I/II/III x skilled/semi/unskilled, monthly and daily, Jul-Dec 2026; `allowance_verified=false` |
| quantity_norm | 371 | material per unit of work (SSR ch.17); 351 usable rows, 20 flagged REVIEW |
| transport_trip_cost | 92 | cost per trip by lead km, manual and machine loading |
| lead_charge_raw | 56 | Statement C-1 raw numbers; column meanings need verifying against the PDF page header |
| rate_rule | 21 | floor lift 1 to 4 percent, excavation depth +20/+30 percent, foul condition +25/+5, scaffolding +1, curing +5, royalty, insurance 0.5/1.0, 50 m initial lead, GST excluded |
| wpi_item, wpi_series | 20, 840 | price indices, monthly |
| material_wpi_map | 231 | automatic keyword mapping to WPI items; `reviewed=false` |
| zone | 5 | Pune local-body zones with min-wage zone; `price_multiplier` and lead distances are NULL on purpose |
| data_source, dataset_version, parameter | | provenance, versioning, constants (`wpi_base = 100`) |
| price_quote, real_project | 0 | empty; for dealer/contractor quotes and ground-truth projects |

Package contents: `schema.sql`, `load.sql`, `roles.sql`, `csv/`, `validate.py` (must print 0 ERROR), `README.md`, a restorable dump, an Excel copy for reading. Load: `psql "$DATABASE_URL" -f sql/schema.sql -f sql/load.sql`. Production path: an Alembic migration creates the schema; a seed command (idempotent) loads the CSVs.

## 3. Caveats you must respect

1. **Prices are 2022-23, ex-GST.** Current prices need updating. Labour moved a lot: minimum wage (Zone I, 2026) is about 1.40 times the PWD 2022-23 rate for each skill. Cement and mild-steel indices are slightly below the 2022-23 average.
2. **Completed rates are composite.** Read the item on its SSR page for inclusions (formwork, steel, curing). Concrete item rates may exclude reinforcement and shuttering. Descriptions are machine-extracted and can be truncated.
3. **Rates include a 50 m initial lead.** Extra lead is charged separately. Royalty, labour insurance and GST are outside the rates (`rate_rule`).
4. **`v_material_rate_indicative` is indicative.** National wholesale index; treats July 2022 as the FY22-23 average; some mappings are weak (aggregates mapped to "stone chip"). Label it indicative in any output.
5. **The SSR is statewide.** No Pune-specific price factor exists in public documents. Geography enters only through minimum-wage zone, transport lead, floor lift, and real quotes. `zone.price_multiplier` NULL means refuse.
6. **Rows flagged REVIEW** (7 work items, 20 norm rows, 9 material rows) and SSR serials 1598-1602 are not usable until a human checks them.
7. **No quantity formulas exist yet** for a house. They are the main missing input (section 7).

## 4. Engine design (decision D-01)

For one house the engine does:
1. **BOQ template:** the list of SSR work items a house of the chosen type uses (by item number), chosen and reviewed by a civil engineer. Stored as data (`boq_template` table or reviewed CSV), not code.
2. **Quantities:** each item's quantity is a formula of the inputs (built-up area, floors, plot area, rooms, tier). Formulas are ASSUMPTIONS until reviewed (section 7).
3. **Pricing:** quantity x `completed_rate` for the item (lookup by item number and dataset version).
4. **Rules from `rate_rule`:** apply floor lift by floor, excavation depth increments, foul-condition and curing options only when the input says they apply. Each application is recorded in the result's audit trail.
5. **Labour split:** `labour_rate` is the labour part of each item. For the Labour category, sum the labour parts (decision D-02). Optionally report an indicative current-labour figure by scaling with the minimum-wage ratio, clearly labelled.
6. **Optional indicative update:** WPI factor for mapped materials, clearly labelled indicative; off by default until validated against quotes.
7. **Overheads, contingency, GST:** only from sourced values. Until sourced they are `TODO(data)` and must be reported as "not included", never guessed.
8. **Categories:** each item maps to one of the 8 non-labour categories via an engineer-reviewed `item -> category` table; Labour is the sum of labour parts. Totals must reconcile exactly.
9. **Output:** integers, largest-remainder rounding, with a per-item audit trail (item number, quantity, rate, source page, rules applied) so any number can be traced.

## 5. Range and confidence (proposal; needs human decision)

Do **not** invent plus-or-minus percentages. Options that use data:
- **Basis range:** low = SSR 2022-23 rates as published; high = rates with documented updates (index factor for mapped materials, minimum-wage-scaled labour). The spread comes from real alternative price bases and is explainable.
- **Later (needs real projects):** empirical error quantiles of engine-versus-actual, giving a P10 to P90 band, then a calibration model.
- **Confidence label** is a documented function of (a) share of the total priced from reviewed items versus REVIEW or weakly mapped ones, (b) whether the input lies in the range the formulas were reviewed for, (c) whether real-project validation exists. With no real validation the label is capped at Low or Medium and says why.
Until validation exists, every result says "calculated from published rates; validation in progress".

## 6. What can be priced today

Roughly seven of nine categories have sourced item rates: foundation and structure (excavation, PCC, RCC concrete and steel fixing), masonry, flooring, plumbing and finishing items, doors and windows, waterproofing, labour. **Not priceable yet:** electrical (SSR electrical volume unread), shuttering and formwork (items not yet extracted), interior emulsion and drainage items, overheads and GST, Pune price factors, any quantities. The engine must report these as missing, not skip them silently.

## 7. Quantity formulas rule

Agents must not write numeric quantity formulas from memory or "typical values". Produce `docs/engine_design.md` listing, for a 2-floor RCC independent house, every quantity needed (for example concrete volume per sq ft of built-up area by element) as an ASSUMPTION with an empty value, the SSR items it prices, and the question for the engineer. A civil engineering professor or contractor fills and signs them. Only then do they enter `boq.py` or the template table, with a `reviewed_by` and date.

## 8. Tests the engine must have

- Unit tests per rule (floor lift, depth, lead) using values read from the database, not typed.
- Property tests: categories sum exactly to the total; more area never lowers cost; adding a floor never lowers cost; premium tier not below standard.
- A **golden test**: one hand-priced mini-BOQ (three items) computed by a human with a calculator from database values.
- Missing-data tests: NULL zone factor, TODO item, unreviewed quantity each produce `MissingDataError` with the exact key.
- Stub-unreachable test: stub numbers cannot be returned when `is_mock=false`.

## 9. Open data items (not in the database yet)

Shuttering and centering items; interior emulsion and putty; drainage and piping items; electrical items; zone price factors and lead distances; overheads, profit, contingency, GST; quality-tier specification table; dealer quotes (3 per key material); contractor per-sq-ft rates by tier; real project records (target 40 or more); CPWD DSR 2023 and Analysis of Rates cross-check; human verification of SRC-03 digits; review of the 231 automatic index mappings.
