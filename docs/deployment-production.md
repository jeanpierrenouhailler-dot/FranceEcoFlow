# Déploiement et exploitation

## État réel

Le dépôt contient `Dockerfile` et `docker-compose.yml` avec PostgreSQL/PostGIS. Le service applicatif requiert une `DATABASE_URL`; le serveur échoue au démarrage en production si la connexion PostgreSQL/PostGIS échoue. Le conteneur de base exécute `001_initial_schema.sql` à sa première initialisation; le runner applicatif applique ensuite les migrations versionnées restantes. Le déploiement Compose n’a pas été exécuté dans le cadre de cet audit.

La présence des fichiers Docker n’atteste ni la disponibilité de l’application, ni la persistance des flux, ni une restauration testée.

## Configuration

Copier `.env.example` vers un fichier non commité et définir des identifiants forts uniques. Configurer `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `APP_URL` et `INGESTION_ADMIN_TOKEN`. Les identifiants d’API optionnels ne rendent pas un connecteur opérationnel. Ne jamais utiliser les valeurs de démonstration en production.

## Checklist de déploiement non validée

- [ ] Image construite et démarrée avec la configuration cible.
- [ ] PostgreSQL/PostGIS sain et migration versionnée exécutée.
- [ ] Health check testé sur état sain et dégradé.
- [ ] HTTPS configuré au reverse proxy et CORS limité aux origines exactes.
- [ ] Secret d’administration et credentials stockés dans un gestionnaire de secrets.
- [ ] Logs structurés, surveillance, alertes et politique de rétention.
- [ ] Sauvegarde PostgreSQL et fichiers bruts mise en place.
- [ ] Restauration complète chronométrée et vérifiée.
- [ ] Ingestion sur données officielles autorisées et contrôles métier vérifiés.
- [ ] Staging et retour arrière validés.

En l’état, aucune sauvegarde ou restauration n’a été testée. Les données sources prioritaires et les connecteurs restent indisponibles.
