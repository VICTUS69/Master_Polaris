"""
POLARIS Polar Physics Engine
Pure, side-effect-free functions implementing the three Phase 2 physics models:

  1. Arrhenius Battery Derating  — dynamic RTE decay and parasitic heater load
  2. Rime Ice Accretion          — accumulator state variable across timesteps
  3. CHP Thermal-Electrical Coupling — waste heat displacing electrical heating demand

All functions accept plain scalars / lists and return plain scalars / lists.
They are imported identically by both the optimizer and the simulation engine
so the physics calculations are NEVER duplicated or diverged.
"""

import math
from typing import Dict, Any, List, Optional, Tuple


# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────

# Arrhenius decay coefficient for Li-NMC/LFP cells below -10 °C.
# Calibrated to ~22% RTE reduction at -30 °C (knee of published cold-temp curves).
ARRHENIUS_ALPHA: float = 0.025          # per °C

# Temperature threshold below which Arrhenius decay activates (°C)
ARRHENIUS_THRESHOLD_C: float = -10.0

# Absolute minimum RTE floor (below which cells are considered non-functional)
RTE_MIN_FLOOR: float = 0.60

# Temperature threshold below which parasitic battery heater activates (°C)
HEATER_ACTIVATION_TEMP_C: float = -20.0

# Parasitic battery heater draw as fraction of installed capacity (kW per kWh)
# 0.5% per kWh → 3.0 kW for a 600 kWh bank (consistent with BMS thermal specs)
HEATER_DRAW_FRACTION: float = 0.005

# CHP waste-heat recovery coefficient:
# Diesel gen: ~35% electrical, ~45% recoverable thermal  →  0.45 / 0.35 = 1.286 ≈ 1.3
CHP_C_THERMAL: float = 1.3             # kW_thermal per kW_electrical

# Maximum rime-ice coverage (%)
ICE_MAX_PCT: float = 100.0

# Minimum wind speed (km/h) required for rime-ice accretion to occur
ICE_WIND_THRESHOLD_KMH: float = 15.0

# Base accretion rate: % ice per (km/h · hour) before humidity scaling
ICE_ACCRETION_BASE: float = 0.08

# Melt rate when ambient temperature > 0 °C (% per hour)
ICE_MELT_RATE_PCT_H: float = 5.0

# Solar opacity factor: fraction of solar output blocked per 1% ice coverage
# At 100% ice → 85% of solar is blocked; 15% diffuse still passes through
ICE_OPACITY_FACTOR: float = 0.0085


# ─────────────────────────────────────────────────────────────────────────────
# 1. ARRHENIUS BATTERY DERATING
# ─────────────────────────────────────────────────────────────────────────────

def compute_arrhenius_rte(
    base_rte_fraction: float,
    temp_c: float,
) -> Tuple[float, float]:
    """
    Returns the temperature-adjusted charge and discharge efficiency (eta_chg, eta_dis)
    for the current ambient temperature using an Arrhenius exponential decay model.

    Below ARRHENIUS_THRESHOLD_C (-10 °C), Li-ion internal resistance rises
    exponentially, reducing the effective round-trip efficiency.

    Physics:
        rte_adjusted = base_rte * exp(alpha * (T_c - T_ref))   for T_c < T_ref
        eta_chg = eta_dis = sqrt(rte_adjusted)

    Args:
        base_rte_fraction: Nominal round-trip efficiency at standard conditions (0–1.0).
        temp_c:            Ambient temperature in degrees Celsius.

    Returns:
        (eta_chg, eta_dis): Symmetric charge / discharge one-way efficiencies (0–1.0).
    """
    if temp_c >= ARRHENIUS_THRESHOLD_C:
        rte = base_rte_fraction
    else:
        delta_t = temp_c - ARRHENIUS_THRESHOLD_C   # negative below threshold
        rte = base_rte_fraction * math.exp(ARRHENIUS_ALPHA * delta_t)
        rte = max(RTE_MIN_FLOOR, rte)

    eta = math.sqrt(rte)
    return eta, eta


def compute_arrhenius_rte_pct(base_rte_pct: float, temp_c: float) -> float:
    """
    Convenience wrapper returning the adjusted RTE as a percentage (0–100).
    """
    eta_chg, _ = compute_arrhenius_rte(base_rte_pct / 100.0, temp_c)
    return round(eta_chg ** 2 * 100.0, 2)   # RTE = eta_chg * eta_dis = eta²


def compute_battery_parasitic_load(batt_cap_kwh: float, temp_c: float) -> float:
    """
    Returns the continuous parasitic power draw (kW) of the battery thermal
    management system (heating blankets / immersion heaters) when ambient
    temperature falls below HEATER_ACTIVATION_TEMP_C (-20 °C).

    This load is treated as a firm station demand — it cannot be curtailed
    without risking lithium plating and permanent cell damage.

    Args:
        batt_cap_kwh: Installed battery capacity in kWh.
        temp_c:       Ambient temperature in °C.

    Returns:
        Heater draw in kW (0.0 if above threshold).
    """
    if temp_c < HEATER_ACTIVATION_TEMP_C:
        return round(batt_cap_kwh * HEATER_DRAW_FRACTION, 2)
    return 0.0


