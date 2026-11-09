-- Load all CSVs. Run from the package root:  psql "$DATABASE_URL" -f sql/schema.sql -f sql/load.sql
SET search_path = rates, public;
BEGIN;
\copy data_source (source_id, name, issuer, edition_date, url, file_name, file_sha256, status, notes) FROM 'csv/data_source.csv' WITH (FORMAT csv, HEADER true)
\copy dataset_version (version_id, label, created_on, price_basis, notes, is_active) FROM 'csv/dataset_version.csv' WITH (FORMAT csv, HEADER true)
\copy parameter (key, value, description) FROM 'csv/parameter.csv' WITH (FORMAT csv, HEADER true)
\copy zone (zone_id, name, min_wage_zone, basis, transport_lead_km_to_main_materials, price_multiplier, source_id, status) FROM 'csv/zone.csv' WITH (FORMAT csv, HEADER true)
\copy labour_rate_ssr (ssr_sr, trade, unit, rate_2022_23, ssr_page, pdf_page, source_id, status, unit_norm) FROM 'csv/labour_rate_ssr.csv' WITH (FORMAT csv, HEADER true)
\copy minimum_wage (wage_id, industry, skill_class, zone, basic_monthly, special_allowance_monthly, total_monthly, total_monthly_as_printed, daily_rate, period_start, period_end, basic_source_id, allowance_source_id, allowance_verified, status) FROM 'csv/minimum_wage.csv' WITH (FORMAT csv, HEADER true)
\copy material_rate_ssr (material_id, section, sr, material, unit, rate, ssr_page, pdf_page, source_id, basis, status, unit_norm, row_quality, is_building_relevant) FROM 'csv/material_rate_ssr.csv' WITH (FORMAT csv, HEADER true)
\copy work_item_ssr (work_item_id, ssr_sr, item_no, ref_no, description, unit, completed_rate, labour_rate, ssr_page, pdf_page, parse_status, chapter_no, chapter_name, source_id, basis) FROM 'csv/work_item_ssr.csv' WITH (FORMAT csv, HEADER true)
\copy quantity_norm (norm_id, category, sr, item, item_unit, material, qty, material_unit, ssr_page, pdf_page, parse_status, source_id, table_title) FROM 'csv/quantity_norm.csv' WITH (FORMAT csv, HEADER true)
\copy transport_trip_cost (row_id, mode, lead_km, avg_speed_kmph, factor, trips_per_day, km_done, overhead_10pct, gross_total, cost_per_trip, n_numbers, ssr_page, pdf_page, diesel_rate_per_l, labour_rate_per_day, truck_hire_per_day, source_id, status) FROM 'csv/transport_trip_cost.csv' WITH (FORMAT csv, HEADER true)
\copy lead_charge_raw (mode, lead_km, v01, v02, v03, v04, v05, v06, v07, v08, v09, v10, v11, v12, v13, v14, ssr_page, pdf_page, source_id, status) FROM 'csv/lead_charge_raw.csv' WITH (FORMAT csv, HEADER true)
\copy rate_rule (rule_id, kind, description, value, unit, reference, note, source_id, status) FROM 'csv/rate_rule.csv' WITH (FORMAT csv, HEADER true)
\copy wpi_item (wpi_code, commodity, weight, item_level, source_id) FROM 'csv/wpi_item.csv' WITH (FORMAT csv, HEADER true)
\copy wpi_series (wpi_code, month, index_value, provisional, source_id) FROM 'csv/wpi_series.csv' WITH (FORMAT csv, HEADER true)
\copy material_wpi_map (material_id, wpi_code, match_quality, rationale, method, reviewed) FROM 'csv/material_wpi_map.csv' WITH (FORMAT csv, HEADER true)
COMMIT;
ANALYZE;
