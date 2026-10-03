import React from 'react';
import ReactECharts from 'echarts-for-react';
import { TimeseriesPoint } from '../../types/index.ts';

interface TimeseriesChartProps {
  data: TimeseriesPoint[];
  height?: string;
}

export const TimeseriesChart: React.FC<TimeseriesChartProps> = ({ data, height = '360px' }) => {
  const years = data.map((d) => d.period);
  const quantitiesMt = data.map((d) => Math.round((d.quantityTonnes / 1000000) * 10) / 10);
  const valuesMdEur = data.map((d) => Math.round((d.valueEur / 1000000000) * 10) / 10);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: {
        color: '#f8fafc',
        fontSize: 12,
        fontFamily: 'sans-serif',
      },
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#475569',
        },
      },
    },
    legend: {
      data: ['Volume (Mt)', 'Valeur (€ Md)'],
      textStyle: {
        color: '#94a3b8',
        fontSize: 11,
      },
      top: 0,
      right: 10,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '5%',
      top: '12%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: years,
        axisPointer: {
          type: 'shadow',
        },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 11,
          fontFamily: 'monospace',
        },
        axisLine: {
          lineStyle: {
            color: '#334155',
          },
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Volume (Mt)',
        nameTextStyle: {
          color: '#94a3b8',
          fontSize: 11,
        },
        min: 0,
        axisLabel: {
          formatter: '{value} Mt',
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
      {
        type: 'value',
        name: 'Valeur (€ Md)',
        nameTextStyle: {
          color: '#94a3b8',
          fontSize: 11,
        },
        min: 0,
        axisLabel: {
          formatter: '{value} Md€',
          color: '#94a3b8',
          fontSize: 11,
          fontFamily: 'monospace',
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: 'Volume (Mt)',
        type: 'bar',
        data: quantitiesMt,
        itemStyle: {
          color: '#0284c7',
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: 'Valeur (€ Md)',
        type: 'line',
        yAxisIndex: 1,
        data: valuesMdEur,
        smooth: true,
        lineStyle: {
          color: '#f59e0b',
          width: 3,
        },
        itemStyle: {
          color: '#f59e0b',
        },
      },
    ],
  };

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-semibold text-slate-200">Évolution annuelle du volume et de la facture d'importation</span>
        <span className="text-slate-400 font-mono text-[11px]">2015 — 2026</span>
      </div>
      <ReactECharts option={option} style={{ height, width: '100%' }} />
    </div>
  );
};