def compute_arrhenius_capacity_derate(base_capacity_kwh: float, temp_c: float) -> float:
    """
    Returns the effective usable capacity (kWh) accounting for capacity fade
    due to low temperature. Uses same Arrhenius coefficient, capped at RTE_MIN_FLOOR.

    Note: This is separate from the RTE effect. Cold temperatures reduce BOTH
    usable capacity (fewer kWh stored) AND efficiency (losses per cycle).
    """
    if temp_c >= ARRHENIUS_THRESHOLD_C:
        return base_capacity_kwh
    delta_t = temp_c - ARRHENIUS_THRESHOLD_C
    derate = math.exp(ARRHENIUS_ALPHA * 0.5 * delta_t)  # half-strength for capacity
    derate = max(0.75, derate)   # capacity floor at 75% (physical limit for Li cells)
    return round(base_capacity_kwh * derate, 2)


# ─────────────────────────────────────────────────────────────────────────────
# 2. RIME ICE ACCRETION ACCUMULATOR
# ─────────────────────────────────────────────────────────────────────────────

def compute_ice_trajectory(
    weather_forecast: List[Dict[str, Any]],
    initial_ice_pct: float = 0.0,
    mechanical_clearing_hours: Optional[List[int]] = None,
) -> List[float]:
    """
    Computes the hour-by-hour rime ice coverage percentage (0–100) on the
    solar PV panel surface across the simulation horizon.

    Ice is NOT an instantaneous state — it accumulates during storms and
    only melts when ambient temperature rises above 0 °C or manual clearing.

    Accretion model:
        ΔI = (wind_kmh / 100) * humidity_factor * 8.0   [% per hour]
        where humidity_factor = 1 + 2 * snowfall_cm

    Melt model:
        ΔI = -ICE_MELT_RATE_PCT_H   [only if T > 0 °C]

    Args:
        weather_forecast:          Hourly forecast records (must contain
                                   temperature_c, wind_speed_kmh, snowfall_cm).
        initial_ice_pct:           Starting ice coverage at t=0 (%).
        mechanical_clearing_hours: List of timestep indices at which a manual
                                   panel clearing event occurs (ice → 0%).

    Returns:
        List of ice coverage percentages, one per forecast timestep.
    """
    clearing_set = set(mechanical_clearing_hours or [])
    ice_pct = float(initial_ice_pct)
    trajectory: List[float] = []

    for t, step in enumerate(weather_forecast):
        # Manual clearing event resets ice to zero
        if t in clearing_set:
            ice_pct = 0.0

        temp_c    = float(step.get("temperature_c", -15.0))
        wind_kmh  = float(step.get("wind_speed_kmh", 25.0))
        snowfall  = float(step.get("snowfall_cm", 0.0))

        if temp_c > 0.0:
            # Above freezing → melting
            ice_pct = max(0.0, ice_pct - ICE_MELT_RATE_PCT_H)
        elif wind_kmh >= ICE_WIND_THRESHOLD_KMH:
            # Sub-zero with sufficient wind → accretion
            humidity_factor = 1.0 + 2.0 * max(0.0, snowfall)
            accretion = (wind_kmh / 100.0) * humidity_factor * (ICE_ACCRETION_BASE / 0.08 * 8.0)
            ice_pct = min(ICE_MAX_PCT, ice_pct + accretion)
        # else: calm sub-zero night — ice persists unchanged

        trajectory.append(round(ice_pct, 2))

    return trajectory


def apply_ice_solar_derating(solar_ideal_kw: float, ice_pct: float) -> float:
    """
    Returns the actual solar output (kW) after rime ice opacity derating.

        P_solar = P_ideal * max(0, 1 - ice_pct * OPACITY_FACTOR)

    At 100% ice: 85% blockage, 15% diffuse still passes.
    At 0% ice:   no derating.

    Args:
        solar_ideal_kw: Solar output under current irradiance (pre-ice).
        ice_pct:        Current ice coverage on panels (0–100 %).

    Returns:
        Derated solar output in kW.
    """
    derate = max(0.0, 1.0 - (ice_pct * ICE_OPACITY_FACTOR))
    return round(solar_ideal_kw * derate, 3)


def compute_ice_derate_factor(ice_pct: float) -> float:
    """
    Returns the scalar derating factor (0.0–1.0) for a given ice coverage.
    Used to pre-compute parameters for the MILP optimizer.
    """
    return max(0.0, 1.0 - (ice_pct * ICE_OPACITY_FACTOR))


# ─────────────────────────────────────────────────────────────────────────────
# 3. CHP THERMAL-ELECTRICAL COUPLING
# ─────────────────────────────────────────────────────────────────────────────

