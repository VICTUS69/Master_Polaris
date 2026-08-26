"""
Agentic AI System API
Orchestrates Forecast Agent, Energy Manager, Safety Agent, and Scenario Agent
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.agents.orchestrator import PolarisAgentOrchestrator
from backend.services.weather_service import fetch_open_meteo_weather

router = APIRouter(prefix="/api/agents", tags=["agents"])
orchestrator = PolarisAgentOrchestrator()


class AgentCycleRequest(BaseModel):
    station_config: Dict[str, Any]
    scenario_id: str = "polar_storm"
    simulation_results: Optional[Dict[str, Any]] = None


@router.post("/orchestrate")
async def run_agent_orchestration(req: AgentCycleRequest):
    """
    Triggers the multi-agent Observe -> Forecast -> Plan -> Safety Check -> Execute cycle.
    """
    config = req.station_config
    lat = float(config.get("latitude", -69.4072))
    lon = float(config.get("longitude", 76.1872))

    weather_data = await fetch_open_meteo_weather(lat=lat, lon=lon, forecast_days=4)

    cycle_res = orchestrator.run_agentic_cycle(
        station_config=config,
        weather_data=weather_data,
        scenario_id=req.scenario_id,
        simulation_results=req.simulation_results
    )

    return cycle_res
