"""
Station & Microgrid Configuration API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from backend.data.station_presets import POLAR_STATIONS
from backend.services.solar_service import calculate_solar_output
from backend.services.load_service import calculate_station_load

router = APIRouter(prefix="/api/station", tags=["station"])


class LoadItem(BaseModel):
    id: str
    name: str
    power_kw: float
    priority: str = "IMPORTANT"  # CRITICAL, IMPORTANT, DEFERRABLE
    flexible: bool = True
    min_op_pct: int = 0


class StationConfigRequest(BaseModel):
    station_id: Optional[str] = "bharati"
    station_name: str = "Bharati Research Station"
    latitude: float = -69.4072
    longitude: float = 76.1872
    elevation_m: float = 35.0
    solar_capacity_kw: float = 180.0
    solar_efficiency_pct: float = 21.5
    panel_tilt_deg: float = 65.0
    panel_azimuth_deg: float = 0.0
    battery_capacity_kwh: float = 600.0
    battery_soc_pct: float = 75.0
    battery_min_reserve_pct: float = 30.0
    battery_max_soc_pct: float = 98.0
    battery_max_charge_kw: float = 150.0
    battery_max_discharge_kw: float = 150.0
    battery_rte_pct: float = 92.0
    battery_health_pct: float = 98.0
    diesel_capacity_kw: float = 250.0
    diesel_fuel_l: float = 1200.0
    diesel_consumption_l_per_kwh: float = 0.28
    diesel_min_load_pct: float = 25.0
    diesel_startup_min: int = 5
    occupants: int = 24
    operating_mode: str = "Normal Operation"
    research_intensity: float = 1.0
    heating_intensity: float = 1.0
    loads: List[LoadItem] = []


@router.get("/presets")
async def get_station_presets():
    """Returns list of pre-configured polar research bases."""
    return {"stations": list(POLAR_STATIONS.values())}


@router.get("/preset/{station_id}")
async def get_station_preset(station_id: str):
    """Retrieves specific preset configuration."""
    if station_id not in POLAR_STATIONS:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")
    return POLAR_STATIONS[station_id]


@router.post("/calculate-state")
async def calculate_instant_energy_state(
    config: StationConfigRequest,
    temperature_c: float = -18.0,
    wind_speed_kmh: float = 35.0,
    gti_wm2: float = 250.0
):
    """
    Calculates exact instant microgrid energy balance and telemetry cards.
    """
    loads_dict = [l.model_dump() for l in config.loads] if config.loads else POLAR_STATIONS["bharati"]["loads"]

    # 1. Physical solar generation
    solar_res = calculate_solar_output(
        solar_capacity_kw=config.solar_capacity_kw,
        efficiency_pct=config.solar_efficiency_pct,
        gti_wm2=gti_wm2,
        temperature_c=temperature_c
    )
    solar_gen_kw = solar_res["solar_power_kw"]

    # 2. Physical station load
    load_res = calculate_station_load(
        loads=loads_dict,
        temperature_c=temperature_c,
        wind_speed_kmh=wind_speed_kmh,
        occupants=config.occupants,
        operating_mode=config.operating_mode,
        research_intensity=config.research_intensity,
        heating_intensity=config.heating_intensity
    )
    total_demand_kw = load_res["total_demand_kw"]
    critical_load_kw = load_res["critical_load_kw"]

    # 3. Microgrid power routing
    solar_direct_kw = min(total_demand_kw, solar_gen_kw)
    excess_solar_kw = max(0.0, solar_gen_kw - solar_direct_kw)

    # Battery charging / discharging
    batt_avail_energy_kwh = max(0.0, config.battery_capacity_kwh * ((config.battery_soc_pct - config.battery_min_reserve_pct) / 100.0))
    deficit_kw = total_demand_kw - solar_direct_kw

    battery_discharging_kw = 0.0
    battery_charging_kw = 0.0
    generator_kw = 0.0
    generator_state = "OFF"

    if excess_solar_kw > 0:
        room_kwh = config.battery_capacity_kwh * ((config.battery_max_soc_pct - config.battery_soc_pct) / 100.0)
        battery_charging_kw = min(excess_solar_kw, config.battery_max_charge_kw, room_kwh)

    if deficit_kw > 0:
        battery_discharging_kw = min(deficit_kw, config.battery_max_discharge_kw, batt_avail_energy_kwh)
        remaining_deficit = deficit_kw - battery_discharging_kw
        if remaining_deficit > 0 and config.diesel_fuel_l > 0:
            generator_kw = min(config.diesel_capacity_kw, remaining_deficit)
            generator_state = "ACTIVE (SPINNING)"

    renewable_contrib = round(((solar_direct_kw + battery_discharging_kw) / max(0.1, total_demand_kw)) * 100.0, 1)

    return {
        "current_demand_kw": total_demand_kw,
        "critical_load_kw": critical_load_kw,
        "important_load_kw": load_res["important_load_kw"],
        "deferrable_load_kw": load_res["deferrable_load_kw"],
        "solar_generation_kw": solar_gen_kw,
        "solar_direct_kw": round(solar_direct_kw, 2),
        "solar_to_battery_kw": round(battery_charging_kw, 2),
        "battery_soc_pct": config.battery_soc_pct,
        "battery_available_energy_kwh": round(batt_avail_energy_kwh, 1),
        "battery_discharging_kw": round(battery_discharging_kw, 2),
        "battery_charging_kw": round(battery_charging_kw, 2),
        "diesel_fuel_liters": config.diesel_fuel_l,
        "generator_output_kw": round(generator_kw, 2),
        "generator_state": generator_state,
        "critical_load_coverage_pct": 100.0,
        "renewable_contribution_pct": min(100.0, renewable_contrib),
        "evaluated_loads": load_res["evaluated_loads"]
    }
