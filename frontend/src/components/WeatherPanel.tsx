import React from 'react';
import {
  Thermometer,
  Wind,
  Sun,
  Cloud,
  CloudSnow,
  AlertTriangle,
  Moon,
  Compass,
  Gauge
} from 'lucide-react';
import { WeatherTelemetry } from '../types';

interface WeatherPanelProps {
  weather: WeatherTelemetry | null;
  isLoading: boolean;
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({ weather, isLoading }) => {
  if (isLoading || !weather) {
    return (
      <div className="glass-panel rounded-2xl p-5 border border-polaris-800 animate-pulse">
        <div className="h-4 bg-polaris-700 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-16 bg-polaris-800/60 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const isStorm = weather.is_storm || weather.storm_probability_pct > 60;

  return (
    <div className={`glass-panel rounded-2xl p-5 border transition-all ${
      isStorm ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'border-polaris-800'
    }`}>
      {/* Title & Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
            LIVE ENVIRONMENTAL CONDITIONS
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {weather.is_day ? (
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
              <Sun className="w-3 h-3 text-amber-400" />
              POLAR DAYLIGHT
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30">
              <Moon className="w-3 h-3 text-blue-400" />
              POLAR NIGHT
            </span>
          )}

          {isStorm && (
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-500/40 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              STORM WARNING
            </span>
          )}
        </div>
      </div>

      {/* Grid of Weather Telemetry Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Temperature */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">TEMPERATURE</span>
            <span className="text-lg font-bold font-mono text-cyan-300">
              {weather.temperature_c > 0 ? `+${weather.temperature_c}` : weather.temperature_c}°C
            </span>
            <span className="text-[10px] font-mono text-slate-400 block">
              Feels: {weather.apparent_temperature_c}°C
            </span>
          </div>
          <Thermometer className="w-5 h-5 text-cyan-400 opacity-80" />
        </div>

        {/* Wind Speed & Direction */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">WIND SPEED</span>
            <span className="text-lg font-bold font-mono text-cyan-300">
              {weather.wind_speed_kmh} <span className="text-xs font-normal text-slate-400">km/h</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 block">
              Gusts: {weather.wind_gusts_kmh} km/h
            </span>
          </div>
          <Wind className="w-5 h-5 text-cyan-400 opacity-80" />
        </div>

        {/* Global Tilted Solar Irradiance (GTI) */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">SOLAR GTI (65° TILT)</span>
            <span className="text-lg font-bold font-mono text-amber-300">
              {weather.global_tilted_irradiance_wm2} <span className="text-xs font-normal text-slate-400">W/m²</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 block">
              DNI: {weather.direct_normal_irradiance_wm2} W/m²
            </span>
          </div>
          <Sun className="w-5 h-5 text-amber-400 opacity-80" />
        </div>

        {/* Storm Probability */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">STORM PROBABILITY</span>
            <span className={`text-lg font-bold font-mono ${
              weather.storm_probability_pct > 60 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {weather.storm_probability_pct}%
            </span>
            <span className="text-[10px] font-mono text-slate-400 block">
              Risk: {weather.storm_probability_pct > 60 ? 'HIGH' : 'STABLE'}
            </span>
          </div>
          <AlertTriangle className={`w-5 h-5 opacity-80 ${
            weather.storm_probability_pct > 60 ? 'text-rose-400' : 'text-emerald-400'
          }`} />
        </div>

        {/* Cloud Cover */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">CLOUD COVER</span>
            <span className="text-lg font-bold font-mono text-slate-200">
              {weather.cloud_cover_pct}%
            </span>
            <span className="text-[10px] font-mono text-slate-400 block">
              Diffuse: {weather.diffuse_radiation_wm2} W/m²
            </span>
          </div>
          <Cloud className="w-5 h-5 text-slate-400 opacity-80" />
        </div>

        {/* Snowfall */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">SNOWFALL</span>
            <span className="text-lg font-bold font-mono text-slate-200">
              {weather.snowfall_cm} <span className="text-xs font-normal text-slate-400">cm/h</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 block">
              Precip: {weather.precipitation_mm} mm
            </span>
          </div>
          <CloudSnow className="w-5 h-5 text-cyan-300 opacity-80" />
        </div>

        {/* Wind Direction */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">WIND BEARING</span>
            <span className="text-lg font-bold font-mono text-slate-200">
              {weather.wind_direction_deg}°
            </span>
            <span className="text-[10px] font-mono text-slate-400 block">
              Katabatic flow
            </span>
          </div>
          <Compass className="w-5 h-5 text-cyan-400 opacity-80" />
        </div>

        {/* Sunshine Duration */}
        <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">SUNSHINE / HR</span>
            <span className="text-lg font-bold font-mono text-slate-200">
              {Math.round(weather.sunshine_duration_s / 60)} <span className="text-xs font-normal text-slate-400">min</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 block">
              Albedo gain: +12%
            </span>
          </div>
          <Sun className="w-5 h-5 text-amber-300 opacity-80" />
        </div>
      </div>
    </div>
  );
};
