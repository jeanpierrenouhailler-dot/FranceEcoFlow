# Provenance et qualité des données

## État actuel

`data/provenance.json` répertorie quatre fichiers et leur SHA-256. Les entrées ont les statuts `QUARANTINED`, et les dates de publication/extraction, versions, licences et périodes sont inconnues. `server/data/ingestion/provenance.ts` recalcule le hash et bloque la publication si le fichier manque ou diffère.

Un hash démontre l’intégrité d’un fichier précis par rapport au registre. Il ne démontre ni l’identité du producteur, ni l’origine officielle, ni les droits de redistribution, ni l’exactitude statistique.

## Conditions de sortie de quarantaine

Pour chaque fichier et chaque nouveau lot, conserver la référence précise de publication ou l’URL/fichier source, le producteur, les conditions de réutilisation, le format et la version, les dates de téléchargement, la période, les paramètres d’extraction, le hash, les transformations, les unités, les contrôles exécutés et les anomalies. Comparer un échantillon ou les agrégats à la source primaire, documenter le résultat, puis faire approuver explicitement le changement de statut.

Les statuts de traitement doivent rester distincts :

- `RAW` : reçu, pas encore contrôlé.
- `PENDING_VALIDATION` : structure reconnue, contrôles en cours.
- `VALIDATED` : contrôles de schéma et qualité réussis, publication encore conditionnée à la politique de provenance.
- `REJECTED` : observation invalide; la raison reste enregistrée.
- `QUARANTINED` : provenance, licence ou qualité insuffisante; exclu de l’API métier.

La confiance de classification, la fiabilité de source, la qualité d’observation, la fraîcheur et la provenance sont dimensions séparées. La reconnaissance d’un NC8 ne prouve pas une observation économique. Aucune extraction live ni table PostgreSQL de provenance n’est actuellement opérationnelle.
