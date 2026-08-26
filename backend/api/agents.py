"""
Agentic AI System API
Orchestrates Forecast Agent, Energy Manager, Safety Agent, and Scenario Agent.

Phase 2 C2: When the Energy Manager Agent issues a mechanical ice clearing work order,
the agents endpoint automatically triggers a re-simulation with the clearing hours applied.
This gives the frontend a single call that returns both the agent logs AND the final
AI-track timeline that reflects the crew clearing event.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from backend.agents.orchestrator import PolarisAgentOrchestrator
from backend.simulation.engine import run_dual_simulation
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
    Triggers the multi-agent Observe → Forecast → Plan → Safety Check → Execute cycle.

    Phase 2 C2 behaviour:
      1. Run the orchestrator with the initial simulation results.
      2. If the Energy Manager orders mechanical ice clearing, automatically
         re-run the simulation with the clearing hours applied to the AI track.
      3. Return the final agent logs + the updated simulation result in one response.
    """
    config = req.station_config
    lat = float(config.get("latitude", -69.4072))
    lon = float(config.get("longitude", 76.1872))

    weather_data = await fetch_open_meteo_weather(lat=lat, lon=lon, forecast_days=4)

    # First orchestration pass — uses the simulation result passed in from the client
    cycle_res = orchestrator.run_agentic_cycle(
        station_config=config,
        weather_data=weather_data,
        scenario_id=req.scenario_id,
        simulation_results=req.simulation_results,
    )

    clearing_hours: List[int] = cycle_res.get("mechanical_clearing_hours", [])

    # C2: If the Energy Manager issued a clearing work order, re-run the simulation
    # with the clearing applied so the AI timeline reflects the crew intervention.
    # The baseline timeline is NOT re-run — SCADA never orders a clearing.
    if clearing_hours and req.simulation_results:
        forecast_72h = weather_data.get("forecast_72h", [])
        updated_sim = run_dual_simulation(
            station_config=config,
            weather_forecast=forecast_72h,
            scenario_id=req.scenario_id,
            mechanical_clearing_hours=clearing_hours,
        )
        # Inject the updated AI timeline and ice trajectory back into the response.
        # Baseline remains the original uncorrected run — the asymmetry is the point.
        cycle_res["updated_simulation"] = {
            "ai_timeline":    updated_sim["ai_timeline"],
            "ice_trajectory": updated_sim.get("ice_trajectory", []),
            "metrics_comparison": updated_sim["metrics_comparison"],
        }

    return cycle_res
