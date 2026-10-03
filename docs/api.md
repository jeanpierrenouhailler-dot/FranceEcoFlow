# Spécification de l'API REST Backend

Toutes les routes retournent des objets JSON formattés avec code HTTP standard et sont accessibles sous `/api/*`.

## Endpoints Principaux

### 1. `GET /api/flows/summary`
Retourne les indicateurs macroscopiques agrégés sur la sélection active.
- **Paramètres de requête :**
  - `reporter` (défaut: 'FR')
  - `flow` ('import' ou 'export')
  - `product` (défaut: 'crude_oil')
  - `from` (ex: 2015)
  - `to` (ex: 2026)
  - `partner` (optionnel, ISO2 du partenaire)
- **Réponse :**
  ```json
  {
    "filters": { ... },
    "summary": {
      "totalQuantityTonnes": 48250000,
      "totalValueEur": 17520000000,
      "averageImplicitPriceEurPerTonne": 363.11,
      "supplierCount": 14,
      "hhiIndex": 1280,
      "hhiClassification": "MODERATE",
      "topSupplier": { ... },
      "yoyQuantityChangePercent": -1.3,
      "yoyPriceChangePercent": -1.8
    }
  }
  ```

### 2. `GET /api/flows/partners`
Retourne la liste ordonnée des pays partenaires avec leurs parts de marché respectives, volumes et prix implicites.

### 3. `GET /api/flows/timeseries`
Retourne les séries annuelles ou mensuelles de volume (tonnes), valeur (€) et prix unitaire (€/t).

### 4. `GET /api/flows/sankey`
Structure nœuds et liens optimisée pour le rendu du diagramme de flux de Sankey.

### 5. `GET /api/flows/anomalies`
Détection des chocs géopolitiques et variations structurelles sur le produit spécifié.

### 6. `GET /api/countries/:id`
Fiche détaillée bilatérale d'un pays avec la France (historique, flux, routes et ports connectés).

### 7. `GET /api/infrastructures`
Répertoire des ports, terminaux et raffineries avec coordonnées et capacités.

### 8. `GET /api/export`
Génère un export complet au format CSV ou JSON.
- `GET /api/export?format=csv&from=2015&to=2026`
- `GET /api/export?format=json&from=2015&to=2026`
