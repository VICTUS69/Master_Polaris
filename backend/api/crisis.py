"""
POLARIS Catastrophic Crisis Simulation Endpoint
POST /api/simulation/crisis

Forces the grid into absolute survival mode:
  - Solar generation → 0 kW
  - Diesel generation → 0 kW
  - P1 (BESS Heating) → SHED to 0 kW
  - P2 (Science/Rover) → SHED to 0 kW
  - P0 (Life Support) → FULLY POWERED (sole battery consumer)
  - Calculates thermal death countdown: Survival Hours = Battery_kWh / P0_kW
  - Fires SOS webhook to configurable REPLIT_WEBHOOK_URL
  - Logs crisis event to scada_telemetry.sqlite edge database
"""

import os
import math
import logging
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from backend.data.station_presets import POLAR_STATIONS
from backend.database.edge_db import log_crisis_event

logger = logging.getLogger("polaris.crisis")

router = APIRouter(prefix="/api/simulation", tags=["crisis"])

# Configurable webhook URL — defaults to empty (fire-and-forget if unset)
REPLIT_WEBHOOK_URL = os.getenv("REPLIT_WEBHOOK_URL") or "http://127.0.0.1:3000/api/sos-webhook"


# ── Response Models ──────────────────────────────────────────────────────────

class CrisisLoadItem(BaseModel):
    id: str
    name: str
    power_kw: float
    rated_kw: float
    status: str  # "ACTIVE" | "SHED"


class CrisisLoadTier(BaseModel):
    loads: List[CrisisLoadItem]
    total_kw: float
    status: str  # "FULLY_POWERED" | "SHED_TO_ZERO"


class CrisisGeneration(BaseModel):
    solar_kw: float = 0.0
    diesel_kw: float = 0.0
    total_kw: float = 0.0


class CrisisBattery(BaseModel):
    capacity_kwh: float
    soc_pct: float
    available_energy_kwh: float
    status: str = "SOLE_POWER_SOURCE"


class CrisisSurvival(BaseModel):
    p0_load_kw: float
    p0_exergy_remaining_hours: float
    p0_exergy_remaining_minutes: int
    runway_display: str


class CrisisWebhookStatus(BaseModel):
    url: str
    fired: bool
    response_status: Optional[int] = None


class CrisisEdgeDatabases(BaseModel):
    weather_cache: str = "weather_cache.sqlite"
    scada_telemetry: str = "scada_telemetry.sqlite"
    crisis_logged: bool = False


class CrisisResponse(BaseModel):
    status: str = "CRITICAL_SOS"
    station: str
    fault: str = "Total Generation Failure"
    timestamp: str
    generation: CrisisGeneration
    battery: CrisisBattery
    load_hierarchy: dict  # p0_life_support, p1_bess_heating, p2_science_rover
    survival: CrisisSurvival
    webhook: CrisisWebhookStatus
    edge_databases: CrisisEdgeDatabases


# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/crisis", response_model=CrisisResponse)
async def simulate_catastrophic_crisis():
    """
    Simulates a catastrophic total generation failure at Bharati Research Station.
    Forces the grid into survival mode: only P0 (Life Support) loads remain powered,
    running exclusively on BESS reserves until thermal death.
    """
    # Load Bharati station preset
    station = POLAR_STATIONS["bharati"]
    station_name = station["name"]
    station_id = station["id"]
    loads = station["loads"]

    # Battery parameters
    batt_capacity_kwh = float(station.get("default_battery_kwh", 600.0))
    batt_soc_pct = float(station.get("default_battery_soc_pct", 75.0))
    batt_energy_kwh = batt_capacity_kwh * (batt_soc_pct / 100.0)

    # ── Classify loads into P0 / P1 / P2 ────────────────────────────────
    # P0: CRITICAL priority loads (Life Support — never shed)
    p0_loads = []
    for load in loads:
        if load["priority"] == "CRITICAL":
            p0_loads.append(CrisisLoadItem(
                id=load["id"],
                name=load["name"],
                power_kw=load["power_kw"],
                rated_kw=load["power_kw"],
                status="ACTIVE",
            ))

    p0_total_kw = sum(l.power_kw for l in p0_loads)

    # P1: BESS Thermal Management (parasitic heater — shed in crisis)
    bess_heater_rated_kw = 15.0  # From polar_physics: activates below -20°C
    p1_loads = [CrisisLoadItem(
        id="battery_heater",
        name="BESS Thermal Management",
        power_kw=0.0,
        rated_kw=bess_heater_rated_kw,
        status="SHED",
    )]

    # P2: IMPORTANT + DEFERRABLE loads (Science, Rover — shed in crisis)
    p2_loads = []
    for load in loads:
        if load["priority"] in ("IMPORTANT", "DEFERRABLE"):
            p2_loads.append(CrisisLoadItem(
                id=load["id"],
                name=load["name"],
                power_kw=0.0,
                rated_kw=load["power_kw"],
                status="SHED",
            ))

    p2_total_rated_kw = sum(l.rated_kw for l in p2_loads)

    # ── Calculate survival runway ────────────────────────────────────────
    if p0_total_kw > 0:
        survival_hours = batt_energy_kwh / p0_total_kw
    else:
        survival_hours = float("inf")

    survival_minutes = int(survival_hours * 60)
    hours_part = int(survival_hours)
    minutes_part = survival_minutes - (hours_part * 60)
    runway_display = f"{hours_part} Hours {minutes_part} Minutes"

    now_iso = datetime.now(timezone.utc).isoformat()

    # ── Fire SOS Webhook ─────────────────────────────────────────────────
    webhook_payload = {
        "status": "CRITICAL_SOS",
        "station": "Bharati",
        "fault": "Total Generation Failure",
        "p0_exergy_remaining_hours": round(survival_hours, 2),
        "timestamp": now_iso,
        "battery_soc_pct": batt_soc_pct,
        "p0_load_kw": p0_total_kw,
        "battery_energy_kwh": round(batt_energy_kwh, 2),
    }

    webhook_fired = False
    webhook_response_status = None
    webhook_response_text = ""

    if REPLIT_WEBHOOK_URL:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(REPLIT_WEBHOOK_URL, json=webhook_payload)
                webhook_fired = True
                webhook_response_status = resp.status_code
                webhook_response_text = f"HTTP {resp.status_code}"
                logger.info(f"SOS webhook fired to {REPLIT_WEBHOOK_URL}: {resp.status_code}")
        except Exception as e:
            webhook_fired = True
            webhook_response_text = f"FAILED: {str(e)}"
            logger.error(f"SOS webhook failed: {e}")
    else:
        webhook_response_text = "REPLIT_WEBHOOK_URL not configured — SOS logged locally only"
        logger.warning("REPLIT_WEBHOOK_URL not set. Crisis logged to edge DB only.")

    # ── Log to edge database ─────────────────────────────────────────────
    crisis_logged = False
    try:
        log_crisis_event(
            station_id=station_id,
            fault_type="Total Generation Failure",
            p0_load_kw=p0_total_kw,
            battery_soc_pct=batt_soc_pct,
            survival_hours=round(survival_hours, 2),
            webhook_fired=webhook_fired,
            webhook_response=webhook_response_text,
        )
        crisis_logged = True
    except Exception as e:
        logger.error(f"Failed to log crisis event to edge DB: {e}")

    # ── Build response ───────────────────────────────────────────────────
    return CrisisResponse(
        status="CRITICAL_SOS",
        station=station_name,
        fault="Total Generation Failure",
        timestamp=now_iso,
        generation=CrisisGeneration(solar_kw=0, diesel_kw=0, total_kw=0),
        battery=CrisisBattery(
            capacity_kwh=batt_capacity_kwh,
            soc_pct=batt_soc_pct,
            available_energy_kwh=round(batt_energy_kwh, 2),
            status="SOLE_POWER_SOURCE",
        ),
        load_hierarchy={
            "p0_life_support": CrisisLoadTier(
                loads=p0_loads,
                total_kw=p0_total_kw,
                status="FULLY_POWERED",
            ).model_dump(),
            "p1_bess_heating": CrisisLoadTier(
                loads=p1_loads,
                total_kw=0.0,
                status="SHED_TO_ZERO",
            ).model_dump(),
            "p2_science_rover": CrisisLoadTier(
                loads=p2_loads,
                total_kw=0.0,
                status="SHED_TO_ZERO",
            ).model_dump(),
        },
        survival=CrisisSurvival(
            p0_load_kw=p0_total_kw,
            p0_exergy_remaining_hours=round(survival_hours, 2),
            p0_exergy_remaining_minutes=survival_minutes,
            runway_display=runway_display,
        ),
        webhook=CrisisWebhookStatus(
            url=REPLIT_WEBHOOK_URL or "(not configured)",
            fired=webhook_fired,
            response_status=webhook_response_status,
        ),
        edge_databases=CrisisEdgeDatabases(
            crisis_logged=crisis_logged,
        ),
    )
