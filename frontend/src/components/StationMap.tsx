import React from 'react';
import { MapPin, Navigation, Globe, RefreshCw, Radio } from 'lucide-react';

interface StationMapProps {
  latitude: number;
  longitude: number;
  onCoordinatesChange: (lat: number, lon: number) => void;
  onFetchLiveWeather: () => void;
  isLoadingWeather: boolean;
  stationName: string;
  region?: string;
  sourceLabel?: string;
}

export const StationMap: React.FC<StationMapProps> = ({
  latitude,
  longitude,
  onCoordinatesChange,
  onFetchLiveWeather,
  isLoadingWeather,
  stationName,
  region,
  sourceLabel
}) => {
  // Convert lat/lon to polar SVG coordinate projection
  // In Antarctica projection: South pole (-90) is center (150, 150), edge is lat -60
  const isSouthern = latitude < 0;
  const normalizedLat = isSouthern ? Math.abs(latitude) : latitude;
  const radius = Math.max(10, Math.min(130, ((90 - normalizedLat) / 30) * 110));
  const angleRad = (longitude * Math.PI) / 180;
  const pinX = 150 + radius * Math.sin(angleRad);
  const pinY = 150 - radius * Math.cos(angleRad);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-polaris-800 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
            STATION LOCATION & TELEMETRY UPLINK
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
          {region || (isSouthern ? 'Antarctic Polar Domain' : 'Arctic Polar Domain')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Polar Projection Mini-Radar Visualizer */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-48 h-48 rounded-full bg-polaris-900 border border-cyan-500/30 shadow-[inset_0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-center overflow-hidden">
            {/* Concentric Polar Circles */}
            <div className="absolute w-40 h-40 rounded-full border border-dashed border-cyan-500/20" />
            <div className="absolute w-28 h-28 rounded-full border border-cyan-500/25" />
            <div className="absolute w-16 h-16 rounded-full border border-cyan-500/30" />

            {/* Radar Crosshairs */}
            <div className="absolute w-full h-[1px] bg-cyan-500/20" />
            <div className="absolute h-full w-[1px] bg-cyan-500/20" />

            {/* Polar Center Label */}
            <div className="absolute text-[9px] font-mono text-cyan-500/50 bottom-2">
              {isSouthern ? 'SOUTH POLE 90°S' : 'NORTH POLE 90°N'}
            </div>

            {/* Sweeping Radar Line */}
            <div className="absolute w-24 h-[1px] bg-gradient-to-r from-cyan-400 to-transparent top-1/2 left-1/2 origin-left animate-spin-slow" />

            {/* Station Pin Indicator */}
            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
              style={{ left: `${pinX / 3}%`, top: `${pinY / 3}%` }}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute w-6 h-6 rounded-full bg-cyan-400/30 animate-ping" />
                <span className="w-3 h-3 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_8px_#06b6d4]" />
              </div>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-2 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            GPS Fix: <span className="text-slate-200 font-semibold">{stationName}</span>
          </div>
        </div>

        {/* Coordinate Inputs & Live Fetch Action */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                LATITUDE (°N/S)
              </label>
              <input
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                value={latitude}
                onChange={(e) => onCoordinatesChange(parseFloat(e.target.value) || 0, longitude)}
                className="w-full bg-polaris-900 border border-polaris-700 text-cyan-300 font-mono text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                LONGITUDE (°E/W)
              </label>
              <input
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                value={longitude}
                onChange={(e) => onCoordinatesChange(latitude, parseFloat(e.target.value) || 0)}
                className="w-full bg-polaris-900 border border-polaris-700 text-cyan-300 font-mono text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>

          {/* Quick Presets Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">QUICK PRESETS:</span>
            <button
              onClick={() => onCoordinatesChange(-69.4072, 76.1872)}
              className="text-[10px] font-mono px-2 py-1 rounded bg-polaris-800 hover:bg-polaris-700 text-slate-300 border border-polaris-700 hover:border-cyan-500/50 transition-colors"
            >
              Bharati (-69.40°, 76.18°)
            </button>
            <button
              onClick={() => onCoordinatesChange(-70.7667, 11.7333)}
              className="text-[10px] font-mono px-2 py-1 rounded bg-polaris-800 hover:bg-polaris-700 text-slate-300 border border-polaris-700 hover:border-cyan-500/50 transition-colors"
            >
              Maitri (-70.76°, 11.73°)
            </button>
            <button
              onClick={() => onCoordinatesChange(78.9244, 11.9306)}
              className="text-[10px] font-mono px-2 py-1 rounded bg-polaris-800 hover:bg-polaris-700 text-slate-300 border border-polaris-700 hover:border-cyan-500/50 transition-colors"
            >
              Svalbard Arctic (78.92°, 11.93°)
            </button>
          </div>

          {/* Fetch Live Atmospheric Conditions Button */}
          <button
            onClick={onFetchLiveWeather}
            disabled={isLoadingWeather}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-mono text-xs font-bold tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingWeather ? 'animate-spin' : ''}`} />
            {isLoadingWeather ? 'SYNCING OPEN-METEO TELEMETRY...' : 'FETCH LIVE CONDITIONS'}
          </button>

          {sourceLabel && (
            <div className="text-[10px] font-mono text-slate-400 text-center tracking-tight">
              ● Source: <span className="text-cyan-300">{sourceLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
