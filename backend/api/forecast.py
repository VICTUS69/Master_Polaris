"""
AI Forecasting API
Provides ML-powered multi-horizon forecasts for demand and solar generation.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.forecasting.solar_forecast import predict_solar_generation
from backend.forecasting.load_forecast import get_ml_load_forecast
from backend.services.weather_service import fetch_open_meteo_weather
from backend.data.station_presets import POLAR_STATIONS

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


class ForecastRequest(BaseModel):
    latitude: float = -69.4072
    longitude: float = 76.1872
    solar_capacity_kw: float = 180.0
    solar_efficiency_pct: float = 21.5
    battery_capacity_kwh: float = 600.0
    battery_soc_pct: float = 75.0
    occupants: int = 24
    operating_mode: str = "Normal Operation"
    research_intensity: float = 1.0
    heating_intensity: float = 1.0
    loads: Optional[List[Dict[str, Any]]] = None


@router.post("/run")
async def run_forecasting_pipeline(req: ForecastRequest):
    """
    Executes parallel AI load and solar forecasts using live atmospheric data.
    """
    weather_data = await fetch_open_meteo_weather(lat=req.latitude, lon=req.longitude, forecast_days=4)
    forecast_72h = weather_data.get("forecast_72h", [])

    loads_list = req.loads if req.loads else POLAR_STATIONS["bharati"]["loads"]

    # 1. AI Solar Forecast
    solar_res = predict_solar_generation(
        solar_capacity_kw=req.solar_capacity_kw,
        efficiency_pct=req.solar_efficiency_pct,
        weather_forecast=forecast_72h
    )

    # 2. Surrogate ML Load Forecast
    load_res = get_ml_load_forecast(weather_forecast_series=forecast_72h)

    # 3. Calculate Prototype Resilience Risk Score
    curr = weather_data.get("current", {})
    temp = curr.get("temperature_c", -18.0)
    wind = curr.get("wind_speed_kmh", 35.0)
    snow = curr.get("snowfall_cm", 0.0)
    storm_prob = curr.get("storm_probability_pct", 50)
    soc = req.battery_soc_pct

    # Multi-factor resilience risk metric [0 - 100]
    temp_risk = max(0.0, min(30.0, (-temp - 10.0) * 0.8))  # Higher risk when below -10°C
    wind_risk = min(25.0, (wind / 80.0) * 25.0)
    batt_risk = max(0.0, (50.0 - soc) * 0.5)  # Higher risk when battery low
    storm_risk = (storm_prob / 100.0) * 25.0

    total_risk_score = min(100, int(temp_risk + wind_risk + batt_risk + storm_risk))
    if total_risk_score < 30:
        risk_level = "LOW"
        risk_color = "#10b981"
    elif total_risk_score < 60:
        risk_level = "MODERATE"
        risk_color = "#f59e0b"
    elif total_risk_score < 85:
        risk_level = "HIGH"
        risk_color = "#f97316"
    else:
        risk_level = "CRITICAL"
        risk_color = "#ef4444"

    return {
        "weather_summary": {
            "source": weather_data.get("source"),
            "temperature_c": temp,
            "apparent_temp_c": curr.get("apparent_temperature_c", temp),
            "wind_speed_kmh": wind,
            "snowfall_cm": snow,
            "cloud_cover_pct": curr.get("cloud_cover_pct", 50),
            "storm_probability_pct": storm_prob
        },
        "solar_forecast": solar_res,
        "load_forecast": load_res,
        "resilience_risk": {
            "score": total_risk_score,
            "level": risk_level,
            "color": risk_color,
            "breakdown": {
                "thermal_stress": round(temp_risk, 1),
                "wind_severity": round(wind_risk, 1),
                "battery_margin": round(batt_risk, 1),
                "atmospheric_instability": round(storm_risk, 1)
            }
        }
    }
