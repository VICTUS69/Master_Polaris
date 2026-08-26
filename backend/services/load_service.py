"""
POLARIS Station Demand & Multi-Load Service
Simulates thermal, scientific, and habitat power loads under extreme polar weather conditions.
"""

from typing import Dict, Any, List


def calculate_station_load(
    loads: List[Dict[str, Any]],
    temperature_c: float,
    wind_speed_kmh: float,
    occupants: int = 24,
    operating_mode: str = "Normal Operation",
    research_intensity: float = 1.0,
    heating_intensity: float = 1.0,
    hour_of_day: int = 12
) -> Dict[str, Any]:
    """
    Computes real-time dynamic power consumption for all station subsystems.
    Thermal heating load scales with delta-T below indoor setpoint (+20°C) and wind chill.
    """
    indoor_setpoint = 20.0
    delta_t = max(0.0, indoor_setpoint - temperature_c)

    # Convective wind chill heat loss multiplier: ~ +1.5% per 10 km/h wind
    wind_chill_factor = 1.0 + (wind_speed_kmh / 100.0) * 0.15
    # Base thermal coefficient per °C delta-T
    thermal_multiplier = (1.0 + (delta_t / 35.0) * 0.45) * wind_chill_factor * heating_intensity

    # Mode multipliers
    mode_factors = {
        "Normal Operation": {"research": 1.0, "life": 1.0, "deferrable": 1.0},
        "High Research Operation": {"research": 1.35, "life": 1.05, "deferrable": 1.15},
        "Storm Lockdown": {"research": 0.35, "life": 1.25, "deferrable": 0.15},
        "Extreme Cold Protocol": {"research": 0.50, "life": 1.45, "deferrable": 0.25},
        "Conservation Mode": {"research": 0.20, "life": 0.90, "deferrable": 0.0}
    }
    mode_cfg = mode_factors.get(operating_mode, mode_factors["Normal Operation"])

    # Diurnal occupancy profile (daytime activity vs night sleep)
    is_active_hours = 7 <= hour_of_day <= 22
    diurnal_occupant_kw = (occupants * 0.35) if is_active_hours else (occupants * 0.18)

    evaluated_loads = []
    total_load_kw = 0.0
    critical_load_kw = 0.0
    important_load_kw = 0.0
    deferrable_load_kw = 0.0

    for item in loads:
        base_p = float(item.get("power_kw", 10.0))
        p_id = item.get("id", "")
        priority = item.get("priority", "IMPORTANT").upper()

        if "heat" in p_id or "thermal" in p_id:
            curr_p = base_p * thermal_multiplier * mode_cfg["life"]
        elif "atmos" in p_id or "lab" in p_id or "research" in p_id or "computing" in p_id:
            curr_p = base_p * research_intensity * mode_cfg["research"]
        elif "life" in p_id or "water_purif" in p_id:
            curr_p = base_p * (1.0 + (occupants / 24.0) * 0.2) * mode_cfg["life"]
        elif priority == "DEFERRABLE":
            curr_p = base_p * mode_cfg["deferrable"]
        else:
            curr_p = base_p

        curr_p = round(max(1.0, curr_p), 2)
        total_load_kw += curr_p

        if priority == "CRITICAL":
            critical_load_kw += curr_p
        elif priority == "IMPORTANT":
            important_load_kw += curr_p
        else:
            deferrable_load_kw += curr_p

        evaluated_loads.append({
            **item,
            "current_kw": curr_p,
            "nominal_kw": base_p
        })

    # Add occupant personal appliance load
    total_load_kw += diurnal_occupant_kw
    important_load_kw += diurnal_occupant_kw

    return {
        "total_demand_kw": round(total_load_kw, 2),
        "critical_load_kw": round(critical_load_kw, 2),
        "important_load_kw": round(important_load_kw, 2),
        "deferrable_load_kw": round(deferrable_load_kw, 2),
        "critical_percentage": round((critical_load_kw / total_load_kw * 100.0) if total_load_kw > 0 else 0.0, 1),
        "thermal_multiplier": round(thermal_multiplier, 3),
        "evaluated_loads": evaluated_loads
    }


def compute_load_profile_72h(
    loads: List[Dict[str, Any]],
    weather_forecast: List[Dict[str, Any]],
    occupants: int = 24,
    operating_mode: str = "Normal Operation",
    research_intensity: float = 1.0,
    heating_intensity: float = 1.0
) -> List[Dict[str, Any]]:
    """
    Computes dynamic 72-hour load timeline.
    """
    timeline = []
    for i, step in enumerate(weather_forecast):
        temp = step.get("temperature_c", -15.0)
        wind = step.get("wind_speed_kmh", 25.0)
        hour = (i % 24)

        calc = calculate_station_load(
            loads=loads,
            temperature_c=temp,
            wind_speed_kmh=wind,
            occupants=occupants,
            operating_mode=operating_mode,
            research_intensity=research_intensity,
            heating_intensity=heating_intensity,
            hour_of_day=hour
        )

        timeline.append({
            "timestamp": step.get("timestamp"),
            "hour": hour,
            "temperature_c": temp,
            "total_demand_kw": calc["total_demand_kw"],
            "critical_load_kw": calc["critical_load_kw"],
            "important_load_kw": calc["important_load_kw"],
            "deferrable_load_kw": calc["deferrable_load_kw"],
            "thermal_multiplier": calc["thermal_multiplier"]
        })
    return timeline
