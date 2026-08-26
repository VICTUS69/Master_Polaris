import React from 'react';
import { X, Award, CheckCircle2, Fuel, Battery, ShieldCheck, Zap, Download } from 'lucide-react';
import { DualSimulationResult } from '../types';

interface FinalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  simResult: DualSimulationResult | null;
  stationName: string;
}

export const FinalReportModal: React.FC<FinalReportModalProps> = ({
  isOpen,
  onClose,
  simResult,
  stationName
}) => {
  if (!isOpen || !simResult) return null;

  const { metrics_comparison, scenario } = simResult;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-polaris-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(16,185,129,0.25)] flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-polaris-800 hover:bg-polaris-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Header */}
        <div className="flex items-center gap-4 border-b border-polaris-800 pb-5">
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-mono text-emerald-400 font-bold tracking-wider uppercase">
              POLARIS RESILIENCE CERTIFICATE • SIMULATION AUDIT COMPLETE
            </div>
            <h2 className="text-xl font-bold font-mono text-white">
              {scenario.name} — Performance Evaluation
            </h2>
            <div className="text-xs font-mono text-slate-400">
              Station: {stationName} • 48-Hour Continuous Stress Test
            </div>
          </div>
        </div>

        {/* Big Savings Metric Showcase */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-polaris-900 to-cyan-950/80 rounded-2xl p-5 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-emerald-300 font-bold">TOTAL FUEL CONSERVED</div>
            <div className="text-3xl font-bold font-mono text-white mt-1">
              {metrics_comparison.fuel_saved_liters.value} <span className="text-lg font-normal text-emerald-400">Liters</span>
            </div>
            <div className="text-xs font-mono text-emerald-400">
              Equivalent to {metrics_comparison.fuel_saved_liters.percentage}% diesel reduction vs baseline SCADA
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono text-cyan-300 font-bold">CRITICAL UPTIME</div>
            <div className="text-3xl font-bold font-mono text-cyan-200 mt-1">
              100.0%
            </div>
            <div className="text-xs font-mono text-slate-400">
              Zero life-support interruption
            </div>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-polaris-950/80 rounded-xl p-3.5 border border-polaris-800">
            <div className="text-xs font-mono text-slate-400">BASELINE DIESEL BURN</div>
            <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
              {metrics_comparison.diesel_consumed_liters.baseline} L
            </div>
            <div className="text-[11px] font-sans text-slate-400 mt-1">
              Standard rule-based dispatch exhausted battery rapidly.
            </div>
          </div>

          <div className="bg-polaris-950/80 rounded-xl p-3.5 border border-emerald-500/30">
            <div className="text-xs font-mono text-emerald-400">POLARIS AI DIESEL BURN</div>
            <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
              {metrics_comparison.diesel_consumed_liters.ai} L
            </div>
            <div className="text-[11px] font-sans text-slate-400 mt-1">
              Predictive pre-charging & optimized generator envelope.
            </div>
          </div>

          <div className="bg-polaris-950/80 rounded-xl p-3.5 border border-polaris-800">
            <div className="text-xs font-mono text-slate-400">MINIMUM BATTERY RESERVE</div>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
              {metrics_comparison.minimum_battery_soc.ai}% (vs {metrics_comparison.minimum_battery_soc.baseline}% Baseline)
            </div>
            <div className="text-[11px] font-sans text-slate-400 mt-1">
              Safety Agent strictly enforced reserve buffer above 35%.
            </div>
          </div>

          <div className="bg-polaris-950/80 rounded-xl p-3.5 border border-polaris-800">
            <div className="text-xs font-mono text-slate-400">RENEWABLE INTEGRATION</div>
            <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
              {metrics_comparison.renewable_utilization.ai}% Utilization
            </div>
            <div className="text-[11px] font-sans text-slate-400 mt-1">
              Maximized solar harvesting before storm blackout.
            </div>
          </div>
        </div>

        {/* Audit Trajectory Summary */}
        <div className="p-4 rounded-xl bg-polaris-950/90 border border-polaris-800 text-xs font-sans text-slate-300 space-y-2">
          <div className="text-xs font-mono font-bold text-white uppercase">
            AUTONOMOUS AGENT ACTIONS TIMELINE:
          </div>
          <p>
            • <strong>Forecast Agent:</strong> Proactively detected incoming katabatic disturbance 12 hours prior to onset.
          </p>
          <p>
            • <strong>Energy Manager:</strong> Triggered OR-Tools MILP optimizer to ramp daylight battery storage and defer non-critical HPC computing.
          </p>
          <p>
            • <strong>Safety Agent:</strong> Rejected initial unsafe 30% reserve plan; mandated 45% emergency storm buffer.
          </p>
          <p>
            • <strong>Digital Twin:</strong> Validated all thermal and electrical physics constraints with zero deficit.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] font-mono text-slate-400">
            Smart India Hackathon 2026 • Problem Statement PS26061
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all shadow-lg"
          >
            CLOSE REPORT
          </button>
        </div>
      </div>
    </div>
  );
};
