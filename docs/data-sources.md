# Registre des sources et jeux de données

## État de publication

Aucune donnée économique embarquée dans le dépôt n’est actuellement authentifiée comme source officielle. Les quatre fichiers de `data/provenance.json` restent en quarantaine. Le SHA-256 du registre permet de détecter une modification du fichier, mais ne prouve ni son origine, ni sa licence, ni sa méthode de collecte.

Les neuf classes de connecteurs référencent des organismes et portails officiels, mais ne font pas d’extraction. Elles ne doivent pas apparaître comme sources opérationnelles ni alimenter les vues en production.

## Fichiers présents et quarantaine

| Fichier | Attribution déclarée dans le fichier | État | Éléments manquants |
|---|---|---|---|
| `data/raw/dgddi/dgddi_flux_brut_2015_2026_annuel.csv` | DGDDI | Quarantaine | Publication originale, extraction, version, période et unités comparées à la source, licence et transformations |
| `data/raw/dgddi/dgddi_flux_brut_mensuel_2024_2026.csv` | DGDDI | Quarantaine | Publication originale, extraction, version, période et unités comparées à la source, licence et transformations |
| `server/ingestion/raw/dgddi_dau_2015_2026.csv` | DGDDI | Quarantaine | Publication originale, extraction, version, période et unités comparées à la source, licence et transformations |
| `data/raw/sdes/sdes_receptions_brut_ports.csv` | SDES | Quarantaine | Publication originale, extraction, version, méthode, unités, licence et transformations |

Ne pas retirer un fichier de quarantaine avant une vérification indépendante et la mise à jour de sa fiche de provenance.

## Sources envisagées (non connectées)

Les URL ci-dessous identifient les portails institutionnels; elles ne valident pas à elles seules un jeu de données, une licence ou la couverture recherchée.

| Source | Portail | Accès effectif dans ce dépôt |
|---|---|---|
| DGDDI | <https://lekiosque.finances.gouv.fr> | Non implémenté |
| SDES | <https://www.statistiques.developpement-durable.gouv.fr> | Non implémenté |
| Eurostat | <https://ec.europa.eu/eurostat> | Non implémenté |
| INSEE | <https://www.insee.fr> | Non implémenté |
| UN Comtrade | <https://comtradeplus.un.org> | Non implémenté |
| JODI Oil | <https://www.jodidata.org> | Non implémenté |
| EIA | <https://www.eia.gov> | Non implémenté |
| OpenStreetMap / Overpass | <https://www.openstreetmap.org> | Non implémenté |
| IGN | <https://geoservices.ign.fr> | Non implémenté |

Pour chaque jeu réellement intégré, compléter les métadonnées producteur, URL exacte, licence, méthode d’accès, format, couverture, date d’extraction, version, transformations et limites méthodologiques. Une comparaison DGDDI/Eurostat/Comtrade doit préserver les méthodes, unités, flux et périmètres déclaratifs propres à chaque source.
