import React, { useEffect, useCallback } from 'react';
import { Wind, TrendingDown, Clock, Layers, BarChart4 } from 'lucide-react';
import { usePolarisStore } from '../store/usePolarisStore';
import { MathInspectorPanel } from './MathInspectorPanel';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
} from 'recharts';

// ── Color System (Dark-Mode Command Center) ─────────────────────────────────
const COLORS = {
  baseline:       '#6b7280',  // Dashed grey — legacy SCADA
  aiP50:          '#22d3ee',  // Solid cyan — POLARIS AI expected
  envelope:       '#22d3ee',  // Glowing cyan envelope (P10–P90)
  genLimit:       '#ef4444',  // Solid red — generator physical limit
  heatP0:         '#ef4444',  // Red — P0 Habitat Heating
  jacketP1:       '#f97316',  // Orange — P1 Battery Thermal Jacket
  scienceP2:      '#3b82f6',  // Blue — P2 Deferrable Science
  lifeSupportP0:  '#10b981',  // Emerald — Life Support base
  gridLines:      '#1e293b',
  axisText:       '#64748b',
  tooltipBg:      '#0f172a',
  tooltipBorder:  '#334155',
};

export const ForecastChart: React.FC = () => {
  const {
    loadAnalysis,
    fetchLoadAnalysis,
    hoveredHour,
    setHoveredHour,
    setSelectedHour,
  } = usePolarisStore();

  useEffect(() => {
    if (!loadAnalysis) {
      fetchLoadAnalysis();
    }
  }, [loadAnalysis, fetchLoadAnalysis]);

  // ── Hover handler: wire Recharts onMouseMove to Zustand ────────────────
  const handleMouseMove = useCallback((state: any) => {
    if (state && state.activeTooltipIndex !== undefined) {
      setHoveredHour(state.activeTooltipIndex);
    }
  }, [setHoveredHour]);

  const handleMouseLeave = useCallback(() => {
    setHoveredHour(null);
  }, [setHoveredHour]);

  // ── Click handler: wire Recharts onClick to toggle Inspector ───────────
  const handleClick = useCallback((state: any) => {
    if (state && state.activeTooltipIndex !== undefined) {
      setSelectedHour(state.activeTooltipIndex);
    }
  }, [setSelectedHour]);

  if (!loadAnalysis) {
    return (
      <div className="glass-panel rounded-2xl p-5 border border-polaris-800 flex items-center justify-center h-96">
        <div className="text-cyan-400 font-mono animate-pulse">
          TRAINING XGBOOST SURROGATE MODELS ON 15K KATABATIC EDGE-CASES...
        </div>
      </div>
    );
  }

  const data = loadAnalysis.series;
  const kpis = loadAnalysis.kpis;
  const genCap = loadAnalysis.generator_capacity_kw;

  // ── Compute per-hour KPI values for hover, or aggregate for idle ──────
  const activeFrame = hoveredHour !== null && hoveredHour < data.length
    ? data[hoveredHour]
    : null;

  // Wind-chill penalty: per-hour infiltration component, or worst-case aggregate
  const displayWindPenalty = activeFrame
    ? +(0.012 * activeFrame.wind_kmh * Math.max(0, 20 - activeFrame.temperature_c)).toFixed(1)
    : kpis.wind_chill_penalty_kw;

  // Forecast error reduction: aggregate only (per-hour doesn't make sense)
  const displayErrorReduction = kpis.forecast_error_reduction_pct;

  // Thermal inertia lag: constant physical property
  const displayThermalLag = kpis.thermal_inertia_lag_hours;

  const tooltipStyle = {
    contentStyle: { backgroundColor: COLORS.tooltipBg, borderColor: COLORS.tooltipBorder, borderRadius: '8px' },
    labelStyle: { color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' },
  };

  return (
    <>
      <MathInspectorPanel />
      <div className="glass-panel rounded-2xl p-5 border border-polaris-800 flex flex-col gap-6 relative">
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart4 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
              AI LOAD FORECASTING ENGINE — XGBOOST + THERMAL CONVECTION PHYSICS
            </h2>
          </div>
          <div className="text-[10px] font-mono text-slate-400 tracking-widest uppercase animate-pulse">
            CLICK ANY POINT TO INSPECT MATH
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 1: THE COMPARATIVE DEMAND & UNCERTAINTY MATRIX
            Dominates upper half. Grey baseline, cyan P50, cyan envelope, red 250kW limit.
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-mono font-bold tracking-widest text-slate-400">
            ZONE 1 — COMPARATIVE DEMAND & UNCERTAINTY MATRIX
          </h3>
          <div className="h-80 w-full bg-polaris-950/70 rounded-xl p-3 border border-polaris-800/80 cursor-crosshair">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLines} />
                <XAxis dataKey="hour" stroke={COLORS.axisText} tick={{ fontSize: 10, fill: COLORS.axisText }} />
                <YAxis stroke={COLORS.axisText} tick={{ fontSize: 10, fill: COLORS.axisText }} unit=" kW" />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />

                {/* Generator physical capacity limit — solid red line */}
                <ReferenceLine
                  y={genCap}
                  stroke={COLORS.genLimit}
                  strokeWidth={2}
                  strokeDasharray=""
                  label={{
                    value: `GEN LIMIT ${genCap} kW`,
                    position: 'right',
                    fill: COLORS.genLimit,
                    fontSize: 10,
                    fontFamily: 'monospace',
                  }}
                />

                {/* P90 upper confidence bound (glowing cyan envelope top) */}
                <Area
                  type="monotone"
                  dataKey="ai_p90_kw"
                  name="P90 Upper Bound"
                  stroke="none"
                  fill={COLORS.envelope}
                  fillOpacity={0.12}
                />
                {/* P10 lower bound — masks out below to create band illusion */}
                <Area
                  type="monotone"
                  dataKey="ai_p10_kw"
                  name="P10 Lower Bound"
                  stroke="none"
                  fill="#0a0f1a"
                  fillOpacity={0.9}
                />

                {/* AI P50 — solid cyan prediction line */}
                <Line
                  type="monotone"
                  dataKey="ai_p50_kw"
                  name="POLARIS AI (P₅₀ Expected)"
                  stroke={COLORS.aiP50}
                  strokeWidth={2.5}
                  dot={false}
                />

                {/* Legacy SCADA baseline — dashed grey */}
                <Line
                  type="monotone"
                  dataKey="baseline_kw"
                  name="Legacy SCADA (6h Rolling Avg)"
                  stroke={COLORS.baseline}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 2: STACKED SUBSYSTEM LOAD DECOMPOSITION
            Sedimentary area layers: red heating → orange jacket → blue science
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold tracking-widest text-slate-400">
              ZONE 2 — SUBSYSTEM LOAD DECOMPOSITION (THERMAL PHYSICS)
            </h3>
          </div>
          <div className="h-56 w-full bg-polaris-950/70 rounded-xl p-3 border border-polaris-800/80 cursor-crosshair">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={data} 
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLines} />
                <XAxis dataKey="hour" stroke={COLORS.axisText} tick={{ fontSize: 10, fill: COLORS.axisText }} />
                <YAxis stroke={COLORS.axisText} tick={{ fontSize: 10, fill: COLORS.axisText }} unit=" kW" />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />

                {/* Bottom sediment: Life Support (emerald) — constant base */}
                <Area
                  type="monotone"
                  dataKey="life_support_kw"
                  name="P0 Life Support"
                  stackId="load"
                  stroke={COLORS.lifeSupportP0}
                  fill={COLORS.lifeSupportP0}
                  fillOpacity={0.7}
                />
                {/* P0 Habitat Heating (red) — balloons as temperature drops */}
                <Area
                  type="monotone"
                  dataKey="habitat_heating_kw"
                  name="P0 Habitat Heating (Q = U·A·ΔT)"
                  stackId="load"
                  stroke={COLORS.heatP0}
                  fill={COLORS.heatP0}
                  fillOpacity={0.65}
                />
                {/* P1 Battery Thermal Jacket (orange) — parasitic below -20°C */}
                <Area
                  type="monotone"
                  dataKey="battery_jacket_kw"
                  name="P1 Battery Jacket (T < -20°C)"
                  stackId="load"
                  stroke={COLORS.jacketP1}
                  fill={COLORS.jacketP1}
                  fillOpacity={0.6}
                />
                {/* P2 Deferrable Science (blue) — top layer, first to shed */}
                <Area
                  type="monotone"
                  dataKey="science_labs_kw"
                  name="P2 Science & Compute (Deferrable)"
                  stackId="load"
                  stroke={COLORS.scienceP2}
                  fill={COLORS.scienceP2}
                  fillOpacity={0.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 3: FEATURE ATTRIBUTION KPI STRIP
            Hover-linked telemetry cards. Updates from hoveredHour via Zustand.
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-mono font-bold tracking-widest text-slate-400">
            ZONE 3 — FEATURE ATTRIBUTION & EXPLAINABILITY
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Wind-Chill Penalty */}
            <div className="bg-polaris-900/90 rounded-xl p-4 border border-polaris-800 flex items-center gap-3 transition-all">
              <Wind className="w-9 h-9 text-blue-400 p-2 bg-blue-400/10 rounded-lg flex-shrink-0" />
              <div>
                <div className="text-[10px] font-mono text-slate-400 tracking-wider">WIND-CHILL PENALTY</div>
                <div className="text-xl font-bold font-mono text-white">
                  +{displayWindPenalty} kW
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  {activeFrame ? `T+${hoveredHour}h · ${activeFrame.wind_kmh} km/h · ${activeFrame.temperature_c}°C` : 'Aggregate worst-case'}
                </div>
              </div>
            </div>

            {/* Forecast Error Reduction */}
            <div className="bg-polaris-900/90 rounded-xl p-4 border border-polaris-800 flex items-center gap-3 transition-all">
              <TrendingDown className="w-9 h-9 text-emerald-400 p-2 bg-emerald-400/10 rounded-lg flex-shrink-0" />
              <div>
                <div className="text-[10px] font-mono text-slate-400 tracking-wider">FORECAST ERROR REDUCTION</div>
                <div className="text-xl font-bold font-mono text-white">
                  {displayErrorReduction}%
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  AI MAE vs. Legacy SCADA MAE
                </div>
              </div>
            </div>

            {/* Thermal Inertia Lag */}
            <div className="bg-polaris-900/90 rounded-xl p-4 border border-polaris-800 flex items-center gap-3 transition-all">
              <Clock className="w-9 h-9 text-rose-400 p-2 bg-rose-400/10 rounded-lg flex-shrink-0" />
              <div>
                <div className="text-[10px] font-mono text-slate-400 tracking-wider">THERMAL INERTIA LAG</div>
                <div className="text-xl font-bold font-mono text-white">
                  {displayThermalLag}h
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  τ = (M·Cₚ) / (U·A) — Cold penetration delay
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
