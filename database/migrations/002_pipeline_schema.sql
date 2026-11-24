-- Align runtime repositories with one versioned schema and retain ingestion lineage.
ALTER TABLE transport_routes
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(10, 2);

ALTER TABLE trade_flows
  ADD COLUMN IF NOT EXISTS raw_nc_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS raw_nc_description VARCHAR(255),
  ADD COLUMN IF NOT EXISTS dau_reference VARCHAR(100),
  ADD COLUMN IF NOT EXISTS validation_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_VALIDATION'
    CHECK (validation_status IN ('RAW', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'QUARANTINED'));

ALTER TABLE trade_flows DROP CONSTRAINT IF EXISTS unique_trade_flow;
CREATE UNIQUE INDEX IF NOT EXISTS idx_trade_flows_source_identity
  ON trade_flows (
    reporter_country_id,
    partner_country_id,
    product_id,
    period_year,
    COALESCE(period_month, 0),
    flow_type,
    COALESCE(source_id, ''),
    COALESCE(dataset_id, '')
  );

DO $$
BEGIN
  IF to_regclass('public.economic_flows') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO sources (id, provider, title, url, license, notes)
      SELECT DISTINCT
        e.source_id,
        ''Unverified legacy source'',
        ''Legacy source reference — verification required'',
        '''',
        ''UNVERIFIED'',
        ''Placeholder created during schema migration; the actual source and license have not been verified.''
      FROM economic_flows e
      WHERE e.source_id IS NOT NULL
      ON CONFLICT (id) DO NOTHING
    ';
    EXECUTE '
      INSERT INTO datasets (id, source_id, name, frequency, update_frequency, methodology_url)
      SELECT
        e.dataset_id,
        MIN(e.source_id),
        ''Legacy dataset — verification required'',
        CASE
          WHEN BOOL_AND(e.period_month IS NULL) THEN ''annual''
          WHEN BOOL_AND(e.period_month IS NOT NULL) THEN ''monthly''
          ELSE ''unknown''
        END,
        ''Unknown'',
        NULL
      FROM economic_flows e
      WHERE e.dataset_id IS NOT NULL
      GROUP BY e.dataset_id
      ON CONFLICT (id) DO NOTHING
    ';
    EXECUTE '
      INSERT INTO trade_flows (
        id, reporter_country_id, partner_country_id, product_id, period_year, period_month,
        flow_type, value_eur, quantity_tonnes, confidence, source_id, dataset_id,
        raw_nc_code, raw_nc_description, dau_reference
      )
      SELECT
        id, reporter_country_id, partner_country_id, product_id, period_year, period_month,
        flow_type, value_eur, quantity_tonnes, confidence, source_id, dataset_id,
        raw_nc_code, raw_nc_description, dau_reference
      FROM economic_flows
      WHERE value_eur > 0 AND quantity_tonnes > 0
      ON CONFLICT DO NOTHING
    ';
  END IF;
END
$$;

ALTER TABLE product_classifications
  ADD COLUMN IF NOT EXISTS nomenclature_version VARCHAR(32),
  ADD COLUMN IF NOT EXISTS valid_from DATE,
  ADD COLUMN IF NOT EXISTS valid_to DATE,
  ADD COLUMN IF NOT EXISTS language VARCHAR(8) NOT NULL DEFAULT 'fr';

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id VARCHAR(64) REFERENCES sources(id),
  dataset_id VARCHAR(64) REFERENCES datasets(id),
  status VARCHAR(32) NOT NULL CHECK (status IN ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED', 'QUARANTINED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  records_received INTEGER NOT NULL DEFAULT 0 CHECK (records_received >= 0),
  records_validated INTEGER NOT NULL DEFAULT 0 CHECK (records_validated >= 0),
  records_rejected INTEGER NOT NULL DEFAULT 0 CHECK (records_rejected >= 0),
  error_summary TEXT
);

CREATE TABLE IF NOT EXISTS raw_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingestion_run_id UUID REFERENCES ingestion_runs(id),
  source_id VARCHAR(64) REFERENCES sources(id),
  dataset_id VARCHAR(64) REFERENCES datasets(id),
  source_url TEXT,
  file_name VARCHAR(255) NOT NULL,
  format VARCHAR(32) NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size >= 0),
  sha256 CHAR(64) NOT NULL,
  license TEXT,
  source_version VARCHAR(64),
  extracted_at TIMESTAMPTZ NOT NULL,
  validation_status VARCHAR(32) NOT NULL CHECK (
    validation_status IN ('RAW', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'QUARANTINED')
  ),
  storage_reference TEXT NOT NULL,
  UNIQUE (sha256)
);

CREATE TABLE IF NOT EXISTS data_provenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_flow_id VARCHAR(64) NOT NULL REFERENCES trade_flows(id) ON DELETE CASCADE,
  raw_file_id UUID REFERENCES raw_files(id),
  source_id VARCHAR(64) REFERENCES sources(id),
  source_record_key TEXT,
  retrieved_at TIMESTAMPTZ,
  transformation_version VARCHAR(64),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS data_quality_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingestion_run_id UUID REFERENCES ingestion_runs(id),
  raw_file_id UUID REFERENCES raw_files(id),
  source_record_key TEXT,
  severity VARCHAR(16) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'ERROR')),
  issue_code VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  observed_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raw_dgddi_declarations (
  id BIGSERIAL PRIMARY KEY,
  annee INTEGER NOT NULL CHECK (annee BETWEEN 1900 AND 2200),
  mois INTEGER CHECK (mois BETWEEN 0 AND 12),
  flux VARCHAR(10) NOT NULL CHECK (flux IN ('1', '2', 'import', 'export')),
  pays_declarant VARCHAR(10) NOT NULL,
  pays_partenaire VARCHAR(10) NOT NULL,
  code_nc8 VARCHAR(20) NOT NULL,
  libelle_nc8 VARCHAR(255) NOT NULL DEFAULT '',
  valeur_caf_euros NUMERIC(18, 2) NOT NULL,
  masse_nette_kg NUMERIC(18, 3) NOT NULL,
  dau_reference VARCHAR(100),
  source VARCHAR(50) NOT NULL,
  checksum_sha256 CHAR(64) NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (checksum_sha256, annee, mois, pays_declarant, pays_partenaire, code_nc8, flux)
);

CREATE TABLE IF NOT EXISTS economic_indicators (
  id VARCHAR(100) PRIMARY KEY,
  indicator_code VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  period VARCHAR(20) NOT NULL,
  value NUMERIC(14, 4) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  label_fr VARCHAR(255) NOT NULL,
  series_id VARCHAR(100),
  retrieved_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS energy_observations (
  id VARCHAR(100) PRIMARY KEY,
  country_id VARCHAR(10) NOT NULL REFERENCES countries(id),
  flow_metric VARCHAR(50) NOT NULL,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id),
  period VARCHAR(20) NOT NULL,
  volume_kboed NUMERIC(12, 2),
  volume_tonnes NUMERIC(15, 2),
  stock_days_net_imports NUMERIC(6, 1),
  source_id VARCHAR(64) NOT NULL REFERENCES sources(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingestion_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id VARCHAR(100) NOT NULL,
  source_id VARCHAR(64) NOT NULL REFERENCES sources(id),
  file_name VARCHAR(255),
  file_sha256 CHAR(64),
  status VARCHAR(20) NOT NULL CHECK (status IN ('PASSED', 'WARNING', 'FAILED')),
  records_loaded INTEGER NOT NULL DEFAULT 0 CHECK (records_loaded >= 0),
  duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  checks_summary JSONB,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trade_flows_period
  ON trade_flows(period_year, period_month, flow_type);
CREATE INDEX IF NOT EXISTS idx_trade_flows_source
  ON trade_flows(source_id, dataset_id);
CREATE INDEX IF NOT EXISTS idx_trade_flows_publication
  ON trade_flows(validation_status, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_product_classifications_version
  ON product_classifications(system, nomenclature_version, code);
CREATE INDEX IF NOT EXISTS idx_transport_routes_distance
  ON transport_routes(distance_km);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source_started
  ON ingestion_runs(source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_files_source_extracted
  ON raw_files(source_id, extracted_at DESC);
CREATE INDEX IF NOT EXISTS idx_quality_issues_run
  ON data_quality_issues(ingestion_run_id, severity);
CREATE INDEX IF NOT EXISTS idx_energy_observations_metric_period
  ON energy_observations(country_id, flow_metric, period);
CREATE INDEX IF NOT EXISTS idx_indicators_code_period
  ON economic_indicators(indicator_code, period);

CREATE INDEX IF NOT EXISTS idx_countries_geom ON countries USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_infrastructures_geom ON infrastructures USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_transport_routes_geom ON transport_routes USING GIST(geom);
