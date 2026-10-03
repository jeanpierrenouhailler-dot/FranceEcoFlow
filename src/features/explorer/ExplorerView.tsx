import React, { useState } from 'react';
import {
  Country,
  Product,
  Infrastructure,
  TransportRoute,
  FlowAnalysisSummary,
  SupplierSummary,
  TimeseriesPoint,
  SankeyData,
} from '../../types/index.ts';
import { FlowParams } from '../../lib/api.ts';
import { FilterToolbar } from './FilterToolbar.tsx';
import { MetricCard } from '../../components/common/MetricCard.tsx';
import { FlowMap } from '../../components/map/FlowMap.tsx';
import { PartnerBarChart } from '../../components/charts/PartnerBarChart.tsx';
import { SankeyChart } from '../../components/charts/SankeyChart.tsx';
import { TimeseriesChart } from '../../components/charts/TimeseriesChart.tsx';
import { ImplicitPriceChart } from '../../components/charts/ImplicitPriceChart.tsx';
import { ConcentrationGauge } from '../../components/charts/ConcentrationGauge.tsx';
import { FlowsTable } from '../../components/tables/FlowsTable.tsx';
import { SourceCitation } from '../../components/common/SourceCitation.tsx';
import { formatCurrencyEur, formatTonnes, formatPricePerTonne } from '../../lib/calculations.ts';
import { Map, BarChart3, GitFork, LineChart, DollarSign, Table2, Layers } from 'lucide-react';

interface ExplorerViewProps {
  params: FlowParams;
  onUpdateParams: (newParams: Partial<FlowParams>) => void;
  onResetFilters: () => void;
  countries: Country[];
  products: Product[];
  infrastructures: Infrastructure[];
  routes: TransportRoute[];
  summary: FlowAnalysisSummary;
  suppliers: SupplierSummary[];
  timeseries: TimeseriesPoint[];
  sankey: SankeyData;
  onSelectPartner: (partnerId: string) => void;
  onSelectInfrastructure: (infra: Infrastructure) => void;
}

type ExplorerTab = 'overview' | 'map' | 'sankey' | 'timeseries' | 'price' | 'table';

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  params,
  onUpdateParams,
  onResetFilters,
  countries,
  products,
  infrastructures,
  routes,
  summary,
  suppliers,
  timeseries,
  sankey,
  onSelectPartner,
  onSelectInfrastructure,
}) => {
  const [activeTab, setActiveTab] = useState<ExplorerTab>('overview');

  const selectedPartner = countries.find((c) => c.id === params.partner);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Filter Toolbar */}
      <FilterToolbar
        params={params}
        onChange={onUpdateParams}
        countries={countries}
        products={products}
        onReset={onResetFilters}
      />

      {/* Selected Partner Filter Alert (if filtered) */}
      {selectedPartner && (
        <div className="flex items-center justify-between bg-cyan-950/40 border border-cyan-800/80 px-4 py-2.5 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">{selectedPartner.flag}</span>
            <span className="text-cyan-300 font-semibold">
              Filtre actif : {selectedPartner.nameFr} ({selectedPartner.id})
            </span>
            <span className="text-slate-400">· Données restreintes à ce partenaire</span>
          </div>
          <button
            onClick={() => onUpdateParams({ partner: 'all' })}
            className="text-cyan-400 hover:text-white font-medium cursor-pointer"
          >
            Réinitialiser au global
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label={params.flow === 'export' ? "Volume exporté" : "Volume importé"}
          value={formatTonnes(summary.totalQuantityTonnes)}
          variation={summary.yoyQuantityChangePercent}
          variationLabel="YoY"
          sourceLabel="DGDDI · Douanes"
          highlight
        />
        <MetricCard
          label="Facture financière totale"
          value={formatCurrencyEur(summary.totalValueEur)}
          subtext={`Période : ${summary.periodLabel}`}
          sourceLabel="CAF / FOB"
        />
        <MetricCard
          label="Prix unitaire implicite"
          value={formatPricePerTonne(summary.averageImplicitPriceEurPerTonne)}
          variation={summary.yoyPriceChangePercent}
          variationLabel="YoY"
          subtext="Valeur / Masse nette"
          sourceLabel="Calcul dérivé"
        />
        <MetricCard
          label="Nombre de partenaires actifs"
          value={`${summary.supplierCount}`}
          subtext={
            summary.topSupplier
              ? `Principal : ${summary.topSupplier.country.flag} ${summary.topSupplier.country.nameFr}`
              : undefined
          }
          sourceLabel="Origines déclarées"
        />
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vue globale</span>
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Carte des flux & ports</span>
          </button>
          <button
            onClick={() => setActiveTab('sankey')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'sankey'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Diagramme de Sankey</span>
          </button>
          <button
            onClick={() => setActiveTab('timeseries')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'timeseries'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Séries temporelles</span>
          </button>
          <button
            onClick={() => setActiveTab('price')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'price'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Prix unitaire implicite</span>
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'table'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Tableau détaillé</span>
          </button>
        </div>
      </div>

      {/* Main Content Area based on selected Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <FlowMap
            suppliers={suppliers}
            infrastructures={infrastructures}
            routes={routes}
            selectedPartnerId={params.partner}
            onSelectPartner={(pId) => onUpdateParams({ partner: pId })}
            onSelectInfrastructure={onSelectInfrastructure}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PartnerBarChart
                suppliers={suppliers}
                onSelectPartner={(pId) => onUpdateParams({ partner: pId })}
              />
            </div>
            <div className="lg:col-span-1">
              <ConcentrationGauge hhi={summary.hhiIndex} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'map' && (
        <div className="space-y-4">
          <FlowMap
            suppliers={suppliers}
            infrastructures={infrastructures}
            routes={routes}
            selectedPartnerId={params.partner}
            onSelectPartner={(pId) => onUpdateParams({ partner: pId })}
            onSelectInfrastructure={onSelectInfrastructure}
          />
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span>
              💡 Survolez les lignes de flux ou les ports pour afficher les volumes précis et les documents logistiques attestés.
            </span>
            <span className="font-mono text-cyan-400">MapLibre GL / OpenStreetMap</span>
          </div>
        </div>
      )}

      {activeTab === 'sankey' && (
        <div className="space-y-4">
          <SankeyChart data={sankey} height="520px" />
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <strong>Interprétation du flux de Sankey : </strong>
            La largeur des branches représente les millions de tonnes (Mt) de pétrole brut acheminés par les pays d’origine vers le territoire métropolitain français avant d’alimenter les unités de raffinage.
          </div>
        </div>
      )}

      {activeTab === 'timeseries' && (
        <div className="space-y-4">
          <TimeseriesChart data={timeseries} height="440px" />
        </div>
      )}

      {activeTab === 'price' && (
        <div className="space-y-4">
          <ImplicitPriceChart
            suppliers={suppliers}
            averagePrice={summary.averageImplicitPriceEurPerTonne}
            height="440px"
          />
        </div>
      )}

      {activeTab === 'table' && (
        <FlowsTable
          suppliers={suppliers}
          periodLabel={summary.periodLabel}
          onSelectPartner={(pId) => onUpdateParams({ partner: pId })}
        />
      )}

      {/* Lineage & Methodology Citation */}
      <SourceCitation
        sourceId="dgddi"
        datasetName="Statistiques douanières mensuelles et annuelles consolidées (HS 2709 / NC8 27090090)"
        period={summary.periodLabel}
      />
    </div>
  );
};
