-- ============================================================
-- FRANCE ECONOMIC FLOW EXPLORER
-- Database Migration 001: Initial Schema (PostgreSQL + PostGIS)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Sources & Datasets (Data Lineage)
CREATE TABLE IF NOT EXISTS sources (
    id VARCHAR(64) PRIMARY KEY,
    provider VARCHAR(128) NOT NULL,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    license VARCHAR(128) NOT NULL,
    retrieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    methodology_url TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS datasets (
    id VARCHAR(64) PRIMARY KEY,
    source_id VARCHAR(64) REFERENCES sources(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    frequency VARCHAR(32) NOT NULL, -- monthly, quarterly, annual
    update_frequency VARCHAR(64),
    last_updated DATE,
    methodology_url TEXT
);

-- 2. Countries
CREATE TABLE IF NOT EXISTS countries (
    id VARCHAR(8) PRIMARY KEY, -- ISO2 (e.g. 'FR', 'KZ', 'US')
    iso3 VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    name_fr VARCHAR(128) NOT NULL,
    region VARCHAR(64) NOT NULL,
    subregion VARCHAR(64),
    geom GEOMETRY(Point, 4326),
    flag VARCHAR(16)
);

-- 3. Product Nomenclature & Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    name_fr VARCHAR(128) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS product_classifications (
    id VARCHAR(64) PRIMARY KEY,
    system VARCHAR(32) NOT NULL, -- 'HS', 'NC8', 'CPA', 'SITC'
    code VARCHAR(32) NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL, -- e.g. HS 2709
    name VARCHAR(128) NOT NULL,
    name_fr VARCHAR(128) NOT NULL,
    category_id VARCHAR(64) REFERENCES product_categories(id),
    unit VARCHAR(16) NOT NULL, -- 't', 'kt', 'bbl'
    description_fr TEXT
);

-- 4. Economic Flows (Statistical Observations)
CREATE TABLE IF NOT EXISTS trade_flows (
    id VARCHAR(64) PRIMARY KEY,
    reporter_country_id VARCHAR(8) REFERENCES countries(id),
    partner_country_id VARCHAR(8) REFERENCES countries(id),
    product_id VARCHAR(64) REFERENCES products(id),
    period_year INT NOT NULL,
    period_month INT, -- NULL for annual aggregate, 1-12 for monthly
    flow_type VARCHAR(16) NOT NULL CHECK (flow_type IN ('import', 'export')),
    value_eur NUMERIC(18, 2) NOT NULL,
    quantity_tonnes NUMERIC(18, 3) NOT NULL,
    implicit_price_eur_per_tonne NUMERIC(14, 2) GENERATED ALWAYS AS (
        CASE WHEN quantity_tonnes > 0 THEN ROUND(value_eur / quantity_tonnes, 2) ELSE 0 END
    ) STORED,
    confidence VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED',
    source_id VARCHAR(64) REFERENCES sources(id),
    dataset_id VARCHAR(64) REFERENCES datasets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_trade_flow UNIQUE (reporter_country_id, partner_country_id, product_id, period_year, period_month, flow_type)
);

CREATE INDEX IF NOT EXISTS idx_trade_flows_reporter_year ON trade_flows(reporter_country_id, period_year);
CREATE INDEX IF NOT EXISTS idx_trade_flows_partner ON trade_flows(partner_country_id);
CREATE INDEX IF NOT EXISTS idx_trade_flows_product ON trade_flows(product_id);

-- 5. Physical Infrastructures (Ports, Terminals, Refineries, Pipelines)
CREATE TABLE IF NOT EXISTS infrastructures (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('port', 'terminal', 'refinery', 'depot', 'pipeline')),
    country_id VARCHAR(8) REFERENCES countries(id),
    operator VARCHAR(128),
    geom GEOMETRY(Geometry, 4326),
    capacity_annual_tonnes NUMERIC(14, 2),
    current_status VARCHAR(32) DEFAULT 'active',
    description_fr TEXT,
    osm_id VARCHAR(64),
    confidence VARCHAR(32) NOT NULL DEFAULT 'DOCUMENTED',
    source_id VARCHAR(64) REFERENCES sources(id)
);

-- 6. Transport Routes (Physical Logistical Pathways - distinct from statistical trade)
CREATE TABLE IF NOT EXISTS transport_routes (
    id VARCHAR(64) PRIMARY KEY,
    source_partner_id VARCHAR(8) REFERENCES countries(id),
    destination_reporter_id VARCHAR(8) REFERENCES countries(id),
    product_id VARCHAR(64) REFERENCES products(id),
    mode VARCHAR(32) NOT NULL CHECK (mode IN ('maritime', 'pipeline', 'rail', 'road', 'unknown')),
    geom GEOMETRY(LineString, 4326),
    confidence VARCHAR(32) NOT NULL CHECK (confidence IN ('CONFIRMED', 'DOCUMENTED', 'PROBABLE', 'UNKNOWN')),
    evidence TEXT NOT NULL,
    source_id VARCHAR(64) REFERENCES sources(id)
);

-- 7. Data Quality & Auditing
CREATE TABLE IF NOT EXISTS data_quality_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL, -- 'PASSED', 'WARNING', 'FAILED'
    details JSONB,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
