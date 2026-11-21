# France Economic Flow Explorer

> **État : NOT READY FOR PRODUCTION.** Les extractions réelles ne sont pas encore implémentées et les fichiers historiques livrés avec le dépôt sont en quarantaine faute de provenance vérifiable. Les API de données refusent donc actuellement de présenter ces valeurs comme réelles.

---

## 1. Vision & Fonctionnalités Clés

L’interface contient des vues d’exploration pour les flux commerciaux et énergétiques. Leur disponibilité dépend de l’implémentation et de la validation des connecteurs et jeux de données ; aucune couverture historique ni infrastructure n’est actuellement attestée.

- **Cartographie :** La vue cartographique est présente, mais aucune infrastructure ni route non vérifiée n’est publiée.
- **Provenance :** Les fichiers intégrés sont identifiés par empreinte SHA-256 et restent en quarantaine jusqu’à authentification.
- **Échelle de Confiance :** Indicateurs explicites (`CONFIRMED`, `DOCUMENTED`, `PROBABLE`, `UNKNOWN`).
- **Analyses Économiques Avancées :**
  - **Prix unitaire implicite (€ / tonne) :** Calculé rigoureusement par le ratio valeur CAF déclarée / masse nette.
  - **Indice de concentration HHI :** Mesure de la vulnérabilité des approvisionnements avec seuils réglementaires (Commission Européenne / US DoJ).
  - **Diagramme de Sankey :** Visualisation des flux entre pays d'origine, le hub France et les unités de raffinage.
  - **Détection des variations :** Les anomalies ne sont calculées qu’à partir de flux annuels chargés et vérifiés.
- **PWA :** L’interface est installable ; les réponses d’API en cache ne sont plus réutilisées comme données actuelles après une erreur réseau.
- **Export & Partage :** Les exports de flux sont désactivés tant qu’aucun jeu de données vérifié n’est disponible.

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

# 2. Configurer les variables d'environnement et une base PostgreSQL/PostGIS
cp .env.example .env
# Modifier les valeurs d’identifiants ; définir DATABASE_URL pour la base locale.

# 3. Lancer le serveur unifié (API Express + Vite middlewares sur le port 3000)
npm run dev

# 4. Lancer les tests unitaires
npm test
```

Accéder à l'application dans votre navigateur : `http://localhost:3000`.

### Déploiement Docker Compose (prérequis PostgreSQL & PostGIS réels)

```bash
docker compose up -d
```

Compose exige des variables `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD` et `POSTGRES_DB`. Ne réutilisez pas les valeurs d’exemple en production. L’accès à l’application échoue volontairement si PostgreSQL/PostGIS n’est pas opérationnel.

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
