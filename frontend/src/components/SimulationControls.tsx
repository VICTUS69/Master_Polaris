import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  StepForward,
  AlertTriangle,
  Flame,
  Sun,
  Battery,
  CloudSnow,
  Zap,
  Radio
} from 'lucide-react';
import { ScenarioDefinition } from '../types';

interface SimulationControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onStep: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  currentHour: number;
  maxHours: number;
  onScrubHour: (hour: number) => void;
  scenarios: ScenarioDefinition[];
  selectedScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  isRunningSim: boolean;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isPlaying,
  onPlayPause,
  onReset,
  onStep,
  playbackSpeed,
  onSpeedChange,
  currentHour,
  maxHours,
  onScrubHour,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  isRunningSim
}) => {
  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'polar_storm':
        return <CloudSnow className="w-4 h-4 text-cyan-400" />;
      case 'solar_failure':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'generator_failure':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'extreme_cold':
        return <CloudSnow className="w-4 h-4 text-violet-400" />;
      case 'load_spike':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'combined_failure':
        return <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />;
      default:
        return <Radio className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-polaris-800 flex flex-col gap-4">
      {/* Top Bar: Playback Controls & Timeline Scrubber */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-center">
          <button
            onClick={onPlayPause}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" /> PAUSE
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> PLAY SIMULATION
              </>
            )}
          </button>

          <button
            onClick={onStep}
            disabled={isPlaying || currentHour >= maxHours - 1}
            className="p-2 rounded-xl bg-polaris-800 hover:bg-polaris-700 text-slate-300 border border-polaris-700 disabled:opacity-40 transition-colors"
            title="Step +1 Hour"
          >
            <StepForward className="w-4 h-4" />
          </button>

          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-polaris-800 hover:bg-polaris-700 text-slate-300 border border-polaris-700 transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Selection */}
          <div className="flex items-center bg-polaris-900 rounded-xl p-1 border border-polaris-700 ml-2">
            {[1, 10, 50, 100].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  playbackSpeed === s
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex-1 w-full flex items-center gap-3">
          <span className="text-xs font-mono text-cyan-300 font-bold whitespace-nowrap">
            T+{String(currentHour).padStart(2, '0')}:00h / {maxHours}h
          </span>
          <input
            type="range"
            min="0"
            max={Math.max(0, maxHours - 1)}
            value={currentHour}
            onChange={(e) => onScrubHour(parseInt(e.target.value) || 0)}
            className="w-full h-2 bg-polaris-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      {/* Scenario Triggers Grid */}
      <div>
        <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          SELECT POLAR DISASTER & STRESS-TEST SCENARIOS:
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {scenarios.map((sc) => {
            const isSelected = selectedScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc.id)}
                disabled={isRunningSim}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                    : 'bg-polaris-900/80 border-polaris-800 hover:border-polaris-700 hover:bg-polaris-850'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  {getScenarioIcon(sc.id)}
                  <span
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${sc.color}20`,
                      color: sc.color,
                      borderColor: `${sc.color}40`,
                      borderWidth: '1px'
                    }}
                  >
                    {sc.severity}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-200 line-clamp-1">
                  {sc.name}
                </div>
                <div className="text-[9px] font-sans text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                  {sc.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
