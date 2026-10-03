import React from 'react';
import { getHHIInterpretation } from '../../lib/calculations.ts';
import { HelpCircle } from 'lucide-react';

interface ConcentrationGaugeProps {
  hhi: number;
}

export const ConcentrationGauge: React.FC<ConcentrationGaugeProps> = ({ hhi }) => {
  const interp = getHHIInterpretation(hhi);
  // Calculate percentage of scale (0 to 3000 max)
  const clamped = Math.min(Math.max(hhi, 0), 3000);
  const positionPercent = (clamped / 3000) * 100;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
          <span>Indice de concentration HHI</span>
          <span
            className="cursor-help text-slate-500 hover:text-slate-300"
            title="Indice d'Herfindahl-Hirschman : somme des carrés des parts de marché (en %). Mesure la vulnérabilité et le degré de diversification des approvisionnements."
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${interp.color}`}>
          {interp.level}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold font-mono text-white tabular-nums">{hhi}</span>
        <span className="text-xs text-slate-400 font-mono">/ 10 000 pts</span>
      </div>

      {/* Visual threshold gradient bar */}
      <div className="mt-3 relative">
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
          <div className="w-[33.3%] bg-emerald-500/80" title="Diversifié (< 1000)" />
          <div className="w-[26.7%] bg-cyan-500/80" title="Modéré (1000 - 1800)" />
          <div className="w-[23.3%] bg-amber-500/80" title="Élevé (1800 - 2500)" />
          <div className="w-[16.7%] bg-rose-500/80" title="Extrême (> 2500)" />
        </div>
        {/* Needle indicator */}
        <div
          className="absolute top-0 w-1.5 h-3 -mt-0.5 bg-white rounded-full shadow-md transition-all duration-300"
          style={{ left: `calc(${positionPercent}% - 3px)` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-500">
        <span>0 (Atomisé)</span>
        <span>1 000</span>
        <span>1 800</span>
        <span>2 500+</span>
      </div>

      <p className="mt-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-2.5">
        {interp.description}
      </p>

      <div className="mt-2 text-[11px] text-slate-400 leading-normal bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
        <strong className="text-slate-300">Méthodologie HHI : </strong>
        Calculé par $HHI = \sum (s_i)^2$, où $s_i$ représente la part de chaque pays fournisseur dans le volume total importé. Utilisé par la Commission Européenne et les régulateurs pour évaluer la sécurité d’approvisionnement.
      </div>
    </div>
  );
};
