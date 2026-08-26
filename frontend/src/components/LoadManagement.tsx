import React from 'react';
import { Layers, Shield, AlertCircle, Clock, Plus, Trash2 } from 'lucide-react';
import { LoadItem } from '../types';

interface LoadManagementProps {
  loads: LoadItem[];
  onChange: (updatedLoads: LoadItem[]) => void;
  totalDemand: number;
  criticalLoad: number;
  importantLoad: number;
  deferrableLoad: number;
}

export const LoadManagement: React.FC<LoadManagementProps> = ({
  loads,
  onChange,
  totalDemand,
  criticalLoad,
  importantLoad,
  deferrableLoad
}) => {
  const updateLoadItem = (index: number, field: keyof LoadItem, value: any) => {
    const updated = [...loads];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeLoadItem = (index: number) => {
    if (loads.length <= 1) return;
    const updated = loads.filter((_, i) => i !== index);
    onChange(updated);
  };

  const addLoadItem = () => {
    const newItem: LoadItem = {
      id: `custom_load_${Date.now()}`,
      name: 'Auxiliary Laboratory Rig',
      power_kw: 15.0,
      priority: 'IMPORTANT',
      flexible: true,
      min_op_pct: 50
    };
    onChange([...loads, newItem]);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-polaris-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
            LOAD MANAGEMENT & DISPATCH PRIORITY
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addLoadItem}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-lg bg-polaris-800 hover:bg-polaris-700 text-slate-200 border border-polaris-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            ADD SUBSYSTEM LOAD
          </button>
        </div>
      </div>

      {/* Load Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-polaris-900/90 rounded-xl p-2.5 border border-polaris-800">
          <div className="text-[10px] font-mono text-slate-400">TOTAL LOADS</div>
          <div className="text-sm font-bold font-mono text-white">{totalDemand} kW</div>
        </div>

        <div className="bg-polaris-900/90 rounded-xl p-2.5 border border-rose-500/30">
          <div className="text-[10px] font-mono text-rose-400 flex items-center gap-1">
            <Shield className="w-3 h-3" /> CRITICAL (100% SERVED)
          </div>
          <div className="text-sm font-bold font-mono text-rose-300">{criticalLoad} kW</div>
        </div>

        <div className="bg-polaris-900/90 rounded-xl p-2.5 border border-amber-500/30">
          <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> IMPORTANT (ADAPTIVE)
          </div>
          <div className="text-sm font-bold font-mono text-amber-300">{importantLoad} kW</div>
        </div>

        <div className="bg-polaris-900/90 rounded-xl p-2.5 border border-cyan-500/30">
          <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> DEFERRABLE (SHEDDABLE)
          </div>
          <div className="text-sm font-bold font-mono text-cyan-300">{deferrableLoad} kW</div>
        </div>
      </div>

      {/* Load Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-polaris-800 text-slate-400 text-[10px]">
              <th className="pb-2 font-semibold">SUBSYSTEM LOAD</th>
              <th className="pb-2 font-semibold">RATED (kW)</th>
              <th className="pb-2 font-semibold">DYNAMIC (kW)</th>
              <th className="pb-2 font-semibold">PRIORITY TIER</th>
              <th className="pb-2 font-semibold">FLEXIBLE?</th>
              <th className="pb-2 font-semibold">MIN OP (%)</th>
              <th className="pb-2 font-semibold text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-polaris-850">
            {loads.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-polaris-900/50 transition-colors">
                <td className="py-2.5 pr-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateLoadItem(idx, 'name', e.target.value)}
                    className="w-full bg-transparent border-0 text-slate-200 font-sans text-xs focus:ring-1 focus:ring-cyan-400 rounded px-1"
                  />
                </td>
                <td className="py-2.5 pr-2 w-20">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.power_kw}
                    onChange={(e) => updateLoadItem(idx, 'power_kw', parseFloat(e.target.value) || 1)}
                    className="w-full bg-polaris-950 border border-polaris-800 text-cyan-300 rounded px-2 py-1"
                  />
                </td>
                <td className="py-2.5 pr-2 text-slate-300 font-bold">
                  {item.current_kw ? `${item.current_kw} kW` : `${item.power_kw} kW`}
                </td>
                <td className="py-2.5 pr-2">
                  <select
                    value={item.priority}
                    onChange={(e) => updateLoadItem(idx, 'priority', e.target.value)}
                    className={`text-[10px] font-bold font-mono rounded px-2 py-1 border bg-polaris-950 cursor-pointer ${
                      item.priority === 'CRITICAL'
                        ? 'text-rose-400 border-rose-500/40 bg-rose-950/40'
                        : item.priority === 'IMPORTANT'
                        ? 'text-amber-400 border-amber-500/40 bg-amber-950/40'
                        : 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40'
                    }`}
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="IMPORTANT">IMPORTANT</option>
                    <option value="DEFERRABLE">DEFERRABLE</option>
                  </select>
                </td>
                <td className="py-2.5 pr-2">
                  <input
                    type="checkbox"
                    checked={item.flexible}
                    onChange={(e) => updateLoadItem(idx, 'flexible', e.target.checked)}
                    className="rounded bg-polaris-900 border-polaris-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                </td>
                <td className="py-2.5 pr-2 w-20">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="10"
                    value={item.min_op_pct}
                    onChange={(e) => updateLoadItem(idx, 'min_op_pct', parseInt(e.target.value) || 0)}
                    className="w-full bg-polaris-950 border border-polaris-800 text-slate-300 rounded px-2 py-1"
                  />
                </td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={() => removeLoadItem(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
