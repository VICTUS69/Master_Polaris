import React from 'react';
import { Clock, Zap, Sun, Battery, Fuel, CheckCircle, Sparkles } from 'lucide-react';

interface OptimizationTimelineProps {
  schedule: any[];
  summary: any;
  recommendations: string[];
  onGeneratePlan: () => void;
  isLoading: boolean;
}

export const OptimizationTimeline: React.FC<OptimizationTimelineProps> = ({
  schedule,
  summary,
  recommendations,
  onGeneratePlan,
  isLoading
}) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-polaris-800 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
            OPTIMAL 24-HOUR MICROGRID DISPATCH SCHEDULE (OR-TOOLS MILP)
          </h2>
        </div>

        <button
          onClick={onGeneratePlan}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isLoading ? 'SOLVING MILP SCHEDULE...' : 'GENERATE OPTIMAL PLAN'}
        </button>
      </div>

      {/* Dynamic AI Recommendation Cards */}
      {recommendations.length > 0 && (
        <div className="bg-cyan-950/40 rounded-xl p-3.5 border border-cyan-500/30 flex flex-col gap-1.5">
          <div className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI OPTIMIZATION RECOMMENDATIONS:
          </div>
          <ul className="text-xs font-sans text-slate-300 list-disc list-inside space-y-1">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 24-Hour Dispatch Timeline Horizontal Grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-[750px] pb-2">
          {schedule.slice(0, 24).map((step, idx) => {
            const isGen = step.generator_active || step.generator_kw > 0;
            const isSolar = step.solar_total_kw > 5;
            const isDischarge = step.battery_discharge_kw > 0;

            return (
              <div
                key={idx}
                className="flex-1 min-w-[95px] bg-polaris-900/90 rounded-xl p-2.5 border border-polaris-800 flex flex-col justify-between text-center"
              >
                <div className="text-[10px] font-mono text-slate-400 border-b border-polaris-800 pb-1 font-bold">
                  {String(step.hour).padStart(2, '0')}:00h
                </div>

                <div className="my-2 flex flex-col gap-1 text-[10px] font-mono">
                  {isSolar && (
                    <span className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ☀ {step.solar_total_kw}kW
                    </span>
                  )}
                  {isDischarge && (
                    <span className="px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ⚡ -{step.battery_discharge_kw}kW
                    </span>
                  )}
                  {isGen ? (
                    <span className="px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      ⛽ {step.generator_kw}kW
                    </span>
                  ) : (
                    <span className="px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                      GEN OFF
                    </span>
                  )}
                </div>

                <div className="text-[9px] font-mono text-cyan-300 border-t border-polaris-800 pt-1">
                  SoC: {step.battery_soc_pct}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
