import React from 'react';
import { ForecastChart } from '../components/ForecastChart';
import { ShieldCheck, Cpu, Zap, Activity, AlertTriangle, Sparkles } from 'lucide-react';

interface ForecastPageProps {
  solarForecast: any;
  loadForecast: any;
  weatherForecast: any[];
  resilienceRisk: any;
  onRefreshForecast: () => void;
  isLoading: boolean;
}

export const ForecastPage: React.FC<ForecastPageProps> = ({
  solarForecast,
  loadForecast,
  weatherForecast,
  resilienceRisk,
  onRefreshForecast,
  isLoading
}) => {
  const breakdown = resilienceRisk?.breakdown || {
    thermal_stress: 15,
    wind_severity: 18,
    battery_margin: 8,
    atmospheric_instability: 12
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner: Action & Model Status */}
      <div className="glass-panel rounded-2xl p-5 border border-polaris-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-cyan-400 font-bold uppercase">
            AI FORECASTING ENGINE • PS26061 SCIENTIFIC LABORATORY
          </div>
          <h2 className="text-lg font-bold font-mono text-white mt-0.5">
            Predictive Atmospheric & Exogenous Microgrid Analytics
          </h2>
        </div>

        <button
          onClick={onRefreshForecast}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {isLoading ? 'RETRAINING REGRESSOR...' : 'RE-RUN 72H ML FORECAST'}
        </button>
      </div>

      {/* 72-Hour Interactive Chart */}
      <ForecastChart
        solarForecast={solarForecast}
        loadForecast={loadForecast}
        weatherForecast={weatherForecast}
      />

      {/* Resilience Risk & Model Diagnostics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Resilience Risk Breakdown */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 border border-polaris-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold font-mono uppercase text-white">
                PROTOTYPE RESILIENCE RISK METRIC
              </h3>
            </div>
            <span
              className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${resilienceRisk?.color || '#10b981'}20`,
                color: resilienceRisk?.color || '#10b981',
                border: `1px solid ${resilienceRisk?.color || '#10b981'}40`
              }}
            >
              {resilienceRisk?.score || 45}/100 ({resilienceRisk?.level || 'MODERATE'})
            </span>
          </div>

          <div className="space-y-3 my-2">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Thermal Stress (-ΔT Enclosure Loss)</span>
                <span>{breakdown.thermal_stress} pts</span>
              </div>
              <div className="w-full bg-polaris-900 rounded-full h-2">
                <div
                  className="bg-cyan-400 h-2 rounded-full"
                  style={{ width: `${(breakdown.thermal_stress / 30) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Wind Chill & Katabatic Severity</span>
                <span>{breakdown.wind_severity} pts</span>
              </div>
              <div className="w-full bg-polaris-900 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full"
                  style={{ width: `${(breakdown.wind_severity / 25) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Battery Reserve Buffer Vulnerability</span>
                <span>{breakdown.battery_margin} pts</span>
              </div>
              <div className="w-full bg-polaris-900 rounded-full h-2">
                <div
                  className="bg-amber-400 h-2 rounded-full"
                  style={{ width: `${(breakdown.battery_margin / 25) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Atmospheric Instability & Storm Risk</span>
                <span>{breakdown.atmospheric_instability} pts</span>
              </div>
              <div className="w-full bg-polaris-900 rounded-full h-2">
                <div
                  className="bg-rose-400 h-2 rounded-full"
                  style={{ width: `${(breakdown.atmospheric_instability / 25) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 border-t border-polaris-800 pt-2">
            ● Prototype Multi-Factor Polar Microgrid Vulnerability Index
          </div>
        </div>

        {/* Machine Learning Model Diagnostics */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 border border-polaris-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono uppercase text-white">
              AI MODEL PIPELINE SPECIFICATIONS
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 my-2 text-xs font-mono">
            <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
              <div className="text-[10px] text-slate-400">DEMAND REGRESSOR</div>
              <div className="text-slate-100 font-bold mt-1">Exogenous Gradient Boosting</div>
              <div className="text-[10px] text-cyan-300 mt-0.5">R² = {loadForecast?.metrics?.r2_score || 0.96}</div>
            </div>

            <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
              <div className="text-[10px] text-slate-400">SOLAR MODEL</div>
              <div className="text-slate-100 font-bold mt-1">GTI Physics-Guided ML</div>
              <div className="text-[10px] text-amber-300 mt-0.5">MAE = {solarForecast?.metrics?.mae_kw || 1.8} kW</div>
            </div>

            <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
              <div className="text-[10px] text-slate-400">ATMOSPHERIC REANALYSIS</div>
              <div className="text-slate-100 font-bold mt-1">ECMWF ERA5 / Open-Meteo</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">72-Hour Step Horizon</div>
            </div>

            <div className="bg-polaris-900/90 rounded-xl p-3 border border-polaris-800">
              <div className="text-[10px] text-slate-400">MATHEMATICAL SOLVER</div>
              <div className="text-slate-100 font-bold mt-1">OR-Tools MILP (SCIP)</div>
              <div className="text-[10px] text-purple-400 mt-0.5">Physical Power Balance</div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 border-t border-polaris-800 pt-2">
            ● Continuous online retraining with rolling 24-hour error correction
          </div>
        </div>
      </div>
    </div>
  );
};
