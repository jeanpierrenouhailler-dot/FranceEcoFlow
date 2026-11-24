# Architecture actuelle et cible

## État réellement présent

- **Interface :** React, TypeScript, Vite, ECharts et composants SVG. Les données métier sont demandées au backend Express.
- **API :** routes dans `server/api/routes.ts`. Les routes analytiques lisent actuellement des fonctions dans `server/data/store.ts`, dont `economicFlows` est chargé en mémoire; elles ne constituent donc pas encore une lecture PostgreSQL des observations.
- **Base :** `pg.Pool`, un repository et des requêtes PostGIS sont définis dans `server/db/`. Le démarrage applique désormais les fichiers ordonnés de `database/migrations/` et vérifie leur checksum. Une migration additive crée le modèle de pipeline et rapproche les anciennes observations `economic_flows` dans `trade_flows` en statut non publié. Ces migrations n’ont pas encore été exécutées sur un PostgreSQL de test.
- **Ingestion :** neuf connecteurs sont déclarés dans `server/ingestion/sources/`, mais leurs extractions live ne sont pas implémentées. Le registre les garde à l’état indisponible. Les jeux de données intégrés listés dans `data/provenance.json` sont en quarantaine.
- **PWA :** le service worker met en cache les ressources de l’application et les polices configurées. Les réponses API ne sont pas conservées pour un usage hors ligne. Le client ne réutilise pas les anciennes réponses.

## Architecture cible non encore achevée

```text
Sources officielles à authentifier et connecter
        -> extraction et stockage brut avec provenance
        -> validation et quarantaine des erreurs
        -> normalisation versionnée
        -> PostgreSQL/PostGIS (source de vérité)
        -> API paginée et validée
        -> interface avec date, source et état de fraîcheur
```

Cette architecture décrit un objectif, pas un état opérationnel. Aucun flux économique intégré n’est actuellement attesté comme provenant d’une extraction vérifiée.

## Responsabilités principales

- `server/ingestion/sources/` : interfaces et registres des connecteurs; les classes déclarées sont encore des squelettes.
- `server/normalization/` : règles locales de résolution des produits et normalisation DGDDI; le catalogue NC8 n’est pas officiellement authentifié/versionné.
- `server/db/` : connexion, exécution versionnée des migrations, repository spatial et lecture des flux publiables depuis PostgreSQL.
- `server/data/store.ts` : référentiels locaux et fonctions pures d’analyse; les fonctions analytiques exigent les lignes fournies par le repository PostgreSQL, sans fallback vers un CSV en mémoire.
- `src/lib/api.ts` : appels réseau directs. Aucun cache de réponse API hors ligne n’est activé.
- `vite.config.ts` : génération PWA et cache des ressources statiques/polices; pas de stratégie hors-ligne pour les observations API.

## Limites fonctionnelles à garder visibles

- Les arcs de fournisseurs sont une représentation statistique et ne prouvent pas un itinéraire logistique.
- Les données d’infrastructure et routes doivent rester vides tant que leurs sources et leur provenance ne sont pas validées.
- PostgreSQL/PostGIS, les migrations, les extractions réelles et la restauration n’ont pas encore été testés sur un environnement de production ou de staging.
