import React from 'react';
import { Sun, Battery, Fuel, Users, Sliders, Settings2 } from 'lucide-react';
import { StationConfig } from '../types';

interface StationConfigProps {
  config: StationConfig;
  onChange: (updated: StationConfig) => void;
  onRecalculate: () => void;
}

export const StationConfigComponent: React.FC<StationConfigProps> = ({
  config,
  onChange,
  onRecalculate
}) => {
  const updateField = (field: keyof StationConfig, value: any) => {
    const updated = { ...config, [field]: value };
    onChange(updated);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-polaris-800">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
            STATION ENERGY & SUBSYSTEM CONFIGURATION
          </h2>
        </div>
        <button
          onClick={onRecalculate}
          className="text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/40 transition-colors"
        >
          UPDATE & RECALCULATE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Section 1: Solar Field */}
        <div className="bg-polaris-900/90 rounded-xl p-4 border border-polaris-800 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-400 pb-2 border-b border-polaris-800">
            <Sun className="w-4 h-4" />
            <h3 className="text-xs font-bold font-mono uppercase">SOLAR PV ARRAY</h3>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">
              SOLAR CAPACITY (kW)
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={config.solar_capacity_kw}
              onChange={(e) => updateField('solar_capacity_kw', parseFloat(e.target.value) || 0)}
              className="w-full bg-polaris-950 border border-polaris-700 text-amber-300 font-mono text-xs rounded-lg px-2.5 py-1.5 focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                EFFICIENCY (%)
              </label>
              <input
                type="number"
                min="5"
                max="30"
                step="0.5"
                value={config.solar_efficiency_pct}
                onChange={(e) => updateField('solar_efficiency_pct', parseFloat(e.target.value) || 0)}
                className="w-full bg-polaris-950 border border-polaris-700 text-slate-200 font-mono text-xs rounded-lg px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                TILT (DEGREES)
              </label>
              <input
                type="number"
                min="0"
                max="90"
                value={config.panel_tilt_deg}
                onChange={(e) => updateField('panel_tilt_deg', parseFloat(e.target.value) || 0)}
                className="w-full bg-polaris-950 border border-polaris-700 text-slate-200 font-mono text-xs rounded-lg px-2.5 py-1.5"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Battery Storage */}
        <div className="bg-polaris-900/90 rounded-xl p-4 border border-polaris-800 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-emerald-400 pb-2 border-b border-polaris-800">
            <Battery className="w-4 h-4" />
            <h3 className="text-xs font-bold font-mono uppercase">BATTERY STORAGE (BESS)</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                CAPACITY (kWh)
              </label>
              <input
                type="number"
                min="50"
                step="50"
                value={config.battery_capacity_kwh}
                onChange={(e) => updateField('battery_capacity_kwh', parseFloat(e.target.value) || 0)}
                className="w-full bg-polaris-950 border border-polaris-700 text-emerald-300 font-mono text-xs rounded-lg px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                CURRENT SOC (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={config.battery_soc_pct}
                onChange={(e) => updateField('battery_soc_pct', parseFloat(e.target.value) || 0)}
                className="w-full bg-polaris-950 border border-polaris-700 text-emerald-300 font-mono text-xs rounded-lg px-2.5 py-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                MIN RESERVE (%)
              </label>
              <input
                type="number"
                min="15"
                max="60"
                value={config.battery_min_reserve_pct}
                onChange={(e) => updateField('battery_min_reserve_pct', parseFloat(e.target.value) || 0)}
                className="w-full bg-polaris-950 border border-polaris-700 text-slate-200 font-mono text-xs rounded-lg px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                MAX CHG/DIS (kW)
              </label>
              <input
                type="number"
                min="10"
                step="10"
                value={config.battery_max_charge_kw}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  updateField('battery_max_charge_kw', v);
                  updateField('battery_max_discharge_kw', v);
                }}
                className="w-full bg-polaris-950 border border-polaris-700 text-slate-200 font-mono text-xs rounded-lg px-2.5 py-1.5"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Diesel Generator */}
        <div className="bg-polaris-900/90 rounded-xl p-4 border border-polaris-800 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-300 pb-2 border-b border-polaris-800">
            <Fuel className="w-4 h-4" />
            <h3 className="text-xs font-bold font-mono uppercase">DIESEL GENERATOR</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                RATED GEN (kW)
              </label>
              <input
                type="number"
                min="50"
                step="25"
                value={config.diesel_capacity_kw}
                onChange={(e) => updateField('diesel_capacity_kw', parseFloat(e.target.value) || 0)}
                className="w-full bg-polaris-950 border border-polaris-700 text-slate-200 font-mono text-xs rounded-lg px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                FUEL TANK (L)
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={config.diesel_fuel_l}
                onChange={(e) => updateField('diesel_fuel_l', parseFloat(e.target.value) || 0)}
                className="w-full bg-polaris-950 border border-polaris-700 text-slate-200 font-mono text-xs rounded-lg px-2.5 py-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                L/kWh BURN RATE
              </label>
              <input
                type="number"
                step="0.01"
                min="0.20"
                max="0.45"
                value={config.diesel_consumption_l_per_kwh}
                onChange={(e) => updateField('diesel_consumption_l_per_kwh', parseFloat(e.target.value) || 0)}
                className="w-full bg-polaris-950 border border-polaris-700 text-slate-200 font-mono text-xs rounded-lg px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                MIN LOAD (%)
              </label>
              <input
                type="number"
                min="15"
                max="40"
                value={config.diesel_min_load_pct}
                onChange={(e) => updateField('diesel_min_load_pct', parseFloat(e.target.value) || 0)}
                className="w-full bg-polaris-950 border border-polaris-700 text-slate-200 font-mono text-xs rounded-lg px-2.5 py-1.5"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Station Operations */}
        <div className="bg-polaris-900/90 rounded-xl p-4 border border-polaris-800 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-cyan-400 pb-2 border-b border-polaris-800">
            <Users className="w-4 h-4" />
            <h3 className="text-xs font-bold font-mono uppercase">STATION OPERATIONS</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                OCCUPANTS
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={config.occupants}
                onChange={(e) => updateField('occupants', parseInt(e.target.value) || 1)}
                className="w-full bg-polaris-950 border border-polaris-700 text-cyan-300 font-mono text-xs rounded-lg px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                HEAT MULTIPLIER
              </label>
              <input
                type="number"
                min="0.5"
                max="2.0"
                step="0.1"
                value={config.heating_intensity}
                onChange={(e) => updateField('heating_intensity', parseFloat(e.target.value) || 1.0)}
                className="w-full bg-polaris-950 border border-polaris-700 text-slate-200 font-mono text-xs rounded-lg px-2.5 py-1.5"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 block mb-1">
              OPERATIONAL PROTOCOL
            </label>
            <select
              value={config.operating_mode}
              onChange={(e) => updateField('operating_mode', e.target.value)}
              className="w-full bg-polaris-950 border border-polaris-700 text-slate-200 font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
            >
              <option value="Normal Operation">Normal Operation</option>
              <option value="High Research Operation">High Research Operation</option>
              <option value="Storm Lockdown">Storm Lockdown</option>
              <option value="Extreme Cold Protocol">Extreme Cold Protocol</option>
              <option value="Conservation Mode">Conservation Mode</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
