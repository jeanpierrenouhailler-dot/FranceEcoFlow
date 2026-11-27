# Contexte de préparation à la production

Mis à jour le 27 novembre 2026.

## État

FranceEcoFlow n’est pas prêt pour la production. Le système reste en mode fail-closed : les fichiers historiques non authentifiés sont en quarantaine, les connecteurs sans extraction live sont indisponibles et les API ne doivent pas présenter de flux non vérifiés.

L’outillage du dépôt a été modernisé le 27 novembre 2026 (commit `15d15d2`, poussé sur `main`, CI verte) : gestionnaire de paquets standardisé sur npm avec `package-lock.json`, lint `tsc --noEmit` + `oxlint` sans avertissement, Prettier, hooks git Lefthook, workflow CI GitHub Actions, `AGENTS.md`, documentation de quarantaine du CSV brut DGDDI, et bundle initial réduit de 1,49 Mo à 244 kB (`React.lazy` par vue + imports ECharts ciblés dans `src/lib/echarts.ts`).

## Étapes et blocages

1. **Données historiques :** quatre fichiers recensés dans `data/provenance.json`. Leurs empreintes SHA-256 concordent avec le registre, mais aucune preuve de publication/extraction originale, de licence, de version, de période complète ni de transformations n’a été retrouvée. Aucun n’est validé.
2. **Connecteurs :** les neuf connecteurs enregistrés dans `server/ingestion/sources/index.ts` ont des extractions live désactivées. Les clés Comtrade et EIA ne sont pas configurées dans l’environnement d’audit. Ne pas activer les connecteurs sans valider le contrat de source, l’authentification, les schémas, les unités et le traitement des erreurs.
3. **PostgreSQL/PostGIS :** aucune base réelle n’a été disponible pour la recette ; Docker et les outils PostgreSQL étaient absents et `DATABASE_URL` non configuré. Le repository sélectionne `transport_routes.distance_km`, absent de `database/migrations/001_initial_schema.sql`. Le DDL runtime de `server/db/schema.sql` est appliqué séparément, sans suivi de version ; les deux schémas doivent être réconciliés avant validation.
4. **Tests :** 31 tests unitaires passent, ainsi que `npm run lint` et `npm run build`. Ces résultats ne remplacent pas des tests d’intégration de connecteurs, PostgreSQL/PostGIS, Docker, API et frontend.
5. **Préproduction :** aucun staging, `APP_URL`, `DATABASE_URL` ni outil Docker disponible ; aucun déploiement ou smoke test externe n’a été exécuté.

## Vérifications récentes (27 novembre 2026)

- `npm test` : 31 tests réussis (exécutés aussi par le hook `pre-push`).
- `npm run lint` : réussi (`tsc --noEmit` + oxlint, 0 avertissement).
- `npm run build` : réussi ; l’avertissement Vite porte désormais sur le chunk ECharts (~611 kB) chargé à la demande, le bundle initial étant descendu à ~244 kB.
- CI GitHub Actions (`run 46037272991`) : verte — lint, tests, build, audit des dépendances de production (`npm audit --omit=dev` désormais possible grâce au lockfile npm).
- Annotation CI non bloquante : passer `actions/checkout@v4` et `actions/setup-node@v4` en versions ciblant Node 24.

## Reste à faire

1. **Provenance des données historiques :** retrouver les fichiers sources officiels et prouver provenance, période, unités, licence, version et transformations ; sortir de quarantaine uniquement après vérification indépendante (voir `server/ingestion/raw/README.md` et `data/provenance.json`).
2. **Connecteurs :** implémenter les extractions réelles (DGDDI, INSEE, Eurostat, UN Comtrade, JODI, EIA, SDES, Overpass, IGN) avec contrats de source validés, gestion des erreurs/limites/pagination, validation des schémas et unités, puis persistance. Configurer `COMTRADE_API_KEY` et `EIA_API_KEY` via gestionnaire de secrets.
3. **PostgreSQL/PostGIS :** réconcilier et versionner les migrations (écart `transport_routes.distance_km` vs `001_initial_schema.sql`), puis valider démarrage, PostGIS, lectures/écritures et migrations sur une vraie base ; ajouter un service PostGIS de développement au `docker-compose.yml`.
4. **Tests d’intégration et frontend :** tests de connecteurs sur fixtures, tests base/API, erreurs API côté frontend ; les brancher dans la CI existante (`.github/workflows/ci.yml`).
5. **Préproduction :** déployer en staging avec secrets hors du dépôt, HTTPS, sauvegardes et journalisation ; smoke tests santé, carte, exports, cache avant promotion.
6. **Mineur :** mettre à jour les actions GitHub (`actions/checkout`, `actions/setup-node`) vers des versions compatibles Node 24.

## Règles à préserver

- Ne pas supprimer silencieusement les fichiers historiques ; conserver leur statut et leurs empreintes.
- Ne pas présenter un nom de source, une URL officielle ou un hash comme preuve suffisante de provenance.
- Ne pas activer de connecteur tant que l’extraction live, la validation et la persistance ne sont pas effectivement implémentées et testées.
- Ne jamais remplacer une erreur d’API ou de base par des données simulées, un cache ancien ou une réponse de succès vide.
- Ne pas déclarer la production prête avant validation de toutes les étapes ci-dessus.
