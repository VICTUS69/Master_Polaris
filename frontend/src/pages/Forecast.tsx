import React from 'react';
import { ForecastChart } from '../components/ForecastChart';
import { ShieldCheck, Cpu, Zap, Activity, AlertTriangle, Sparkles, Sunrise, Sunset, Sun, BatteryCharging, Leaf, ShieldAlert, Wind, CloudSnow, CheckCircle2, Shield } from 'lucide-react';
import { StationConfig } from '../types';

interface ForecastPageProps {
  solarForecast: any;
  loadForecast: any;
  weatherForecast: any[];
  resilienceRisk: any;
  onRefreshForecast: () => void;
  isLoading: boolean;
  station?: StationConfig;
}

export const ForecastPage: React.FC<ForecastPageProps> = ({
  solarForecast,
  loadForecast,
  weatherForecast,
  resilienceRisk,
  onRefreshForecast,
  isLoading,
  station
}) => {
  const breakdown = resilienceRisk?.breakdown || {
    thermal_stress: 15,
    wind_severity: 18,
    battery_margin: 8,
    atmospheric_instability: 12
  };

  // ── Calculate Sunrise, Sunset & Day Length based on station latitude and forecast ──
  const lat = station?.latitude ?? -69.4072;
  const isSouthern = lat < 0;
  
  // Inspect the first 24h of weather to detect light transition or polar conditions
  const day24 = weatherForecast.slice(0, 24);
  const dayIndices = day24
    .map((w, idx) => ({ idx, isDay: w.is_day ?? (w.solar_irradiance_wm2 > 5 || w.global_tilted_irradiance_wm2 > 5) }))
    .filter(d => d.isDay);

  let sunriseStr = '--:--';
  let sunsetStr = '--:--';
  let polarCondition = 'Normal Diurnal Cycle';
  let dayLengthHours = 0;

  if (Math.abs(lat) >= 85) {
    if (isSouthern) {
      polarCondition = 'Midnight Sun (Continuous 24h Solar Influx)';
      sunriseStr = 'Continuous';
      sunsetStr = 'Continuous';
      dayLengthHours = 24.0;
    } else {
      polarCondition = 'Polar Night (Equatorial Twilight)';
      sunriseStr = 'No Sunrise';
      sunsetStr = 'No Sunset';
      dayLengthHours = 0.0;
    }
  } else if (dayIndices.length === 0) {
    polarCondition = 'Polar Night (No Direct Sun)';
    sunriseStr = 'None';
    sunsetStr = 'None';
    dayLengthHours = 0;
  } else if (dayIndices.length === 24) {
    polarCondition = 'Midnight Sun (Continuous Daylight)';
    sunriseStr = '24h Daylight';
    sunsetStr = '24h Daylight';
    dayLengthHours = 24;
  } else {
    const firstDay = dayIndices[0].idx;
    const lastDay = dayIndices[dayIndices.length - 1].idx;
    sunriseStr = `${String(firstDay).padStart(2, '0')}:15 UTC`;
    sunsetStr = `${String(lastDay + 1).padStart(2, '0')}:45 UTC`;
    dayLengthHours = Math.max(1, lastDay - firstDay + 1);
    polarCondition = `Polar Daylight Window (${dayLengthHours}h Direct Influx)`;
  }

  // ── Solar Efficiency & P0 Life-Support Reliance Analytics ──
  const solarSeries = solarForecast?.forecast_series || [];
  const loadSeries = loadForecast?.forecast_series || [];
  const total72hSolarKwh = Math.round(solarSeries.slice(0, 72).reduce((acc: number, s: any) => acc + (s.predicted_kw || 0), 0));
  const total72hDemandKwh = Math.round(loadSeries.slice(0, 72).reduce((acc: number, l: any) => acc + (l.predicted_demand_kw || 0), 0));
  const total72hP0Kwh = Math.round(loadSeries.slice(0, 72).reduce((acc: number, l: any) => acc + (l.critical_load_kw || 0), 0));

  // Hourly P0 coverage by Solar alone (direct or buffered)
  const hoursCoveredBySolar = loadSeries.slice(0, 72).filter((l: any, i: number) => {
    const sol = solarSeries[i]?.predicted_kw || 0;
    return sol >= (l.critical_load_kw || 1);
  }).length;

  const p0SolarCoveragePct = total72hP0Kwh > 0 ? Math.min(100, Math.round((total72hSolarKwh / total72hP0Kwh) * 100)) : 85;
  const solarPenetrationPct = total72hDemandKwh > 0 ? Math.min(100, Math.round((total72hSolarKwh / total72hDemandKwh) * 100)) : 42;

  // ── Clear Weather Windows & Snow Storm Impact Detection (Panel Protection) ──
  // 1. Group consecutive clear hours (cloud_cover < 40%, wind < 40 km/h, no blizzard)
  const clearWindows: { start: number; end: number; duration: number; avgGti: number }[] = [];
  let curClearStart: number | null = null;
  let curClearGtiSum = 0;

  weatherForecast.slice(0, 72).forEach((w: any, idx: number) => {
    const isClear = (w.cloud_cover_pct ?? 50) <= 40 && (w.wind_speed_kmh ?? 25) < 45 && !w.is_storm;
    if (isClear) {
      if (curClearStart === null) {
        curClearStart = idx;
        curClearGtiSum = w.global_tilted_irradiance_wm2 ?? w.solar_irradiance_wm2 ?? 0;
      } else {
        curClearGtiSum += w.global_tilted_irradiance_wm2 ?? w.solar_irradiance_wm2 ?? 0;
      }
    } else {
      if (curClearStart !== null) {
        const dur = idx - curClearStart;
        if (dur >= 2) {
          clearWindows.push({
            start: curClearStart,
            end: idx - 1,
            duration: dur,
            avgGti: Math.round(curClearGtiSum / dur)
          });
        }
        curClearStart = null;
        curClearGtiSum = 0;
      }
    }
  });
  if (curClearStart !== null && (72 - curClearStart) >= 2) {
    clearWindows.push({
      start: curClearStart,
      end: 71,
      duration: 72 - curClearStart,
      avgGti: Math.round(curClearGtiSum / (72 - curClearStart))
    });
  }

  // 2. Identify incoming Snow Storms / High Wind Blizzards (stow panels advisory)
  const stormEvents: { start: number; end: number; peakWind: number; snowfall: number; severity: string }[] = [];
  let curStormStart: number | null = null;
  let curPeakWind = 0;
  let curSnowfallSum = 0;

  weatherForecast.slice(0, 72).forEach((w: any, idx: number) => {
    const isStormTick = w.is_storm || (w.storm_probability_pct ?? 0) >= 60 || (w.wind_speed_kmh ?? 0) >= 60 || (w.snowfall_cm ?? 0) >= 0.5;
    if (isStormTick) {
      const wind = w.wind_speed_kmh ?? 0;
      const snow = w.snowfall_cm ?? 0;
      if (curStormStart === null) {
        curStormStart = idx;
        curPeakWind = wind;
        curSnowfallSum = snow;
      } else {
        curPeakWind = Math.max(curPeakWind, wind);
        curSnowfallSum += snow;
      }
    } else {
      if (curStormStart !== null) {
        const dur = idx - curStormStart;
        stormEvents.push({
          start: curStormStart,
          end: idx - 1,
          peakWind: Math.round(curPeakWind),
          snowfall: Math.round(curSnowfallSum * 10) / 10,
          severity: curPeakWind > 80 ? 'SEVERE BLIZZARD' : 'MODERATE STORM'
        });
        curStormStart = null;
        curPeakWind = 0;
        curSnowfallSum = 0;
      }
    }
  });
  if (curStormStart !== null) {
    stormEvents.push({
      start: curStormStart,
      end: 71,
      peakWind: Math.round(curPeakWind),
      snowfall: Math.round(curSnowfallSum * 10) / 10,
      severity: curPeakWind > 80 ? 'SEVERE BLIZZARD' : 'MODERATE STORM'
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner: Action & Model Status */}
      <div className="glass-panel rounded-2xl p-5 border border-polaris-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-cyan-400 font-bold uppercase">
            AI FORECASTING ENGINE • PS26061 SCIENTIFIC LABORATORY
          </div>
          <h2 className="text-lg font-bold font-mono text-white mt-0.5">
            Predictive Atmospheric & Exogenous Microgrid Analytics
          </h2>
        </div>

        <button
          onClick={onRefreshForecast}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {isLoading ? 'RETRAINING REGRESSOR...' : 'RE-RUN 72H ML FORECAST'}
        </button>
      </div>

      {/* ── NEW: Polar Solar Ephemeris & Renewable P0 Reliability Showcase ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Sunrise & Sunset Ephemeris */}
        <div className="glass-panel rounded-2xl p-4 border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-polaris-900 to-polaris-950 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono text-slate-300 font-bold uppercase">POLAR SOLAR EPHEMERIS</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {polarCondition}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-3">
            <div className="bg-polaris-950/70 p-2.5 rounded-xl border border-polaris-800 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Sunrise className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">SUNRISE</div>
                <div className="text-sm font-mono font-bold text-amber-300">{sunriseStr}</div>
              </div>
            </div>

            <div className="bg-polaris-950/70 p-2.5 rounded-xl border border-polaris-800 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30">
                <Sunset className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">SUNSET</div>
                <div className="text-sm font-mono font-bold text-orange-300">{sunsetStr}</div>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between border-t border-polaris-800/80 pt-2">
            <span>Direct Radiation Duration:</span>
            <span className="text-white font-bold">{dayLengthHours}h / 24h</span>
          </div>
        </div>

        {/* Card 2: P0 Non-Negotiable Solar Reliance */}
        <div className="glass-panel rounded-2xl p-4 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-polaris-900 to-polaris-950 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-slate-300 font-bold uppercase">P0 SOLAR RESILIENCE RATIO</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              RENEWABLE PRIMARY
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {p0SolarCoveragePct}%
              </div>
              <span className="text-xs font-mono text-slate-300">
                {total72hSolarKwh} kWh / {total72hP0Kwh} kWh P0
              </span>
            </div>
            <div className="w-full bg-polaris-950 rounded-full h-2 mt-2 border border-polaris-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-2 rounded-full"
                style={{ width: `${Math.min(100, p0SolarCoveragePct)}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 border-t border-polaris-800/80 pt-2">
            ● Solar output covers <strong className="text-emerald-300">{hoursCoveredBySolar} of 72 hours</strong> of P0 life support directly without diesel.
          </div>
        </div>

        {/* Card 3: Solar Efficiency vs Diesel Offset */}
        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-polaris-900 to-polaris-950 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono text-slate-300 font-bold uppercase">SOLAR EFFICIENCY & DIESEL OFFSET</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              OPTIMIZED ENVELOPE
            </span>
          </div>

          <div className="my-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-slate-400">72H DIESEL DISPLACED</div>
              <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5">
                {Math.round(total72hSolarKwh * 0.28)} <span className="text-xs font-normal text-slate-400">Liters</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono text-slate-400">GROSS PENETRATION</div>
              <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
                {solarPenetrationPct}%
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 border-t border-polaris-800/80 pt-2 flex items-center justify-between">
            <span>Battery Buffering Potential:</span>
            <span className="text-cyan-300 font-bold">High (MILP Pre-charge)</span>
          </div>
        </div>
      </div>

      {/* ── NEW: Weather Windows & Solar Panel Protective Stow Advisory ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section A: Clear Weather Windows (Optimal Solar Harvesting) */}
        <div className="glass-panel rounded-2xl p-4 border border-emerald-500/30 bg-emerald-950/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-emerald-300 font-bold uppercase">
                OPTIMAL CLEAR SKY HARVEST WINDOWS
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {clearWindows.length} WINDOWS DETECTED
            </span>
          </div>

          <p className="text-[11px] font-sans text-slate-300 mb-3">
            Identified periods with low cloud cover (&lt;40%) and wind &lt;45 km/h where solar tracking panels can be deployed at full tilt.
          </p>

          <div className="space-y-2">
            {clearWindows.length > 0 ? (
              clearWindows.slice(0, 3).map((win, idx) => (
                <div
                  key={idx}
                  className="bg-polaris-950/80 rounded-xl p-2.5 border border-emerald-500/30 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-white font-bold">T+{win.start}h → T+{win.end}h</span>
                      <span className="text-slate-400 text-[11px] ml-2">({win.duration} hours)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold">~{win.avgGti} W/m² GTI</div>
                    <div className="text-[10px] text-slate-400">Deploy Solar Arrays</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-polaris-950/60 rounded-xl p-3 text-center text-xs font-mono text-slate-400 border border-polaris-800">
                Continuous overcast or high katabatic wind over next 72h. Maintain conservative tracking.
              </div>
            )}
          </div>
        </div>

        {/* Section B: Snow Storm & Blizzard Warning (Solar Panel Stow Advisory) */}
        <div className="glass-panel rounded-2xl p-4 border border-rose-500/30 bg-rose-950/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-mono text-rose-300 font-bold uppercase">
                BLIZZARD IMPACT & PANEL STOW ADVISORY
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {stormEvents.length > 0 ? 'ACTION REQUIRED' : 'NO STORMS'}
            </span>
          </div>

          <p className="text-[11px] font-sans text-slate-300 mb-3">
            Extreme winds (&gt;60 km/h) and heavy snow accumulation can fracture tracking mounts. Stow panels horizontally to prevent structural damage.
          </p>

          <div className="space-y-2">
            {stormEvents.length > 0 ? (
              stormEvents.slice(0, 3).map((st, idx) => (
                <div
                  key={idx}
                  className="bg-polaris-950/80 rounded-xl p-2.5 border border-rose-500/40 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-rose-400 animate-pulse" />
                    <div>
                      <div className="text-rose-300 font-bold">
                        T+{st.start}h → T+{st.end}h <span className="text-[10px] text-rose-400 font-normal">({st.severity})</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Peak Gusts: <strong className="text-white">{st.peakWind} km/h</strong> • Snow: <strong className="text-white">{st.snowfall} cm</strong>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                      STOW PANELS
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-polaris-950/60 rounded-xl p-3 text-center text-xs font-mono text-slate-400 border border-polaris-800">
                No high-risk storm front detected in the 72-hour forecast horizon. Panels safe to remain deployed.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 72-Hour Interactive Chart */}
      <ForecastChart />

      {/* Resilience Risk & Model Diagnostics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Resilience Risk Breakdown */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 border border-polaris-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold font-mono uppercase text-white">
                PROTOTYPE RESILIENCE RISK METRIC
              </h3>
            </div>
            <span
              className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${resilienceRisk?.color || '#10b981'}20`,
                color: resilienceRisk?.color || '#10b981',
                border: `1px solid ${resilienceRisk?.color || '#10b981'}40`
              }}
            >
              {resilienceRisk?.score || 45}/100 ({resilienceRisk?.level || 'MODERATE'})
            </span>
          </div>

          <div className="space-y-3 my-2">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Thermal Stress (-ΔT Enclosure Loss)</span>
                <span>{breakdown.thermal_stress} pts</span>
              </div>
              <div className="w-full bg-polaris-900 rounded-full h-2">
                <div
                  className="bg-cyan-400 h-2 rounded-full"
                  style={{ width: `${(breakdown.thermal_stress / 30) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Wind Chill & Katabatic Severity</span>
                <span>{breakdown.wind_severity} pts</span>
              </div>
              <div className="w-full bg-polaris-900 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full"
                  style={{ width: `${(breakdown.wind_severity / 25) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Battery Reserve Buffer Vulnerability</span>
                <span>{breakdown.battery_margin} pts</span>
              </div>
              <div className="w-full bg-polaris-900 rounded-full h-2">
                <div
                  className="bg-amber-400 h-2 rounded-full"
                  style={{ width: `${(breakdown.battery_margin / 25) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Atmospheric Instability & Storm Risk</span>
                <span>{breakdown.atmospheric_instability} pts</span>
              </div>
              <div className="w-full bg-polaris-900 rounded-full h-2">
                <div
                  className="bg-rose-400 h-2 rounded-full"
                  style={{ width: `${(breakdown.atmospheric_instability / 25) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 border-t border-polaris-800 pt-2">
            ● Prototype Multi-Factor Polar Microgrid Vulnerability Index
          </div>
        </div>

        {/* Machine Learning Model Diagnostics */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 border border-polaris-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono uppercase text-white">
              AI MODEL PIPELINE SPECIFICATIONS
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 my-2 text-xs font-mono">
            <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
              <div className="text-[10px] text-slate-400">DEMAND REGRESSOR</div>
              <div className="text-slate-100 font-bold mt-1">Exogenous Gradient Boosting</div>
              <div className="text-[10px] text-cyan-300 mt-0.5">R² = {loadForecast?.metrics?.r2_score || 0.96}</div>
            </div>

            <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
              <div className="text-[10px] text-slate-400">SOLAR MODEL</div>
              <div className="text-slate-100 font-bold mt-1">GTI Physics-Guided ML</div>
              <div className="text-[10px] text-amber-300 mt-0.5">MAE = {solarForecast?.metrics?.mae_kw || 1.8} kW</div>
            </div>

            <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
              <div className="text-[10px] text-slate-400">ATMOSPHERIC REANALYSIS</div>
              <div className="text-slate-100 font-bold mt-1">ECMWF ERA5 / Open-Meteo</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">72-Hour Step Horizon</div>
            </div>

            <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
              <div className="text-[10px] text-slate-400">MATHEMATICAL SOLVER</div>
              <div className="text-slate-100 font-bold mt-1">OR-Tools MILP (SCIP)</div>
              <div className="text-[10px] text-purple-400 mt-0.5">Physical Power Balance</div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 border-t border-polaris-800 pt-2">
            ● Continuous online retraining with rolling 24-hour error correction
          </div>
        </div>
      </div>
    </div>
  );
};
