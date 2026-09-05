export interface LoadItem {
  id: string;
  name: string;
  power_kw: number;
  priority: 'CRITICAL' | 'IMPORTANT' | 'DEFERRABLE';
  flexible: boolean;
  min_op_pct: number;
  current_kw?: number;
  nominal_kw?: number;
}

export interface StationConfig {
  station_id?: string;
  station_name: string;
  operator?: string;
  location_name?: string;
  region?: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  solar_capacity_kw: number;
  solar_efficiency_pct: number;
  panel_tilt_deg: number;
  panel_azimuth_deg: number;
  battery_capacity_kwh: number;
  battery_soc_pct: number;
  battery_min_reserve_pct: number;
  battery_max_soc_pct: number;
  battery_max_charge_kw: number;
  battery_max_discharge_kw: number;
  battery_rte_pct: number;
  battery_health_pct: number;
  diesel_capacity_kw: number;
  diesel_fuel_l: number;
  diesel_consumption_l_per_kwh: number;
  diesel_min_load_pct: number;
  diesel_startup_min: number;
  occupants: number;
  operating_mode: string;
  research_intensity: number;
  heating_intensity: number;
  loads: LoadItem[];
}

export interface WeatherTelemetry {
  timestamp: string;
  temperature_c: number;
  apparent_temperature_c: number;
  wind_speed_kmh: number;
  wind_gusts_kmh: number;
  wind_direction_deg: number;
  cloud_cover_pct: number;
  precipitation_mm: number;
  snowfall_cm: number;
  solar_irradiance_wm2: number;
  direct_normal_irradiance_wm2: number;
  global_tilted_irradiance_wm2: number;
  diffuse_radiation_wm2: number;
  sunshine_duration_s: number;
  is_day: boolean;
  is_storm: boolean;
  storm_probability_pct: number;
}

export interface WeatherDataResponse {
  latitude: number;
  longitude: number;
  source: string;
  cached: boolean;
  fetched_at: string;
  current: WeatherTelemetry;
  forecast_72h: WeatherTelemetry[];
}

export interface InstantEnergyState {
  current_demand_kw: number;
  critical_load_kw: number;
  important_load_kw: number;
  deferrable_load_kw: number;
  solar_generation_kw: number;
  solar_direct_kw: number;
  solar_to_battery_kw: number;
  battery_soc_pct: number;
  battery_available_energy_kwh: number;
  battery_discharging_kw: number;
  battery_charging_kw: number;
  diesel_fuel_liters: number;
  generator_output_kw: number;
  generator_state: string;
  critical_load_coverage_pct: number;
  renewable_contribution_pct: number;
  evaluated_loads: LoadItem[];
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  solar_multiplier: number;
  demand_multiplier: number;
  temp_offset_c: number;
  wind_multiplier: number;
  generator_available: boolean;
  solar_available: boolean;
  /** Phase 2: starting rime ice coverage on PV panels (%). Replaces static battery_capacity_multiplier. */
  initial_ice_pct: number;
  /** Phase 2: optional scenario-specific ice aggressiveness coefficient. */
  humidity_factor_override?: number;
  duration_hours: number;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  color: string;
}

/**
 * Phase 2: Real-time physics state for dashboard gauges and alerts.
 * Exposed by the simulation engine per timestep and by the instant-state endpoint.
 */
export interface PhysicsState {
  /** Rime ice coverage on PV panels, 0–100 % */
  ice_coverage_pct: number;
  /** Direction ice is moving this tick */
  ice_trend: 'accumulating' | 'melting' | 'stable';
  /** Total thermal power recoverable from diesel generator (kW) */
  chp_heat_available_kw: number;
  /** Electrical heating demand being offset by CHP waste heat (kW) */
  chp_heat_displacing_kw: number;
  /** Whether battery thermal blankets are active */
  battery_heater_active: boolean;
  /** Parasitic draw of battery heater (kW) */
  battery_heater_kw: number;
  /** Actual round-trip efficiency after Arrhenius correction (%) */
  battery_eta_rte_pct: number;
  /** Percentage reduction in RTE vs nominal (e.g. 12.4 = 12.4% worse than spec) */
  arrhenius_derating_pct: number;
}

/**
 * A single hour timestep from a simulation track (Baseline or AI).
 * Phase 2 adds CHP, ice, and Arrhenius fields.
 */
