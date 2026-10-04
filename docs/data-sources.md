# Sources de Données, Fichiers Bruts & Pipeline d'Ingestion (Data Lineage)

Chaque donnée présentée dans France Economic Flow Explorer est rattachée à son fichier brut d'origine, à son empreinte cryptographique SHA-256 et à un niveau de confiance vérifiable.

## 0. Architecture d'Ingestion des Fichiers Bruts (ETL)

L'application n'utilise **aucune simulation synthétique, aucune boucle mathématique artificielle ni multiplicateur Brent/devises**. 

Toutes les observations proviennent de fichiers CSV bruts stockés dans le répertoire `data/raw/` :
- `data/raw/dgddi/dgddi_flux_brut_2015_2026_annuel.csv` : Série annuelle consolidée des importations de brut (DGDDI).
- `data/raw/dgddi/dgddi_flux_brut_mensuel_2024_2026.csv` : Déclarations mensuelles détaillées au code NC8 27090090 (DGDDI).
- `data/raw/sdes/sdes_receptions_brut_ports.csv` : Réceptions physiques par port et raffinerie (SDES).

Le pipeline d'ingestion (`server/data/ingestion/`) :
1. Charge les fichiers ligne par ligne en validant les types et codes douaniers.
2. Calcule l'empreinte SHA-256 de chaque fichier source sur disque.
3. Convertit la masse nette enregistrée en douane (kg) en tonnes métriques (`kg / 1000`).
4. Calcule le **prix unitaire implicite** de façon strictement comptable : `VALEUR_CAF_EUROS / (MASSE_NETTE_KG / 1000)`.
5. Exécute un ensemble de contrôles de qualité automatisés (`QualityAuditReport`) consultables via l'onglet **Audit & Données brutes** et l'API `GET /api/ingestion/report`.

## 1. Direction Générale des Douanes et Droits Indirects (DGDDI)

- **Rôle :** Source primaire obligatoire pour les statistiques du commerce extérieur de la France.
- **Produits suivis :** Pétrole brut sous le code SH 2709 et NC8 27090090 (huiles brutes de pétrole ou de minéraux bitumineux).
- **Champs extraits :** Année, mois, pays partenaire déclarant, flux (importation CAF / exportation FOB), valeur en euros, masse nette en tonnes.
- **Licence :** Licence Ouverte 2.0 (Etalab).
- **URL officielle :** https://lekiosque.finances.gouv.fr

## 2. Service des Données et Études Statistiques (SDES)
- **Rôle :** Bilan énergétique de la France, suivi des capacités de raffinage et des stocks stratégiques (SAGESS / CPSSP).
- **URL officielle :** https://www.statistiques.developpement-durable.gouv.fr

## 3. Eurostat (Commission Européenne)
- **Rôle :** Données de contrôle Comext (DS-045409) et validation des statistiques de transport maritime intra et extra-UE.
- **URL officielle :** https://ec.europa.eu/eurostat

## 4. OpenStreetMap (OSM) & Overpass API
- **Rôle :** Emprises géométriques, coordonnées et attributs des terminaux pétroliers, jetées maritimes et oléoducs.
- **Objets OSM suivis :**
  - Grand Port Maritime de Marseille (Fos-sur-Mer / Lavéra) : relation 1145623
  - Grand Port Maritime du Havre (Antifer) : node 257388914
  - Raffinerie de Normandie (Gonfreville-l'Orcher) : way 28491024
  - Pipeline Sud-Européen (SPSE) : relation 8849102
- **Licence :** Open Database License (ODbL 1.0).

## 5. EIA (U.S. Energy Information Administration) & JODI Oil
- **Rôle :** Détail des exportations américaines de WTI Midland depuis les terminaux du Texas (Corpus Christi, Houston) vers la France, et bilans mondiaux d'offre/demande.
