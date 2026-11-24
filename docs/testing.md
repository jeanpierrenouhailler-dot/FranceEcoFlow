# Stratégie de tests et état des vérifications

## Couverture attendue

- **Unitaires :** normalisation, classification, unités, périodes, validation, pays inconnus et erreurs de connecteurs.
- **Intégration :** PostgreSQL/PostGIS isolé, migrations base vierge/mise à niveau, transactions et persistance; ingestion à partir de fixtures archivées avec provenance; lecture par l’API.
- **Interface :** états de données indisponibles/périmées, filtres, export, visualisations, navigation et mode hors ligne.
- **Staging :** configuration, migrations, sources, redémarrage, sauvegarde et restauration.

Les tests sur données externes doivent être contrôlés et reproductibles; la suite unitaire ne doit pas dépendre de la disponibilité continue des fournisseurs.

## Tests ciblés ajoutés

- `tests/products_normalization.test.ts` vérifie qu’un code NC8 inconnu n’est plus classé comme pétrole brut et qu’une observation normalisée n’obtient pas `CONFIRMED` par le seul appariement du code.
- `tests/admin_auth.test.ts` couvre la validation du jeton administrateur.

## Exécution

Installer les dépendances décrites par le dépôt, puis exécuter :

```sh
bun install --frozen-lockfile
bun run test
bun run lint
bun run build
```

Dans l’environnement d’audit, ces dépendances ont aussi été installées avec `npm install --no-package-lock --legacy-peer-deps` en raison d’un conflit de peer dependencies; `npm test`, `npm run lint` et `npm run build` ont tous réussi après les changements. L’installation npm standard échoue sur l’incompatibilité déclarée entre Vite 8 et esbuild 0.25; le fichier `bun.lock` est la référence utilisée par le Dockerfile.

Les tests PostgreSQL/PostGIS, les tests de connecteurs réels, la recette PWA, le staging et les essais de sauvegarde/restauration ne sont pas encore présents ou n’ont pas été exécutés. Ne pas les marquer réussis sans preuve.
