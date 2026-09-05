import React from 'react';
import { StationMap } from '../components/StationMap';
import { WeatherPanel } from '../components/WeatherPanel';
import { CurrentEnergyCard } from '../components/CurrentEnergyCard';
import { EnergyFlow } from '../components/EnergyFlow';
import { StationConfigComponent } from '../components/StationConfig';
import { LoadManagement } from '../components/LoadManagement';
import { OptimizationTimeline } from '../components/OptimizationTimeline';
import { AlertTriangle, RotateCcw, Radiation } from 'lucide-react';
import {
  StationConfig,
  WeatherTelemetry,
  InstantEnergyState,
  LoadItem,
  CrisisResponse
} from '../types';

interface DashboardPageProps {
  station: StationConfig;
  weather: WeatherTelemetry | null;
  weatherSourceLabel?: string;
  energyState: InstantEnergyState | null;
  isLoadingWeather: boolean;
  isLoadingState: boolean;
  onCoordinatesChange: (lat: number, lon: number) => void;
  onFetchLiveWeather: () => void;
  onStationConfigChange: (updated: StationConfig) => void;
  onLoadsChange: (updatedLoads: LoadItem[]) => void;
  onRecalculateState: () => void;
  optimalSchedule: any[];
  optimalSummary: any;
  recommendations: string[];
  onGeneratePlan: () => void;
  isLoadingPlan: boolean;
  onSelectStationPreset?: (stationId: string) => void;
  // Crisis props
  crisisData: CrisisResponse | null;
  isCrisisActive: boolean;
  isTriggeringCrisis: boolean;
  onTriggerCrisis: () => void;
  onResetCrisis: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  station,
  weather,
  weatherSourceLabel,
  energyState,
  isLoadingWeather,
  isLoadingState,
  onCoordinatesChange,
  onFetchLiveWeather,
  onStationConfigChange,
  onLoadsChange,
  onRecalculateState,
  optimalSchedule,
  optimalSummary,
  recommendations,
  onGeneratePlan,
  isLoadingPlan,
  onSelectStationPreset,
  crisisData,
  isCrisisActive,
  isTriggeringCrisis,
  onTriggerCrisis,
  onResetCrisis
}) => {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* 1. Top Section: Station Coordinates & Live Atmospheric Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <StationMap
            latitude={station.latitude}
            longitude={station.longitude}
            onCoordinatesChange={onCoordinatesChange}
            onFetchLiveWeather={onFetchLiveWeather}
            isLoadingWeather={isLoadingWeather}
            stationName={station.station_name}
            region={station.region}
            sourceLabel={weatherSourceLabel}
            onSelectStationPreset={onSelectStationPreset}
          />
        </div>
        <div className="lg:col-span-6">
          <WeatherPanel weather={weather} isLoading={isLoadingWeather} />
        </div>
      </div>

      {/* ── CATASTROPHIC CRISIS BUTTON ────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={onTriggerCrisis}
          disabled={isTriggeringCrisis || isCrisisActive}
          className={`
            relative flex items-center gap-3 px-6 py-3.5 rounded-xl font-mono text-sm font-bold uppercase tracking-wider
            transition-all duration-300 border-2
            ${isCrisisActive
              ? 'bg-red-950/60 border-red-500/50 text-red-400 cursor-not-allowed'
              : isTriggeringCrisis
              ? 'bg-red-950/40 border-red-600/40 text-red-500 cursor-wait animate-pulse'
              : 'bg-gradient-to-r from-red-950 to-red-900 border-red-500 text-red-100 hover:from-red-900 hover:to-red-800 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:scale-[1.02] active:scale-[0.98]'
            }
          `}
        >
          {/* Pulsing danger ring */}
          {!isCrisisActive && !isTriggeringCrisis && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          )}
          <Radiation className={`w-5 h-5 ${isTriggeringCrisis ? 'animate-spin' : ''}`} />
          {isTriggeringCrisis
            ? 'EXECUTING CRISIS PROTOCOL...'
            : isCrisisActive
            ? 'CRISIS MODE ACTIVE'
            : 'SIMULATE CATASTROPHIC CRISIS'
          }
        </button>

        {isCrisisActive && (
          <button
            onClick={onResetCrisis}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            RESET TO NORMAL
          </button>
        )}
      </div>

      {/* 2. Microgrid Telemetry KPIs + Crisis Countdown */}
      <CurrentEnergyCard
        state={energyState}
        isLoading={isLoadingState}
        crisisData={crisisData}
        isCrisisActive={isCrisisActive}
      />

      {/* 3. Active Energy Flow Diagram */}
      <EnergyFlow state={energyState} />

      {/* 4. Optimal 24-Hour Schedule & AI Recommendations */}
      <OptimizationTimeline
        schedule={optimalSchedule}
        summary={optimalSummary}
        recommendations={recommendations}
        onGeneratePlan={onGeneratePlan}
        isLoading={isLoadingPlan}
      />

      {/* 5. Station Equipment Configuration */}
      <StationConfigComponent
        config={station}
        onChange={onStationConfigChange}
        onRecalculate={onRecalculateState}
      />

      {/* 6. Dynamic Subsystem Load Priorities */}
      <LoadManagement
        loads={station.loads}
        onChange={onLoadsChange}
        totalDemand={energyState?.current_demand_kw || 120}
        criticalLoad={energyState?.critical_load_kw || 50}
        importantLoad={energyState?.important_load_kw || 40}
        deferrableLoad={energyState?.deferrable_load_kw || 30}
        crisisData={crisisData}
        isCrisisActive={isCrisisActive}
      />
    </div>
  );
};
