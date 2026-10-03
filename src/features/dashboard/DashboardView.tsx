import React from 'react';
import { FlowAnalysisSummary, SupplierSummary, AnomalyDetection } from '../../types/index.ts';
import { MetricCard } from '../../components/common/MetricCard.tsx';
import { ConcentrationGauge } from '../../components/charts/ConcentrationGauge.tsx';
import { PartnerBarChart } from '../../components/charts/PartnerBarChart.tsx';
import { SourceCitation } from '../../components/common/SourceCitation.tsx';
import { formatCurrencyEur, formatTonnes, formatPricePerTonne } from '../../lib/calculations.ts';
import { ArrowRight, AlertTriangle, TrendingUp, Compass, Anchor } from 'lucide-react';

interface DashboardViewProps {
  summary: FlowAnalysisSummary;
  suppliers: SupplierSummary[];
  anomalies: AnomalyDetection[];
  onExplore: () => void;
  onSelectPartner: (partnerId: string) => void;
  onOpenMap: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  suppliers,
  anomalies,
  onExplore,
  onSelectPartner,
  onOpenMap,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Editorial Hero Banner */}
      <div className="border border-slate-800 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
            <span>OBSERVATOIRE DU COMMERCE EXTÉRIEUR DE LA FRANCE</span>
            <span>·</span>
            <span>DONNÉES OFFICIELLES DGDDI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            Exploration des flux économiques et approvisionnements stratégiques de la France
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Visualisez et analysez la provenance des flux énergétiques français, l’évolution des pays partenaires, les capacités des terminaux portuaires et les routes logistiques réelles.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onExplore}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Explorer les flux (Pétrole brut 2015-2026)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={onOpenMap}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              <Anchor className="w-4 h-4 text-cyan-400" />
              <span>Carte des infrastructures portuaires</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid (4 Core Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Volume importé (Pétrole brut)"
          value={formatTonnes(summary.totalQuantityTonnes)}
          variation={summary.yoyQuantityChangePercent}
          variationLabel="YoY (vs année préc.)"
          sourceLabel="DGDDI · HS 2709"
          highlight
        />
        <MetricCard
          label="Facture d'importation totale"
          value={formatCurrencyEur(summary.totalValueEur)}
          subtext={`Période consolidée : ${summary.periodLabel}`}
          sourceLabel="DGDDI (CAF)"
        />
        <MetricCard
          label="Prix unitaire implicite moyen"
          value={formatPricePerTonne(summary.averageImplicitPriceEurPerTonne)}
          variation={summary.yoyPriceChangePercent}
          variationLabel="variation annuelle"
          subtext="Ratio valeur déclarée / masse"
          sourceLabel="Calcul dérivé"
        />
        <MetricCard
          label="Premier pays fournisseur"
          value={
            summary.topSupplier
              ? `${summary.topSupplier.country.flag} ${summary.topSupplier.country.id}`
              : 'N/A'
          }
          subtext={
            summary.topSupplier
              ? `${summary.topSupplier.country.nameFr} (${summary.topSupplier.marketSharePercent}% des volumes)`
              : undefined
          }
          sourceLabel="Douanes FR"
        />
      </div>

      {/* Analytical Section: Partner Shares & Concentration Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PartnerBarChart suppliers={suppliers} onSelectPartner={onSelectPartner} />
        </div>
        <div className="lg:col-span-1">
          <ConcentrationGauge hhi={summary.hhiIndex} />
        </div>
      </div>

      {/* Detected Variations & Structural Shocks (Requirement 38 & 39) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">
            Variations structurelles majeures détectées (2020 - 2026)
          </h3>
          <span className="text-xs text-slate-500 font-mono ml-auto">
            Algorithme de détection statistique
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {anomalies.map((anom) => (
            <div
              key={anom.id}
              className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-2 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{anom.partnerCountryName}</span>
                <span
                  className={`font-mono font-bold ${
                    anom.type === 'DROP' ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {anom.magnitudePercent > 0
                    ? `+${anom.magnitudePercent}%`
                    : `${anom.magnitudePercent}%`}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{anom.observation}</p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono">Période : {anom.period}</span>
                <span className="font-mono text-cyan-400">Source : {anom.sourceId.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provenance and Citation */}
      <SourceCitation
        sourceId="dgddi"
        datasetName="Statistiques douanières mensuelles et annuelles consolidées (HS 2709)"
        period={summary.periodLabel}
      />
    </div>
  );
};
