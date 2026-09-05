import React, { useEffect, useRef } from 'react';
import {
  Sun,
  BatteryCharging,
  Fuel,
  Home,
  CloudSnow,
  Wind,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity
} from 'lucide-react';
import { SimulationTimestep, WeatherTelemetry } from '../types';

interface DigitalTwinProps {
  currentStep: SimulationTimestep | null;
  weather: WeatherTelemetry | null;
  scenarioName: string;
  isStorm: boolean;
  stationName: string;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({
  currentStep,
  weather,
  scenarioName,
  isStorm,
  stationName
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const solarKw = currentStep?.solar_total_kw ?? currentStep?.solar_kw ?? (currentStep ? (currentStep.solar_direct_kw || 0) + (currentStep.solar_to_battery_kw || 0) : 0);
  const battSoC = currentStep?.battery_soc_pct || 75;
  const isDischarging = (currentStep?.battery_discharge_kw || 0) > 0;
  const isCharging = (currentStep?.solar_charge_kw || currentStep?.solar_to_battery_kw || 0) > 0;
  const genKw = currentStep?.generator_kw || 0;
  const isGenActive = currentStep?.generator_active || genKw > 0;
  const demandKw = currentStep?.demand_kw || 120;
  const fuelRemaining = currentStep?.fuel_remaining_l || 1200;

  // Snow / Blizzard Particle Physics Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const particleCount = isStorm ? 220 : 60;
    const windSpeed = weather?.wind_speed_kmh || (isStorm ? 85 : 25);

    const particles: { x: number; y: number; radius: number; speedX: number; speedY: number; opacity: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * (isStorm ? 2.5 : 1.5) + 0.5,
        speedX: -(windSpeed / 18.0) - Math.random() * 2.0,
        speedY: Math.random() * (isStorm ? 4.0 : 2.0) + 1.0,
        opacity: Math.random() * 0.7 + 0.3
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Sky gradient backdrop based on storm / day / night
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isStorm) {
        skyGrad.addColorStop(0, '#090e1c');
        skyGrad.addColorStop(1, '#0e182e');
      } else if (weather?.is_day) {
        skyGrad.addColorStop(0, '#0c1a38');
        skyGrad.addColorStop(1, '#132c58');
      } else {
        skyGrad.addColorStop(0, '#03060d');
        skyGrad.addColorStop(1, '#080e1c');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Aurora Borealis / Australis Shimmer if clear night
      if (!isStorm && !weather?.is_day) {
        const aurora = ctx.createLinearGradient(0, 40, width, 140);
        aurora.addColorStop(0, 'rgba(6, 182, 212, 0.0)');
        aurora.addColorStop(0.5, 'rgba(16, 185, 129, 0.15)');
        aurora.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
        ctx.fillStyle = aurora;
        ctx.fillRect(0, 0, width, 200);
      }

      // Snow ground terrain
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height + 40, width * 0.65, 140, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ice shelf shading
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(width * 0.75, height + 20, width * 0.5, 90, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw active snow particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.y > height) {
          p.y = 0;
          p.x = Math.random() * width;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isStorm, weather]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-polaris-700/80 shadow-[0_12px_40px_rgba(0,0,0,0.6)] bg-polaris-950 min-h-[480px] flex flex-col justify-between">
      {/* Dynamic Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top HUD: Station ID & Weather Mode Banner */}
      <div className="relative z-20 p-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-b from-polaris-950/90 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400 tracking-wider">
              POLARIS DIGITAL TWIN • SIMULATED RUNTIME
            </div>
            <div className="text-base font-bold font-mono text-white flex items-center gap-2">
              {stationName}
              <span className="text-xs px-2 py-0.5 rounded-full bg-polaris-800 border border-polaris-700 text-slate-300">
                {scenarioName}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Badges */}
        <div className="flex items-center gap-2">
          {isStorm ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-mono font-bold animate-pulse">
              <CloudSnow className="w-4 h-4" />
              BLIZZARD CONDITIONS ({weather?.wind_speed_kmh || 85} km/h)
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-polaris-900/80 border border-polaris-700 text-slate-300 text-xs font-mono">
              <Wind className="w-4 h-4 text-cyan-400" />
              WIND: {weather?.wind_speed_kmh || 25} km/h • TEMP: {weather?.temperature_c || -18}°C
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            CRITICAL LOAD: 100%
          </div>
        </div>
      </div>

      {/* Main Digital Twin Visual Scene (SVG Subsystems on Antarctic Ice) */}
      <div className="relative z-10 w-full flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Subsystem 1: Solar Field */}
          <div className="relative group bg-polaris-900/85 backdrop-blur-md rounded-2xl p-4 border border-polaris-700 shadow-xl flex flex-col items-center">
            {/* Animated Glow on active */}
            {solarKw > 5 && (
              <div className="absolute -inset-0.5 rounded-2xl bg-amber-500/30 blur-sm animate-pulse pointer-events-none" />
            )}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-12 mb-2 relative flex items-center justify-center">
                {/* Solar Panel Array SVG */}
                <svg viewBox="0 0 64 48" className="w-full h-full drop-shadow-md">
                  <polygon
                    points="4,36 28,10 60,10 36,36"
                    fill={solarKw > 0 ? '#1e3a8a' : '#334155'}
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                  {/* Grid Lines */}
                  <line x1="20" y1="23" x2="48" y2="23" stroke="#06b6d4" strokeWidth="0.8" />
                  <line x1="32" y1="10" x2="16" y2="36" stroke="#06b6d4" strokeWidth="0.8" />
                  <line x1="46" y1="10" x2="26" y2="36" stroke="#06b6d4" strokeWidth="0.8" />
                  {/* Stilt posts */}
                  <line x1="12" y1="36" x2="12" y2="46" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="32" y1="36" x2="32" y2="46" stroke="#94a3b8" strokeWidth="2" />
                </svg>
              </div>
              <div className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                SOLAR ARRAY
              </div>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                {solarKw} <span className="text-xs font-normal text-slate-400">kW</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                {solarKw > 0 ? 'Active Photovoltaic' : 'Blackout / Sub-zero'}
              </div>
            </div>
          </div>

          {/* Subsystem 2: Battery Storage Bank (BESS) */}
          <div className="relative group bg-polaris-900/85 backdrop-blur-md rounded-2xl p-4 border border-polaris-700 shadow-xl flex flex-col items-center">
            {(isCharging || isDischarging) && (
              <div className="absolute -inset-0.5 rounded-2xl bg-emerald-500/30 blur-sm animate-pulse pointer-events-none" />
            )}
            <div className="relative z-10 flex flex-col items-center w-full">
              {/* Battery Container SVG */}
              <div className="w-14 h-12 mb-2 relative flex items-center justify-center">
                <div className="w-12 h-10 rounded-lg border-2 border-emerald-400/80 bg-polaris-950 p-1 flex flex-col justify-end relative shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  {/* Battery Terminal */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-emerald-400 rounded-t-sm" />
                  {/* Dynamic SoC Level Bar */}
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded transition-all duration-300"
                    style={{ height: `${battSoC}%` }}
                  />
                </div>
              </div>
              <div className="text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                BESS STORAGE
              </div>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                {battSoC}% <span className="text-xs font-normal text-slate-400">SoC</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                {isCharging ? 'Charging from Solar' : (isDischarging ? 'Discharging to Base' : 'Buffer Reserve')}
              </div>
            </div>
          </div>

          {/* Subsystem 3: Diesel Generator Module */}
          <div className="relative group bg-polaris-900/85 backdrop-blur-md rounded-2xl p-4 border border-polaris-700 shadow-xl flex flex-col items-center">
            {isGenActive && (
              <div className="absolute -inset-0.5 rounded-2xl bg-amber-500/40 blur-sm animate-pulse pointer-events-none" />
            )}
            <div className="relative z-10 flex flex-col items-center w-full">
              {/* Generator Engine SVG */}
              <div className={`w-14 h-12 mb-2 relative flex items-center justify-center ${isGenActive ? 'animate-bounce' : ''}`}>
                <svg viewBox="0 0 50 40" className="w-full h-full">
                  <rect x="5" y="10" width="40" height="26" rx="4" fill={isGenActive ? '#78350f' : '#1e293b'} stroke="#f59e0b" strokeWidth="1.5" />
                  <rect x="12" y="16" width="10" height="8" fill="#f59e0b" />
                  <circle cx="34" cy="23" r="5" fill="#f59e0b" opacity="0.8" />
                  {/* Exhaust Pipe & Smoke */}
                  <path d="M38 10 L38 4 L42 4" stroke="#94a3b8" strokeWidth="2" fill="none" />
                  {isGenActive && (
                    <circle cx="44" cy="2" r="2.5" fill="#f59e0b" className="animate-ping" />
                  )}
                </svg>
              </div>
              <div className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
                DIESEL GEN
              </div>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                {genKw} <span className="text-xs font-normal text-slate-400">kW</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">
                Fuel: {Math.round(fuelRemaining)} L remaining
              </div>
            </div>
          </div>

          {/* Subsystem 4: Polar Habitat & Science Station */}
          <div className="relative group bg-polaris-900/90 backdrop-blur-md rounded-2xl p-4 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex flex-col items-center">
            <div className="relative z-10 flex flex-col items-center w-full">
              {/* Habitat Building SVG on Stilts */}
              <div className="w-18 h-12 mb-2 relative flex items-center justify-center">
                <svg viewBox="0 0 70 45" className="w-full h-full">
                  {/* Stilts */}
                  <line x1="12" y1="28" x2="12" y2="42" stroke="#94a3b8" strokeWidth="2.5" />
                  <line x1="28" y1="28" x2="28" y2="42" stroke="#94a3b8" strokeWidth="2.5" />
                  <line x1="44" y1="28" x2="44" y2="42" stroke="#94a3b8" strokeWidth="2.5" />
                  <line x1="58" y1="28" x2="58" y2="42" stroke="#94a3b8" strokeWidth="2.5" />
                  {/* Main Aerodynamic Habitat Pod */}
                  <rect x="6" y="10" width="58" height="20" rx="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                  {/* Glowing Windows */}
                  <circle cx="16" cy="20" r="3" fill="#38bdf8" className="animate-pulse" />
                  <circle cx="28" cy="20" r="3" fill="#38bdf8" />
                  <circle cx="40" cy="20" r="3" fill="#38bdf8" />
                  <circle cx="52" cy="20" r="3" fill="#38bdf8" className="animate-pulse" />
                  {/* Observation Dome on top */}
                  <path d="M 28 10 A 8 8 0 0 1 42 10 Z" fill="#06b6d4" opacity="0.8" />
                  {/* SATCOM Dish */}
                  <path d="M 52 4 Q 56 1 60 6" stroke="#38bdf8" strokeWidth="2" fill="none" />
                  <line x1="56" y1="4" x2="56" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-cyan-400" />
                RESEARCH HABITAT
              </div>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                {demandKw} <span className="text-xs font-normal text-slate-400">kW</span>
              </div>
              <div className="text-[10px] font-mono text-emerald-400 mt-1">
                ● Life Support Protected
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="relative z-20 p-3 bg-polaris-950/90 border-t border-polaris-800/80 flex flex-wrap items-center justify-between text-xs font-mono gap-3">
        <div className="flex items-center gap-4 text-slate-400">
          <div>
            GENERATION: <span className="text-white font-bold">{Math.round(solarKw + genKw)} kW</span>
          </div>
          <div>
            DEMAND: <span className="text-white font-bold">{demandKw} kW</span>
          </div>
          <div>
            BATTERY: <span className="text-emerald-400 font-bold">{battSoC}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-semibold">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          Autonomous Multi-Agent Dispatch Active
        </div>
      </div>
    </div>
  );
};