def compute_chp_heat_available(p_gen_kw: float, c_thermal: float = CHP_C_THERMAL) -> float:
    """
    Returns the recoverable thermal power (kW) from the diesel generator at
    a given electrical output level.

    Physics:
        P_fuel   = P_gen / eta_elec   (eta_elec ≈ 0.35 for diesel genset)
        Q_recov  = P_fuel * 0.45      (45% of fuel energy as jacket / exhaust heat)
        ⟹  Q_recov = P_gen * (0.45 / 0.35) = P_gen * 1.286 ≈ P_gen * C_thermal

    Args:
        p_gen_kw:  Generator electrical output (kW).
        c_thermal: Waste-heat recovery coefficient (default 1.3).

    Returns:
        Recoverable thermal power in kW.
    """
    return round(max(0.0, p_gen_kw * c_thermal), 2)


def compute_chp_heat_displaced(
    p_gen_kw: float,
    heat_demand_kw: float,
    c_thermal: float = CHP_C_THERMAL,
) -> float:
    """
    Returns the portion of the electrical heating demand that is met by CHP
    waste heat, reducing the net electrical demand on the microgrid.

        H_displaced = min(P_gen * C_thermal, heat_demand)

    NOTE: In the MILP this is implemented as a linear auxiliary variable.
    This function is used in the sequential simulation tracks (not the MILP).

    Args:
        p_gen_kw:      Generator electrical output (kW).
        heat_demand_kw: Station electrical heating load this timestep (kW).
        c_thermal:     Waste-heat recovery coefficient.

    Returns:
        Electrical heating demand offset by CHP waste heat (kW).
    """
    heat_available = p_gen_kw * c_thermal
    return round(min(heat_available, max(0.0, heat_demand_kw)), 2)


def compute_net_electrical_heating(
    total_heat_demand_kw: float,
    p_gen_kw: float,
    c_thermal: float = CHP_C_THERMAL,
) -> float:
    """
    Returns the residual electrical heating demand after CHP waste heat offset.

        L_elec_heat = max(0, L_heat_total - P_gen * C_thermal)

    Args:
        total_heat_demand_kw: Total station thermal heating requirement (kW electrical equiv.)
        p_gen_kw:            Generator electrical output (kW).
        c_thermal:           Waste-heat recovery coefficient.

    Returns:
        Remaining electrical heating load (kW).
    """
    return round(max(0.0, total_heat_demand_kw - p_gen_kw * c_thermal), 2)


# ─────────────────────────────────────────────────────────────────────────────
# COMPOSITE HELPER — used by the simulation engine per timestep
# ─────────────────────────────────────────────────────────────────────────────

def compute_timestep_physics(
    temp_c: float,
    wind_kmh: float,
    snowfall_cm: float,
    p_gen_kw: float,
    heat_demand_kw: float,
    batt_cap_kwh: float,
    base_rte: float,
    current_ice_pct: float,
    prev_ice_pct: float,
    mechanical_clear: bool = False,
) -> Dict[str, Any]:
    """
    Computes all three physics models for a single simulation timestep.
    Returns a flat dict suitable for merging into a timestep output record.

    This is the single authoritative physics call in the sequential engine.
    """
    # 1. Arrhenius battery
    eta_chg, eta_dis = compute_arrhenius_rte(base_rte, temp_c)
    heater_kw = compute_battery_parasitic_load(batt_cap_kwh, temp_c)
    rte_pct = round(eta_chg * eta_dis * 100.0, 2)
    arrhenius_derating_pct = round((1.0 - rte_pct / (base_rte * 100.0)) * 100.0, 1)

    # 2. Ice accretion (single step update)
    ice = 0.0 if mechanical_clear else current_ice_pct
    if temp_c > 0.0:
        ice = max(0.0, ice - ICE_MELT_RATE_PCT_H)
    elif wind_kmh >= ICE_WIND_THRESHOLD_KMH:
        humidity_factor = 1.0 + 2.0 * max(0.0, snowfall_cm)
        accretion = (wind_kmh / 100.0) * humidity_factor * 8.0
        ice = min(ICE_MAX_PCT, ice + accretion)
    ice = round(ice, 2)
    ice_derate_factor = compute_ice_derate_factor(ice)

    # Ice trend
    if ice > prev_ice_pct + 0.5:
        ice_trend = "accumulating"
    elif ice < prev_ice_pct - 0.5:
        ice_trend = "melting"
    else:
        ice_trend = "stable"

    # 3. CHP
    chp_heat_kw = compute_chp_heat_available(p_gen_kw)
    chp_displaced_kw = compute_chp_heat_displaced(p_gen_kw, heat_demand_kw)

    return {
        # Arrhenius
        "eta_chg": eta_chg,
        "eta_dis": eta_dis,
        "eta_rte_pct": rte_pct,
        "arrhenius_derating_pct": arrhenius_derating_pct,
        "battery_heater_kw": heater_kw,
        "battery_heater_active": heater_kw > 0.0,
        # Ice
        "ice_coverage_pct": ice,
        "ice_derate_factor": ice_derate_factor,
        "ice_trend": ice_trend,
        # CHP
        "chp_heat_kw": chp_heat_kw,
        "chp_heat_displacing_kw": chp_displaced_kw,
    }
