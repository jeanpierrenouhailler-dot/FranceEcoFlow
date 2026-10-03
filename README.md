# France Economic Flow Explorer

> **PWA d'exploration interactive des flux économiques, commerciaux et énergétiques de la France**  
> Basée sur les statistiques douanières officielles (DGDDI), le bilan énergétique (SDES), Eurostat et les infrastructures OpenStreetMap.

---

## 1. Vision & Fonctionnalités Clés

L'application permet d'analyser en profondeur les approvisionnements stratégiques de la France, avec un premier cas d'usage complet dédié au **pétrole brut (HS 2709 / NC8 27090090)** sur la période **2015–2026** :

- **Cartographie Interactive des Flux :** Lignes de flux courbes proportionnelles aux volumes importés (Mt), nœuds de partenaires mondiaux, localisation des terminaux pétroliers (Fos-sur-Mer, Le Havre-Antifer, Donges) et raffineries actives de France.
- **Distinction Statistique vs Itinéraire Logistique :** Séparation stricte entre l'origine statistique déclarée en douane (Trade Flow) et l'itinéraire maritime / terrestre attesté (Transport Route).
- **Échelle de Confiance :** Indicateurs explicites (`CONFIRMED`, `DOCUMENTED`, `PROBABLE`, `UNKNOWN`).
- **Analyses Économiques Avancées :**
  - **Prix unitaire implicite (€ / tonne) :** Calculé rigoureusement par le ratio valeur CAF déclarée / masse nette.
  - **Indice de concentration HHI :** Mesure de la vulnérabilité des approvisionnements avec seuils réglementaires (Commission Européenne / US DoJ).
  - **Diagramme de Sankey :** Visualisation des flux entre pays d'origine, le hub France et les unités de raffinage.
  - **Détection des chocs structurels :** Analyse des variations notables (ex : arrêt quasi-total du pétrole russe post-2022, montée en puissance du brut américain).
- **PWA & Offline :** Compatible mobile et desktop, installable avec invite in-app, fonctionnement hors-ligne avec cache local des dernières données consultées.
- **Export & Partage :** Téléchargement CSV, JSON et impression PDF, URLs partageables conservant l'état des filtres (`?flow=import&product=crude_oil&from=2015&to=2026`).

---

## 2. Architecture Technique

- **Frontend :** React 19, TypeScript, Vite, Tailwind CSS v4, Apache ECharts, MapLibre GL.
- **Backend :** Node.js 22, Express, TypeScript (`tsx`).
- **Base de Données :** Schéma PostgreSQL 16 + PostGIS 3.4 (`GEOMETRY(Point, 4326)` et `GEOMETRY(LineString, 4326)`).
- **PWA :** `vite-plugin-pwa`, Service Worker Workbox, Manifest complet, icônes conformes (192px, 512px, maskable, iOS touch icon).

---

## 3. Installation & Démarrage Rapide

### En développement local

```bash
# 1. Cloner et installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env

# 3. Lancer le serveur unifié (API Express + Vite middlewares sur le port 3000)
npm run dev

# 4. Lancer les tests unitaires
npm test
```

Accéder à l'application dans votre navigateur : `http://localhost:3000`.

### Déploiement avec Docker Compose (avec PostgreSQL & PostGIS)

```bash
docker compose up -d
```

---

## 4. Documentation Détaillée

- [Architecture système & composants](docs/architecture.md)
- [Sources de données & Lignage](docs/data-sources.md)
- [Modèle de données & Schéma relationnel](docs/data-model.md)
- [Spécification des APIs REST](docs/api.md)
- [Méthodologie & Formules mathématiques](docs/methodology.md)

---

## 5. Licences & Références des Données

- Données douanières : **DGDDI** (Licence Ouverte 2.0 Etalab)
- Données énergétiques : **SDES / Ministère de la Transition Écologique**
- Données européennes : **Eurostat** (CC BY 4.0)
- Données cartographiques : **OpenStreetMap Contributors** (ODbL 1.0)
