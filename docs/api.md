# API REST — état et contrats actuellement implémentés

Toutes les routes sont préfixées par `/api`. Les routes analytiques ne retournent que les observations présentes dans PostgreSQL qui ont le statut `VALIDATED` et une ligne de provenance liée à un fichier validé, avec URL et licence renseignées. En l’absence de telles observations, elles répondent `503 NOT_AVAILABLE`; aucun chiffre de démonstration n’est retourné.

## Routes analytiques

Les routes `GET /flows`, `/flows/summary`, `/flows/partners`, `/flows/timeseries`, `/flows/sankey`, `/flows/anomalies`, `/countries/:id`, `/products/:id` et `/export` lisent depuis `trade_flows` via le repository PostgreSQL.

Filtres disponibles sur les routes de flux : `reporter` (défaut `FR`), `flow` (`import`/`export`), `product` (défaut `crude_oil`), `from`, `to`, `partner`, `periodType` (`annual`/`monthly`). La validation complète des paramètres, la pagination des résultats et les limites configurables restent à implémenter.

## Référentiels, système et ingestion

- `GET /countries`, `/countries/:id`, `/products`, `/products/:id` : listes locales de référence pour l’interface; elles ne sont pas encore administrées depuis PostgreSQL.
- `GET /products/resolve-nc8` et `/products/nomenclatures` : résolution depuis le catalogue NC8 local, incomplet et non authentifié; une correspondance n’atteste pas une observation.
- `GET /sources`, `/sources/registry`, `/sources/health` : métadonnées des sources envisagées; les neuf connecteurs restent indisponibles.
- `GET /ingestion/report`, `/ingestion/files`, `/ingestion/raw-sample` : état et métadonnées des fichiers, sans lever leur quarantaine.
- `GET /database/status`, `/database/spatial/within`, `/infrastructures`, `/infrastructures/:id`, `/transport-routes`, `/sources/insee`, `/sources/energy` : accès DB/PostGIS; aucune donnée de référence opérationnelle n’est actuellement attestée.
- `POST /sources/ingest` : opération protégée par `Authorization: Bearer <INGESTION_ADMIN_TOKEN>`. Répond `503` si le secret n’est pas configuré, `401` si le jeton est invalide. Les sources actuelles répondent encore `NOT_AVAILABLE`.
- `GET /health` : état de santé global; `503` lorsque PostgreSQL/PostGIS n’est pas connecté.

Cette page documente le code courant, pas une disponibilité de production. Les filtres ne sont pas tous strictement validés, les exports/listes ne sont pas encore paginés et aucune recette de l’API contre une vraie base n’a été exécutée.
