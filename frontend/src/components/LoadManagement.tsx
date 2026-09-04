import React from 'react';
import { Layers, Shield, AlertCircle, Clock, Plus, Trash2, AlertTriangle, Skull } from 'lucide-react';
import { LoadItem, CrisisResponse } from '../types';

interface LoadManagementProps {
  loads: LoadItem[];
  onChange: (updatedLoads: LoadItem[]) => void;
  totalDemand: number;
  criticalLoad: number;
  importantLoad: number;
  deferrableLoad: number;
  crisisData?: CrisisResponse | null;
  isCrisisActive?: boolean;
}

export const LoadManagement: React.FC<LoadManagementProps> = ({
  loads,
  onChange,
  totalDemand,
  criticalLoad,
  importantLoad,
  deferrableLoad,
  crisisData,
  isCrisisActive
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

  // Build crisis lookup for quick status checks
  const crisisP0Ids = new Set<string>();
  if (isCrisisActive && crisisData) {
    crisisData.load_hierarchy.p0_life_support.loads.forEach((l) => crisisP0Ids.add(l.id));
  }

  return (
    <div className={`glass-panel rounded-2xl p-5 border transition-all duration-500 ${
      isCrisisActive ? 'border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-polaris-800'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {isCrisisActive ? (
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
          ) : (
            <Layers className="w-4 h-4 text-cyan-400" />
          )}
          <h2 className={`text-sm font-bold font-mono tracking-wider uppercase ${
            isCrisisActive ? 'text-red-400' : 'text-white'
          }`}>
            {isCrisisActive ? 'EMERGENCY LOAD SHEDDING — SURVIVAL MODE' : 'LOAD MANAGEMENT & DISPATCH PRIORITY'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {!isCrisisActive && (
            <button
              onClick={addLoadItem}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-lg bg-polaris-800 hover:bg-polaris-700 text-slate-200 border border-polaris-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              ADD SUBSYSTEM LOAD
            </button>
          )}
        </div>
      </div>

      {/* Load Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className={`rounded-xl p-2.5 border ${
          isCrisisActive ? 'bg-red-950/30 border-red-500/30' : 'bg-polaris-900/90 border-polaris-800'
        }`}>
          <div className={`text-[10px] font-mono ${isCrisisActive ? 'text-red-400' : 'text-slate-400'}`}>
            {isCrisisActive ? 'P0 ONLY ACTIVE' : 'TOTAL LOADS'}
          </div>
          <div className={`text-sm font-bold font-mono ${isCrisisActive ? 'text-red-300' : 'text-white'}`}>
            {isCrisisActive && crisisData ? `${crisisData.survival.p0_load_kw} kW` : `${totalDemand} kW`}
          </div>
        </div>

        <div className={`rounded-xl p-2.5 border ${
          isCrisisActive ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-rose-500/30 bg-polaris-900/90'
        }`}>
          <div className={`text-[10px] font-mono flex items-center gap-1 ${
            isCrisisActive ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            <Shield className="w-3 h-3" />
            {isCrisisActive ? 'P0 — FULLY POWERED ✓' : 'CRITICAL (100% SERVED)'}
          </div>
          <div className={`text-sm font-bold font-mono ${isCrisisActive ? 'text-emerald-300' : 'text-rose-300'}`}>
            {criticalLoad} kW
          </div>
        </div>

        <div className={`rounded-xl p-2.5 border ${
          isCrisisActive ? 'border-red-500/40 bg-red-950/30' : 'border-amber-500/30 bg-polaris-900/90'
        }`}>
          <div className={`text-[10px] font-mono flex items-center gap-1 ${
            isCrisisActive ? 'text-red-400' : 'text-amber-400'
          }`}>
            {isCrisisActive ? (
              <><Skull className="w-3 h-3" /> P1 — SHED TO 0 kW</>
            ) : (
              <><AlertCircle className="w-3 h-3" /> IMPORTANT (ADAPTIVE)</>
            )}
          </div>
          <div className={`text-sm font-bold font-mono ${
            isCrisisActive ? 'text-red-400 line-through' : 'text-amber-300'
          }`}>
            {isCrisisActive ? '0 kW' : `${importantLoad} kW`}
          </div>
        </div>

        <div className={`rounded-xl p-2.5 border ${
          isCrisisActive ? 'border-red-500/40 bg-red-950/30' : 'border-cyan-500/30 bg-polaris-900/90'
        }`}>
          <div className={`text-[10px] font-mono flex items-center gap-1 ${
            isCrisisActive ? 'text-red-400' : 'text-cyan-400'
          }`}>
            {isCrisisActive ? (
              <><Skull className="w-3 h-3" /> P2 — SHED TO 0 kW</>
            ) : (
              <><Clock className="w-3 h-3" /> DEFERRABLE (SHEDDABLE)</>
            )}
          </div>
          <div className={`text-sm font-bold font-mono ${
            isCrisisActive ? 'text-red-400 line-through' : 'text-cyan-300'
          }`}>
            {isCrisisActive ? '0 kW' : `${deferrableLoad} kW`}
          </div>
        </div>
      </div>

      {/* Load Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-polaris-800 text-slate-400 text-[10px]">
              <th className="pb-2 font-semibold">SUBSYSTEM LOAD</th>
              <th className="pb-2 font-semibold">RATED (kW)</th>
              <th className="pb-2 font-semibold">{isCrisisActive ? 'CRISIS (kW)' : 'DYNAMIC (kW)'}</th>
              <th className="pb-2 font-semibold">PRIORITY TIER</th>
              <th className="pb-2 font-semibold">FLEXIBLE?</th>
              <th className="pb-2 font-semibold">MIN OP (%)</th>
              <th className="pb-2 font-semibold text-right">
                {isCrisisActive ? 'STATUS' : 'ACTION'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-polaris-850">
            {/* P1 row — BESS Heater (only shown during crisis) */}
            {isCrisisActive && (
              <tr className="bg-red-950/20 border-l-2 border-red-500">
                <td className="py-2.5 pr-2 text-slate-400">BESS Thermal Management</td>
                <td className="py-2.5 pr-2 text-slate-500">15.0</td>
                <td className="py-2.5 pr-2">
                  <span className="text-red-400 font-bold line-through">0 kW</span>
                </td>
                <td className="py-2.5 pr-2">
                  <span className="text-[10px] font-bold font-mono rounded px-2 py-1 border text-red-400 border-red-500/40 bg-red-950/60">
                    P1 — BESS
                  </span>
                </td>
                <td className="py-2.5 pr-2 text-red-400">—</td>
                <td className="py-2.5 pr-2 text-red-400">0</td>
                <td className="py-2.5 text-right">
                  <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">SHED</span>
                </td>
              </tr>
            )}

            {loads.map((item, idx) => {
              const isP0 = item.priority === 'CRITICAL';
              const isShed = isCrisisActive && !isP0;

              return (
                <tr
                  key={item.id || idx}
                  className={`transition-all duration-300 ${
                    isCrisisActive
                      ? isP0
                        ? 'bg-emerald-950/10 border-l-2 border-emerald-500'
                        : 'bg-red-950/10 border-l-2 border-red-500 opacity-60'
                      : 'hover:bg-polaris-900/50'
                  }`}
                >
                  <td className="py-2.5 pr-2">
                    {isCrisisActive ? (
                      <span className={`text-xs font-sans ${isP0 ? 'text-emerald-300' : 'text-slate-500 line-through'}`}>
                        {item.name}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateLoadItem(idx, 'name', e.target.value)}
                        className="w-full bg-transparent border-0 text-slate-200 font-sans text-xs focus:ring-1 focus:ring-cyan-400 rounded px-1"
                      />
                    )}
                  </td>
                  <td className="py-2.5 pr-2 w-20">
                    {isCrisisActive ? (
                      <span className="text-slate-500">{item.power_kw}</span>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.power_kw}
                        onChange={(e) => updateLoadItem(idx, 'power_kw', parseFloat(e.target.value) || 1)}
                        className="w-full bg-polaris-950 border border-polaris-800 text-cyan-300 rounded px-2 py-1"
                      />
                    )}
                  </td>
                  <td className="py-2.5 pr-2">
                    {isCrisisActive ? (
                      isShed ? (
                        <span className="text-red-400 font-bold line-through">0 kW</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">{item.power_kw} kW ✓</span>
                      )
                    ) : (
                      <span className="text-slate-300 font-bold">
                        {item.current_kw ? `${item.current_kw} kW` : `${item.power_kw} kW`}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-2">
                    {isCrisisActive ? (
                      <span className={`text-[10px] font-bold font-mono rounded px-2 py-1 border ${
                        isP0
                          ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40'
                          : 'text-red-400 border-red-500/40 bg-red-950/40'
                      }`}>
                        {isP0 ? 'P0 — LIFE' : item.priority === 'IMPORTANT' ? 'P2 — SCI' : 'P2 — DEF'}
                      </span>
                    ) : (
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
                    )}
                  </td>
                  <td className="py-2.5 pr-2">
                    {isCrisisActive ? (
                      <span className={`text-xs ${isP0 ? 'text-slate-500' : 'text-red-500'}`}>
                        {isP0 ? 'No' : '—'}
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={item.flexible}
                        onChange={(e) => updateLoadItem(idx, 'flexible', e.target.checked)}
                        className="rounded bg-polaris-900 border-polaris-700 text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                    )}
                  </td>
                  <td className="py-2.5 pr-2 w-20">
                    {isCrisisActive ? (
                      <span className={`text-xs ${isP0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isP0 ? '100' : '0'}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="10"
                        value={item.min_op_pct}
                        onChange={(e) => updateLoadItem(idx, 'min_op_pct', parseInt(e.target.value) || 0)}
                        className="w-full bg-polaris-950 border border-polaris-800 text-slate-300 rounded px-2 py-1"
                      />
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    {isCrisisActive ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isP0
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-red-500 bg-red-500/10'
                      }`}>
                        {isP0 ? 'ACTIVE' : 'SHED'}
                      </span>
                    ) : (
                      <button
                        onClick={() => removeLoadItem(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
