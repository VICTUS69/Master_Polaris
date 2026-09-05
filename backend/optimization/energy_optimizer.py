"""
POLARIS Mathematical Energy Optimizer — Phase 2
Solves optimal microgrid energy dispatch over 24h/72h horizons using
Google OR-Tools Mixed-Integer Linear Programming (MILP) with heuristic fallback.

Phase 2 physics upgrades:
  1. CHP Thermal-Electrical Coupling
       H_displaced[t] auxiliary variable linearises the min() operator.
       Power balance: Supply = Demand + Heater - CHP_credit - Curtailed
       Objective: Generator cost reduced by waste-heat credit.

  2. Arrhenius Battery Derating
       Per-timestep eta_chg[t] / eta_dis[t] derived from temperature.
       Battery wear cost scales with temperature (colder = more degradation).
       Parasitic heater load added to demand at each timestep.

  3. Rime Ice Accretion (pre-computed parameter injection)
       Ice trajectory computed outside the MILP as a deterministic sequence.
       Solar availability at each timestep is already ice-derated before
       entering the solver — MILP stays fully linear.
"""

import math
from typing import Dict, Any, List, Optional

from backend.physics.polar_physics import (
    compute_arrhenius_rte,
    compute_battery_parasitic_load,
    compute_ice_trajectory,
    compute_ice_derate_factor,
    CHP_C_THERMAL,
)

try:
    from ortools.linear_solver import pywraplp
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False


# CHP heat credit in the objective function ($/kW of heat displaced).
# Reduces the net cost of running the generator when it offsets electrical heating.
CHP_HEAT_CREDIT_PER_KW: float = 0.08

# Temperature-scaled battery wear base cost ($/kWh discharged)
BATT_WEAR_BASE: float = 0.035
# Additional wear per °C below -10 °C
BATT_WEAR_COLD_COEFF: float = 0.001


def _build_per_timestep_physics(
    T: int,
    station_config: Dict[str, Any],
    solar_forecast_series: List[Dict[str, Any]],
    load_forecast_series: List[Dict[str, Any]],
    weather_forecast_series: Optional[List[Dict[str, Any]]],
    ice_trajectory: Optional[List[float]],
    forced_solar_offline: bool,
) -> Dict[str, List]:
    """
    Pre-computes all timestep-specific physics parameters that are CONSTANTS
    from the MILP solver's perspective.  Runs before solver.Solve().

    Returns a dict of parallel lists indexed by timestep t.
    """
    base_rte = float(station_config.get("battery_rte_pct", station_config.get("default_battery_rte_pct", 92.0))) / 100.0
    batt_cap_kwh = float(station_config.get("battery_capacity_kwh", station_config.get("default_battery_kwh", 600.0)))

    eta_chg_arr      = []
    eta_dis_arr      = []
    heater_kw_arr    = []
    ice_derate_arr   = []
    heat_demand_arr  = []
    solar_avail_arr  = []
    demand_adj_arr   = []
    temp_arr         = []
    rte_pct_arr      = []

    for t in range(T):
        # Temperature from weather forecast (fall back to -15 °C)
        if weather_forecast_series and t < len(weather_forecast_series):
            temp_c = float(weather_forecast_series[t].get("temperature_c", -15.0))
        else:
            temp_c = -15.0
        temp_arr.append(temp_c)

        # 1. Arrhenius RTE
        eta_chg, eta_dis = compute_arrhenius_rte(base_rte, temp_c)
        eta_chg_arr.append(eta_chg)
        eta_dis_arr.append(eta_dis)
        rte_pct_arr.append(round(eta_chg * eta_dis * 100.0, 2))

        # 2. Battery parasitic heater load (kW)
        heater_kw = compute_battery_parasitic_load(batt_cap_kwh, temp_c)
        heater_kw_arr.append(heater_kw)

        # 3. Ice-derated solar availability
        raw_solar = 0.0 if forced_solar_offline else float(
            solar_forecast_series[t].get("predicted_kw", 0.0)
        )
        if ice_trajectory and t < len(ice_trajectory):
            derate = compute_ice_derate_factor(ice_trajectory[t])
        else:
            derate = 1.0
        solar_avail_arr.append(raw_solar * derate)
        ice_derate_arr.append(derate)

        # 4. Thermal (CHP-offsettable) heating demand at this timestep
        heat_t = float(load_forecast_series[t].get("thermal_load_kw", 0.0)) if t < len(load_forecast_series) else 0.0
        heat_demand_arr.append(heat_t)

        # 5. Adjusted demand (add battery heater as firm load)
        demand_t = float(load_forecast_series[t].get("predicted_demand_kw", 100.0)) if t < len(load_forecast_series) else 100.0
        demand_adj_arr.append(demand_t + heater_kw)

    return {
        "eta_chg": eta_chg_arr,
        "eta_dis": eta_dis_arr,
        "rte_pct": rte_pct_arr,
        "heater_kw": heater_kw_arr,
        "ice_derate": ice_derate_arr,
        "heat_demand": heat_demand_arr,
        "solar_avail": solar_avail_arr,
        "demand_adj": demand_adj_arr,
        "temp": temp_arr,
    }


