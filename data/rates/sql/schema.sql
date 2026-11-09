-- BuildSmart AI: sourced rates database, PostgreSQL 16
-- Every row carries provenance (source_id) and a status. Nothing is estimated by hand.
CREATE SCHEMA IF NOT EXISTS rates;
SET search_path = rates, public;

CREATE TABLE data_source (
  source_id    text PRIMARY KEY,
  name         text NOT NULL,
  issuer       text,
  edition_date date,
  url          text,
  file_name    text,
  file_sha256  char(64),
  status       text NOT NULL CHECK (status IN ('READ','HAND-READ','NOT EXTRACTED','SECONDARY','NOT OBTAINED')),
  notes        text
);
COMMENT ON TABLE data_source IS 'Every document or file that data was taken from. file_sha256 lets you prove which file a number came from.';

CREATE TABLE dataset_version (
  version_id  text PRIMARY KEY,
  label       text NOT NULL,
  created_on  date NOT NULL,
  price_basis text NOT NULL,
  notes       text,
  is_active   boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX one_active_dataset ON dataset_version (is_active) WHERE is_active;

CREATE TABLE parameter (
  key         text PRIMARY KEY,
  value       numeric NOT NULL,
  description text
);

CREATE TABLE zone (
  zone_id     text PRIMARY KEY,
  name        text NOT NULL,
  min_wage_zone text NOT NULL CHECK (min_wage_zone IN ('I','II','III')),
  basis       text,
  transport_lead_km_to_main_materials numeric CHECK (transport_lead_km_to_main_materials >= 0),
  price_multiplier numeric CHECK (price_multiplier > 0),
  source_id   text NOT NULL REFERENCES data_source,
  status      text NOT NULL
);
COMMENT ON COLUMN zone.price_multiplier IS 'NULL until a sourced value exists (TODO(data)). The engine must refuse to price with NULL, not default.';

CREATE TABLE labour_rate_ssr (
  ssr_sr      integer PRIMARY KEY,
  trade       text NOT NULL,
  unit        text NOT NULL,
  rate_2022_23 numeric(10,2) NOT NULL CHECK (rate_2022_23 > 0),
  ssr_page    integer NOT NULL,
  pdf_page    integer NOT NULL,
  source_id   text NOT NULL REFERENCES data_source,
  status      text NOT NULL,
  unit_norm   text NOT NULL
);

CREATE TABLE minimum_wage (
  wage_id     text PRIMARY KEY,
  industry    text NOT NULL,
  skill_class text NOT NULL CHECK (skill_class IN ('Skilled','Semi-skilled','Unskilled')),
  zone        text NOT NULL CHECK (zone IN ('I','II','III')),
  basic_monthly integer NOT NULL CHECK (basic_monthly > 0),
  special_allowance_monthly integer NOT NULL CHECK (special_allowance_monthly >= 0),
  total_monthly integer NOT NULL,
  total_monthly_as_printed integer,
  daily_rate  numeric(10,2) NOT NULL CHECK (daily_rate > 0),
  period_start date NOT NULL,
  period_end   date NOT NULL,
  basic_source_id text NOT NULL REFERENCES data_source,
  allowance_source_id text NOT NULL REFERENCES data_source,
  allowance_verified boolean NOT NULL DEFAULT false,
  status      text NOT NULL,
  CHECK (total_monthly = basic_monthly + special_allowance_monthly),
  CHECK (period_end > period_start),
  UNIQUE (industry, skill_class, zone, period_start)
);

CREATE TABLE material_rate_ssr (
  material_id text PRIMARY KEY,
  section     text NOT NULL,
  sr          text NOT NULL,
  material    text NOT NULL,
  unit        text NOT NULL,
  rate        numeric(14,2) NOT NULL CHECK (rate > 0),
  ssr_page    integer NOT NULL,
  pdf_page    integer NOT NULL,
  source_id   text NOT NULL REFERENCES data_source,
  basis       text NOT NULL,
  status      text NOT NULL,
  unit_norm   text NOT NULL,
  row_quality text NOT NULL CHECK (row_quality IN ('OK','DUPLICATE_SR_IN_SECTION')),
  is_building_relevant boolean NOT NULL
);
CREATE INDEX material_section_idx ON material_rate_ssr (section);
CREATE INDEX material_text_idx ON material_rate_ssr USING gin (to_tsvector('simple', material));
COMMENT ON COLUMN material_rate_ssr.rate IS 'INR per unit, excluding GST, SSR 2022-23 prices.';

CREATE TABLE work_item_ssr (
  work_item_id text PRIMARY KEY,
  ssr_sr       integer NOT NULL UNIQUE,
  item_no      text NOT NULL UNIQUE,
  ref_no       text,
  description  text NOT NULL,
  unit         text,
  completed_rate numeric(14,2) NOT NULL CHECK (completed_rate >= 0),
  labour_rate    numeric(14,2) NOT NULL CHECK (labour_rate >= 0),
  ssr_page     integer NOT NULL,
  pdf_page     integer NOT NULL,
  parse_status text NOT NULL CHECK (parse_status IN ('OK','OK_VARIANT','REVIEW')),
  chapter_no   integer NOT NULL,
  chapter_name text NOT NULL,
  source_id    text NOT NULL REFERENCES data_source,
  basis        text NOT NULL,
  CHECK (labour_rate <= completed_rate)
);
CREATE INDEX work_item_chapter_idx ON work_item_ssr (chapter_no);
CREATE INDEX work_item_text_idx ON work_item_ssr USING gin (to_tsvector('simple', description));
COMMENT ON TABLE work_item_ssr IS 'Completed item rates from the PWD SSR building chapters. completed_rate includes materials, labour, overheads; labour_rate is the labour component. Read the SSR page for inclusions.';

CREATE TABLE quantity_norm (
  norm_id      text PRIMARY KEY,
  category     text NOT NULL,
  sr           integer,
  item         text NOT NULL,
  item_unit    text,
  material     text NOT NULL,
  qty          numeric(12,4) CHECK (qty IS NULL OR qty >= 0),
  material_unit text,
  ssr_page     integer NOT NULL,
  pdf_page     integer NOT NULL,
  parse_status text NOT NULL,
  source_id    text NOT NULL REFERENCES data_source,
  table_title  text
);
CREATE INDEX norm_item_idx ON quantity_norm (category, sr);

CREATE TABLE transport_trip_cost (
  row_id       text PRIMARY KEY,
  mode         text NOT NULL CHECK (mode IN ('manual loading','machine loading')),
  lead_km      numeric NOT NULL CHECK (lead_km > 0),
  avg_speed_kmph numeric,
  factor       numeric,
  trips_per_day numeric,
  km_done      numeric,
  overhead_10pct numeric,
  gross_total  numeric,
  cost_per_trip numeric(12,2) NOT NULL CHECK (cost_per_trip > 0),
  n_numbers    integer,
  ssr_page     integer NOT NULL,
  pdf_page     integer NOT NULL,
  diesel_rate_per_l numeric,
  labour_rate_per_day numeric,
  truck_hire_per_day numeric,
  source_id    text NOT NULL REFERENCES data_source,
  status       text NOT NULL,
  UNIQUE (mode, lead_km)
);

CREATE TABLE lead_charge_raw (
  mode text NOT NULL, lead_km numeric NOT NULL,
  v01 numeric, v02 numeric, v03 numeric, v04 numeric, v05 numeric, v06 numeric, v07 numeric,
  v08 numeric, v09 numeric, v10 numeric, v11 numeric, v12 numeric, v13 numeric, v14 numeric,
  ssr_page integer NOT NULL, pdf_page integer NOT NULL,
  source_id text NOT NULL REFERENCES data_source, status text NOT NULL,
  PRIMARY KEY (mode, lead_km, pdf_page)
);
COMMENT ON TABLE lead_charge_raw IS 'Statement C-1 numbers as printed. Column meanings are in the PDF page header; verify before using.';

CREATE TABLE rate_rule (
  rule_id     text PRIMARY KEY,
  kind        text NOT NULL,
  description text NOT NULL,
  value       numeric,
  unit        text,
  reference   text,
  note        text,
  source_id   text NOT NULL REFERENCES data_source,
  status      text NOT NULL
);

CREATE TABLE wpi_item (
  wpi_code  text PRIMARY KEY,
  commodity text NOT NULL,
  weight    numeric,
  item_level text,
  source_id text NOT NULL REFERENCES data_source
);
CREATE TABLE wpi_series (
  wpi_code    text NOT NULL REFERENCES wpi_item,
  month       date NOT NULL CHECK (extract(day FROM month) = 1),
  index_value numeric(8,1) NOT NULL CHECK (index_value > 0),
  provisional boolean NOT NULL,
  source_id   text NOT NULL REFERENCES data_source,
  PRIMARY KEY (wpi_code, month)
);
CREATE TABLE material_wpi_map (
  material_id text PRIMARY KEY REFERENCES material_rate_ssr,
  wpi_code    text NOT NULL REFERENCES wpi_item,
  match_quality text NOT NULL CHECK (match_quality IN ('good','fair','weak')),
  rationale   text,
  method      text NOT NULL,
  reviewed    boolean NOT NULL DEFAULT false
);
COMMENT ON TABLE material_wpi_map IS 'Automatic keyword mapping of SSR materials to the nearest WPI item. reviewed=false until a human confirms.';

-- Empty tables ready for data you collect yourself ---------------------------
CREATE TABLE price_quote (
  quote_id     bigserial PRIMARY KEY,
  collected_on date NOT NULL,
  collected_by text NOT NULL,
  item         text NOT NULL,
  spec         text,
  unit         text NOT NULL,
  supplier     text NOT NULL,
  zone_id      text REFERENCES zone,
  price_inr    numeric(14,2) NOT NULL CHECK (price_inr > 0),
  includes_gst boolean NOT NULL,
  delivered    boolean NOT NULL,
  evidence_file text NOT NULL,
  data_type    text NOT NULL CHECK (data_type IN ('dealer_quote','contractor_quote')),
  note         text
);
CREATE TABLE real_project (
  project_id   bigserial PRIMARY KEY,
  built_up_area_sqft numeric NOT NULL CHECK (built_up_area_sqft > 0),
  floors       smallint NOT NULL CHECK (floors BETWEEN 1 AND 6),
  bedrooms     smallint, bathrooms smallint,
  zone_id      text NOT NULL REFERENCES zone,
  quality_tier text NOT NULL CHECK (quality_tier IN ('economy','standard','premium')),
  construction_type text,
  completion_year smallint NOT NULL CHECK (completion_year BETWEEN 2015 AND 2100),
  total_cost_inr numeric(16,2) NOT NULL CHECK (total_cost_inr > 0),
  land_excluded boolean NOT NULL DEFAULT true,
  source       text NOT NULL,
  source_date  date NOT NULL,
  data_type    text NOT NULL CHECK (data_type IN ('real_project','published_rate_derived','synthetic')),
  collected_by text NOT NULL,
  note         text
);
COMMENT ON TABLE real_project IS 'Ground-truth projects used only to VALIDATE the engine and the model. Never mix with generated rows.';

-- Views -------------------------------------------------------------------
CREATE VIEW v_work_item AS
SELECT w.*, (completed_rate - labour_rate) AS non_labour_rate,
       CASE WHEN completed_rate > 0 THEN round(labour_rate / completed_rate, 3) END AS labour_share
FROM work_item_ssr w;

CREATE VIEW v_wpi_latest AS
SELECT DISTINCT ON (wpi_code) wpi_code, month AS latest_month, index_value AS latest_index, provisional
FROM wpi_series ORDER BY wpi_code, month DESC;

CREATE VIEW v_material_rate_indicative AS
SELECT m.material_id, m.section, m.material, m.unit_norm, m.rate AS ssr_rate_2022_23_exgst,
       i.commodity AS wpi_item, mp.match_quality, mp.reviewed,
       l.latest_month, l.latest_index,
       round(l.latest_index / (SELECT value FROM parameter WHERE key = 'wpi_base'), 4) AS update_factor,
       round(m.rate * l.latest_index / (SELECT value FROM parameter WHERE key = 'wpi_base'), 2) AS indicative_rate
FROM material_rate_ssr m
JOIN material_wpi_map mp USING (material_id)
JOIN wpi_item i USING (wpi_code)
JOIN v_wpi_latest l USING (wpi_code);
COMMENT ON VIEW v_material_rate_indicative IS 'INDICATIVE only: SSR rate x WPI(latest)/100. National wholesale index, treats Jul 2022 as the FY22-23 average. Validate with dealer quotes.';

CREATE VIEW v_minimum_wage_vs_ssr AS
SELECT w.zone, w.skill_class, w.daily_rate AS min_wage_daily_2026,
       l.trade AS ssr_trade, l.rate_2022_23 AS ssr_daily_2022_23,
       round(w.daily_rate / l.rate_2022_23, 3) AS ratio
FROM minimum_wage w
JOIN labour_rate_ssr l ON l.ssr_sr = CASE w.skill_class WHEN 'Skilled' THEN 3 WHEN 'Semi-skilled' THEN 20 ELSE 33 END;
