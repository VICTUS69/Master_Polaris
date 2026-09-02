"""
Simulation & Digital Twin API
"""

import asyncio
import json
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from backend.simulation.scenarios import SCENARIOS
from backend.simulation.engine import run_dual_simulation
from backend.services.weather_service import fetch_open_meteo_weather
from backend.data.station_presets import POLAR_STATIONS
from backend.services.optimizer_service import run_polaris_milp_optimization, generate_commander_briefing

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


class RunSimulationRequest(BaseModel):
    station_config: Dict[str, Any]
    scenario_id: str = "polar_storm"
    # Phase 2 C2: hours at which a mechanical panel clearing event occurs in the AI track.
    # Populated by the agents API after the Energy Manager issues a work order.
    mechanical_clearing_hours: Optional[List[int]] = None


# --- TASK 1: MASTER STATE JSON CONTRACT ---
class PolarisSystemState(BaseModel):
    simulation_hour: int
    
    # Weather Physics
    temperature_c: float
    wind_kmh: float
    solar_irradiance_wm2: float
    ice_coverage_pct: float
    
    # Microgrid Telemetry
    solar_generation_kw: float
    battery_soc_pct: float
    battery_heater_kw: float
    generator_output_kw: float
    chp_heat_recovered_kw: float
    
    # Load Metrics
    demand_critical_kw: float
    demand_deferrable_kw: float
    load_curtailed_kw: float
    critical_shortfall_kw: float
    
    # Agent Status
    latest_agent_log: str


# --- TASK 2: WEBSOCKET CONNECTION MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except RuntimeError:
                # Connection might have dropped mid-broadcast
                self.disconnect(connection)

manager = ConnectionManager()


@router.get("/scenarios")
async def get_available_scenarios():
    """Returns all disaster and extreme polar scenarios."""
    return {"scenarios": list(SCENARIOS.values())}


