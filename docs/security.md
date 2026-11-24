# Sécurité

## Contrôles présents après l’audit

- `POST /api/sources/ingest` requiert `Authorization: Bearer <INGESTION_ADMIN_TOKEN>`. Si la variable n’est pas configurée, la route répond `503`; token absent ou erroné, `401`. La comparaison est à temps constant lorsque les longueurs correspondent. Le secret doit être injecté au déploiement, jamais commité.
- CORS n’autorise plus `*` en production. La variable `APP_URL` configure une liste d’origines autorisées séparées par des virgules; en développement, les origines sont ouvertes pour faciliter le travail local.
- Les réponses d’erreur API ne sérialisent plus le texte/trace de l’exception.
- Les requêtes SQL existantes utilisent des paramètres pour les valeurs.

## Limites et actions avant production

- Le jeton partagé protège le déclenchement d’ingestion mais ne remplace pas une authentification utilisateur, des rôles, une rotation/secrets manager, ni une journalisation d’identité d’administrateur. La route est désactivée si le secret est absent.
- Aucune limitation de débit n’est configurée; le serveur n’établit pas à lui seul HTTPS. Ajouter ces contrôles au reverse proxy ou à l’infrastructure de déploiement et les valider sur staging.
- Vérifier la validation stricte des paramètres sur toutes les routes, les limites/paginations des résultats, les en-têtes HTTP, la politique CORS de chaque environnement et la protection des journaux.
- Garder `DATABASE_URL`, `INGESTION_ADMIN_TOKEN`, clés de fournisseurs et mots de passe dans un gestionnaire de secrets. Les valeurs d’exemple ne sont pas des secrets de production.
- La configuration Docker, les sauvegardes et les procédures de restauration n’ont pas été validées en production.

## Vérification

Le test unitaire `tests/admin_auth.test.ts` couvre jeton valide, invalide et non configuré. Il ne remplace pas un test HTTP d’autorisation en intégration ni un test d’intrusion sur l’environnement déployé.
