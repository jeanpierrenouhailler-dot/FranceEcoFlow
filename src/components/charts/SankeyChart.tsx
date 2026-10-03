import React from 'react';
import ReactECharts from 'echarts-for-react';
import { SankeyData } from '../../types/index.ts';

interface SankeyChartProps {
  data: SankeyData;
  height?: string;
}

export const SankeyChart: React.FC<SankeyChartProps> = ({ data, height = '450px' }) => {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: {
        color: '#f8fafc',
        fontSize: 12,
        fontFamily: 'sans-serif',
      },
      formatter: (params: any) => {
        if (params.dataType === 'edge') {
          return `<div class="p-1 font-sans">
            <span class="text-slate-400">${params.data.source} → ${params.data.target}</span><br/>
            <span class="font-bold text-cyan-400 font-mono text-sm">${params.data.value} Mt</span>
          </div>`;
        }
        return `<div class="p-1 font-sans">
          <span class="font-bold text-white">${params.name}</span>
        </div>`;
      },
    },
    series: [
      {
        type: 'sankey',
        layout: 'none',
        emphasis: {
          focus: 'adjacency',
        },
        data: data.nodes.map((node) => ({
          name: node.name,
          itemStyle: {
            color:
              node.category === 'reporter'
                ? '#0284c7'
                : node.category === 'product'
                ? '#0d9488'
                : '#38bdf8',
            borderColor: '#0f172a',
            borderWidth: 1,
          },
        })),
        links: data.links,
        lineStyle: {
          color: 'gradient',
          curveness: 0.5,
          opacity: 0.45,
        },
        label: {
          color: '#cbd5e1',
          fontSize: 11,
          fontFamily: 'sans-serif',
        },
        nodeWidth: 18,
        nodeGap: 14,
      },
    ],
  };

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-semibold text-slate-200">Diagramme de Sankey des approvisionnements</span>
        <span className="text-slate-400 font-mono text-[11px]">Unité : Millions de tonnes (Mt)</span>
      </div>
      <ReactECharts option={option} style={{ height, width: '100%' }} />
    </div>
  );
};
