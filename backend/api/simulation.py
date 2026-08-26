"""
Simulation & Digital Twin API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.simulation.scenarios import SCENARIOS
from backend.simulation.engine import run_dual_simulation
from backend.services.weather_service import fetch_open_meteo_weather
from backend.data.station_presets import POLAR_STATIONS

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


class RunSimulationRequest(BaseModel):
    station_config: Dict[str, Any]
    scenario_id: str = "polar_storm"
    # Phase 2 C2: hours at which a mechanical panel clearing event occurs in the AI track.
    # Populated by the agents API after the Energy Manager issues a work order.
    mechanical_clearing_hours: Optional[List[int]] = None


@router.get("/scenarios")
async def get_available_scenarios():
    """Returns all disaster and extreme polar scenarios."""
    return {"scenarios": list(SCENARIOS.values())}


@router.post("/run")
async def run_scenario_simulation(req: RunSimulationRequest):
    """
    Executes 48h dual-track simulation comparing Baseline rule-based SCADA against Polaris AI.
    Pass `mechanical_clearing_hours` to apply agentic crew work orders to the AI track ice model.
    """
    config = req.station_config
    lat = float(config.get("latitude", -69.4072))
    lon = float(config.get("longitude", 76.1872))

    weather_data = await fetch_open_meteo_weather(lat=lat, lon=lon, forecast_days=4)
    forecast_72h = weather_data.get("forecast_72h", [])

    sim_res = run_dual_simulation(
        station_config=config,
        weather_forecast=forecast_72h,
        scenario_id=req.scenario_id,
        mechanical_clearing_hours=req.mechanical_clearing_hours or [],
    )

    return sim_res

