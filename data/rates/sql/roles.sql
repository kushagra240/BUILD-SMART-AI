-- Optional: a read-only role for the API. The API should never write to reference rates.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'rates_reader') THEN CREATE ROLE rates_reader NOLOGIN; END IF;
END $$;
GRANT USAGE ON SCHEMA rates TO rates_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA rates TO rates_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA rates GRANT SELECT ON TABLES TO rates_reader;
-- Quotes and real projects are written by your admin tooling, not by the public API.
