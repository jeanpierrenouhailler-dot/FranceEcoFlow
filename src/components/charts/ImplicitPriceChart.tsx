import React from 'react';
import ReactECharts from 'echarts-for-react';
import { SupplierSummary } from '../../types/index.ts';

interface ImplicitPriceChartProps {
  suppliers: SupplierSummary[];
  averagePrice: number;
  height?: string;
}

export const ImplicitPriceChart: React.FC<ImplicitPriceChartProps> = ({
  suppliers,
  averagePrice,
  height = '360px',
}) => {
  const top10 = suppliers.slice(0, 10);
  const names = top10.map((s) => `${s.country.flag} ${s.country.id}`);
  const prices = top10.map((s) => s.implicitPriceEurPerTonne);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: {
        color: '#f8fafc',
        fontSize: 12,
      },
      formatter: (params: any) => {
        const item = params[0];
        const supplier = top10[item.dataIndex];
        const diff = supplier.implicitPriceEurPerTonne - averagePrice;
        const diffStr = diff >= 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
        return `<div class="p-1">
          <span class="font-bold text-white">${supplier.country.nameFr}</span><br/>
          <span class="text-cyan-400 font-mono">Prix unitaire implicite : ${supplier.implicitPriceEurPerTonne} € / t</span><br/>
          <span class="text-slate-400 font-mono text-[11px]">Écart à la moyenne : ${diffStr} € / t</span>
        </div>`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        color: '#cbd5e1',
        fontSize: 11,
      },
      axisLine: {
        lineStyle: {
          color: '#334155',
        },
      },
    },
    yAxis: {
      type: 'value',
      name: '€ / tonne',
      nameTextStyle: {
        color: '#94a3b8',
        fontSize: 11,
      },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        fontFamily: 'monospace',
      },
      splitLine: {
        lineStyle: {
          color: '#1e293b',
        },
      },
    },
    series: [
      {
        name: 'Prix unitaire implicite',
        type: 'bar',
        data: prices,
        itemStyle: {
          color: (params: any) => {
            const p = prices[params.dataIndex];
            return p > averagePrice ? '#f59e0b' : '#06b6d4';
          },
          borderRadius: [4, 4, 0, 0],
        },
        markLine: {
          data: [
            {
              yAxis: averagePrice,
              name: 'Moyenne générale',
              lineStyle: {
                color: '#ef4444',
                type: 'dashed',
                width: 2,
              },
              label: {
                formatter: `Moyenne : ${averagePrice} €/t`,
                position: 'end',
                color: '#ef4444',
                fontSize: 11,
                fontFamily: 'monospace',
              },
            },
          ],
        },
      },
    ],
  };

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 text-xs">
        <div>
          <span className="font-semibold text-slate-200">Comparaison du prix unitaire implicite par pays fournisseur</span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Calculé par le ratio valeur déclarée CAF / masse nette importée (DGDDI).
          </p>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">Unité : € / tonne</span>
      </div>
      <ReactECharts option={option} style={{ height, width: '100%' }} />
    </div>
  );
};
