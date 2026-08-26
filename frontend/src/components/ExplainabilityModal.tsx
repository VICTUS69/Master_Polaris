import React from 'react';
import { X, HelpCircle, CheckCircle2, Zap, ShieldCheck, Flame, Sun, Battery } from 'lucide-react';
import { AgentCycleResult } from '../types';

interface ExplainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  explainability: AgentCycleResult['explainability'] | null;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  isOpen,
  onClose,
  explainability
}) => {
  if (!isOpen || !explainability) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-polaris-900 border border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col gap-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-polaris-800 hover:bg-polaris-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono text-cyan-400 font-bold tracking-wider uppercase">
              DECISION EXPLAINABILITY & REASONING AUDIT
            </div>
            <h3 className="text-lg font-bold font-mono text-white">
              {explainability.title}
            </h3>
          </div>
        </div>

        {/* Summary Description */}
        <div className="p-4 rounded-2xl bg-polaris-950/80 border border-polaris-800 text-xs font-sans text-slate-200 leading-relaxed">
          {explainability.summary}
        </div>

        {/* Quantitative Trigger Factors */}
        <div>
          <div className="text-xs font-mono font-bold text-slate-300 mb-2 uppercase tracking-wide">
            PRIMARY CAUSAL TELEMETRY TRIGGERS:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {explainability.key_factors.map((factor, i) => (
              <div
                key={i}
                className="bg-polaris-950/60 rounded-xl p-3 border border-polaris-800 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">{factor.factor}</span>
                  <span className="text-cyan-300 font-bold">{factor.value}</span>
                </div>
                <div className="text-[11px] font-sans text-slate-300 mt-1">
                  Impact: {factor.impact}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Autonomous Microgrid Interventions Taken */}
        <div>
          <div className="text-xs font-mono font-bold text-slate-300 mb-2 uppercase tracking-wide">
            AUTONOMOUS ACTIONS EXECUTED:
          </div>
          <ul className="space-y-1.5">
            {explainability.actions_taken.map((action, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-xs font-sans text-slate-200 bg-polaris-950/40 rounded-lg p-2 border border-polaris-800/80"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-md"
          >
            DISMISS AUDIT
          </button>
        </div>
      </div>
    </div>
  );
};
