import React from 'react';
import { X, BookOpen, Sigma, Zap, BarChart4 } from 'lucide-react';
import { usePolarisStore } from '../store/usePolarisStore';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

export const MathInspectorPanel: React.FC = () => {
  const { loadAnalysis, selectedHour, setSelectedHour } = usePolarisStore();

  if (selectedHour === null || !loadAnalysis) return null;

  const frame = loadAnalysis.series[selectedHour];
  if (!frame) return null;

  const temp = frame.temperature_c.toFixed(1);
  const wind = frame.wind_kmh.toFixed(1);
  const deltaT = Math.max(0, 20 - frame.temperature_c).toFixed(1);
  
  // Enclosure UA is 2.5 kW/°C. Infiltration coeff is 0.012.
  const q_envelope = (2.5 * parseFloat(deltaT)).toFixed(1);
  const q_infil = (0.012 * frame.wind_kmh * parseFloat(deltaT)).toFixed(1);
  const total_heating = frame.habitat_heating_kw.toFixed(1);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-polaris-950 border-l border-polaris-800 shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
      <div className="flex items-center justify-between p-4 border-b border-polaris-800 bg-polaris-900/50">
        <div className="flex items-center gap-2 text-cyan-400">
          <BookOpen className="w-5 h-5" />
          <h2 className="font-mono font-bold tracking-widest text-sm">MATHEMATICAL INSPECTOR</h2>
        </div>
        <button 
          onClick={() => setSelectedHour(null)}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-8">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-widest border-l-2 border-cyan-500 pl-3">
          Analyzing {frame.hour}
          <br/>
          <span className="text-white">T = {temp}°C | v = {wind} km/h</span>
        </div>

        {/* Heating Formula */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-rose-400">
            <Sigma className="w-4 h-4" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider">Convective Heat Loss (P0)</h3>
          </div>
          <div className="bg-polaris-900/80 rounded-lg p-4 border border-polaris-800 text-slate-200">
            <BlockMath math="Q_{loss} = (U \cdot A \cdot \Delta T) + (k_{inf} \cdot v_{wind} \cdot \Delta T)" />
          </div>
          <div className="bg-polaris-950 rounded-lg p-3 border border-polaris-800 font-mono text-xs text-slate-300 space-y-1.5 shadow-inner">
            <div><span className="text-slate-500">where</span> <InlineMath math="\Delta T" /> = <span className="text-rose-300">{deltaT}°C</span> (20°C - {temp}°C)</div>
            <div><span className="text-slate-500">where</span> <InlineMath math="v_{wind}" /> = <span className="text-blue-300">{wind} km/h</span></div>
            <div className="pt-2 border-t border-polaris-800/50 mt-2 text-cyan-300">
              <BlockMath math={`Q_{loss} = (2.5 \\cdot ${deltaT}) + (0.012 \\cdot ${wind} \\cdot ${deltaT})`} />
            </div>
            <div className="text-center font-bold text-rose-400 text-lg mt-2">
              = {total_heating} kW
            </div>
          </div>
        </div>

        {/* Battery Derating Formula */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-orange-400">
            <Zap className="w-4 h-4" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider">Arrhenius Battery Fade (P1)</h3>
          </div>
          <div className="bg-polaris-900/80 rounded-lg p-4 border border-polaris-800 text-slate-200">
            <BlockMath math="C = C_0 \cdot \exp\left(-\frac{E_a}{R \cdot T}\right)" />
          </div>
          <div className="bg-polaris-950 rounded-lg p-3 border border-polaris-800 font-mono text-xs text-slate-300 shadow-inner">
            {parseFloat(temp) < -20 ? (
              <>
                <div className="text-rose-400 mb-2 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  THRESHOLD BREACH (T &lt; -20°C)
                </div>
                <div>Parasitic thermal jacket engaged to prevent lithium plating and capacity collapse.</div>
                <div className="mt-2 text-orange-300 font-bold text-base text-center">
                  + {frame.battery_jacket_kw.toFixed(1)} kW (Parasitic Load)
                </div>
              </>
            ) : (
              <div className="text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                T ≥ -20°C (SAFE BOUNDS)
              </div>
            )}
          </div>
        </div>

        {/* MILP Optimizer */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-purple-400">
            <BarChart4 className="w-4 h-4" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider">MILP Objective Function</h3>
          </div>
          <div className="bg-polaris-900/80 rounded-lg p-4 border border-polaris-800 text-slate-200">
            <BlockMath math="\min \sum_{t=1}^{48} \left( w_1 \cdot \text{Fuel}_t + w_2 \cdot \text{Degradation}_t \right)" />
          </div>
          <div className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-widest mt-2">
            Subject to Power Balance & Capacity Bounds
          </div>
        </div>

      </div>
    </div>
  );
};
