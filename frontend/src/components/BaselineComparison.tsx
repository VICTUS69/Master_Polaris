import React from 'react';
import {
  TrendingUp,
  Fuel,
  Battery,
  ShieldCheck,
  Zap,
  Award,
  AlertOctagon,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { DualSimulationResult } from '../types';

interface BaselineComparisonProps {
  simResult: DualSimulationResult | null;
  onOpenReport: () => void;
}

export const BaselineComparison: React.FC<BaselineComparisonProps> = ({
  simResult,
  onOpenReport
}) => {
  if (!simResult) {
    return (
      <div className="glass-panel rounded-2xl p-5 border border-polaris-800 text-center text-slate-400 font-mono text-xs">
        Run a simulation scenario to view Baseline vs Polaris AI performance metrics.
      </div>
    );
  }

  const { metrics_comparison, baseline_timeline, ai_timeline, scenario } = simResult;

  // Combine timelines for Recharts
  const chartData = baseline_timeline.map((b, i) => {
    const a = ai_timeline[i] || {};
    return {
      hour: `T+${b.hour}h`,
      baseline_soc: b.battery_soc_pct,
      ai_soc: a.battery_soc_pct,
      baseline_fuel: b.fuel_remaining_l,
      ai_fuel: a.fuel_remaining_l,
      baseline_gen: b.generator_kw,
      ai_gen: a.generator_kw
    };
  });

  return (
    <div className="glass-panel rounded-2xl p-5 border border-polaris-800 flex flex-col gap-5">
      {/* Title & End of Sim Certificate Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
              BASELINE SCADA vs POLARIS AI COMPARISON
            </h2>
            <div className="text-[11px] font-mono text-slate-400">
              Scenario: <span className="text-cyan-300 font-semibold">{scenario.name}</span> (48-Hour Dual Track)
            </div>
          </div>
        </div>

        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
        >
          <Award className="w-4 h-4" />
          FULL SIMULATION REPORT
        </button>
      </div>

      {/* KPI Comparison Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Diesel Fuel Burned */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
          <div className="text-[10px] font-mono text-slate-400">DIESEL CONSUMED</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xs font-mono text-slate-400 line-through">
              {metrics_comparison.diesel_consumed_liters.baseline} L
            </span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {metrics_comparison.diesel_consumed_liters.ai} L
            </span>
          </div>
          <div className="text-[10px] font-mono text-emerald-400 font-semibold mt-0.5">
            ▼ {metrics_comparison.fuel_saved_liters.percentage}% Saved
          </div>
        </div>

        {/* 2. Minimum Battery Reserve */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
          <div className="text-[10px] font-mono text-slate-400">MIN BATTERY RESERVE</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xs font-mono text-slate-400">
              {metrics_comparison.minimum_battery_soc.baseline}%
            </span>
            <span className="text-base font-bold font-mono text-cyan-300">
              {metrics_comparison.minimum_battery_soc.ai}%
            </span>
          </div>
          <div className="text-[10px] font-mono text-cyan-300 font-semibold mt-0.5">
            +{(metrics_comparison.minimum_battery_soc.ai - metrics_comparison.minimum_battery_soc.baseline).toFixed(1)}% Safe Buffer
          </div>
        </div>

        {/* 3. Critical Load Coverage */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-emerald-500/30">
          <div className="text-[10px] font-mono text-slate-400">CRITICAL COVERAGE</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xs font-mono text-slate-400">
              {metrics_comparison.critical_load_coverage.baseline}%
            </span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {metrics_comparison.critical_load_coverage.ai}%
            </span>
          </div>
          <div className="text-[10px] font-mono text-emerald-400 font-semibold mt-0.5">
            ● 100% Guaranteed
          </div>
        </div>

        {/* 4. Renewable Utilization */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
          <div className="text-[10px] font-mono text-slate-400">RENEWABLE MIX</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xs font-mono text-slate-400">
              {metrics_comparison.renewable_utilization.baseline}%
            </span>
            <span className="text-base font-bold font-mono text-cyan-300">
              {metrics_comparison.renewable_utilization.ai}%
            </span>
          </div>
          <div className="text-[10px] font-mono text-cyan-400 font-semibold mt-0.5">
            Max Green Utilization
          </div>
        </div>

        {/* 5. Resilience Risk Score */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
          <div className="text-[10px] font-mono text-slate-400">RESILIENCE RISK</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xs font-mono text-rose-400">
              {metrics_comparison.resilience_risk_score.baseline}/100
            </span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {metrics_comparison.resilience_risk_score.ai}/100
            </span>
          </div>
          <div className="text-[10px] font-mono text-emerald-400 font-semibold mt-0.5">
            Safe Operating Band
          </div>
        </div>

        {/* 6. AI Interventions */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
          <div className="text-[10px] font-mono text-slate-400">AI ACTIONS</div>
          <div className="text-base font-bold font-mono text-white mt-1">
            {metrics_comparison.agent_interventions_count} Interventions
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            {metrics_comparison.plan_revisions_count} Re-plans
          </div>
        </div>
      </div>

      {/* Dual Trajectory Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Battery SoC Comparison Chart */}
        <div className="bg-polaris-900/80 rounded-xl p-4 border border-polaris-800">
          <div className="text-xs font-mono font-bold text-slate-200 mb-3 flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            BATTERY SOC TRAJECTORY (%): BASELINE vs POLARIS AI
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <Line
                  type="monotone"
                  dataKey="baseline_soc"
                  name="Baseline SCADA SoC"
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="ai_soc"
                  name="POLARIS AI SoC"
                  stroke="#10b981"
                  dot={false}
                  strokeWidth={2.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diesel Fuel Reserve Comparison Chart */}
        <div className="bg-polaris-900/80 rounded-xl p-4 border border-polaris-800">
          <div className="text-xs font-mono font-bold text-slate-200 mb-3 flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            FUEL DEPLETION CURVE (LITERS): BASELINE vs POLARIS AI
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <Line
                  type="monotone"
                  dataKey="baseline_fuel"
                  name="Baseline Fuel Remaining"
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="ai_fuel"
                  name="POLARIS AI Fuel Remaining"
                  stroke="#06b6d4"
                  dot={false}
                  strokeWidth={2.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