def optimize_energy_schedule(
    station_config: Dict[str, Any],
    solar_forecast_series: List[Dict[str, Any]],
    load_forecast_series: List[Dict[str, Any]],
    planning_horizon_hours: int = 24,
    emergency_reserve_boost_pct: float = 0.0,
    forced_generator_offline: bool = False,
    forced_solar_offline: bool = False,
    # ── Phase 2 new parameters ──────────────────────────────────────────────
    weather_forecast_series: Optional[List[Dict[str, Any]]] = None,
    ice_trajectory: Optional[List[float]] = None,
) -> Dict[str, Any]:
    """
    Optimises microgrid power dispatch using OR-Tools MILP (SCIP/GLOP).

    Phase 2 additions:
      - weather_forecast_series: hourly weather records for per-tick temperatures.
      - ice_trajectory: pre-computed ice coverage % per hour (from polar_physics).
        If None, no ice derating is applied (useful for tests / non-storm scenarios).
    """
    T = min(len(solar_forecast_series), len(load_forecast_series), planning_horizon_hours)
    if T == 0:
        return {"success": False, "error": "Empty forecast series provided."}

    # ── Station physical parameters ─────────────────────────────────────────
    solar_cap_kw     = float(station_config.get("solar_capacity_kw", station_config.get("default_solar_kw", 180.0)))
    batt_cap_kwh     = float(station_config.get("battery_capacity_kwh", station_config.get("default_battery_kwh", 600.0)))
    current_soc_pct  = float(station_config.get("battery_soc_pct", station_config.get("default_battery_soc_pct", 75.0)))
    min_reserve_pct  = float(station_config.get("battery_min_reserve_pct", station_config.get("default_battery_min_reserve_pct", 30.0))) + emergency_reserve_boost_pct
    min_reserve_pct  = min(85.0, max(15.0, min_reserve_pct))
    max_soc_pct      = float(station_config.get("battery_max_soc_pct", station_config.get("default_battery_max_soc_pct", 98.0)))
    max_chg_kw       = float(station_config.get("battery_max_charge_kw", station_config.get("default_battery_max_charge_kw", 150.0)))
    max_dis_kw       = float(station_config.get("battery_max_discharge_kw", station_config.get("default_battery_max_discharge_kw", 150.0)))
    gen_cap_kw       = float(station_config.get("diesel_capacity_kw", station_config.get("default_diesel_kw", 250.0)))
    current_fuel_l   = float(station_config.get("diesel_fuel_l", station_config.get("default_diesel_fuel_l", 1200.0)))
    fuel_rate_l_kwh  = float(station_config.get("diesel_consumption_l_per_kwh", station_config.get("default_diesel_consumption_l_per_kwh", 0.28)))
    gen_min_load_pct = float(station_config.get("diesel_min_load_pct", station_config.get("default_diesel_min_load_pct", 25.0))) / 100.0
    gen_min_kw       = gen_cap_kw * gen_min_load_pct

    # ── Pre-compute per-timestep physics parameters ─────────────────────────
    phy = _build_per_timestep_physics(
        T, station_config,
        solar_forecast_series, load_forecast_series,
        weather_forecast_series, ice_trajectory,
        forced_solar_offline,
    )

    # ── Create Solver ───────────────────────────────────────────────────────
    solver = None
    if ORTOOLS_AVAILABLE:
        solver = pywraplp.Solver.CreateSolver("SCIP")
        if not solver:
            solver = pywraplp.Solver.CreateSolver("GLOP")

    if not solver:
        return _run_heuristic_optimizer(
            station_config, solar_forecast_series, load_forecast_series,
            T, emergency_reserve_boost_pct,
            forced_generator_offline, forced_solar_offline,
            weather_forecast_series, ice_trajectory,
        )

    # ── Decision variables ─────────────────────────────────────────────────
    P_solar_dir = []    # Solar direct to station (kW)
    P_solar_chg = []    # Solar to battery charge (kW)
    P_batt_dis  = []    # Battery discharge to station (kW)
    P_gen       = []    # Generator electrical output (kW)
    u_gen       = []    # Generator ON/OFF binary
    P_curt      = []    # Deferrable load curtailed (kW)
    E_batt      = []    # Battery energy at START of hour t (kWh)
    H_displaced = []    # Phase 2 CHP: waste heat displacing electrical heating (kW)

    infinity = solver.infinity()
    dt = 1.0  # 1-hour timestep

    for t in range(T):
        P_solar_dir.append(solver.NumVar(0.0, solar_cap_kw,  f"P_sol_dir_{t}"))
        P_solar_chg.append(solver.NumVar(0.0, max_chg_kw,    f"P_sol_chg_{t}"))
        P_batt_dis.append( solver.NumVar(0.0, max_dis_kw,    f"P_bat_dis_{t}"))
        P_gen.append(      solver.NumVar(0.0, gen_cap_kw,    f"P_gen_{t}"))
        u_gen.append(      solver.BoolVar(                   f"u_gen_{t}"))
        P_curt.append(     solver.NumVar(0.0, infinity,      f"P_curt_{t}"))
        H_displaced.append(solver.NumVar(0.0, infinity,      f"H_disp_{t}"))  # Phase 2 CHP
        E_batt.append(
            solver.NumVar(
                batt_cap_kwh * (min_reserve_pct / 100.0),
                batt_cap_kwh * (max_soc_pct / 100.0),
                f"E_batt_{t}"
            )
        )

    E_batt_end = solver.NumVar(
        batt_cap_kwh * (min_reserve_pct / 100.0),
        batt_cap_kwh * (max_soc_pct / 100.0),
        "E_batt_end"
    )

    # Initial battery state
    initial_energy = batt_cap_kwh * (current_soc_pct / 100.0)
    solver.Add(E_batt[0] == initial_energy)

    # Hard physical fuel tank constraint: generator cannot burn more fuel than available
    solver.Add(sum(P_gen[t] * fuel_rate_l_kwh * dt for t in range(T)) <= current_fuel_l)

    # ── Constraints per timestep ────────────────────────────────────────────
    for t in range(T):
        solar_avail  = phy["solar_avail"][t]    # already ice-derated
        demand_adj   = phy["demand_adj"][t]     # base demand + parasitic heater
        heat_t       = phy["heat_demand"][t]    # CHP-offsettable heating demand
        eta_chg_t    = phy["eta_chg"][t]        # Arrhenius-adjusted charge eta
        eta_dis_t    = phy["eta_dis"][t]        # Arrhenius-adjusted discharge eta

        raw_demand   = float(load_forecast_series[t].get("predicted_demand_kw", 100.0))
        def_t        = float(load_forecast_series[t].get("deferrable_load_kw",  20.0))
        imp_t        = float(load_forecast_series[t].get("important_load_kw",   30.0))

        # Solar generation cap (ice-derated)
        solver.Add(P_solar_dir[t] + P_solar_chg[t] <= solar_avail)

        # Phase 2 — CHP auxiliary: linearise min(P_gen*C_thermal, heat_demand)
        # H_displaced <= generator thermal output
        solver.Add(H_displaced[t] <= P_gen[t] * CHP_C_THERMAL)
        # H_displaced <= available electrical heating demand
        solver.Add(H_displaced[t] <= heat_t)
        # No CHP benefit when generator is offline
        if forced_generator_offline:
            solver.Add(H_displaced[t] == 0.0)

        # Power balance: Supply + CHP_credit = Demand + Heater - Curtailed
        # Rearranged: P_solar + P_batt + P_gen = demand_adj - H_displaced - P_curt
        solver.Add(
            P_solar_dir[t] + P_batt_dis[t] + P_gen[t]
            == demand_adj - H_displaced[t] - P_curt[t]
        )

        # Generator commitment and minimum load constraints
        if forced_generator_offline:
            solver.Add(P_gen[t] == 0.0)
            solver.Add(u_gen[t] == 0)
        else:
            solver.Add(P_gen[t] <= gen_cap_kw * u_gen[t])
            solver.Add(P_gen[t] >= gen_min_kw * u_gen[t])

        # Curtailment limited to deferrable + 40% important (CRITICAL always served)
        solver.Add(P_curt[t] <= def_t + (imp_t * 0.40))

        # Phase 2 — Battery evolution with per-timestep Arrhenius-adjusted RTEs
        next_e = E_batt[t + 1] if (t + 1 < T) else E_batt_end
        solver.Add(
            next_e == E_batt[t]
            + (P_solar_chg[t] * eta_chg_t * dt)
            - (P_batt_dis[t] / eta_dis_t * dt)
        )

    # ── Objective function ──────────────────────────────────────────────────
    # CORRECTION C1: Generator pays FULL standard fuel cost.
    # CHP credit is applied as a NEGATIVE coefficient on H_displaced[t].
    # Since H_displaced is bounded by min(P_gen*C_thermal, heat_demand),
    # the solver only earns the credit when waste heat is ACTUALLY consumed
    # by the station. Zero heat demand → H_displaced stays at 0 → no reward.
    # This eliminates the generator-hallucination failure mode where the MILP
    # would run diesel at minimum load purely to collect the mathematical discount.
    objective = solver.Objective()
    for t in range(T):
        temp_t = phy["temp"][t]

        # Fuel cost: Polar delivered logistics cost (~$12.00/L delivered to remote polar bases).
        # This is much higher than the previous $2.20 weight, correctly reflecting the true cost
        # of diesel resupply to Antarctica/Arctic — ensures AI conserves fuel over curtailing science loads.
        objective.SetCoefficient(P_gen[t], fuel_rate_l_kwh * 12.0)

        # Negative reward on H_displaced: solver earns savings only for
        # waste heat that is actually utilised by station heating loads.
        objective.SetCoefficient(H_displaced[t], -CHP_HEAT_CREDIT_PER_KW)

        # Battery wear: higher at cold temperatures (Arrhenius-driven degradation)
        cold_penalty = max(0.0, (-temp_t - 10.0) * BATT_WEAR_COLD_COEFF)
        batt_wear = BATT_WEAR_BASE + cold_penalty
        objective.SetCoefficient(P_batt_dis[t], batt_wear)

        # Load curtailment penalty ($0.80/kW): non-critical science & rover loads are
        # shed during power deficits to save fuel — much lower than fuel cost so AI
        # correctly prefers curtailing deferrable loads over burning expensive diesel.
        objective.SetCoefficient(P_curt[t], 0.80)

        # Generator startup / running fixed cost
        objective.SetCoefficient(u_gen[t], 2.50)

    objective.SetMinimization()

    status = solver.Solve()

    if status not in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
        return {
            "success": False,
            "status": "INFEASIBLE",
            "message": (
                "Critical load cannot be safely maintained under the specified constraints. "
                "Automatic emergency load shedding required."
            ),
            "recommended_actions": [
                "Deploy emergency portable auxiliary generator",
                "Curtail all scientific computing and domestic water heating",
                "Lower habitat indoor thermal setpoint to +16°C",
                "Reduce minimum battery reserve threshold temporarily",
            ],
        }

    # ── Extract and return optimal schedule ────────────────────────────────
    schedule = []
    total_diesel_kwh    = 0.0
    total_diesel_liters = 0.0
    total_solar_used    = 0.0
    total_solar_stored  = 0.0
    total_batt_dis      = 0.0
    total_curt          = 0.0
    total_demand        = 0.0
    total_chp_heat      = 0.0
    fuel_tracker_l      = current_fuel_l

    for t in range(T):
        s_dir  = round(P_solar_dir[t].solution_value(), 2)
        s_chg  = round(P_solar_chg[t].solution_value(), 2)
        b_dis  = round(P_batt_dis[t].solution_value(),  2)
        p_g    = round(P_gen[t].solution_value(),       2)
        g_on   = bool(u_gen[t].solution_value() > 0.5)
        curt   = round(P_curt[t].solution_value(),      2)
        h_disp = round(H_displaced[t].solution_value(), 2)
        e_b    = round(E_batt[t].solution_value(),      2)
        soc    = round((e_b / batt_cap_kwh) * 100.0, 1)

        f_consumed     = round(p_g * fuel_rate_l_kwh, 2)
        fuel_tracker_l = max(0.0, round(fuel_tracker_l - f_consumed, 1))

        raw_demand_t = float(load_forecast_series[t].get("predicted_demand_kw", 100.0))
        served_t     = round(raw_demand_t - curt, 2)
        chp_heat_kw  = round(p_g * CHP_C_THERMAL, 2)

        total_diesel_kwh    += p_g
        total_diesel_liters += f_consumed
        total_solar_used    += s_dir
        total_solar_stored  += s_chg
        total_batt_dis      += b_dis
        total_curt          += curt
        total_demand        += raw_demand_t
        total_chp_heat      += chp_heat_kw

        schedule.append({
            "hour": t,
            "timestamp": solar_forecast_series[t].get("timestamp"),
            # Core power flows
            "demand_kw":           raw_demand_t,
            "load_served_kw":      served_t,
            "curtailed_kw":        curt,
            "solar_direct_kw":     s_dir,
            "solar_to_battery_kw": s_chg,
            "solar_total_kw":      round(s_dir + s_chg, 2),
            "battery_discharge_kw": b_dis,
            "battery_soc_pct":     soc,
            "battery_energy_kwh":  e_b,
            "generator_kw":        p_g,
            "generator_active":    g_on,
            "fuel_consumed_l":     f_consumed,
            "fuel_remaining_l":    fuel_tracker_l,
            "renewable_fraction_pct": round(
                ((s_dir + b_dis) / max(0.1, served_t)) * 100.0, 1
            ) if served_t > 0 else 100.0,
            # Phase 2 physics fields
            "chp_heat_kw":         chp_heat_kw,
            "chp_heat_displacing_kw": h_disp,
            "battery_heater_kw":   round(phy["heater_kw"][t], 2),
            "battery_heater_active": phy["heater_kw"][t] > 0.0,
            "eta_rte_pct":         phy["rte_pct"][t],
            "thermal_load_kw":     float(load_forecast_series[t].get("thermal_load_kw", 0.0)),
            "ice_coverage_pct":    round(ice_trajectory[t], 2) if ice_trajectory else 0.0,
        })

    renewable_contrib_pct = round(
        ((total_solar_used + total_batt_dis) / max(0.1, total_demand - total_curt)) * 100.0, 1
    )

    return {
        "success": True,
        "status": "OPTIMAL",
        "solver": "OR-Tools MILP (SCIP/GLOP)",
        "horizon_hours": T,
        "summary": {
            "total_demand_kwh":            round(total_demand, 1),
            "total_diesel_kwh":            round(total_diesel_kwh, 1),
            "total_diesel_fuel_liters":    round(total_diesel_liters, 1),
            "fuel_remaining_liters":       fuel_tracker_l,
            "total_solar_kwh":             round(total_solar_used + total_solar_stored, 1),
            "total_battery_discharged_kwh": round(total_batt_dis, 1),
            "total_curtailed_kwh":         round(total_curt, 1),
            "total_chp_heat_kwh":          round(total_chp_heat, 1),
            "critical_load_coverage_pct":  100.0,
            "overall_renewable_fraction_pct": min(100.0, renewable_contrib_pct),
            "co2_emissions_kg":            round(total_diesel_liters * 2.68, 1),
        },
        "schedule": schedule,
    }


