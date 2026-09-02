import React, { useEffect } from 'react';
import { usePolarisStore } from '../store/usePolarisStore';
import { Activity, Wind, ThermometerSnowflake, Zap, Battery, AlertTriangle, Terminal } from 'lucide-react';

// Reusable micro-component for telemetry metrics
const TelemetryCard = ({ title, value, unit, icon: Icon, alert = false }: { title: string, value: string, unit: string, icon: any, alert?: boolean }) => (
  <div className={`p-4 border bg-opacity-10 backdrop-blur-md rounded-lg flex items-center justify-between transition-colors duration-300 ${alert ? 'border-red-500 bg-red-950 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-cyan-900 bg-slate-900 text-cyan-500 hover:border-cyan-500'}`}>
    <div>
      <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-1">{title}</h3>
      <div className="text-2xl font-mono font-bold">
        {value} <span className="text-sm text-slate-500">{unit}</span>
      </div>
    </div>
    <div className={`p-3 rounded-full ${alert ? 'bg-red-500/20' : 'bg-cyan-900/30'}`}>
      <Icon size={24} className={alert ? 'text-red-500 animate-pulse' : 'text-cyan-400'} />
    </div>
  </div>
);

export const PolarisDashboard = () => {
  // Action Selector
  const connectWebSocket = usePolarisStore(state => state.connectWebSocket);
  const status = usePolarisStore(state => state.connectionStatus);
  
  // Granular State Selectors (Prevents full DOM re-renders on every tick)
  const hour = usePolarisStore(state => state.simulation_hour);
  const temp = usePolarisStore(state => state.temperature_c);
  const wind = usePolarisStore(state => state.wind_kmh);
  const soc = usePolarisStore(state => state.battery_soc_pct);
  const genOutput = usePolarisStore(state => state.generator_output_kw);
  const shortfall = usePolarisStore(state => state.critical_shortfall_kw);
  const agentLog = usePolarisStore(state => state.latest_agent_log);

  // Initialize Data Stream
  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  // Derived state
  const isEmergency = shortfall > 0 || status === 'disconnected';

  return (
    <div className={`min-h-screen p-6 font-sans text-slate-200 transition-colors duration-1000 ${isEmergency ? 'bg-black' : 'bg-slate-950'}`}>
      
      {/* HEADER BAR */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Activity className={status === 'connected' ? 'text-emerald-500 animate-pulse' : 'text-amber-500'} />
          <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-slate-100">
            Polaris <span className="text-cyan-500">SCADA</span>
          </h1>
        </div>
        <div className="font-mono text-lg flex items-center gap-4">
          <span className="text-slate-500">SIM_HOUR:</span>
          <span className="text-cyan-400 font-bold bg-cyan-950 px-3 py-1 rounded border border-cyan-900">
            {hour.toString().padStart(2, '0')}:00
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT ZONE: TELEMETRY GRID */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-bold border-b border-slate-800 pb-2">Environmental</h2>
          <TelemetryCard title="External Temp" value={temp.toFixed(1)} unit="°C" icon={ThermometerSnowflake} alert={temp < -40} />
          <TelemetryCard title="Wind Speed" value={wind.toFixed(1)} unit="km/h" icon={Wind} alert={wind > 100} />
          
          <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-4 mt-8 font-bold border-b border-slate-800 pb-2">Microgrid Status</h2>
          <TelemetryCard title="Battery SoC" value={soc.toFixed(1)} unit="%" icon={Battery} alert={soc < 30} />
          <TelemetryCard title="Generator" value={genOutput.toFixed(1)} unit="kW" icon={Zap} alert={genOutput > 200} />
          
          {/* Dynamically render the soft constraint alarm */}
          {shortfall > 0 && (
             <TelemetryCard title="CRITICAL SHORTFALL" value={shortfall.toFixed(1)} unit="kW" icon={AlertTriangle} alert={true} />
          )}
        </div>

        {/* CENTER ZONE: DIGITAL TWIN CANVAS */}
        <div className="lg:col-span-2 border border-slate-800 bg-slate-900/50 rounded-xl flex items-center justify-center relative overflow-hidden group">
          {/* Atmospheric ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/10 to-transparent pointer-events-none transition-opacity duration-500" />
          
          <div className="text-center z-10">
            <Zap className="mx-auto mb-4 text-cyan-800 group-hover:text-cyan-500 transition-colors duration-700" size={48} />
            <p className="text-sm font-mono text-slate-600 tracking-widest uppercase">Digital Twin Render Canvas</p>
            <p className="text-xs text-slate-700 mt-2">Awaiting 3D engine hooks...</p>
          </div>
          
          {/* CRT Scanline overlay effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
        </div>

        {/* RIGHT ZONE: ADVISORY AI TERMINAL */}
        <div className="lg:col-span-1 flex flex-col">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-bold border-b border-slate-800 pb-2 flex items-center gap-2">
            <Terminal size={14} /> Advisory AI
          </h2>
          <div className="flex-1 border border-slate-800 bg-black rounded-lg p-4 font-mono text-sm relative overflow-hidden flex flex-col justify-end min-h-[300px]">
            {/* Cyberpunk top border glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30" />
            
            <p className="text-cyan-500 animate-pulse mb-2">_</p>
            <p className="text-slate-300 leading-relaxed border-l-2 border-cyan-500 pl-3">
              {agentLog}
            </p>
            
            {/* Soft vignette to fade older text if we implement a scrolling log later */}
            <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-black to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