@router.post("/run")
async def run_scenario_simulation(req: RunSimulationRequest):
    """
    Executes 48h dual-track simulation comparing Baseline rule-based SCADA against Polaris AI.
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


# --- TASK 3: THE SIMULATION TICK ENGINE WITH SCIP INTEGRATION ---
@router.websocket("/ws/stream")
async def websocket_simulation_stream(websocket: WebSocket):
    """
    Executes the deterministic SCIP solver, translates it via Ollama, 
    and streams the 48-hour SCADA visualization directly to the React dashboard.
    Rate: 1 real-time second = 1 simulation hour.
    """
    await manager.connect(websocket)
    try:
        # 1. Wait for START_SIMULATION signal (or defaults if frontend just connects)
        # We await the first message to trigger the engine.
        msg = await websocket.receive_text()
        
        # Hardcoding Bharati coordinates for the stream demo
        lat = -69.4072
        lon = 76.1872
        
        # Notify UI we are calculating...
        init_state = PolarisSystemState(
            simulation_hour=0,
            temperature_c=0, wind_kmh=0, solar_irradiance_wm2=0, ice_coverage_pct=0,
            solar_generation_kw=0, battery_soc_pct=100, battery_heater_kw=0,
            generator_output_kw=0, chp_heat_recovered_kw=0, demand_critical_kw=0,
            demand_deferrable_kw=0, load_curtailed_kw=0, critical_shortfall_kw=0,
            latest_agent_log="SYSTEM: EXECUTING SCIP MILP SOLVER MATRICES FOR 48H HORIZON..."
        )
        await websocket.send_json(init_state.model_dump())
        
        # Fetch high-fidelity weather from Open-Meteo
        weather_data = await fetch_open_meteo_weather(lat=lat, lon=lon, forecast_days=2)
        forecast = weather_data.get("forecast_72h", [])[:48]
        
        # Fail-safe padding if API returns less than 48 hours
        if len(forecast) < 48:
            forecast += [forecast[-1]] * (48 - len(forecast))
            
        # Physics Pre-processing Vectors (Length 48)
        Demand_Electrical_Base = []
        Demand_Heat = []
        Load_Heater = []
        Demand_Deferrable = []
        Solar_Available_Derated = []
        Eta_chg = []
        Eta_dis = []
        SoC_min_reserve = []
        C_wear = []
        
        # Station limits (Bharati Research Station defaults)
        Gen_Min_kW = 50.0
        Gen_Max_kW = 250.0
        C_thermal = 0.60   # 60% of diesel fuel energy recovered as waste heat
        E_capacity = 600.0 # 600 kWh BESS
        SoC_max = 0.98
        E_batt_initial = 450.0 # Starting at 75% SoC
        
        # Build the physical model vectors
        for t in range(48):
            w = forecast[t]
            temp = w.get("temperature_c", -25.0)
            wind = w.get("wind_speed_kmh", 40.0)
            gti = w.get("global_tilted_irradiance_wm2", 0.0)
            
            # The colder it gets, the higher the base heating demand
            Demand_Electrical_Base.append(90.0 + (5.0 if temp < -30 else 0.0))
            Demand_Heat.append(150.0 + abs(min(0, temp + 10)) * 5.0) 
            
            # Parasitic heater kicks in to keep batteries alive below -20C
            Load_Heater.append(15.0 if temp < -20 else 0.0) 
            Demand_Deferrable.append(30.0) # Snow melters, non-critical science
            
            # Rime Ice Physics: High wind + low temp = ice accumulation on panels
            ice_derate = 1.0 - min(0.9, (t * 0.015)) if temp < -15 and wind > 30 else 1.0
            solar_cap = 180.0
            Solar_Available_Derated.append((gti / 1000.0) * solar_cap * ice_derate)
            
            # Arrhenius electrochemical efficiency (batteries lose efficiency in extreme cold)
            eff = 0.95 if temp > -10 else (0.85 if temp > -25 else 0.75)
            Eta_chg.append(eff)
            Eta_dis.append(eff)
            
            # Dynamic Reserve: Demand more reserve during storms
            SoC_min_reserve.append(0.4 if w.get("is_storm", False) else 0.2)
            
            # Wear penalty based on temperature
            C_wear.append(0.05 if temp > -20 else 0.15)
            
        # --- EXECUTE DETERMINISTIC SCIP ENGINE ---
        opt_res = run_polaris_milp_optimization(
            T=47,
            dt=1.0,
            Demand_Electrical_Base=Demand_Electrical_Base,
            Demand_Heat=Demand_Heat,
            Load_Heater=Load_Heater,
            Demand_Deferrable=Demand_Deferrable,
            Solar_Available_Derated=Solar_Available_Derated,
            Eta_chg=Eta_chg,
            Eta_dis=Eta_dis,
            SoC_min_reserve=SoC_min_reserve,
            Gen_Min_kW=Gen_Min_kW,
            Gen_Max_kW=Gen_Max_kW,
            C_thermal=C_thermal,
            E_capacity=E_capacity,
            SoC_max=SoC_max,
            E_batt_initial=E_batt_initial,
            C_fuel=1.2,
            C_heat=0.5,
            C_wear=C_wear,
            C_curt=500.0,
            C_start=150.0,
            U_gen_initial=0
        )
        
        # --- GENERATE ADVISORY LOG VIA OLLAMA QWEN3:8B ---
        init_state.latest_agent_log = "MATH VERIFIED. AWAITING ADVISORY AI EXPLAINABILITY LAYER..."
        await websocket.send_json(init_state.model_dump())
        
        llm_advisory = await generate_commander_briefing(opt_res)
        
        # Handle catastrophic math failure gracefully
        if opt_res["status"] == "INFEASIBLE_OR_FAILED":
            init_state.latest_agent_log = f"CRITICAL SOLVER FAILURE: {opt_res.get('message')}"
            await websocket.send_json(init_state.model_dump())
            return
            
        timeline = opt_res["timeline"]
        
        # --- 48-TICK BROADCAST LOOP ---
        for t in range(48):
            w = forecast[t]
            t_data = timeline[t]
            
            # Construct actual state from SCIP timeline
            state = PolarisSystemState(
                simulation_hour=t,
                temperature_c=w.get("temperature_c", -25.0),
                wind_kmh=w.get("wind_speed_kmh", 40.0),
                solar_irradiance_wm2=w.get("global_tilted_irradiance_wm2", 0.0),
                ice_coverage_pct=min(100.0, t * 1.5), # Visual proxy for accumulation
                
                # Solved Telemetry
                solar_generation_kw=t_data["solar_direct_kw"] + t_data["solar_charging_kw"],
                battery_soc_pct=(t_data["battery_soc_kwh"] / E_capacity) * 100.0,
                battery_heater_kw=Load_Heater[t],
                generator_output_kw=t_data["generator_output_kw"],
                chp_heat_recovered_kw=t_data["displaced_heating_kw"],
                
                # Solved Load Metrics
                demand_critical_kw=Demand_Electrical_Base[t] + Demand_Heat[t] + Load_Heater[t],
                demand_deferrable_kw=Demand_Deferrable[t],
                load_curtailed_kw=t_data["load_curtailed_kw"],
                critical_shortfall_kw=t_data.get("critical_shortfall_kw", 0.0),
                
                # Static advisory text spanning the simulation
                latest_agent_log=llm_advisory
            )
            
            await websocket.send_json(state.model_dump())
            
            # Rate limit the websocket to create the 50x cinematic speed
            await asyncio.sleep(1.0)
            
        # Post-simulation keep-alive loop
        while True:
            msg = await websocket.receive_text()
            if msg == "RESET":
                break

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except asyncio.CancelledError:
        manager.disconnect(websocket)
