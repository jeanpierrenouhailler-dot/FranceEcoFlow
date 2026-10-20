-- ============================================================
-- France Economic Flow Explorer — PostgreSQL 16 + PostGIS 3.4
-- Schema DDL: Nomenclatures, Flows, Macroeconomics, Spatial Infrastructures
-- ============================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Reference Tables (Countries & Products)
CREATE TABLE IF NOT EXISTS countries (
    id VARCHAR(10) PRIMARY KEY,              -- ISO 3166-1 alpha-2 ('FR', 'KZ', 'US', etc.)
    iso3 VARCHAR(3) NOT NULL UNIQUE,          -- ISO 3166-1 alpha-3 ('FRA', 'KAZ', 'USA')
    name VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    subregion VARCHAR(50) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,      -- PostGIS Point [longitude, latitude]
    flag VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,               -- 'crude_oil', 'refined_fuels', 'lng'
    code VARCHAR(50) NOT NULL,                -- 'HS 2709', 'HS 2710'
    name VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    category_id VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 't',    -- 't' (metric tonnes), 'm3', 'bbl'
    description_fr TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Spatial Infrastructures (Ports, Refineries, Terminals, Pipelines)
CREATE TABLE IF NOT EXISTS infrastructures (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('port', 'refinery', 'terminal', 'pipeline', 'storage')),
    country_id VARCHAR(10) REFERENCES countries(id),
    operator VARCHAR(150) NOT NULL,
    geom GEOMETRY(Geometry, 4326) NOT NULL,   -- Point (terminal/port) or LineString (pipeline)
    capacity_annual_tonnes NUMERIC(15, 2) NOT NULL,
    current_status VARCHAR(50) NOT NULL DEFAULT 'active',
    osm_id VARCHAR(100),                      -- OpenStreetMap OSM ID ('relation/1145623', etc.)
    confidence VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    source_id VARCHAR(50) NOT NULL DEFAULT 'osm',
    description_fr TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Spatial GIST Index for high-performance spatial queries
CREATE INDEX IF NOT EXISTS idx_infrastructures_geom ON infrastructures USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_infrastructures_type ON infrastructures(type);

-- 4. Maritime & Continental Transport Corridors (PostGIS LineString)
CREATE TABLE IF NOT EXISTS transport_routes (
    id VARCHAR(100) PRIMARY KEY,
    source_partner_id VARCHAR(10) REFERENCES countries(id),
    destination_reporter_id VARCHAR(10) REFERENCES countries(id),
    product_id VARCHAR(50) REFERENCES products(id),
    mode VARCHAR(50) NOT NULL CHECK (mode IN ('maritime', 'pipeline', 'rail', 'river')),
    geom GEOMETRY(LineString, 4326) NOT NULL, -- Nautical trajectory LineString
    distance_km NUMERIC(10, 2),
    confidence VARCHAR(20) NOT NULL DEFAULT 'DOCUMENTED',
    evidence TEXT,
    source_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transport_routes_geom ON transport_routes USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_transport_routes_partner ON transport_routes(source_partner_id);

-- 5. Staging Tier: Raw DGDDI Customs Single Administrative Documents (DAU)
CREATE TABLE IF NOT EXISTS raw_dgddi_declarations (
    id SERIAL PRIMARY KEY,
    annee INTEGER NOT NULL,
    mois INTEGER CHECK (mois BETWEEN 0 AND 12),
    flux VARCHAR(10) NOT NULL,                -- '1' (import) or '2' (export)
    pays_declarant VARCHAR(10) NOT NULL,      -- 'FR'
    pays_partenaire VARCHAR(10) NOT NULL,      -- ISO2 partner code
    code_nc8 VARCHAR(20) NOT NULL,            -- '27090090', '27090010'
    libelle_nc8 VARCHAR(255) NOT NULL DEFAULT 'Huiles brutes de pétrole ou de minéraux bitumineux',
    valeur_caf_euros NUMERIC(18, 2) NOT NULL,
    masse_nette_kg NUMERIC(18, 2) NOT NULL,
    dau_reference VARCHAR(100),
    source VARCHAR(50) NOT NULL DEFAULT 'DGDDI',
    checksum_sha256 VARCHAR(64),
    ingested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raw_dgddi_annee_mois ON raw_dgddi_declarations(annee, mois);
CREATE INDEX IF NOT EXISTS idx_raw_dgddi_partenaire ON raw_dgddi_declarations(pays_partenaire);

-- 6. Normalized Tier: Economic Trade Flows (DGDDI / Eurostat / UN Comtrade)
CREATE TABLE IF NOT EXISTS economic_flows (
    id VARCHAR(150) PRIMARY KEY,
    reporter_country_id VARCHAR(10) NOT NULL REFERENCES countries(id),
    partner_country_id VARCHAR(10) NOT NULL REFERENCES countries(id),
    product_id VARCHAR(50) NOT NULL REFERENCES products(id),
    period_year INTEGER NOT NULL,
    period_month INTEGER CHECK (period_month BETWEEN 1 AND 12),
    flow_type VARCHAR(10) NOT NULL CHECK (flow_type IN ('import', 'export')),
    value_eur NUMERIC(18, 2) NOT NULL CHECK (value_eur > 0),
    quantity_tonnes NUMERIC(15, 3) NOT NULL CHECK (quantity_tonnes > 0),
    implicit_price_eur_tonne NUMERIC(12, 2) GENERATED ALWAYS AS (ROUND((value_eur / quantity_tonnes), 2)) STORED,
    confidence VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    source_id VARCHAR(50) NOT NULL,
    dataset_id VARCHAR(100) NOT NULL,
    raw_nc_code VARCHAR(20),                  -- Preserved original NC8 code (e.g. '27090090')
    raw_nc_description VARCHAR(255),
    dau_reference VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_flows_reporter_year ON economic_flows(reporter_country_id, period_year, flow_type);
CREATE INDEX IF NOT EXISTS idx_flows_partner ON economic_flows(partner_country_id);
CREATE INDEX IF NOT EXISTS idx_flows_product ON economic_flows(product_id);

-- 6. INSEE Macroeconomic Indicators
CREATE TABLE IF NOT EXISTS economic_indicators (
    id VARCHAR(100) PRIMARY KEY,
    indicator_code VARCHAR(50) NOT NULL,      -- e.g., 'INSEE_IPI_REFINERY', 'INSEE_CPI_ENERGY'
    provider VARCHAR(50) NOT NULL DEFAULT 'INSEE',
    period VARCHAR(20) NOT NULL,              -- '2024-Q1', '2024-03', '2024'
    value NUMERIC(14, 4) NOT NULL,
    unit VARCHAR(50) NOT NULL,                -- 'indice base 100', 'Md €', '%'
    label_fr VARCHAR(255) NOT NULL,
    series_id VARCHAR(100),                   -- INSEE Series ID (e.g. '010537248')
    retrieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_indicators_code_period ON economic_indicators(indicator_code, period);

-- 7. Energy Observations (JODI Oil / SDES / EIA)
CREATE TABLE IF NOT EXISTS energy_observations (
    id VARCHAR(100) PRIMARY KEY,
    country_id VARCHAR(10) NOT NULL REFERENCES countries(id),
    flow_metric VARCHAR(50) NOT NULL,         -- 'REFINERY_INTAKE', 'CLOSING_STOCK', 'PRODUCTION'
    product_id VARCHAR(50) NOT NULL REFERENCES products(id),
    period VARCHAR(20) NOT NULL,
    volume_kboed NUMERIC(12, 2),
    volume_tonnes NUMERIC(15, 2),
    stock_days_net_imports NUMERIC(6, 1),
    source_id VARCHAR(50) NOT NULL,           -- 'jodi', 'sdes', 'eia'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_energy_obs ON energy_observations(country_id, flow_metric, period);

-- 8. Ingestion Audit Logs (Data Lineage & Cryptographic Proof)
CREATE TABLE IF NOT EXISTS ingestion_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(100) NOT NULL,
    source_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255),
    file_sha256 VARCHAR(64),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PASSED', 'WARNING', 'FAILED')),
    records_loaded INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    checks_summary JSONB,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. PostGIS Spatial View: Infrastructures GeoJSON FeatureCollection
CREATE OR REPLACE VIEW v_infrastructures_geojson AS
SELECT 
    id,
    name,
    type,
    operator,
    capacity_annual_tonnes,
    osm_id,
    confidence,
    ST_AsGeoJSON(geom)::jsonb AS geometry
FROM infrastructures;
