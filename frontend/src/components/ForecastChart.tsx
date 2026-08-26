import React, { useState } from 'react';
import { BarChart3, Activity, Sun, Battery, Thermometer, Wind } from 'lucide-react';
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

interface ForecastChartProps {
  solarForecast: any;
  loadForecast: any;
  weatherForecast: any[];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  solarForecast,
  loadForecast,
  weatherForecast
}) => {
  const [activeChart, setActiveChart] = useState<'demand' | 'solar' | 'weather'>('demand');

  const loadSeries = loadForecast?.forecast_series || [];
  const solarSeries = solarForecast?.forecast_series || [];

  const combinedData = loadSeries.slice(0, 72).map((item: any, i: number) => {
    const s = solarSeries[i] || {};
    const w = weatherForecast[i] || {};
    return {
      hour: `T+${i}h`,
      predicted_demand: item.predicted_demand_kw,
      actual_demand: item.simulated_actual_kw,
      critical_demand: item.critical_load_kw,
      lower_demand: item.lower_bound_kw,
      upper_demand: item.upper_bound_kw,
      predicted_solar: s.predicted_kw || 0,
      actual_solar: s.simulated_actual_kw || 0,
      temperature: w.temperature_c || item.temperature_c || -18,
      wind_speed: w.wind_speed_kmh || 30
    };
  });

  return (
    <div className="glass-panel rounded-2xl p-5 border border-polaris-800 flex flex-col gap-4">
      {/* Tab Switcher for Forecast Modes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
            72-HOUR MULTI-HORIZON AI FORECAST LAB
          </h2>
        </div>

        <div className="flex items-center bg-polaris-900 rounded-xl p-1 border border-polaris-700">
          <button
            onClick={() => setActiveChart('demand')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeChart === 'demand'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DEMAND LOAD
          </button>
          <button
            onClick={() => setActiveChart('solar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeChart === 'solar'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SOLAR GENERATION
          </button>
          <button
            onClick={() => setActiveChart('weather')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeChart === 'weather'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            WEATHER VARIABLES
          </button>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="h-72 w-full bg-polaris-950/70 rounded-xl p-3 border border-polaris-800/80">
        <ResponsiveContainer width="100%" height="100%">
          {activeChart === 'demand' ? (
            <AreaChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} unit=" kW" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Area
                type="monotone"
                dataKey="upper_demand"
                name="Confidence Upper Band"
                stroke="#0284c7"
                fill="#0284c7"
                fillOpacity={0.1}
              />
              <Area
                type="monotone"
                dataKey="critical_demand"
                name="Critical Non-Negotiable Load"
                stroke="#f43f5e"
                fill="#f43f5e"
                fillOpacity={0.15}
              />
              <Line
                type="monotone"
                dataKey="predicted_demand"
                name="AI Predicted Demand (kW)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actual_demand"
                name="Simulated Actual Telemetry (kW)"
                stroke="#a855f7"
                strokeDasharray="3 3"
                strokeWidth={1.8}
                dot={false}
              />
            </AreaChart>
          ) : activeChart === 'solar' ? (
            <AreaChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} unit=" kW" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Area
                type="monotone"
                dataKey="predicted_solar"
                name="AI Predicted Solar PV (kW)"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.25}
                strokeWidth={2.5}
              />
              <Line
                type="monotone"
                dataKey="actual_solar"
                name="Simulated Actual Solar (kW)"
                stroke="#10b981"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          ) : (
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 10, fill: '#38bdf8' }} unit="°C" />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 10, fill: '#f59e0b' }} unit=" km/h" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temperature"
                name="Ambient Temperature (°C)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="wind_speed"
                name="Wind Speed (km/h)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Model Horizon KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
          <div className="text-[10px] font-mono text-slate-400">1-HOUR FORECAST</div>
          <div className="text-sm font-bold font-mono text-white mt-1">
            Dem: {loadForecast?.horizon_predictions?.['1h_demand_kw'] || 120} kW
          </div>
          <div className="text-[10px] font-mono text-amber-400">
            Sol: {solarForecast?.horizon_predictions?.['1h_solar_kw'] || 45} kW
          </div>
        </div>

        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
          <div className="text-[10px] font-mono text-slate-400">6-HOUR FORECAST</div>
          <div className="text-sm font-bold font-mono text-white mt-1">
            Dem: {loadForecast?.horizon_predictions?.['6h_demand_kw'] || 135} kW
          </div>
          <div className="text-[10px] font-mono text-amber-400">
            Sol: {solarForecast?.horizon_predictions?.['6h_solar_kw'] || 80} kW
          </div>
        </div>

        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
          <div className="text-[10px] font-mono text-slate-400">24-HOUR FORECAST</div>
          <div className="text-sm font-bold font-mono text-white mt-1">
            Dem: {loadForecast?.horizon_predictions?.['24h_demand_kw'] || 125} kW
          </div>
          <div className="text-[10px] font-mono text-amber-400">
            Sol: {solarForecast?.horizon_predictions?.['24h_solar_kw'] || 30} kW
          </div>
        </div>

        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
          <div className="text-[10px] font-mono text-slate-400">72-HOUR TOTALS</div>
          <div className="text-sm font-bold font-mono text-white mt-1">
            {loadForecast?.horizon_predictions?.['total_72h_demand_kwh'] || 8600} kWh
          </div>
          <div className="text-[10px] font-mono text-cyan-400">
            MAPE Error: {loadForecast?.metrics?.mape_pct || 3.8}%
          </div>
        </div>
      </div>
    </div>
  );
};
