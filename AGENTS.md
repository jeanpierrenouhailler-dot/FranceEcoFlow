# AGENTS.md — FranceEcoFlow

Instructions pour les agents et contributeurs travaillant dans ce dépôt.

## État du projet

**NON PRÊT POUR LA PRODUCTION.** Les connecteurs d'ingestion ne réalisent aucune
extraction réelle et les fichiers de données historiques sont en quarantaine faute
de provenance vérifiée. Les API refusent volontairement de servir des données non
vérifiées (fail closed). Ne réintroduisez aucune donnée de repli (fallback),
de coordonnées `[0,0]` ni de classification automatique `CONFIRMED`.

Lire d'abord :

- [`README.md`](./README.md) — vision, installation, critères de sortie production
- [`docs/audit-production-final.md`](./docs/audit-production-final.md) — état vérifié et bloqueurs
- [`docs/architecture.md`](./docs/architecture.md) — composants système
- [`docs/data-provenance.md`](./docs/data-provenance.md) — politique de provenance et quarantaine

## Gestionnaire de paquets

- **npm** est le gestionnaire officiel ; le verrouillage est `package-lock.json`.
- Utiliser `npm install`, jamais d'installation avec un autre gestionnaire.
- Si un ajout de dépendance rencontre un conflit de peers (le projet utilise
  TypeScript 7), documenter la raison plutôt que dégrader le compilateur.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur unifié API Express + Vite (port 3000) |
| `npm test` | Tests unitaires (`node --test` via tsx, `tests/*.test.ts`) |
| `npm run lint` | `tsc --noEmit` + `oxlint` |
| `npm run build` | Build de production Vite |
| `npm run format` / `npm run format:check` | Prettier |

## Conventions

- **Lint :** `oxlint` (pas ESLint : `typescript-eslint` ne supporte pas TypeScript 7).
  Tout avertissement doit être corrigé, pas supprimé ; les variables intentionnellement
  inutilisées sont préfixées `_`.
- **Format :** Prettier (`.prettierrc.json`) ; exécuter `npm run format` avant commit
  si le hook signale des fichiers.
- **Hooks :** Lefthook — oxlint + Prettier en `pre-commit`, lint complet + tests en `pre-push`.
- **CI :** `.github/workflows/ci.yml` doit rester vert (lint, tests, build, audit prod).
- **Commits :** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`…).

## Données

- Aucune donnée non vérifiée ne doit être publiée via les API, la carte ou les exports.
- Tout fichier de données brut vit dans `server/ingestion/raw/` ou `data/` et reste en
  quarantaine tant que sa provenance, sa licence et sa méthode ne sont pas établies
  (voir [`docs/data-provenance.md`](./docs/data-provenance.md) et `data/provenance.json`).
- Les migrations vivent dans `database/migrations/`, sont versionnées et ornées d'une
  empreinte SHA-256 ; ne jamais modifier une migration appliquée, en créer une nouvelle.
- Les secrets (`DATABASE_URL`, `INGESTION_ADMIN_TOKEN`, clés d'API) ne vont jamais dans
  le dépôt ; `.env.example` documente les variables sans valeurs réelles.

## Tests

- Nouvelle logique métier → tests dans `tests/` (style `node:test` existant).
- Les tests ne doivent pas dépendre de services externes toujours disponibles ;
  les connecteurs se testent sur fixtures.