export interface SimulationTimestep {
  hour: number;
  /** Raw station load (kW), excluding battery heater parasitic */
  demand_kw: number;
  critical_load_kw?: number;
  /** Total solar output after ice derating (kW) */
  solar_kw: number;
  solar_direct_kw: number;
  solar_charge_kw?: number;
  solar_to_battery_kw?: number;
  battery_discharge_kw: number;
  battery_soc_pct: number;
  battery_energy_kwh?: number;
  generator_kw: number;
  generator_active: boolean;
  curtailed_kw: number;
  fuel_remaining_l: number;
  fuel_consumed_l?: number;
  load_served_kw?: number;
  // ── Phase 2: Dynamic physics state ────────────────────────────────────
  /** Rime ice coverage on PV panels this hour (0–100 %) */
  ice_coverage_pct: number;
  /** Waste heat recovered from diesel generator (kW thermal) */
  chp_heat_kw: number;
  /** Electrical heating demand offset by CHP waste heat (kW) */
  chp_heat_displacing_kw: number;
  /** Parasitic battery thermal management draw (kW); 0 when T > -20°C */
  battery_heater_kw: number;
  /** Whether battery heater is active this tick */
  battery_heater_active: boolean;
  /** Arrhenius-adjusted round-trip efficiency this timestep (%) */
  eta_rte_pct: number;
  /** Electrical heating component of station demand (kW, CHP-offsettable) */
  thermal_load_kw: number;
}

export interface DualSimulationResult {
  scenario: ScenarioDefinition;
  duration_hours: number;
  metrics_comparison: {
    diesel_consumed_liters: { baseline: number; ai: number; unit: string };
    fuel_saved_liters: { value: number; percentage: number; unit: string };
    minimum_battery_soc: { baseline: number; ai: number; unit: string };
    critical_load_coverage: { baseline: number; ai: number; unit: string };
    renewable_utilization: { baseline: number; ai: number; unit: string };
    resilience_risk_score: { baseline: number; ai: number; unit: string };
    agent_interventions_count: number;
    plan_revisions_count: number;
  };
  baseline_timeline: SimulationTimestep[];
  ai_timeline: SimulationTimestep[];
  weather_timeline: WeatherTelemetry[];
  /** Phase 2: ice coverage % per hour, shared by both tracks */
  ice_trajectory?: number[];
}

export interface AgentLog {
  timestamp: string;
  agent: string;
  type: 'alert' | 'forecast' | 'plan' | 'reject' | 'replan' | 'approve' | 'execute';
  icon: string;
  message: string;
  details?: string;
}

export interface AgentCycleResult {
  status: string;
  scenario: string;
  agent_logs: AgentLog[];
  explainability: {
    title: string;
    summary: string;
    key_factors: { factor: string; value: string; impact: string }[];
    actions_taken: string[];
  };
  approval_status: {
    forecast_agent: string;
    energy_manager: string;
    safety_agent: string;
    reserve_margin_pct: number;
  };
}

// ── Catastrophic Crisis Response ────────────────────────────────────────────

export interface CrisisLoadItem {
  id: string;
  name: string;
  power_kw: number;
  rated_kw: number;
  status: 'ACTIVE' | 'SHED';
}

export interface CrisisLoadTier {
  loads: CrisisLoadItem[];
  total_kw: number;
  status: 'FULLY_POWERED' | 'SHED_TO_ZERO';
}

export interface CrisisResponse {
  status: string;
  station: string;
  fault: string;
  timestamp: string;
  generation: {
    solar_kw: number;
    diesel_kw: number;
    total_kw: number;
  };
  battery: {
    capacity_kwh: number;
    soc_pct: number;
    available_energy_kwh: number;
    status: string;
  };
  load_hierarchy: {
    p0_life_support: CrisisLoadTier;
    p1_bess_heating: CrisisLoadTier;
    p2_science_rover: CrisisLoadTier;
  };
  survival: {
    p0_load_kw: number;
    p0_exergy_remaining_hours: number;
    p0_exergy_remaining_minutes: number;
    runway_display: string;
  };
  webhook: {
    url: string;
    fired: boolean;
    response_status: number | null;
  };
  edge_databases: {
    weather_cache: string;
    scada_telemetry: string;
    crisis_logged: boolean;
  };
}


export interface P0P1P2Status {
  p0_active: boolean;
  p1_active: boolean;
  p2_active: boolean;
}

export interface HybridTimeFrame {
  hour: number;
  timestamp: string;
  temperature_c: number;
  solar_pv_yield_kw: number;
  generator_output_kw: number;
  chp_heat_displacing_kw: number;
  battery_soc_pct: number;
  battery_heater_kw: number;
  p0_p1_p2_status: P0P1P2Status;
  thermal_death_runway_hours: number;
  total_load_kw: number;
}

export interface HybridForecastResponse {
  baseline_series: HybridTimeFrame[];
  optimized_series: HybridTimeFrame[];
}

export interface LoadAnalysisFrame {
  hour: string;
  baseline_kw: number;
  ai_p10_kw: number;
  ai_p50_kw: number;
  ai_p90_kw: number;
  habitat_heating_kw: number;
  life_support_kw: number;
  battery_jacket_kw: number;
  science_labs_kw: number;
  temperature_c: number;
  wind_kmh: number;
}

export interface LoadAnalysisKPIs {
  wind_chill_penalty_kw: number;
  forecast_error_reduction_pct: number;
  thermal_inertia_lag_hours: number;
}

export interface LoadAnalysisResponse {
  series: LoadAnalysisFrame[];
  kpis: LoadAnalysisKPIs;
  generator_capacity_kw: number;
}
