# Modèle de Données (PostgreSQL & PostGIS)

## Tables Principales

### 1. `countries`
- `id` (VARCHAR(8), PK) : Code ISO-2 (ex: 'FR', 'KZ', 'US', 'SA', 'NO').
- `iso3` (VARCHAR(3)) : Code ISO-3.
- `name` / `name_fr` (VARCHAR(128)) : Noms officiels.
- `region` / `subregion` (VARCHAR(64)) : Classification géographique ONU.
- `geom` (GEOMETRY(Point, 4326)) : Coordonnées du centroïde.
- `flag` (VARCHAR(16)) : Emoji drapeau.

### 2. `products` & Nomenclatures
- `products` : Clé primaire `id`, code `code` (ex: 'HS 2709'), `name_fr`, `category_id`, unité de référence (`unit`).
- `product_categories` : Groupements ('energy_hydrocarbons', 'energy_gas', etc.).
- `product_classifications` : Système d'origine ('HS', 'NC8', 'CPA', 'SITC').

### 3. `trade_flows` (Statistiques Officielles de Commerce)
- `id` (VARCHAR(64), PK)
- `reporter_country_id` (FK -> `countries.id`)
- `partner_country_id` (FK -> `countries.id`)
- `product_id` (FK -> `products.id`)
- `period_year` (INT)
- `period_month` (INT, NULL pour consolidé annuel)
- `flow_type` (VARCHAR(16) CHECK in ('import', 'export'))
- `value_eur` (NUMERIC(18, 2))
- `quantity_tonnes` (NUMERIC(18, 3))
- `implicit_price_eur_per_tonne` (NUMERIC, calculé automatiquement par ratio)
- `confidence` ('CONFIRMED')
- `source_id` (FK -> `sources.id`)

### 4. `transport_routes` (Itinéraires Logistiques Documentés)
- `id` (VARCHAR(64), PK)
- `source_partner_id` / `destination_reporter_id`
- `mode` ('maritime', 'pipeline', 'rail', 'road', 'unknown')
- `geom` (GEOMETRY(LineString, 4326)) : Tracé géométrique vectoriel.
- `confidence` ('DOCUMENTED', 'PROBABLE')
- `evidence` (TEXT) : Référence de documentation attestant l'itinéraire.

### 5. `infrastructures`
- `id` (VARCHAR(64), PK)
- `name` (VARCHAR(255))
- `type` ('port', 'terminal', 'refinery', 'pipeline', 'depot')
- `geom` (GEOMETRY(Point/Line, 4326))
- `capacity_annual_tonnes` (NUMERIC)
- `operator` (VARCHAR(128))
- `osm_id` (VARCHAR(64))
