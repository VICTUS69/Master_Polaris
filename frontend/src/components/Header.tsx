import React from 'react';
import {
  Compass,
  Radio,
  ShieldCheck,
  Zap,
  PlayCircle,
  Activity,
  Layers,
  ChevronDown,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { StationConfig } from '../types';

interface HeaderProps {
  currentStation: StationConfig;
  onSelectStationPreset: (stationId: string) => void;
  activeTab: 'control' | 'simulation' | 'forecast';
  onTabChange: (tab: 'control' | 'simulation' | 'forecast') => void;
  onStartDemoMode: () => void;
  isDemoRunning: boolean;
  resilienceScore: number;
  resilienceLevel: string;
  resilienceColor: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentStation,
  onSelectStationPreset,
  activeTab,
  onTabChange,
  onStartDemoMode,
  isDemoRunning,
  resilienceScore,
  resilienceLevel,
  resilienceColor
}) => {
  return (
    <header className="sticky top-0 z-50 bg-polaris-950/90 backdrop-blur-md border-b border-polaris-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Core Concept */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Zap className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider text-white font-mono flex items-center gap-1.5">
                POLARIS
                <span className="text-[10px] px-1.5 py-0.5 rounded font-sans uppercase font-bold tracking-normal bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  PS26061
                </span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                OPERATIONAL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono tracking-tight hidden sm:block">
              AI Polar Energy Resilience Platform • Digital Twin
            </p>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <div className="flex items-center p-1 bg-polaris-900/90 rounded-xl border border-polaris-700/80">
          <button
            onClick={() => onTabChange('control')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium font-mono transition-all ${
              activeTab === 'control'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-polaris-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            STATION CONTROL CENTER
          </button>

          <button
            onClick={() => onTabChange('simulation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium font-mono transition-all relative ${
              activeTab === 'simulation'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-polaris-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            AGENTIC AI SIMULATION
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </button>

          <button
            onClick={() => onTabChange('forecast')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium font-mono transition-all ${
              activeTab === 'forecast'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-polaris-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            FORECAST LAB
          </button>
        </div>

        {/* Right: Station Preset, Risk Metric, Presentation Demo */}
        <div className="flex items-center gap-3">
          {/* Station Preset Selector */}
          <div className="relative group">
            <select
              value={currentStation.station_id || 'custom'}
              onChange={(e) => onSelectStationPreset(e.target.value)}
              className="appearance-none bg-polaris-900 border border-polaris-700 text-slate-200 text-xs font-mono rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="bharati">🇮🇳 Bharati Station (Antarctica)</option>
              <option value="maitri">🇮🇳 Maitri Station (Antarctica)</option>
              <option value="mcmurdo">🇺🇸 McMurdo Station (Ross Island)</option>
              <option value="himadri">🇮🇳 Himadri Arctic (Svalbard)</option>
              <option value="amundsen_scott">🇺🇸 South Pole Station</option>
              <option value="custom">🌐 Custom Coordinates</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Prototype Resilience Score */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-polaris-900/80 rounded-lg border border-polaris-800">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-mono">RESILIENCE</div>
              <div className="text-xs font-mono font-bold" style={{ color: resilienceColor }}>
                {resilienceScore}/100 ({resilienceLevel})
              </div>
            </div>
          </div>

          {/* Presentation Demo Mode Button */}
          <button
            onClick={onStartDemoMode}
            disabled={isDemoRunning}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all shadow-md ${
              isDemoRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            {isDemoRunning ? 'RUNNING DEMO...' : 'PRESENTATION DEMO'}
          </button>
        </div>
      </div>
    </header>
  );
};
