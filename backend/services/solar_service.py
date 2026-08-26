"""
POLARIS Physics-Based Solar Generation Model
Computes PV array power output taking into account:
- Rated capacity (kW) and nominal module efficiency (%)
- Global Tilted Irradiance (GTI) / Direct Normal Irradiance (DNI)
- Low-temperature photovoltaic efficiency gain (+0.4% per °C below 25°C)
- Snow albedo reflection and sub-zero derating/inverter clipping
"""

import math
from typing import Dict, Any, List


def calculate_solar_output(
    solar_capacity_kw: float,
    efficiency_pct: float,
    gti_wm2: float,
    temperature_c: float,
    snow_coverage_pct: float = 0.0,
    dust_soiling_pct: float = 2.0
) -> Dict[str, Any]:
    """
    Calculates instant solar PV output in kW based on solar physics.
    Standard Test Condition (STC): 1000 W/m2 at 25°C.
    """
    if gti_wm2 <= 1.0 or solar_capacity_kw <= 0:
        return {
            "solar_power_kw": 0.0,
            "capacity_factor_pct": 0.0,
            "temp_coefficient_factor": 1.0,
            "snow_derating_factor": 1.0,
            "effective_gti_wm2": 0.0
        }

    # Normalized irradiance factor (relative to 1000 W/m2 STC)
    irradiance_ratio = min(1.35, gti_wm2 / 1000.0)

    # PV cell temperature coefficient (typically -0.4%/°C above 25°C, hence +0.4%/°C below 25°C)
    # Cell temp is roughly ambient + (irradiance / 800) * 20 in sunny conditions
    cell_temp_c = temperature_c + (gti_wm2 / 800.0) * 15.0
    temp_diff = 25.0 - cell_temp_c
    temp_gain_pct = temp_diff * 0.004  # e.g., at -15°C cell temp, gain is (25 - (-15))*0.004 = +16% gain!
    # Cap temperature gain factor between 0.80 and 1.25
    temp_factor = max(0.80, min(1.25, 1.0 + temp_gain_pct))

    # Snow loss factor on tilted panels
    snow_loss = min(0.95, (snow_coverage_pct / 100.0) * 0.85)
    snow_factor = max(0.05, 1.0 - snow_loss)

    # Soiling / albedo factor (Antarctica snow reflection increases bifacial and diffuse gain by up to 15%)
    albedo_boost = 1.12 if temperature_c < 0 else 1.02
    soiling_factor = 1.0 - (dust_soiling_pct / 100.0)

    # System efficiency factor (Inverter & cabling losses ~ 94%)
    system_derate = 0.94

    raw_power = solar_capacity_kw * irradiance_ratio * temp_factor * snow_factor * albedo_boost * soiling_factor * system_derate

    # Inverter clipping at 115% of DC capacity
    max_inverter_kw = solar_capacity_kw * 1.15
    final_power_kw = round(max(0.0, min(max_inverter_kw, raw_power)), 2)

    capacity_factor = round((final_power_kw / solar_capacity_kw * 100.0) if solar_capacity_kw > 0 else 0.0, 1)

    return {
        "solar_power_kw": final_power_kw,
        "capacity_factor_pct": capacity_factor,
        "temp_coefficient_factor": round(temp_factor, 3),
        "snow_derating_factor": round(snow_factor, 3),
        "effective_gti_wm2": round(gti_wm2 * albedo_boost, 1)
    }


def compute_solar_profile_72h(
    solar_capacity_kw: float,
    efficiency_pct: float,
    weather_forecast: List[Dict[str, Any]],
    snow_coverage_pct: float = 0.0
) -> List[Dict[str, Any]]:
    """
    Computes 72-hour hourly solar generation profile.
    """
    profile = []
    for step in weather_forecast:
        gti = step.get("global_tilted_irradiance_wm2", 0.0)
        temp = step.get("temperature_c", -15.0)
        snow = step.get("snowfall_cm", 0.0)
        dynamic_snow = min(90.0, snow_coverage_pct + (snow * 15.0))

        calc = calculate_solar_output(
            solar_capacity_kw=solar_capacity_kw,
            efficiency_pct=efficiency_pct,
            gti_wm2=gti,
            temperature_c=temp,
            snow_coverage_pct=dynamic_snow
        )

        profile.append({
            "timestamp": step.get("timestamp"),
            "gti_wm2": gti,
            "solar_power_kw": calc["solar_power_kw"],
            "capacity_factor_pct": calc["capacity_factor_pct"],
            "temp_gain_pct": round((calc["temp_coefficient_factor"] - 1.0) * 100.0, 1)
        })
    return profile
