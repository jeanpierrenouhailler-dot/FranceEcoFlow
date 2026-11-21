# Contexte de préparation à la production

Mis à jour le 21 novembre 2026.

## État

FranceEcoFlow n’est pas prêt pour la production. Le système reste en mode fail-closed : les fichiers historiques non authentifiés sont en quarantaine, les connecteurs sans extraction live sont indisponibles et les API ne doivent pas présenter de flux non vérifiés.

## Étapes et blocages

1. **Données historiques :** quatre fichiers recensés dans `data/provenance.json`. Leurs empreintes SHA-256 concordent avec le registre, mais aucune preuve de publication/extraction originale, de licence, de version, de période complète ni de transformations n’a été retrouvée. Aucun n’est validé.
2. **Connecteurs :** les neuf connecteurs enregistrés dans `server/ingestion/sources/index.ts` ont des extractions live désactivées. Les clés Comtrade et EIA ne sont pas configurées dans l’environnement d’audit. Ne pas activer les connecteurs sans valider le contrat de source, l’authentification, les schémas, les unités et le traitement des erreurs.
3. **PostgreSQL/PostGIS :** aucune base réelle n’a été disponible pour la recette ; Docker et les outils PostgreSQL étaient absents et `DATABASE_URL` non configuré. Le repository sélectionne `transport_routes.distance_km`, absent de `database/migrations/001_initial_schema.sql`. Le DDL runtime de `server/db/schema.sql` est appliqué séparément, sans suivi de version ; les deux schémas doivent être réconciliés avant validation.
4. **Tests :** 25 tests unitaires passent, ainsi que `npm run lint` et `npm run build`. Ces résultats ne remplacent pas des tests d’intégration de connecteurs, PostgreSQL/PostGIS, Docker, API et frontend.
5. **Préproduction :** aucun staging, `APP_URL`, `DATABASE_URL` ni outil Docker disponible ; aucun déploiement ou smoke test externe n’a été exécuté.

## Vérifications récentes

- `npm test` : 25 tests réussis.
- `npm run lint` : réussi.
- `npm run build` : réussi, avec un avertissement de bundle JavaScript supérieur à 500 kB.
- `git diff --check` : réussi après les changements de provenance.

## Prochaine séquence

1. Retrouver les fichiers sources officiels et prouver provenance, période, unités, licence, version et transformations. Maintenir les fichiers sans preuve en quarantaine.
2. Documenter les contrats d’API réels et implémenter chaque connecteur avec validation, tests contrôlés, gestion des erreurs et persistance. Les données non convertibles sans hypothèse ne doivent pas être converties.
3. Unifier/versionner les migrations, corriger l’écart de schéma, puis valider sur une vraie instance PostgreSQL/PostGIS sans réinitialiser les données existantes.
4. Ajouter les tests d’intégration et frontend requis et les exécuter dans CI.
5. Déployer en préproduction avec secrets gérés hors du dépôt ; vérifier santé, données, carte, exports, cache, journalisation et sauvegardes avant toute promotion.

## Règles à préserver

- Ne pas supprimer silencieusement les fichiers historiques ; conserver leur statut et leurs empreintes.
- Ne pas présenter un nom de source, une URL officielle ou un hash comme preuve suffisante de provenance.
- Ne pas activer de connecteur tant que l’extraction live, la validation et la persistance ne sont pas effectivement implémentées et testées.
- Ne jamais remplacer une erreur d’API ou de base par des données simulées, un cache ancien ou une réponse de succès vide.
- Ne pas déclarer la production prête avant validation de toutes les étapes ci-dessus.
