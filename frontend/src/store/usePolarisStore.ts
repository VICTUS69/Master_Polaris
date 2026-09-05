import { create } from 'zustand';
import { HybridForecastResponse, LoadAnalysisResponse } from '../types';

export interface PolarisSystemState {
  simulation_hour: number;
  temperature_c: number;
  wind_kmh: number;
  solar_irradiance_wm2: number;
  ice_coverage_pct: number;
  solar_generation_kw: number;
  battery_soc_pct: number;
  battery_heater_kw: number;
  generator_output_kw: number;
  chp_heat_recovered_kw: number;
  demand_critical_kw: number;
  demand_deferrable_kw: number;
  load_curtailed_kw: number;
  critical_shortfall_kw: number;
  latest_agent_log: string;
}

interface PolarisStore extends PolarisSystemState {
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  hybridForecast: HybridForecastResponse | null;
  forecastMode: 'baseline' | 'optimized' | 'comparative';
  setForecastMode: (mode: 'baseline' | 'optimized' | 'comparative') => void;
  fetchHybridForecast: () => Promise<void>;
  loadAnalysis: LoadAnalysisResponse | null;
  fetchLoadAnalysis: () => Promise<void>;
  hoveredHour: number | null;
  setHoveredHour: (hour: number | null) => void;
  selectedHour: number | null;
  setSelectedHour: (hour: number | null) => void;
  connectWebSocket: () => void;
  updateState: (data: Partial<PolarisSystemState>) => void;
}

export const usePolarisStore = create<PolarisStore>((set, get) => ({
  // Initial State (Zeroed out)
  simulation_hour: 0,
  temperature_c: 0,
  wind_kmh: 0,
  solar_irradiance_wm2: 0,
  ice_coverage_pct: 0,
  solar_generation_kw: 0,
  battery_soc_pct: 100,
  battery_heater_kw: 0,
  generator_output_kw: 0,
  chp_heat_recovered_kw: 0,
  demand_critical_kw: 0,
  demand_deferrable_kw: 0,
  load_curtailed_kw: 0,
  critical_shortfall_kw: 0,
  latest_agent_log: 'SYSTEM INITIALIZING...',
  
  connectionStatus: 'disconnected',
  hybridForecast: null,
  loadAnalysis: null,
  hoveredHour: null,
  setHoveredHour: (hour) => set({ hoveredHour: hour }),
  selectedHour: null,
  setSelectedHour: (hour) => set({ selectedHour: hour }),
  fetchLoadAnalysis: async () => {
    try {
        const response = await fetch('http://localhost:8000/api/forecast/load/analysis');
        const data = await response.json();
        set({ loadAnalysis: data });
    } catch (e) {
        console.error('Failed to fetch load analysis', e);
    }
  },
  forecastMode: 'comparative',
  setForecastMode: (mode) => set({ forecastMode: mode }),
  fetchHybridForecast: async () => {
    try {
        const response = await fetch('http://localhost:8000/api/forecast/hybrid');
        const data = await response.json();
        set({ hybridForecast: data });
    } catch (e) {
        console.error('Failed to fetch hybrid forecast', e);
    }
  },

  updateState: (data) => set((state) => ({ ...state, ...data })),

  connectWebSocket: () => {
    // Prevent multiple connections
    if (get().connectionStatus === 'connected' || get().connectionStatus === 'connecting') return;

    set({ connectionStatus: 'connecting', latest_agent_log: 'ESTABLISHING SECURE DATALINK...' });
    
    // Connect to the FastAPI WebSocket router we built earlier
    const ws = new WebSocket('ws://localhost:8000/api/simulation/ws/stream');

    ws.onopen = () => {
      set({ connectionStatus: 'connected', latest_agent_log: 'SCADA DATALINK ESTABLISHED. AWAITING TELEMETRY...' });
    };

    ws.onmessage = (event) => {
      try {
        const data: PolarisSystemState = JSON.parse(event.data);
        get().updateState(data);
      } catch (error) {
        console.error('Failed to parse WebSocket payload:', error);
      }
    };

    ws.onclose = () => {
      set({ connectionStatus: 'disconnected', latest_agent_log: 'CRITICAL: SCADA DATALINK LOST. RECONNECTING...' });
      // Infinite aggressive reconnect loop for high availability
      setTimeout(() => {
        get().connectWebSocket();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      ws.close(); // Forcing close triggers the onclose reconnect logic
    };
  }
}));
