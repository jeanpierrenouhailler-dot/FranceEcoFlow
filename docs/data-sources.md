# Sources de Données & Traçabilité (Data Lineage)

Chaque donnée présentée dans France Economic Flow Explorer est rattachée à son producteur d'origine et à un niveau de confiance vérifiable.

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