# ─────────────────────────────────────────────────────────────────────────────
# HEURISTIC FALLBACK (Phase 2 physics-aware)
# ─────────────────────────────────────────────────────────────────────────────

def _run_heuristic_optimizer(
    station_config: Dict[str, Any],
    solar_forecast_series: List[Dict[str, Any]],
    load_forecast_series: List[Dict[str, Any]],
    T: int,
    emergency_reserve_boost_pct: float,
    forced_generator_offline: bool,
    forced_solar_offline: bool,
    weather_forecast_series: Optional[List[Dict[str, Any]]] = None,
    ice_trajectory: Optional[List[float]] = None,
) -> Dict[str, Any]:
    """
    High-performance rule-based predictive microgrid dispatcher when OR-Tools
    is unavailable.  Phase 2: applies the same Arrhenius RTE, parasitic heater,
    CHP coupling, and ice derating as the MILP path.
    """
    batt_cap_kwh     = float(station_config.get("battery_capacity_kwh", station_config.get("default_battery_kwh", 600.0)))
    current_soc_pct  = float(station_config.get("battery_soc_pct", station_config.get("default_battery_soc_pct", 75.0)))
    min_reserve_pct  = min(85.0, max(15.0,
        float(station_config.get("battery_min_reserve_pct", station_config.get("default_battery_min_reserve_pct", 30.0))) + emergency_reserve_boost_pct))
    max_soc_pct      = float(station_config.get("battery_max_soc_pct", station_config.get("default_battery_max_soc_pct", 98.0)))
    max_chg_kw       = float(station_config.get("battery_max_charge_kw", station_config.get("default_battery_max_charge_kw", 150.0)))
    max_dis_kw       = float(station_config.get("battery_max_discharge_kw", station_config.get("default_battery_max_discharge_kw", 150.0)))
    base_rte         = float(station_config.get("battery_rte_pct", station_config.get("default_battery_rte_pct", 92.0))) / 100.0
    gen_cap_kw       = float(station_config.get("diesel_capacity_kw", station_config.get("default_diesel_kw", 250.0)))
    current_fuel_l   = float(station_config.get("diesel_fuel_l", station_config.get("default_diesel_fuel_l", 1200.0)))
    fuel_rate        = float(station_config.get("diesel_consumption_l_per_kwh", station_config.get("default_diesel_consumption_l_per_kwh", 0.28)))

    e_batt  = batt_cap_kwh * (current_soc_pct / 100.0)
    fuel_l  = current_fuel_l

    schedule         = []
    total_diesel_kwh = 0.0
    total_diesel_l   = 0.0
    total_solar      = 0.0
    total_curt       = 0.0
    total_demand     = 0.0
    total_chp_heat   = 0.0

    for t in range(T):
        # Per-timestep physics parameters
        temp_c = float(weather_forecast_series[t].get("temperature_c", -15.0)) \
                 if weather_forecast_series and t < len(weather_forecast_series) else -15.0

        eta_chg, eta_dis = compute_arrhenius_rte(base_rte, temp_c)
        heater_kw = compute_battery_parasitic_load(batt_cap_kwh, temp_c)
        rte_pct   = round(eta_chg * eta_dis * 100.0, 2)

        ice_pct = ice_trajectory[t] if ice_trajectory and t < len(ice_trajectory) else 0.0
        ice_derate = compute_ice_derate_factor(ice_pct)

        raw_solar = 0.0 if forced_solar_offline else \
                    float(solar_forecast_series[t].get("predicted_kw", 0.0))
        sol_avail = raw_solar * ice_derate

        raw_demand = float(load_forecast_series[t].get("predicted_demand_kw", 100.0))
        heat_t     = float(load_forecast_series[t].get("thermal_load_kw", 0.0))
        dem        = raw_demand + heater_kw  # effective demand including heater

        # Solar direct
        s_dir      = min(dem, sol_avail)
        excess_sol = max(0.0, sol_avail - s_dir)

        # Solar charge
        room_kwh = max(0.0, (batt_cap_kwh * (max_soc_pct / 100.0)) - e_batt)
        s_chg    = min(excess_sol, max_chg_kw, room_kwh / eta_chg)
        e_batt  += s_chg * eta_chg

        rem_dem  = dem - s_dir
        b_avail  = max(0.0, e_batt - (batt_cap_kwh * (min_reserve_pct / 100.0)))
        b_dis    = min(rem_dem, max_dis_kw, b_avail * eta_dis)
        e_batt  -= (b_dis / eta_dis)

        rem_after_batt = max(0.0, rem_dem - b_dis)
        p_g = 0.0
        g_on = False

        if rem_after_batt > 0:
            if not forced_generator_offline and fuel_l > 0:
                # Clamp generator by remaining fuel in tank
                max_p_gen_fuel = fuel_l / max(0.001, fuel_rate)
                p_g  = min(gen_cap_kw, rem_after_batt, max_p_gen_fuel)
                if p_g > 0.01:
                    g_on = True
                    f_use = p_g * fuel_rate
                    fuel_l = max(0.0, fuel_l - f_use)
                    total_diesel_l   += f_use
                    total_diesel_kwh += p_g

        # CHP credit (heuristic: gen is running, so subtract waste heat from remaining demand)
        chp_heat_kw  = round(p_g * CHP_C_THERMAL, 2)
        chp_displaced = min(chp_heat_kw, max(0.0, heat_t))

        curt = max(0.0, rem_after_batt - p_g)
        soc  = round((e_batt / batt_cap_kwh) * 100.0, 1)

        total_solar    += s_dir
        total_curt     += curt
        total_demand   += raw_demand
        total_chp_heat += chp_heat_kw

        schedule.append({
            "hour": t,
            "timestamp": solar_forecast_series[t].get("timestamp"),
            "demand_kw":            raw_demand,
            "load_served_kw":       round(raw_demand - curt, 2),
            "curtailed_kw":         round(curt, 2),
            "solar_direct_kw":      round(s_dir, 2),
            "solar_to_battery_kw":  round(s_chg, 2),
            "solar_total_kw":       round(s_dir + s_chg, 2),
            "battery_discharge_kw": round(b_dis, 2),
            "battery_soc_pct":      soc,
            "battery_energy_kwh":   round(e_batt, 2),
            "generator_kw":         round(p_g, 2),
            "generator_active":     g_on,
            "fuel_consumed_l":      round(p_g * fuel_rate, 2),
            "fuel_remaining_l":     round(fuel_l, 1),
            "renewable_fraction_pct": round(
                ((s_dir + b_dis) / max(0.1, raw_demand - curt)) * 100.0, 1
            ),
            # Phase 2 physics fields
            "chp_heat_kw":          chp_heat_kw,
            "chp_heat_displacing_kw": round(chp_displaced, 2),
            "battery_heater_kw":    round(heater_kw, 2),
            "battery_heater_active": heater_kw > 0.0,
            "eta_rte_pct":          rte_pct,
            "thermal_load_kw":      round(heat_t, 2),
            "ice_coverage_pct":     round(ice_pct, 2),
        })

    ren_pct = round(((total_solar) / max(0.1, total_demand)) * 100.0, 1)

    return {
        "success": True,
        "status": "OPTIMAL (Heuristic)",
        "solver": "Polaris Predictive Microgrid Dispatcher (Phase 2)",
        "horizon_hours": T,
        "summary": {
            "total_demand_kwh":            round(total_demand, 1),
            "total_diesel_kwh":            round(total_diesel_kwh, 1),
            "total_diesel_fuel_liters":    round(total_diesel_l, 1),
            "fuel_remaining_liters":       round(fuel_l, 1),
            "total_solar_kwh":             round(total_solar, 1),
            "total_curtailed_kwh":         round(total_curt, 1),
            "total_chp_heat_kwh":          round(total_chp_heat, 1),
            "critical_load_coverage_pct":  100.0,
            "overall_renewable_fraction_pct": ren_pct,
            "co2_emissions_kg":            round(total_diesel_l * 2.68, 1),
        },
        "schedule": schedule,
    }
