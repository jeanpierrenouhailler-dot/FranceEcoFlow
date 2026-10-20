# Architecture Système — France Economic Flow Explorer

## 1. Vue d'Ensemble

L'application est conçue selon une architecture modulaire data-driven en couches étanches :

```
[ 9 Sources Officielles ] ──> DGDDI, INSEE, Eurostat, UN Comtrade, JODI, EIA, SDES, OSM/Overpass, IGN
        │
        ▼
[ Couche d'Abstraction des Sources (`server/ingestion/sources/*`) ]
        │  - Connecteur dédié par fournisseur (SourceConnector<T>)
        │  - Validation des codes nomenclatures (HS, NC8) et métriques
        │  - Contrôle des unités (kg -> tonnes métriques nettes)
        │  - Calcul comptable strict des prix unitaires implicites (sans simulation)
        │  - Gestion du cache mémoire, des reprises sur erreur et des quotas
        ▼
[ Base de Données Relationnelle & Spatiale ] ──> PostgreSQL 16 + PostGIS 3.4 (`server/db/`)
        │  - Schéma DDL complet (`server/db/schema.sql`)
        │  - Colonnes géométriques PostGIS : GEOMETRY(Point, 4326), GEOMETRY(LineString, 4326)
        │  - Index spatiaux GIST(geom) pour calculs haute performance
        │  - Repository SQL avec requêtes PostGIS (ST_DWithin, ST_Distance, ST_AsGeoJSON)
        │  - Moteur hybride : connexion pg.Pool avec adaptateur spatial pour résilience
        ▼
[ Couche d'Agrégation & API ] ──> Express REST (/api/flows, /api/database/*, /api/sources/*)
        │
        ▼
[ Frontend PWA ] ──> React, Vite, MapLibre GL, Apache ECharts, Tailwind CSS
```

## 2. Couche de Données : PostgreSQL 16 + PostGIS 3.4

- **Schéma relationnel (`server/db/schema.sql`) :**
  - `countries` & `products` (nomenclatures normalisées)
  - `infrastructures` avec géométrie PostGIS (`Point` ou `LineString`)
  - `transport_routes` avec couloirs maritimes vectoriels PostGIS (`LineString`)
  - `economic_flows` (données douanières réelles)
  - `economic_indicators` (indicateurs macroéconomiques INSEE)
  - `energy_observations` (bilans énergétiques JODI / SDES)
  - `ingestion_audit_logs` (traçabilité cryptographique SHA-256)
- **Requêtes spatiales PostGIS :**
  - Calcul de rayon et de proximité via `ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3 * 1000)`.
  - Export vectoriel via `ST_AsGeoJSON(geom)`.

## 3. Couche d'Abstraction des 9 Sources (`server/ingestion/sources/*`)

1. **`dgddi/` :** Douanes Françaises (importations NC8 27090090, calcul du prix unitaire comptable).
2. **`insee/` :** Séries BDM macroéconomiques (IPI Raffinage, IPC Carburants, Solde commercial).
3. **`eurostat/` :** API REST/SDMX-JSON Comext et bilans pétroliers (`nrg_ti_oil`).
4. **`comtrade/` :** API UN Comtrade v1 avec pagination, cache et gestion de quota.
5. **`jodi/` :** JODI Oil World Database (stocks stratégiques, jours de couverture, entrées raffineries).
6. **`eia/` :** U.S. EIA API v2 (exportations américaines de WTI Midland vers la France).
7. **`sdes/` :** Bilan énergétique de la France et réceptions effectives des terminaux portuaires.
8. **`overpass/` :** Extraction vectorielle OpenStreetMap (terminaux, raffineries, oléoducs SPSE/LHP).
9. **`ign/` :** Cartographie souveraine IGN Géoplateforme (eaux territoriales, ZEE, trait de côte).


## 2. Découplage Frontend / Backend

- **Backend Express (`server.ts`) :**
  - Gère les routes d'API, l'agrégation statistique (somme des volumes, pondération des prix unitaires, calcul HHI).
  - En développement : monte `vite.middlewares` pour un serveur unique sur le port 3000.
  - En production : sert les fichiers statiques pré-compilés de `dist/`.

- **PWA & Résilience Hors-Ligne :**
  - Service worker généré via `vite-plugin-pwa` (stratégie NetworkFirst sur les endpoints `/api/*` et CacheFirst sur les polices et tuiles).
  - `localStorage` fallback côté client dans `src/lib/api.ts` garantissant un affichage complet même en perte de connexion.

## 3. Extensibilité Conçue dès la V1

- **Extensibilité Pays :** Aucune condition hardcodée `if (country === 'France')`. L'entité `EconomicFlow` utilise des clés étrangères `reporter_country_id` et `partner_country_id`.
- **Extensibilité Produits :** Les flux sont rattachés à une table générique `products` liée aux nomenclatures HS et NC8. L'ajout du gaz naturel, du blé ou des métaux ne nécessite aucune modification du moteur de calcul.
