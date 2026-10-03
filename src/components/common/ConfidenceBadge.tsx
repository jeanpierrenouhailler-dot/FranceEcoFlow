import React from 'react';
import { ConfidenceLevel } from '../../types/index.ts';
import { ShieldCheck, FileText, HelpCircle, AlertCircle } from 'lucide-react';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  className?: string;
  showIcon?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  level,
  className = '',
  showIcon = true,
}) => {
  const configs: Record<
    ConfidenceLevel,
    { label: string; textClass: string; icon: React.ReactNode; tooltip: string }
  > = {
    CONFIRMED: {
      label: 'Confirmé',
      textClass: 'text-emerald-400',
      icon: <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />,
      tooltip: 'Donnée statistique directement extraite des déclarations douanières officielles (DGDDI / Eurostat).',
    },
    DOCUMENTED: {
      label: 'Documenté',
      textClass: 'text-cyan-400',
      icon: <FileText className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />,
      tooltip: 'Itinéraire logistique attesté par des manifestes maritimes, bilans de transport (SDES) ou infrastructures physiques vérifiées.',
    },
    PROBABLE: {
      label: 'Probable',
      textClass: 'text-amber-400',
      icon: <HelpCircle className="w-3.5 h-3.5 inline mr-1 text-amber-400" />,
      tooltip: 'Estimation dérivée par modélisation ou croisement statistique indirect.',
    },
    UNKNOWN: {
      label: 'Non déterminé',
      textClass: 'text-slate-400',
      icon: <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-slate-400" />,
      tooltip: 'Information logistique non documentée à ce jour.',
    },
  };

  const config = configs[level] || configs.UNKNOWN;

  return (
    <span
      className={`inline-flex items-center text-xs font-medium ${config.textClass} ${className}`}
      title={config.tooltip}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
