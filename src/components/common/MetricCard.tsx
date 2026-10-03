import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  variation?: number;
  variationLabel?: string;
  subtext?: string;
  sourceLabel?: string;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  variation,
  variationLabel = 'vs an précédent',
  subtext,
  sourceLabel = 'DGDDI',
  highlight = false,
}) => {
  const isPositive = variation !== undefined && variation > 0;
  const isNegative = variation !== undefined && variation < 0;
  const isNeutral = variation !== undefined && variation === 0;

  return (
    <div
      className={`p-5 rounded-lg border transition-all ${
        highlight
          ? 'bg-slate-900/90 border-cyan-500/40 shadow-sm'
          : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80'
      }`}
    >
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium tracking-tight">
        <span>{label}</span>
        {sourceLabel && <span className="text-slate-500 text-[11px] font-mono">{sourceLabel}</span>}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
          {value}
        </span>
        {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
        {variation !== undefined ? (
          <div className="flex items-center gap-1 font-mono text-[12px]">
            {isPositive && (
              <span className="flex items-center text-emerald-400 font-semibold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{variation.toFixed(1)}%
              </span>
            )}
            {isNegative && (
              <span className="flex items-center text-rose-400 font-semibold">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {variation.toFixed(1)}%
              </span>
            )}
            {isNeutral && (
              <span className="flex items-center text-slate-400">
                <Minus className="w-3.5 h-3.5" />
                0.0%
              </span>
            )}
            <span className="text-slate-500 text-[11px] ml-1">{variationLabel}</span>
          </div>
        ) : (
          subtext && <span className="text-slate-400 text-[12px]">{subtext}</span>
        )}
      </div>
    </div>
  );
};
