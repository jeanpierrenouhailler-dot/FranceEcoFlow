# Méthodologie Économique & Principes d'Analyse

## 1. Distinction Statistique vs Réalité Logistique

Un des écueils majeurs des visualisations de commerce international consiste à tracer des routes directes fictives entre pays partenaires.

Dans **France Economic Flow Explorer** :
- **Observation Statistique :** Un enregistrement douanier DGDDI atteste qu'une cargaison dédouanée sur le territoire national a pour pays d'origine statistique le Kazakhstan.
- **Corridor Logistique :** La cargaison a été extraite du bassin de Tengiz, transportée par l'oléoduc CPC jusqu'au terminal russe de Novorossiïsk sur la Mer Noire, chargée sur un pétrolier Suezmax, a franchi le détroit du Bosphore puis la Méditerranée jusqu'au terminal de Fos-sur-Mer.
- Cette seconde dimension n'est affichée que si elle bénéficie d'une **preuve documentaire publique** (niveau `DOCUMENTED`).

## 2. Calcul du Prix Unitaire Implicite

Le libellé officiel adopté dans l'application est **"Prix unitaire implicite"** et non pas simplement "prix".

$$\text{Prix unitaire implicite} = \frac{\text{Valeur déclarée CAF (€)}}{\text{Masse nette déclarée (tonnes)}}$$

Ce ratio statistique reflète le coût réel pondéré aux frontières de la marchandise (incluant le coût matière, l'assurance et le fret maritime jusqu'au port français de débarquement).

## 3. Indice de Concentration d'Herfindahl-Hirschman (HHI)

L'indice HHI est la mesure de référence utilisée par les autorités de concurrence et les analystes en sécurité énergétique :

$$\text{HHI} = \sum_{i=1}^{n} (s_i)^2$$

où $s_i$ est la part de marché en volume du partenaire $i$ exprimée en pourcentage.

- **HHI < 1 000 :** Marché hautement diversifié.
- **1 000 ≤ HHI < 1 800 :** Concentration modérée.
- **1 800 ≤ HHI < 2 500 :** Marché concentré.
- **HHI ≥ 2 500 :** Dépendance critique.
