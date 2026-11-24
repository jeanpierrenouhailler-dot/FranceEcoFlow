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
- **PWA :** L’interface est installable et les ressources statiques/polices sont mises en cache. Les réponses API ne sont pas mises en cache pour un usage hors ligne; les données restent indisponibles sans serveur.
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
bun install --frozen-lockfile

# 2. Configurer les variables d'environnement et une base PostgreSQL/PostGIS
cp .env.example .env
# Modifier les valeurs d’identifiants ; définir DATABASE_URL pour la base locale.

# 3. Lancer le serveur unifié (API Express + Vite middlewares sur le port 3000)
npm run dev

# 4. Vérifications locales
bun run test
bun run lint
bun run build
```

Accéder à l'application dans votre navigateur : `http://localhost:3000`.

### Déploiement Docker Compose (prérequis PostgreSQL & PostGIS réels)

```bash
docker compose up -d
```

Compose exige des variables `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD` et `POSTGRES_DB`. Ne réutilisez pas les valeurs d’exemple en production. L’accès à l’application échoue volontairement si PostgreSQL/PostGIS n’est pas opérationnel.

---

## 4. Préparation à la production

Les étapes ci-dessous sont des critères de sortie obligatoires. L’état reflète les vérifications disponibles au 21 novembre 2026 ; les fonctions indisponibles restent désactivées plutôt que de retourner des données non vérifiées.

| Étape | État actuel | Critère de sortie |
|---|---|---|
| 1. Authentifier les données historiques | **Bloquée** — les quatre fichiers recensés ont une empreinte SHA-256, mais leur publication d’origine, leur date d’extraction, leur licence et leurs transformations ne sont pas établies. Ils restent en quarantaine. | Pour chaque fichier, retrouver la publication ou extraction originale, vérifier source, version, période, colonnes, unités et licence, comparer les agrégats à la source lorsque possible, documenter toute transformation et recalculer l’empreinte. Ne retirer de quarantaine qu’après vérification indépendante. |
| 2. Implémenter les connecteurs | **Bloquée** — les neuf connecteurs sont déclarés indisponibles ; aucun ne réalise d’extraction live. | Implémenter et tester les extractions DGDDI, INSEE, Eurostat, UN Comtrade, JODI, EIA, SDES, OpenStreetMap/Overpass et IGN. Gérer les accès, limites de débit, pagination, erreurs, validation du schéma et des unités, normalisation et persistance. Ne pas activer un connecteur sans contrat de source validé. |
| 3. Valider PostgreSQL/PostGIS | **Bloquée** — la base réelle n’a pas été testée dans l’environnement de travail. Une divergence statique existe : le dépôt lit `transport_routes.distance_km`, colonne absente de la migration initiale ; le schéma runtime est appliqué séparément sans versionnement. | Réconcilier et versionner les migrations, vérifier qu’elles ne détruisent pas les données, puis tester le démarrage, PostGIS, écritures/lectures, requêtes spatiales, migrations à blanc et mises à niveau sur une vraie base. PostgreSQL doit rester la source de vérité métier. |
| 4. Compléter les tests de production | **Partiellement validée** — 25 tests unitaires, le contrôle TypeScript et le build passent ; aucun test d’intégration réel PostgreSQL/PostGIS ni recette frontend complète n’a été exécuté. | Ajouter des tests anti-données fictives, tests de connecteurs sur fixtures de test et services contrôlés, tests d’intégration base/API et PostGIS, erreurs API côté frontend, et contrôles Docker en CI. Ne pas faire dépendre la suite unitaire de services externes disponibles en permanence. |
| 5. Recetter en préproduction | **Non exécutée** — aucun environnement staging, `APP_URL`, `DATABASE_URL` ou Docker n’était disponible dans l’environnement d’audit. | Déployer avec secrets gérés hors du dépôt, HTTPS, sauvegardes et journalisation ; vérifier les health checks, l’ingestion, les données affichées, exports, carte, cache et erreurs. Promouvoir uniquement après validation documentée de l’ensemble des étapes précédentes. |

Le dernier build réussit, mais signale un bundle JavaScript supérieur à 500 kB. Ce point de performance est à examiner ; il ne remplace pas les validations de données, de base et de déploiement ci-dessus.

### État des données intégrées

`data/provenance.json` recense les quatre fichiers historiques et leurs empreintes, sans les qualifier d’authentiques. Les fichiers DGDDI annuels et mensuels, le DAU historique et le fichier SDES restent en quarantaine. L’ingestion ne les publie pas et les API de flux répondent indisponible tant qu’un jeu de données vérifié n’est pas chargé.

Les clés `COMTRADE_API_KEY` et `EIA_API_KEY` doivent être fournies par un gestionnaire de secrets ou l’environnement de déploiement lorsqu’elles sont nécessaires. Ne placez aucune clé réelle dans le dépôt ni dans les rapports.

---

## 5. Documentation détaillée

- [Architecture système & composants](docs/architecture.md)
- [Sources de données & Lignage](docs/data-sources.md)
- [Modèle de données & Schéma relationnel](docs/data-model.md)
- [Spécification des APIs REST](docs/api.md)
- [Méthodologie & Formules mathématiques](docs/methodology.md)
- [Audit initial de préparation à la production](docs/audit-production-initial.md)
- [Provenance et qualité des données](docs/data-provenance.md)
- [Sécurité](docs/security.md)
- [Migrations de base](docs/database-migrations.md)
- [Déploiement production](docs/deployment-production.md)
- [Stratégie de tests](docs/testing.md)

---

## 6. Licences & références des données

Les organismes ci-dessous sont des sources de référence envisagées ; les licences applicables aux fichiers actuellement livrés avec le dépôt n’ont pas été établies. Aucun de ces fichiers ne doit être redistribué ou présenté comme authentifié sur la seule base de ce référencement.

- Commerce extérieur : **DGDDI** — licence et jeu de données à vérifier.
- Données énergétiques françaises : **SDES** — licence et jeu de données à vérifier.
- Données européennes : **Eurostat** — licence et jeu de données à vérifier.
- Données géographiques : **OpenStreetMap Contributors** — vérifier la licence et l’attribution pour chaque extraction.
