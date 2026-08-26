import React from 'react';
import { Sun, Battery, Fuel, Home, ArrowRight, Zap } from 'lucide-react';
import { InstantEnergyState } from '../types';

interface EnergyFlowProps {
  state: InstantEnergyState | null;
}

export const EnergyFlow: React.FC<EnergyFlowProps> = ({ state }) => {
  const solarGen = state?.solar_generation_kw || 0;
  const solarDirect = state?.solar_direct_kw || 0;
  const solarToBatt = state?.solar_to_battery_kw || 0;
  const battDischarge = state?.battery_discharging_kw || 0;
  const battSoC = state?.battery_soc_pct || 75;
  const genOutput = state?.generator_output_kw || 0;
  const demand = state?.current_demand_kw || 120;

  const isSolarActive = solarGen > 2;
  const isCharging = solarToBatt > 2;
  const isDischarging = battDischarge > 2;
  const isGenActive = genOutput > 2;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-polaris-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
            ACTIVE MICROGRID ENERGY FLOW
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Total Demand: <span className="text-white font-bold">{demand} kW</span>
        </span>
      </div>

      <div className="relative py-4 px-2">
        <svg className="w-full h-44 sm:h-52" viewBox="0 0 700 200" fill="none">
          {/* Paths between nodes */}
          {/* Solar -> Station */}
          <path
            d="M 120 50 L 350 100 L 580 100"
            stroke={isSolarActive ? '#06b6d4' : '#1e293b'}
            strokeWidth="3"
            className={isSolarActive ? 'animate-energy-flow' : ''}
          />

          {/* Solar -> Battery */}
          <path
            d="M 120 50 L 230 150 L 340 150"
            stroke={isCharging ? '#10b981' : '#1e293b'}
            strokeWidth="3"
            className={isCharging ? 'animate-energy-flow' : ''}
          />

          {/* Battery -> Station */}
          <path
            d="M 360 150 L 470 150 L 580 100"
            stroke={isDischarging ? '#10b981' : '#1e293b'}
            strokeWidth="3"
            className={isDischarging ? 'animate-energy-flow' : ''}
          />

          {/* Diesel -> Station */}
          <path
            d="M 120 150 L 350 100 L 580 100"
            stroke={isGenActive ? '#f59e0b' : '#1e293b'}
            strokeWidth="3"
            className={isGenActive ? 'animate-energy-flow' : ''}
          />

          {/* Flow Particle Indicators */}
          {isSolarActive && (
            <circle cx="235" cy="75" r="4" fill="#06b6d4" className="animate-ping" />
          )}
          {isCharging && (
            <circle cx="230" cy="150" r="4" fill="#10b981" className="animate-ping" />
          )}
          {isDischarging && (
            <circle cx="470" cy="150" r="4" fill="#10b981" className="animate-ping" />
          )}
          {isGenActive && (
            <circle cx="235" cy="125" r="4" fill="#f59e0b" className="animate-ping" />
          )}
        </svg>

        {/* Overlay Node Cards */}
        {/* Node 1: Solar Array (Top Left) */}
        <div className="absolute top-2 left-2 sm:left-6 flex items-center gap-2 p-2.5 bg-polaris-900 border border-polaris-700 rounded-xl shadow-lg">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400">SOLAR ARRAY</div>
            <div className="text-xs font-bold font-mono text-amber-300">{solarGen} kW</div>
          </div>
        </div>

        {/* Node 2: Diesel Generator (Bottom Left) */}
        <div className="absolute bottom-2 left-2 sm:left-6 flex items-center gap-2 p-2.5 bg-polaris-900 border border-polaris-700 rounded-xl shadow-lg">
          <div className={`p-2 rounded-lg ${isGenActive ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400">DIESEL GEN</div>
            <div className={`text-xs font-bold font-mono ${isGenActive ? 'text-amber-300' : 'text-slate-500'}`}>
              {genOutput} kW {isGenActive ? '(ON)' : '(STANDBY)'}
            </div>
          </div>
        </div>

        {/* Node 3: Battery Storage (Bottom Center) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2.5 bg-polaris-900 border border-polaris-700 rounded-xl shadow-lg">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Battery className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400">BATTERY (SoC {battSoC}%)</div>
            <div className="text-xs font-bold font-mono text-emerald-300">
              {isCharging ? `+${solarToBatt} kW CHG` : (isDischarging ? `-${battDischarge} kW DIS` : 'IDLE')}
            </div>
          </div>
        </div>

        {/* Node 4: Research Station Habitat (Right Center) */}
        <div className="absolute top-1/2 right-2 sm:right-6 -translate-y-1/2 flex items-center gap-2 p-3 bg-polaris-900 border border-cyan-500/40 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-300 font-bold">POLAR STATION</div>
            <div className="text-sm font-bold font-mono text-white">{demand} kW</div>
            <div className="text-[9px] font-mono text-emerald-400">● 100% Critical Served</div>
          </div>
        </div>
      </div>
    </div>
  );
};
