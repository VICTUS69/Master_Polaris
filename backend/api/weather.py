"""
Weather & Atmospheric Telemetry API
"""

from fastapi import APIRouter, Query, HTTPException
from backend.services.weather_service import fetch_open_meteo_weather

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("/live")
async def get_live_weather(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees"),
    days: int = Query(4, ge=1, le=7, description="Forecast horizon in days")
):
    """
    Fetches live and forecast environmental telemetry for polar station coordinates.
    """
    try:
        data = await fetch_open_meteo_weather(lat=lat, lon=lon, forecast_days=days)
        return data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
