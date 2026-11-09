# BuildSmart AI: sourced rates database v1.0.0

A PostgreSQL schema (`rates`) holding the cost data the bottom-up estimator needs. Every row has a `source_id`, a page number and a `status`. Nothing was estimated by hand. Unknown values are NULL or listed as open items, never defaulted.

## What is inside

| Table | Rows | What it holds | Source |
|---|---|---|---|
| work_item_ssr | 895 | Building work items: completed rate, labour component, unit, SSR page | PWD SSR 2022-23 ch.6 |
| material_rate_ssr | 986 | Material rates (cement, steel, sand, bricks, tiles, fittings, wood, paint...) | SSR ch.13 |
| labour_rate_ssr | 91 | PWD day rates by trade | SSR ch.14 |
| minimum_wage | 9 | Construction minimum wage by skill and zone, Jul-Dec 2026 | Govt. notifications 2023 and 2026 |
| quantity_norm | 371 | Material per unit of work (cement bags per m3 etc.) | SSR ch.17 |
| transport_trip_cost | 92 | Truck cost per trip by lead distance, manual and machine loading | SSR ch.16 |
| lead_charge_raw | 56 | Statement C-1 numbers as printed (verify columns before use) | SSR ch.16 |
| rate_rule | 21 | Floor lift, depth, foul-condition, royalty, insurance, lead rules | SSR general notes |
| wpi_item, wpi_series | 20, 840 | Wholesale price indices Apr-23 to Sep-26 (base 2022-23 = 100) | Office of Economic Adviser |
| material_wpi_map | 231 | Automatic mapping of materials to the nearest WPI item (unreviewed) | derived |
| zone | 5 | Pune local-body zones with minimum-wage zone; price factors are NULL (TODO) | notification |
| data_source | 5 | Files used, with SHA-256 | |
| price_quote, real_project | 0 | Empty tables for dealer/contractor quotes and ground-truth projects | you collect |

Views: `v_work_item` (non-labour part, labour share), `v_wpi_latest`, `v_material_rate_indicative` (SSR rate x WPI/100), `v_minimum_wage_vs_ssr`.

## Load it

```
createdb buildsmart            # or use your Supabase connection string
psql "$DATABASE_URL" -f sql/schema.sql -f sql/load.sql     # run from this folder
psql "$DATABASE_URL" -f sql/roles.sql                      # optional read-only API role
```
Or restore everything at once: `gunzip -c dist/buildsmart_rates_v1.0.0.sql.gz | psql "$DATABASE_URL"`.
Run `python validate.py` before loading any changed CSV; it exits non-zero on errors (SHA-256: `9942549b9a3d5314`).
Tested on PostgreSQL 16.15: schema, load, constraint rejection tests, and dump restore all pass. Not tested on Supabase itself. Supabase's Data API exposes the `public` schema by default; keep `rates` out of the exposed schemas so only your backend reads it.

## Example queries
```sql
SET search_path = rates, public;
-- Labour moved more than materials
SELECT * FROM v_minimum_wage_vs_ssr WHERE zone = 'I';
-- Indicative 2026 cement, steel, sand rates (read the caveats below)
SELECT material, unit_norm, ssr_rate_2022_23_exgst, update_factor, indicative_rate, match_quality
FROM v_material_rate_indicative WHERE section = 'General Rates';
-- Find an item
SELECT item_no, unit, completed_rate, labour_share, left(description,80) FROM v_work_item
WHERE to_tsvector('simple', description) @@ plainto_tsquery('simple','plaster') AND chapter_no = 32;
-- How much cement per m3 of M-20 concrete?
SELECT * FROM quantity_norm WHERE item ILIKE '%M-20%' AND material = 'Cement';
```

## Read before using any number
1. **Prices are 2022-23, excluding GST.** `v_material_rate_indicative` scales them with a national wholesale index. It treats July 2022 as the FY22-23 average, the OEA gives no linking method, and some mappings are weak (aggregates map to "stone chip"). Validate against dealer quotes.
2. **Work item rates are composite.** Read the full SSR item on `ssr_page` for inclusions (formwork, steel, curing) before using it. Descriptions are machine-extracted and can be truncated.
3. **Rates include a 50 m initial lead.** Extra lead is added separately (`transport_trip_cost`, `lead_charge_raw`). Royalty, labour insurance and GST are outside the rates (`rate_rule`).
4. **`minimum_wage.allowance_verified` is false.** The special allowance was read by eye from a scanned Marathi table; totals match what is printed, but have a person confirm PDF page 3, entry 11.
5. **Pune price factors do not exist yet.** The SSR is statewide. `zone.price_multiplier` is NULL on purpose; the engine must refuse to price with NULL.
6. **Review sheets** list rows the parser was unsure about: 7 work items, 20 quantity-norm rows, 9 material rows, plus SSR serials 1598-1602 not found.

## Open items (not in this database yet)
Shuttering/centering rates, interior emulsion and putty items, drainage and piping items, electrical items (doc2.pdf needs OCR), zone price factors, overheads and GST, dealer and contractor quotes, a quality-tier specification table.

## Updating
Edit the CSV, run `python validate.py`, reload into a new `dataset_version`, and keep the old version. Estimates should store the `dataset_version` they used.
