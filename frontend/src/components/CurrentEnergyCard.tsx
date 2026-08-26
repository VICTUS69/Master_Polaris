import React from 'react';
import {
  Activity,
  Sun,
  BatteryCharging,
  Fuel,
  ShieldCheck,
  Zap,
  Gauge,
  Flame
} from 'lucide-react';
import { InstantEnergyState } from '../types';

interface CurrentEnergyCardProps {
  state: InstantEnergyState | null;
  isLoading: boolean;
}

export const CurrentEnergyCard: React.FC<CurrentEnergyCardProps> = ({ state, isLoading }) => {
  if (isLoading || !state) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-24 bg-polaris-800/60 rounded-2xl" />
        ))}
      </div>
    );
  }

  const isGenRunning = state.generator_output_kw > 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* 1. Current Station Demand */}
      <div className="glass-panel rounded-2xl p-4 border border-polaris-800 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">TOTAL DEMAND</span>
          <Activity className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="my-1">
          <span className="text-2xl font-bold font-mono text-white">
            {state.current_demand_kw}
          </span>
          <span className="text-xs font-mono text-slate-400 ml-1">kW</span>
        </div>
        <div className="text-[10px] font-mono text-cyan-300">
          Crit: {state.critical_load_kw} kW (100%)
        </div>
      </div>

      {/* 2. Solar PV Output */}
      <div className="glass-panel rounded-2xl p-4 border border-polaris-800 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">SOLAR ARRAY</span>
          <Sun className="w-4 h-4 text-amber-400" />
        </div>
        <div className="my-1">
          <span className="text-2xl font-bold font-mono text-amber-300">
            {state.solar_generation_kw}
          </span>
          <span className="text-xs font-mono text-slate-400 ml-1">kW</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          Direct: {state.solar_direct_kw} kW
        </div>
      </div>

      {/* 3. Battery Storage SoC */}
      <div className="glass-panel rounded-2xl p-4 border border-polaris-800 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">BATTERY SOC</span>
          <BatteryCharging className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="my-1">
          <span className={`text-2xl font-bold font-mono ${
            state.battery_soc_pct < 35 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {state.battery_soc_pct}%
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          Avail: {state.battery_available_energy_kwh} kWh
        </div>
      </div>

      {/* 4. Diesel Fuel Tank */}
      <div className="glass-panel rounded-2xl p-4 border border-polaris-800 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">DIESEL RESERVE</span>
          <Fuel className="w-4 h-4 text-slate-400" />
        </div>
        <div className="my-1">
          <span className="text-2xl font-bold font-mono text-slate-200">
            {state.diesel_fuel_liters}
          </span>
          <span className="text-xs font-mono text-slate-400 ml-1">L</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          Arctic fuel mix (-50°C)
        </div>
      </div>

      {/* 5. Generator State */}
      <div className={`glass-panel rounded-2xl p-4 border flex flex-col justify-between transition-colors ${
        isGenRunning ? 'border-amber-500/40 bg-amber-950/20' : 'border-polaris-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">GENERATOR</span>
          <Flame className={`w-4 h-4 ${isGenRunning ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
        </div>
        <div className="my-1">
          <span className={`text-2xl font-bold font-mono ${isGenRunning ? 'text-amber-300' : 'text-slate-400'}`}>
            {state.generator_output_kw}
          </span>
          <span className="text-xs font-mono text-slate-400 ml-1">kW</span>
        </div>
        <div className={`text-[10px] font-mono font-semibold ${isGenRunning ? 'text-amber-400' : 'text-slate-500'}`}>
          {isGenRunning ? 'ACTIVE (SPINNING)' : 'STANDBY (OFF)'}
        </div>
      </div>

      {/* 6. Renewable Contribution */}
      <div className="glass-panel rounded-2xl p-4 border border-polaris-800 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">RENEWABLE MIX</span>
          <Zap className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="my-1">
          <span className="text-2xl font-bold font-mono text-cyan-300">
            {state.renewable_contribution_pct}%
          </span>
        </div>
        <div className="text-[10px] font-mono text-emerald-400">
          Critical: {state.critical_load_coverage_pct}% Covered
        </div>
      </div>
    </div>
  );
};
