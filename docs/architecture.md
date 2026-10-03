# Architecture Système — France Economic Flow Explorer

## 1. Vue d'Ensemble

L'application est conçue selon une architecture modulaire data-driven en couches étanches :

```
[ Sources Externes ] ──> DGDDI, SDES, Eurostat, OSM, EIA, JODI, Comtrade
        │
        ▼
[ Couche d'Ingestion & Normalisation ]
        │  - Validation des codes nomenclatures (HS, NC8)
        │  - Contrôle des unités (kg -> tonnes métriques nettes)
        │  - Assignation des niveaux de confiance (CONFIRMED vs DOCUMENTED)
        ▼
[ Base de Données ] ──> PostgreSQL / PostGIS (Schéma géospatial 4326)
        │
        ▼
[ Couche d'Agrégation & API ] ──> Express REST (/api/flows, /api/summary, /api/sankey)
        │
        ▼
[ Frontend PWA ] ──> React, Vite, MapLibre GL, Apache ECharts, Tailwind CSS
```

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
