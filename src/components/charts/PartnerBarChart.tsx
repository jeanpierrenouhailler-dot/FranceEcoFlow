import React from 'react';
import ReactECharts from 'echarts-for-react';
import { SupplierSummary } from '../../types/index.ts';

interface PartnerBarChartProps {
  suppliers: SupplierSummary[];
  onSelectPartner?: (partnerId: string) => void;
  height?: string;
}

export const PartnerBarChart: React.FC<PartnerBarChartProps> = ({
  suppliers,
  onSelectPartner,
  height = '360px',
}) => {
  const topSuppliers = suppliers.slice(0, 10).reverse();
  const names = topSuppliers.map((s) => `${s.country.flag} ${s.country.nameFr}`);
  const shares = topSuppliers.map((s) => s.marketSharePercent);
  const volumesMt = topSuppliers.map((s) => Math.round((s.totalQuantityTonnes / 1000000) * 10) / 10);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: {
        color: '#f8fafc',
        fontSize: 12,
      },
      formatter: (params: any) => {
        const item = params[0];
        const supplier = topSuppliers[item.dataIndex];
        return `<div class="p-1">
          <span class="font-bold text-white">${supplier.country.flag} ${supplier.country.nameFr}</span><br/>
          <span class="text-cyan-400 font-mono">Part de marché : ${supplier.marketSharePercent}%</span><br/>
          <span class="text-slate-300 font-mono">Volume : ${volumesMt[item.dataIndex]} Mt</span><br/>
          <span class="text-slate-400 font-mono text-[11px]">Prix implicite : ${supplier.implicitPriceEurPerTonne} €/t</span>
        </div>`;
      },
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%',
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
    yAxis: {
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
    series: [
      {
        name: 'Part de marché',
        type: 'bar',
        data: shares,
        itemStyle: {
          color: (params: any) => {
            return params.dataIndex >= topSuppliers.length - 2 ? '#38bdf8' : '#0284c7';
          },
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: '#94a3b8',
          fontSize: 11,
          fontFamily: 'monospace',
        },
      },
    ],
  };

  const onEvents = {
    click: (params: any) => {
      const s = topSuppliers[params.dataIndex];
      if (s && onSelectPartner) {
        onSelectPartner(s.partnerCountryId);
      }
    },
  };

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-semibold text-slate-200">Principaux pays fournisseurs de pétrole brut</span>
        <span className="text-slate-400 font-mono text-[11px]">Part en volume (%)</span>
      </div>
      <ReactECharts option={option} onEvents={onEvents} style={{ height, width: '100%' }} />
    </div>
  );
};
