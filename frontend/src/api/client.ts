import {
  StationConfig,
  WeatherDataResponse,
  InstantEnergyState,
  DualSimulationResult,
  AgentCycleResult,
  ScenarioDefinition
} from '../types';

const API_BASE = '/api';

export const apiClient = {
  // Fetch Presets
  async getPresets(): Promise<{ stations: StationConfig[] }> {
    const res = await fetch(`${API_BASE}/station/presets`);
    if (!res.ok) throw new Error('Failed to load presets');
    return res.json();
  },

  // Fetch Live / Forecast Weather from Open-Meteo
  async getLiveWeather(lat: number, lon: number, days: number = 4): Promise<WeatherDataResponse> {
    const res = await fetch(`${API_BASE}/weather/live?lat=${lat}&lon=${lon}&days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch live weather telemetry');
    return res.json();
  },

  // Calculate Instant Microgrid State
  async calculateInstantState(
    config: StationConfig,
    temperature_c: number,
    wind_speed_kmh: number,
    gti_wm2: number
  ): Promise<InstantEnergyState> {
    const res = await fetch(
      `${API_BASE}/station/calculate-state?temperature_c=${temperature_c}&wind_speed_kmh=${wind_speed_kmh}&gti_wm2=${gti_wm2}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      }
    );
    if (!res.ok) throw new Error('Failed to calculate microgrid state');
    return res.json();
  },

  // Run AI Forecasting Pipeline
  async runForecastPipeline(config: StationConfig): Promise<any> {
    const res = await fetch(`${API_BASE}/forecast/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: config.latitude,
        longitude: config.longitude,
        solar_capacity_kw: config.solar_capacity_kw,
        solar_efficiency_pct: config.solar_efficiency_pct,
        battery_capacity_kwh: config.battery_capacity_kwh,
        battery_soc_pct: config.battery_soc_pct,
        occupants: config.occupants,
        operating_mode: config.operating_mode,
        research_intensity: config.research_intensity,
        heating_intensity: config.heating_intensity,
        loads: config.loads
      })
    });
    if (!res.ok) throw new Error('Failed to run forecast pipeline');
    return res.json();
  },

  // Run Optimal Schedule Solver (OR-Tools)
  async solveOptimization(
    config: StationConfig,
    horizon_hours: number = 24,
    reserve_boost: number = 0.0
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/optimization/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        station_config: config,
        planning_horizon_hours: horizon_hours,
        emergency_reserve_boost_pct: reserve_boost
      })
    });
    if (!res.ok) throw new Error('Optimization solver failed');
    return res.json();
  },

  // Get Scenarios
  async getScenarios(): Promise<{ scenarios: ScenarioDefinition[] }> {
    const res = await fetch(`${API_BASE}/simulation/scenarios`);
    if (!res.ok) throw new Error('Failed to fetch scenarios');
    return res.json();
  },

  // Run Dual Track Simulation (Baseline vs Polaris AI)
  async runSimulation(config: StationConfig, scenarioId: string): Promise<DualSimulationResult> {
    const res = await fetch(`${API_BASE}/simulation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        station_config: config,
        scenario_id: scenarioId
      })
    });
    if (!res.ok) throw new Error('Simulation failed to execute');
    return res.json();
  },

  // Run Agent Orchestration Cycle
  async orchestrateAgents(
    config: StationConfig,
    scenarioId: string,
    simResult?: DualSimulationResult
  ): Promise<AgentCycleResult> {
    const res = await fetch(`${API_BASE}/agents/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        station_config: config,
        scenario_id: scenarioId,
        simulation_results: simResult
      })
    });
    if (!res.ok) throw new Error('Agent orchestration failed');
    return res.json();
  }
};
