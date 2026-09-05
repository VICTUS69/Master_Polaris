import React from 'react';
import { MapPin, Navigation, Globe, RefreshCw, Radio, Compass } from 'lucide-react';

interface StationMapProps {
  latitude: number;
  longitude: number;
  onCoordinatesChange: (lat: number, lon: number) => void;
  onFetchLiveWeather: () => void;
  isLoadingWeather: boolean;
  stationName: string;
  region?: string;
  sourceLabel?: string;
  onSelectStationPreset?: (stationId: string) => void;
}

export const StationMap: React.FC<StationMapProps> = ({
  latitude,
  longitude,
  onCoordinatesChange,
  onFetchLiveWeather,
  isLoadingWeather,
  stationName,
  region,
  sourceLabel,
  onSelectStationPreset
}) => {
  // Convert lat/lon to polar SVG coordinate projection
  // In Antarctica projection: South pole (-90) is center (150, 150), edge is lat -60
  const isSouthern = latitude < 0;
  const normalizedLat = isSouthern ? Math.abs(latitude) : latitude;
  const radius = Math.max(8, Math.min(130, ((90 - normalizedLat) / 30) * 110));
  const angleRad = (longitude * Math.PI) / 180;
  const pinX = 150 + radius * Math.sin(angleRad);
  const pinY = 150 - radius * Math.cos(angleRad);

  // Deflection calculations
  const bearingDeg = Math.round((angleRad * 180 / Math.PI + 360) % 360);
  const deflectionPct = Math.round((radius / 130) * 100);
  const distanceKm = Math.round((90 - normalizedLat) * 111.1);

  const handlePresetClick = (stationId: string, lat: number, lon: number) => {
    if (onSelectStationPreset) {
      onSelectStationPreset(stationId);
    } else {
      onCoordinatesChange(lat, lon);
    }
  };

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

            {/* Vector Deflection Line from Center Pole to Station Pin */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <line
                x1="50%"
                y1="50%"
                x2={`${pinX / 3}%`}
                y2={`${pinY / 3}%`}
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                strokeOpacity="0.75"
                className="transition-all duration-700 ease-out"
              />
              {/* Radial circle for current deflection radius */}
              <circle
                cx="50%"
                cy="50%"
                r={`${radius / 3}%`}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1"
                strokeOpacity="0.25"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Polar Center Point */}
            <div className="absolute w-2 h-2 rounded-full bg-cyan-500/60 border border-cyan-300/80 z-0" />

            {/* Polar Center Label */}
            <div className="absolute text-[8px] font-mono text-cyan-400/60 bottom-1.5 tracking-wider">
              {isSouthern ? 'SOUTH POLE 90°S' : 'NORTH POLE 90°N'}
            </div>

            {/* Sweeping Radar Scanner Line */}
            <div className="absolute w-24 h-[1px] bg-gradient-to-r from-cyan-400 to-transparent top-1/2 left-1/2 origin-left animate-spin-slow pointer-events-none" />

            {/* Station Pin Indicator with Deflection Motion */}
            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
              style={{ left: `${pinX / 3}%`, top: `${pinY / 3}%` }}
            >
              <div className="relative flex items-center justify-center">
                {/* Outward Deflection Ping Ring (triggers fresh animation when coords change) */}
                <span
                  key={`${latitude}_${longitude}`}
                  className="absolute w-8 h-8 rounded-full bg-cyan-400/40 animate-ping pointer-events-none"
                />
                <span className="w-3.5 h-3.5 rounded-full bg-cyan-300 border-2 border-white shadow-[0_0_12px_#06b6d4]" />
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex flex-col items-center gap-1 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{stationName}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-cyan-400/80 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>BEARING: <strong className="text-white">{bearingDeg}°</strong></span>
              <span>&bull;</span>
              <span>DEFLECTION: <strong className="text-white">{deflectionPct}%</strong></span>
              <span>&bull;</span>
              <span>POLE DIST: <strong className="text-white">{distanceKm} km</strong></span>
            </div>
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
          <div>
            <span className="text-[10px] font-mono text-slate-400 block mb-1">QUICK SELECT PRESETS:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handlePresetClick('bharati', -69.4072, 76.1872)}
                className="text-[10px] font-mono px-2 py-1 rounded bg-polaris-800 hover:bg-polaris-700 text-slate-300 border border-polaris-700 hover:border-cyan-500/50 transition-colors"
              >
                🇮🇳 Bharati (-69.4°, 76.2°)
              </button>
              <button
                onClick={() => handlePresetClick('maitri', -70.7667, 11.7333)}
                className="text-[10px] font-mono px-2 py-1 rounded bg-polaris-800 hover:bg-polaris-700 text-slate-300 border border-polaris-700 hover:border-cyan-500/50 transition-colors"
              >
                🇮🇳 Maitri (-70.8°, 11.7°)
              </button>
              <button
                onClick={() => handlePresetClick('mcmurdo', -77.8463, 166.6682)}
                className="text-[10px] font-mono px-2 py-1 rounded bg-polaris-800 hover:bg-polaris-700 text-slate-300 border border-polaris-700 hover:border-cyan-500/50 transition-colors"
              >
                🇺🇸 McMurdo (-77.8°, 166.7°)
              </button>
              <button
                onClick={() => handlePresetClick('himadri', 78.9244, 11.9306)}
                className="text-[10px] font-mono px-2 py-1 rounded bg-polaris-800 hover:bg-polaris-700 text-slate-300 border border-polaris-700 hover:border-cyan-500/50 transition-colors"
              >
                🇮🇳 Himadri Arctic (78.9°, 11.9°)
              </button>
              <button
                onClick={() => handlePresetClick('amundsen_scott', -90.0, 0.0)}
                className="text-[10px] font-mono px-2 py-1 rounded bg-polaris-800 hover:bg-polaris-700 text-slate-300 border border-polaris-700 hover:border-cyan-500/50 transition-colors"
              >
                🇺🇸 South Pole (-90.0°)
              </button>
            </div>
          </div>

          {/* Fetch Live Atmospheric Conditions Button */}
          <button
            onClick={onFetchLiveWeather}
            disabled={isLoadingWeather}
            className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-mono text-xs font-bold tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50 cursor-pointer"
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
