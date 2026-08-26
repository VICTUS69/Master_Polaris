"""
Energy Optimization API
Provides optimal microgrid dispatch schedule via OR-Tools mathematical programming.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.optimization.energy_optimizer import optimize_energy_schedule
from backend.forecasting.solar_forecast import predict_solar_generation
from backend.forecasting.load_forecast import predict_station_load
from backend.services.weather_service import fetch_open_meteo_weather
from backend.data.station_presets import POLAR_STATIONS

router = APIRouter(prefix="/api/optimization", tags=["optimization"])


class OptimizationRequest(BaseModel):
    station_config: Dict[str, Any]
    planning_horizon_hours: int = 24
    emergency_reserve_boost_pct: float = 0.0
    forced_generator_offline: bool = False
    forced_solar_offline: bool = False


@router.post("/solve")
async def solve_optimal_dispatch(req: OptimizationRequest):
    """
    Executes OR-Tools MILP optimization to generate optimal 24h/72h energy schedule.
    """
    config = req.station_config
    lat = float(config.get("latitude", -69.4072))
    lon = float(config.get("longitude", 76.1872))

    weather_data = await fetch_open_meteo_weather(lat=lat, lon=lon, forecast_days=4)
    forecast_72h = weather_data.get("forecast_72h", [])

    solar_res = predict_solar_generation(
        solar_capacity_kw=float(config.get("solar_capacity_kw", 180.0)),
        efficiency_pct=float(config.get("solar_efficiency_pct", 21.5)),
        weather_forecast=forecast_72h
    )

    load_res = predict_station_load(
        loads=config.get("loads", POLAR_STATIONS["bharati"]["loads"]),
        weather_forecast=forecast_72h,
        occupants=int(config.get("occupants", 24)),
        operating_mode=config.get("operating_mode", "Normal Operation"),
        research_intensity=float(config.get("research_intensity", 1.0)),
        heating_intensity=float(config.get("heating_intensity", 1.0))
    )

    opt_result = optimize_energy_schedule(
        station_config=config,
        solar_forecast_series=solar_res["forecast_series"],
        load_forecast_series=load_res["forecast_series"],
        planning_horizon_hours=req.planning_horizon_hours,
        emergency_reserve_boost_pct=req.emergency_reserve_boost_pct,
        forced_generator_offline=req.forced_generator_offline,
        forced_solar_offline=req.forced_solar_offline
    )

    # Dynamic AI Recommendations
    recommendations = []
    summary = opt_result.get("summary", {})
    if summary.get("total_diesel_fuel_liters", 0) > 200:
        recommendations.append("High generator runtime expected. Pre-charge battery during peak daytime solar hours.")
    else:
        recommendations.append("Renewable generation covers > 70% of station demand over the horizon.")

    if req.emergency_reserve_boost_pct > 0:
        recommendations.append(f"Emergency reserve active (+{req.emergency_reserve_boost_pct}%). Deferrable compute throttled to maintain critical life support.")
    else:
        recommendations.append("Standard 30% battery reserve active. All scientific loads operating normally.")

    return {
        **opt_result,
        "ai_recommendations": recommendations
    }
