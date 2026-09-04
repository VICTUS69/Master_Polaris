import React, { useState, useEffect } from 'react';
import {
  Activity,
  Sun,
  BatteryCharging,
  Fuel,
  ShieldCheck,
  Zap,
  Gauge,
  Flame,
  AlertTriangle,
  Clock,
  Skull
} from 'lucide-react';
import { InstantEnergyState, CrisisResponse } from '../types';

interface CurrentEnergyCardProps {
  state: InstantEnergyState | null;
  isLoading: boolean;
  crisisData?: CrisisResponse | null;
  isCrisisActive?: boolean;
}

// Live countdown timer component
const CrisisCountdown: React.FC<{ totalMinutes: number }> = ({ totalMinutes }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(totalMinutes * 60);

  useEffect(() => {
    setRemainingSeconds(totalMinutes * 60);
  }, [totalMinutes]);

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="font-mono text-center">
      <div className="text-5xl md:text-6xl font-black tracking-tight tabular-nums">
        <span className="text-red-400">{String(hours).padStart(2, '0')}</span>
        <span className="text-red-500/60 animate-pulse mx-1">:</span>
        <span className="text-red-400">{String(minutes).padStart(2, '0')}</span>
        <span className="text-red-500/60 animate-pulse mx-1">:</span>
        <span className="text-red-300">{String(seconds).padStart(2, '0')}</span>
      </div>
      <div className="text-[10px] tracking-[0.3em] text-red-400/70 mt-1">
        HOURS &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; MINUTES &nbsp;&nbsp;&nbsp;&nbsp; SECONDS
      </div>
    </div>
  );
};

