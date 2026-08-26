import React from 'react';
import { Database, CheckCircle2, ShieldCheck, Globe, Cpu, Sun } from 'lucide-react';

export const DataSourcesFooter: React.FC = () => {
  return (
    <footer className="mt-10 border-t border-polaris-800 bg-polaris-950/80 p-5 rounded-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200">DATA LINEAGE & SCIENTIFIC TRANSPARENCY:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Live Weather: <strong className="text-slate-300">Open-Meteo Atmospheric API</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Station Telemetry: <strong className="text-slate-300">Physics Microgrid Simulator</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Solar Generation: <strong className="text-slate-300">GTI + Thermal Physics Model</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Optimization: <strong className="text-slate-300">Google OR-Tools MILP</strong>
          </span>
        </div>
      </div>
    </footer>
  );
};
