# Migrations PostgreSQL/PostGIS

## Implémentation actuelle — à valider

`server/db/connection.ts` exécute désormais les fichiers `database/migrations/<version>_<nom>.sql` dans l’ordre numérique, conserve version, SHA-256 et date dans `schema_migrations`, refuse de réexécuter un fichier déjà appliqué dont le hash a changé et sérialise les exécutions par verrou consultatif PostgreSQL. Chaque migration et son enregistrement sont transactionnels.

`002_pipeline_schema.sql` ajoute la colonne `distance_km`, le statut de publication et les tables de traçabilité, d’anomalies, d’indicateurs et d’énergie. Il copie les anciens `economic_flows` dans `trade_flows` si présents; aucune de ces lignes migrées n’est publiée sans nouvelle validation/provenance.

`001` reste le schéma historique. Docker Compose l’applique à la création d’un volume neuf; au démarrage, le runner reconnaît les tables existantes grâce aux DDL idempotents puis applique les versions non exécutées. Le schéma runtime divergent `server/db/schema.sql` a été supprimé.

## Procédure exigée avant déploiement

1. Établir l’état des bases existantes et sauvegarder avant toute modification destructive.
2. Sauvegarder avant migration une base existante et confirmer son historique de schéma.
3. Tester le chemin base vierge et le chemin de mise à niveau depuis chaque version supportée avec PostgreSQL/PostGIS réels.
4. Valider contraintes, clés étrangères, indexes, transactions, persistance après redémarrage et compatibilité repository.
5. Déployer l’exécution des migrations avec un compte aux privilèges requis; confirmer que ce compte peut créer la table de suivi et les extensions nécessaires.

Le gestionnaire a été implémenté mais n’a pas encore été exécuté contre PostgreSQL/PostGIS dans cet environnement; le schéma n’est donc pas prêt pour production.
