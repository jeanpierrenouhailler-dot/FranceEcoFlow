# Modèle de Données (état du dépôt)

> Le schéma est défini par les migrations de `database/migrations/`. La migration `002` introduit les éléments de pipeline et la publication contrôlée; elle n’a pas encore été exécutée sur une base d’intégration.

## Tables définies dans les fichiers SQL

### `countries`
- `id` (VARCHAR(8), PK) : Code ISO-2 (ex: 'FR', 'KZ', 'US', 'SA', 'NO').
- `iso3` (VARCHAR(3)) : Code ISO-3.
- `name` / `name_fr` (VARCHAR(128)) : Noms officiels.
- `region` / `subregion` (VARCHAR(64)) : Classification géographique ONU.
- `geom` (GEOMETRY(Point, 4326)) : Coordonnées du centroïde.
- `flag` (VARCHAR(16)) : Emoji drapeau.

### `products`, `product_categories` et `product_classifications`
- `products` : Clé primaire `id`, code `code` (ex: 'HS 2709'), `name_fr`, `category_id`, unité de référence (`unit`).
- `product_categories` : Groupements ('energy_hydrocarbons', 'energy_gas', etc.).
- `product_classifications` : Système d'origine ('HS', 'NC8', 'CPA', 'SITC').

### `trade_flows` (schéma de migration initial)
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
- `confidence` (valeur par défaut `UNKNOWN`; contraintes et valeurs autorisées à harmoniser)
- `source_id` (FK -> `sources.id`)

### `transport_routes`
- `id` (VARCHAR(64), PK)
- `source_partner_id` / `destination_reporter_id`
- `mode` ('maritime', 'pipeline', 'rail', 'road', 'unknown')
- `geom` (GEOMETRY(LineString, 4326)) : Tracé géométrique vectoriel.
- `confidence` ('DOCUMENTED', 'PROBABLE')
- `evidence` (TEXT) : Référence de documentation attestant l'itinéraire.

### `infrastructures`
- `id` (VARCHAR(64), PK)
- `name` (VARCHAR(255))
- `type` ('port', 'terminal', 'refinery', 'pipeline', 'depot')
- `geom` (GEOMETRY(Point/Line, 4326))
- `capacity_annual_tonnes` (NUMERIC)
- `operator` (VARCHAR(128))
- `osm_id` (VARCHAR(64))

## Historique et limites

Le repository attend notamment `transport_routes.distance_km`, ajoutée par la migration `002`. Celle-ci copie de façon additive les lignes d’une ancienne table `economic_flows` vers `trade_flows` si cette table existe; les lignes restent en `PENDING_VALIDATION` et sans provenance ne sont pas publiées. La migration versionnée ne remplace pas un test de mise à niveau PostgreSQL réel.

Les modèles SQL ne prouvent pas qu’une extraction existe. Les observations des quatre CSV recensés dans `data/provenance.json` demeurent en quarantaine.
