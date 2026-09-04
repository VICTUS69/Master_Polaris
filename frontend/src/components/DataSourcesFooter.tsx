import React from 'react';
import { Database, CheckCircle2, ShieldCheck, Globe, Cpu, Sun, HardDrive, Brain } from 'lucide-react';

export const DataSourcesFooter: React.FC = () => {
  return (
    <footer className="mt-10 border-t border-polaris-800 bg-polaris-950/80 p-5 rounded-2xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 text-xs font-mono">
        {/* Row 1: Data Lineage */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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

        {/* Row 2: AI Pipeline Specifications & Edge Databases */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-polaris-800/50 pt-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Brain className="w-4 h-4 text-violet-400" />
            <span className="font-bold text-slate-200">AI PIPELINE SPECIFICATIONS:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              Training Corpus: <strong className="text-violet-300">15,000+ Synthetic Katabatic Edge-Cases (PINN)</strong>
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              Edge DBs: <strong className="text-slate-300">weather_cache.sqlite</strong> · <strong className="text-slate-300">scada_telemetry.sqlite</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Advisory LLM: <strong className="text-slate-300">Qwen3:8B (Ollama Edge)</strong>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