export const CurrentEnergyCard: React.FC<CurrentEnergyCardProps> = ({
  state,
  isLoading,
  crisisData,
  isCrisisActive
}) => {
  if (isLoading || !state) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-24 bg-polaris-800/60 rounded-2xl" />
        ))}
      </div>
    );
  }

  const isGenRunning = isCrisisActive ? false : state.generator_output_kw > 0;
  const solarVal = isCrisisActive ? 0 : state.solar_generation_kw;
  const genVal = isCrisisActive ? 0 : state.generator_output_kw;
  const socVal = isCrisisActive && crisisData ? crisisData.battery.soc_pct : state.battery_soc_pct;
  const battAvail = isCrisisActive && crisisData ? crisisData.battery.available_energy_kwh : state.battery_available_energy_kwh;
  const demandVal = isCrisisActive && crisisData ? crisisData.survival.p0_load_kw : state.current_demand_kw;
  const critVal = isCrisisActive && crisisData ? crisisData.survival.p0_load_kw : state.critical_load_kw;

  return (
    <div className="flex flex-col gap-4">
      {/* ── CRISIS COUNTDOWN BANNER ──────────────────────────────── */}
      {isCrisisActive && crisisData && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-red-500 bg-gradient-to-br from-red-950 via-red-950/95 to-black p-6 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
          {/* Animated danger stripes */}
          <div className="absolute inset-0 opacity-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.3)_10px,rgba(239,68,68,0.3)_20px)]" />

          {/* Pulsing border glow */}
          <div className="absolute inset-0 rounded-2xl border-2 border-red-500 animate-pulse opacity-40" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Alert info */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-full animate-pulse">
                <Skull className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
                  <span className="text-[11px] font-mono font-bold text-red-400 tracking-[0.2em] uppercase">
                    CRITICAL P0 SURVIVAL RUNWAY
                  </span>
                </div>
                <p className="text-xs font-mono text-red-300/70">
                  {crisisData.fault} — {crisisData.station}
                </p>
                <p className="text-[10px] font-mono text-red-400/50 mt-1">
                  BESS Sole Source: {crisisData.battery.available_energy_kwh} kWh @ {crisisData.survival.p0_load_kw} kW P0 draw
                </p>
              </div>
            </div>

            {/* Center: Countdown Timer */}
            <CrisisCountdown totalMinutes={crisisData.survival.p0_exergy_remaining_minutes} />

            {/* Right: SOS Status */}
            <div className="text-right">
              <div className="text-[10px] font-mono text-red-400/60 tracking-wider uppercase mb-1">
                SOS WEBHOOK
              </div>
              <div className={`text-xs font-mono font-bold ${crisisData.webhook.fired ? 'text-amber-400' : 'text-red-400'}`}>
                {crisisData.webhook.fired ? '✓ TRANSMITTED' : '○ NOT CONFIGURED'}
              </div>
              <div className="text-[10px] font-mono text-red-400/40 mt-1">
                Edge DB: {crisisData.edge_databases.crisis_logged ? '✓ LOGGED' : '○ PENDING'}
              </div>
            </div>
          </div>

          {/* CRT scanline overlay for dramatic effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30 rounded-2xl" />
        </div>
      )}

      {/* ── STANDARD KPI CARDS ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Current Station Demand */}
        <div className={`glass-panel rounded-2xl p-4 border flex flex-col justify-between ${isCrisisActive ? 'border-red-500/40 bg-red-950/10' : 'border-polaris-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              {isCrisisActive ? 'P0 DEMAND ONLY' : 'TOTAL DEMAND'}
            </span>
            <Activity className={`w-4 h-4 ${isCrisisActive ? 'text-red-400' : 'text-cyan-400'}`} />
          </div>
          <div className="my-1">
            <span className={`text-2xl font-bold font-mono ${isCrisisActive ? 'text-red-300' : 'text-white'}`}>
              {demandVal}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1">kW</span>
          </div>
          <div className={`text-[10px] font-mono ${isCrisisActive ? 'text-red-400' : 'text-cyan-300'}`}>
            {isCrisisActive ? 'P1/P2 SHED' : `Crit: ${critVal} kW (100%)`}
          </div>
        </div>

        {/* 2. Solar PV Output */}
        <div className={`glass-panel rounded-2xl p-4 border flex flex-col justify-between ${isCrisisActive ? 'border-red-500/20 bg-red-950/5 opacity-60' : 'border-polaris-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">SOLAR ARRAY</span>
            <Sun className={`w-4 h-4 ${isCrisisActive ? 'text-slate-600' : 'text-amber-400'}`} />
          </div>
          <div className="my-1">
            <span className={`text-2xl font-bold font-mono ${isCrisisActive ? 'text-red-500 line-through' : 'text-amber-300'}`}>
              {solarVal}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1">kW</span>
          </div>
          <div className={`text-[10px] font-mono ${isCrisisActive ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
            {isCrisisActive ? '⚠ GEN FAILURE' : `Direct: ${state.solar_direct_kw} kW`}
          </div>
        </div>

        {/* 3. Battery Storage SoC */}
        <div className={`glass-panel rounded-2xl p-4 border flex flex-col justify-between ${isCrisisActive ? 'border-red-500/40 bg-red-950/20' : 'border-polaris-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">BATTERY SOC</span>
            <BatteryCharging className={`w-4 h-4 ${isCrisisActive ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
          </div>
          <div className="my-1">
            <span className={`text-2xl font-bold font-mono ${
              isCrisisActive ? 'text-red-400' : socVal < 35 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {socVal}%
            </span>
          </div>
          <div className={`text-[10px] font-mono ${isCrisisActive ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
            {isCrisisActive ? `DRAINING: ${battAvail} kWh` : `Avail: ${battAvail} kWh`}
          </div>
        </div>

        {/* 4. Diesel Fuel Tank */}
        <div className={`glass-panel rounded-2xl p-4 border flex flex-col justify-between ${isCrisisActive ? 'border-red-500/20 bg-red-950/5 opacity-60' : 'border-polaris-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">DIESEL RESERVE</span>
            <Fuel className={`w-4 h-4 ${isCrisisActive ? 'text-slate-600' : 'text-slate-400'}`} />
          </div>
          <div className="my-1">
            <span className={`text-2xl font-bold font-mono ${isCrisisActive ? 'text-slate-600' : 'text-slate-200'}`}>
              {state.diesel_fuel_liters}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1">L</span>
          </div>
          <div className={`text-[10px] font-mono ${isCrisisActive ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
            {isCrisisActive ? '⚠ GEN OFFLINE' : 'Arctic fuel mix (-50°C)'}
          </div>
        </div>

        {/* 5. Generator State */}
        <div className={`glass-panel rounded-2xl p-4 border flex flex-col justify-between transition-colors ${
          isCrisisActive
            ? 'border-red-500/30 bg-red-950/10'
            : isGenRunning ? 'border-amber-500/40 bg-amber-950/20' : 'border-polaris-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">GENERATOR</span>
            <Flame className={`w-4 h-4 ${
              isCrisisActive ? 'text-red-500' : isGenRunning ? 'text-amber-400 animate-pulse' : 'text-slate-500'
            }`} />
          </div>
          <div className="my-1">
            <span className={`text-2xl font-bold font-mono ${
              isCrisisActive ? 'text-red-500 line-through' : isGenRunning ? 'text-amber-300' : 'text-slate-400'
            }`}>
              {genVal}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1">kW</span>
          </div>
          <div className={`text-[10px] font-mono font-semibold ${
            isCrisisActive ? 'text-red-500' : isGenRunning ? 'text-amber-400' : 'text-slate-500'
          }`}>
            {isCrisisActive ? 'FAILED (OFFLINE)' : isGenRunning ? 'ACTIVE (SPINNING)' : 'STANDBY (OFF)'}
          </div>
        </div>

        {/* 6. Renewable Contribution */}
        <div className="glass-panel rounded-2xl p-4 border border-polaris-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              {isCrisisActive ? 'CRISIS STATUS' : 'RENEWABLE MIX'}
            </span>
            <Zap className={`w-4 h-4 ${isCrisisActive ? 'text-red-400' : 'text-cyan-400'}`} />
          </div>
          <div className="my-1">
            <span className={`text-2xl font-bold font-mono ${isCrisisActive ? 'text-red-400' : 'text-cyan-300'}`}>
              {isCrisisActive ? 'SOS' : `${state.renewable_contribution_pct}%`}
            </span>
          </div>
          <div className={`text-[10px] font-mono ${isCrisisActive ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
            {isCrisisActive ? 'MAYDAY ACTIVE' : `Critical: ${state.critical_load_coverage_pct}% Covered`}
          </div>
        </div>
      </div>
    </div>
  );
};
