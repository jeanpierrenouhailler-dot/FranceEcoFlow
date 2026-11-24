# Audit technique final — FranceEcoFlow

**Date :** 24 novembre 2026
**Branche :** `jeanpierrenouhailler-dot-production-readiness-audit`
**Rapport initial :** [`audit-production-initial.md`](./audit-production-initial.md)

## Conclusion

**NON PRÊT POUR LA PRODUCTION.** Cette intervention a corrigé plusieurs risques de publication, d’accès et de cohérence du schéma, mais ne constitue pas une migration complète vers la V1. Aucune source prioritaire n’effectue encore d’extraction réelle et aucune migration n’a été exécutée sur PostgreSQL/PostGIS dans cet environnement. Les quatre fichiers de données historiques demeurent en quarantaine.

Les observations économiques ne sont plus chargées par défaut depuis le CSV en mémoire. Les routes de flux s’appuient sur les observations validées en base et leur provenance; sans base disponible, elles échouent explicitement au lieu de renvoyer des données de démonstration. Cela empêche de présenter les données non vérifiées comme des données de production, mais ne fournit pas encore une chaîne de données opérationnelle.

## État des sources

| Source | Extraction réelle dans le dépôt | Statut |
|---|---:|---|
| DGDDI | Non | `NOT_AVAILABLE` |
| SDES | Non | `NOT_AVAILABLE` |
| Eurostat | Non | `NOT_AVAILABLE` |
| INSEE | Non | `NOT_AVAILABLE` |
| UN Comtrade | Non | `NOT_AVAILABLE` |
| JODI Oil | Non | `NOT_AVAILABLE` |
| EIA | Non | `NOT_AVAILABLE` |
| OpenStreetMap / Overpass | Non | `NOT_AVAILABLE` |
| IGN | Non | `NOT_AVAILABLE` |

Les classes de connecteurs sont enregistrées, mais leur présence ne prouve pas une connexion ou une ingestion. Aucun connecteur ne doit être considéré opérationnel. Les quatre fichiers CSV historiques sont conservés sans publication tant que leur provenance, leur licence et leur méthode ne sont pas établies indépendamment.

## Modifications et garde-fous réalisés

- Ajout du rapport initial avant correction et d’une documentation de provenance, sécurité, migrations, déploiement et tests.
- Suppression de la lecture par défaut des flux économiques depuis le CSV en mémoire; les agrégations et routes de flux utilisent les observations persistées fournies par le repository.
- Ajout d’un statut de validation des flux, de tables de traçabilité et de qualité, d’index, de métadonnées de nomenclature et de `distance_km` dans `002_pipeline_schema.sql`.
- Remplacement de l’exécution du schéma runtime à chaque démarrage par un runner de migrations versionnées avec empreinte SHA-256, ordre numérique, transaction et verrou consultatif; suppression du schéma runtime divergent.
- Les données héritées sont transférées en état `PENDING_VALIDATION`; les routes de publication exigent un flux validé et une provenance/fichier validé.
- Suppression des classifications de repli des codes inconnus et de l’attribution automatique de `CONFIRMED` à une observation économique. Le catalogue local de codes est explicitement non authentifié.
- Retrait des coordonnées de repli `[0,0]`; les entités sans géolocalisation ne sont pas placées sur la carte.
- Retrait du faux cache API local qui écrivait sans restituer les données; l’état hors ligne est signalé sans prétendre fournir des données actuelles.
- Protection de `POST /api/sources/ingest` par `INGESTION_ADMIN_TOKEN`; réponses API assainies et CORS de production limité aux origines configurées.
- Documentation réalignée sur les capacités vérifiées et non vérifiées; le fichier `.env.example` décrit les nouvelles variables sans secrets.

## Résultats de validation

| Vérification | Résultat |
|---|---|
| `npm test` | Réussi : 31 tests, 6 suites |
| `npm run lint` | Réussi : `tsc --noEmit` |
| `npm run build` | Réussi; avertissement Vite pour le bundle JavaScript d’environ 1,49 Mo |
| `git diff --check` | Réussi |
| Démarrage du serveur en développement sans `DATABASE_URL` | Réussi; serveur démarré et base signalée indisponible |
| `GET /api/health` sans PostgreSQL | `503`, état `degraded`, base `Unavailable` |
| `GET /api/flows?limit=5` sans PostgreSQL | `503`, erreur générique; aucune donnée de repli |
| `POST /api/sources/ingest` sans secret | `503`, ingestion désactivée; aucune opération déclenchée |
| `npm audit --omit=dev` | Non exécuté : npm refuse l’audit sans `package-lock.json`; le dépôt utilise `bun.lock` |
| PostgreSQL/PostGIS, migrations sur base vierge ou mise à niveau | Non vérifié : aucun service ni client PostgreSQL/Docker disponible |
| Déploiement Docker, sauvegarde/restauration, staging | Non vérifiés |

Le build signale aussi une taille de bundle supérieure au seuil de 500 kB; ce point n’empêche pas le build, mais devra être évalué pour le déploiement.

## Checklist de production

| Domaine | État | Travail restant |
|---|---|---|
| Quarantaine et provenance | Garde-fous présents | Vérifier les sources, licences et transformations des quatre fichiers avant toute publication |
| Connecteurs | Non opérationnels | Implémenter et tester DGDDI, SDES et Eurostat sur leurs formats officiels |
| Pipeline d’ingestion | Schéma et statuts amorcés | Ajouter extraction, conservation effective des fichiers bruts, validation, normalisation, insertion et bilan de chaque exécution |
| PostgreSQL/PostGIS | Runner et migration ajoutés, non exécutés | Tester base vierge, mise à niveau, contraintes, index, transactions, repository et redémarrage sur PostgreSQL/PostGIS réel |
| Référentiels | Catalogue local explicitement non authentifié | Importer et versionner les référentiels pays et nomenclatures depuis des sources documentées |
| API | Publication filtrée et ingestion protégée | Compléter validation stricte, pagination, limites, autorisations administratives et tests HTTP d’intégration |
| Interface d’administration | Non implémentée | Ajouter le registre des sources et le tableau de bord opérationnel sans inventer de métriques |
| Cartographie | Replis artificiels retirés | Intégrer des données géographiques vérifiées et conserver la distinction entre flux statistiques et itinéraires |
| PWA hors ligne | Faux cache retiré | Ajouter éventuellement un cache réellement restitué, horodaté et indiqué comme périmé |
| Sécurité | Plusieurs garde-fous ajoutés | Ajouter limitation de débit, configuration HTTPS/reverse proxy, gestionnaire de secrets et validation de déploiement |
| Exploitation | Documentation ajoutée | Mettre en place et tester logs, supervision, sauvegardes, restauration, staging et retour arrière |
| Tests | Tests unitaires et build réussis | Ajouter des tests d’intégration sur PostgreSQL/PostGIS et les connecteurs réels |

## Décision de mise en production

Ne pas déployer cette branche comme une V1 de production et ne pas activer les connecteurs. La prochaine étape bloquante est de valider la migration sur une instance isolée PostgreSQL/PostGIS, puis d’implémenter et tester les extractions officielles P0. La mise en production reste conditionnée à ces résultats, aux tests d’intégration API, et à une procédure de sauvegarde/restauration effectivement éprouvée.
