import React from 'react';
import { BookOpen, ShieldCheck, FileText, Calculator, HelpCircle, Layers, CheckCircle } from 'lucide-react';

export const MethodologyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in text-slate-200">
      {/* Page Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <span>Méthodologie & Cadre Scientifique</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          Principes de traçabilité, nomenclatures douanières, formules d'agrégation, calculs de concentration et distinction fondamentale entre flux statistiques et routes logistiques.
        </p>
      </div>

      {/* 1. Distinction Cruciale : Statistique vs Itinéraire */}
      <section className="space-y-3 bg-slate-900/60 border border-cyan-900/60 rounded-xl p-6">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
          <Layers className="w-5 h-5" />
          <h2>1. Distinction fondamentale : Flux statistique vs Itinéraire logistique</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Dans l'analyse du commerce international, <strong>un flux statistique ne constitue jamais automatiquement une route maritime ou terrestre réelle</strong>.
        </p>
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs space-y-2 text-slate-300">
          <p>
            <strong className="text-white">Exemple concret : </strong> Lorsque les données douanières indiquent :
            <code className="text-cyan-400 font-mono mx-1">Kazakhstan → France</code>, cela consigne l'origine légale de la marchandise. Cela ne signifie pas que le pétrole a voyagé directement par train ou avion entre les deux territoires.
          </p>
          <p>
            Pour afficher un itinéraire logistique concret (ex: oléoduc CPC vers Novorossiïsk en Mer Noire, passage du Bosphore par pétrolier Suezmax jusqu'au terminal de Fos-sur-Mer), l'application exige une <strong>documentation logistique vérifiée</strong> (rapports SDES, manifestes portuaires, terminaux d'exportation répertoriés).
          </p>
        </div>
      </section>

      {/* 2. Échelle de Confiance des Données */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>2. Niveaux de confiance des informations</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-1.5">
            <span className="font-bold text-emerald-400 font-mono">CONFIRMED (Confirmé)</span>
            <p className="text-slate-300">
              Donnée directement issue des déclarations douanières officielles obligatoires (DGDDI, Eurostat). Valeurs financières CAF et masses nettes enregistrées aux frontières.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-1.5">
            <span className="font-bold text-cyan-400 font-mono">DOCUMENTED (Documenté)</span>
            <p className="text-slate-300">
              Itinéraire maritime, portuaire ou par pipeline attesté par des documents publics vérifiables (bilan énergétique SDES, cartes d'infrastructures OpenStreetMap, publications de l'AIE).
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-1.5">
            <span className="font-bold text-amber-400 font-mono">PROBABLE (Probable)</span>
            <p className="text-slate-300">
              Hypothèse logistique ou extrapolation modélisée à partir du tirant d'eau des terminaux et des flux maritimes dominants de la zone géographique.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-400 font-mono">UNKNOWN (Non déterminé)</span>
            <p className="text-slate-300">
              Information non confirmée ou chaîne logistique intermédiaire opaque. Aucune route fictive n'est générée dans ce cas.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Formules de Calcul & Définitions */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-400" />
          <span>3. Formules économiques et calculs mathématiques</span>
        </h2>

        <div className="space-y-4 text-xs">
          {/* Prix unitaire implicite */}
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
            <h3 className="font-bold text-white text-sm">A. Prix unitaire implicite (€ / tonne)</h3>
            <p className="text-slate-300 leading-relaxed">
              Le commerce extérieur n'enregistre pas un "prix de marché spot" par transaction, mais le montant global de la facture en euros (valeur CAF : Coût, Assurance, Fret) et la masse nette déclarée en kilogrammes ou tonnes.
            </p>
            <div className="p-3 bg-slate-950 rounded font-mono text-cyan-300 text-xs border border-slate-800">
              Prix unitaire implicite = Valeur déclarée (en €) / Masse nette (en tonnes)
            </div>
            <p className="text-slate-400 text-[11px]">
              Ce ratio reflète le prix moyen pondéré payé à l'importation. Il varie selon la qualité du brut (degré API, teneur en soufre) et les conditions de fret maritime.
            </p>
          </div>

          {/* Indice de Concentration HHI */}
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
            <h3 className="font-bold text-white text-sm">B. Indice de concentration d'Herfindahl-Hirschman (HHI)</h3>
            <p className="text-slate-300 leading-relaxed">
              L'indice HHI mesure le degré de dépendance et de concentration des approvisionnements d'un pays. Il est calculé en sommant les carrés des parts de marché (exprimées en pourcentages de 0 à 100) de chaque pays fournisseur :
            </p>
            <div className="p-3 bg-slate-950 rounded font-mono text-cyan-300 text-xs border border-slate-800">
              HHI = ∑ (Part_fournisseur_i)² = (s₁)² + (s₂)² + ... + (s_n)²
            </div>
            <p className="text-slate-300 text-xs">
              <strong>Seuils réglementaires de référence (Commission Européenne / US DOJ) :</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li><strong className="text-emerald-400">HHI &lt; 1 000 : </strong> Marché diversifié, risque de rupture géopolitique faible.</li>
              <li><strong className="text-cyan-400">1 000 ≤ HHI &lt; 1 800 : </strong> Concentration modérée, équilibre sain entre 5 à 8 partenaires majeurs.</li>
              <li><strong className="text-amber-400">1 800 ≤ HHI &lt; 2 500 : </strong> Forte concentration, dépendance sensible à un choc sur les deux premiers fournisseurs.</li>
              <li><strong className="text-rose-400">HHI ≥ 2 500 : </strong> Concentration critique, situation de quasi-dépendance stratégique.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Nomenclatures Douanières */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <span>4. Nomenclatures de produits et codes statistiques</span>
        </h2>
        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-xs space-y-2 text-slate-300">
          <p>
            L'application gère les hiérarchies de nomenclature internationale :
          </p>
          <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-400">
            <li><strong className="text-slate-200">SH (Système Harmonisé) :</strong> HS 2709 — Huiles brutes de pétrole ou de minéraux bitumineux.</li>
            <li><strong className="text-slate-200">NC8 (Nomenclature Combinée Européenne) :</strong> NC8 27090090 (brut standard de raffinage) et NC8 27090010 (condensats légers de gaz naturel).</li>
            <li><strong className="text-slate-200">Extensibilité Phase 2 :</strong> HS 2710 (Carburants et fiouls raffinés), HS 2711 (Gaz naturel liquéfié GNL).</li>
          </ul>
        </div>
      </section>

      {/* 5. Données Qualité & Contrôles */}
      <section className="space-y-3 pb-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>5. Contrôles de qualité des données (Data Quality Checks)</span>
        </h2>
        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-xs space-y-2 text-slate-300">
          <p>
            Avant publication dans l'API, chaque lot de données subit les tests automatisés suivants :
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
            <li><strong>Cohérence des unités :</strong> Interdiction stricte de mixer kilogrammes, barils et tonnes sans conversion explicite (facteur d'API standard = 7,33 bbl/tonne).</li>
            <li><strong>Contrôle miroir :</strong> Comparaison des statistiques déclarées par la France (DGDDI) avec les déclarations d'exportation des pays partenaires (UN Comtrade).</li>
            <li><strong>Détection des valeurs aberrantes :</strong> Alerte automatique si le prix unitaire implicite dévie de plus de 45% de la moyenne annuelle du Brent.</li>
          </ul>
        </div>
      </section>
    </div>
  );
};
