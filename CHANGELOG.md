# Journal des modifications

Les changements sont regroupés par version. Les éléments non livrés en production sont indiqués comme tels.

## Non publié — 2026-11-21

### Documentation et statut de production

- Ajout du plan de préparation à la production en cinq étapes dans le README.
- Ajout de `CONTEXT.md` pour transmettre les constats, limites et prochaines actions.
- Les licences des fichiers fournis sont désormais indiquées comme à vérifier plutôt que déclarées acquises.

### Provenance et ingestion

- Ajout d’un registre SHA-256 pour les quatre fichiers historiques DGDDI/SDES.
- Mise en quarantaine des fichiers dont l’origine et les conditions de réutilisation ne sont pas authentifiées ; ils ne sont pas servis comme observations officielles.
- Ajout du fichier SDES au rapport d’ingestion des fichiers en quarantaine.
- Les contrôles de qualité échouent lorsqu’aucune observation ou provenance vérifiée n’est disponible.

### Sources, base et interface

- Les connecteurs sans extraction réelle restent désactivés et signalés comme indisponibles.
- Les API de flux refusent de présenter des données sans provenance vérifiée ; les réponses d’API ne sont pas conservées en cache comme données actuelles.
- Les périodes et libellés de l’interface ne doivent pas présenter de périodes ou de sources non vérifiées comme des observations établies.
- Les accès de production exigent une vraie connexion PostgreSQL/PostGIS ; le stockage mémoire n’est pas une source de vérité.

### Vérifications et limites connues

- `npm test` : 25 tests réussis.
- `npm run lint` : réussi.
- `npm run build` : réussi ; avertissement du bundle JavaScript supérieur à 500 kB.
- Les tests PostgreSQL/PostGIS réels, Docker, connecteurs live et staging ne sont pas exécutés. Le projet reste **non prêt pour la production**.
