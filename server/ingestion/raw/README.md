# Quarantaine — données brutes DGDDI

**Statut : QUARANTAINE — NE PAS PUBLIER.**

Le fichier `dgddi_dau_2015_2026.csv` de ce dossier est un fichier de données
historiques hérité dont la provenance n'est pas établie indépendamment :

- publication d'origine et date d'extraction inconnues ;
- licence non confirmée ;
- transformations subies non documentées ;
- agrégats non comparés à la source.

Conformément à la politique de provenance ([`docs/data-provenance.md`](../../../../docs/data-provenance.md))
et à `data/provenance.json`, ce fichier :

- n'est chargé par aucun flux par défaut ;
- reste en état `PENDING_VALIDATION` lors d'une éventuelle ingestion ;
- ne doit pas être présenté comme authentique par les API, la carte ou les exports.

Pour le retirer de quarantaine : retrouver la publication originale, vérifier source,
période, colonnes, unités et licence, comparer les agrégats à la source lorsque
possible, documenter toute transformation, puis recalculer l'empreinte SHA-256.
