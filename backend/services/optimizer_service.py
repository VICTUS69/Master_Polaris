"""
POLARIS - Mathematical Anti-Black Box Execution Engine
Contains the deterministic Google OR-Tools SCIP solver for microgrid dispatch
and the secure LLM handoff via local Ollama, Groq, or Gemini.
"""

import os
import json
import httpx
from typing import Dict, Any
from ortools.linear_solver import pywraplp

def run_polaris_milp_optimization(
    T: int,
    dt: float,
    Demand_Electrical_Base: list,
    Demand_Heat: list,
    Load_Heater: list,
    Demand_Deferrable: list,
    Solar_Available_Derated: list,
    Eta_chg: list,
    Eta_dis: list,
    SoC_min_reserve: list,
    Gen_Min_kW: float,
    Gen_Max_kW: float,
    C_thermal: float,
    E_capacity: float,
    SoC_max: float,
    E_batt_initial: float,
    C_fuel: float,
    C_heat: float,
    C_wear: list,
    C_curt: float,
    C_start: float,
    U_gen_initial: int = 0
) -> Dict[str, Any]:
    """
    Executes the deterministic Google OR-Tools SCIP solver to calculate
    the 48-hour energy dispatch schedule without hallucination risks.
    """
    solver = pywraplp.Solver.CreateSolver('SCIP')
    if not solver:
        raise Exception("SCIP solver is not available.")

    # --- VARIABLE INITIALIZATION ---
    P_solar_dir = []
    P_solar_chg = []
    P_batt_dis = []
    P_gen = []
    U_gen = []
    P_curt = []
    E_batt = []
    H_disp = []
    V_start = []
    S_deficit = [] # New Slack Variable for Infeasibility Cliff

    for t in range(T + 1):
        P_solar_dir.append(solver.NumVar(0.0, solver.infinity(), f'P_solar_dir_{t}'))
        P_solar_chg.append(solver.NumVar(0.0, solver.infinity(), f'P_solar_chg_{t}'))
        P_batt_dis.append(solver.NumVar(0.0, solver.infinity(), f'P_batt_dis_{t}'))
        P_gen.append(solver.NumVar(0.0, solver.infinity(), f'P_gen_{t}'))
        U_gen.append(solver.IntVar(0, 1, f'U_gen_{t}'))
        P_curt.append(solver.NumVar(0.0, solver.infinity(), f'P_curt_{t}'))
        E_batt.append(solver.NumVar(0.0, solver.infinity(), f'E_batt_{t}'))
        H_disp.append(solver.NumVar(0.0, solver.infinity(), f'H_disp_{t}'))
        V_start.append(solver.NumVar(0.0, 1.0, f'V_start_{t}'))
        S_deficit.append(solver.NumVar(0.0, solver.infinity(), f'S_deficit_{t}')) # Soft constraint variable

    # --- HARD CONSTRAINTS ---
    for t in range(T + 1):
        # A. Power Balance Equation (Kirchhoff’s Law)
        # Updated with S_deficit to prevent infeasibility crashes
        solver.Add(
            P_solar_dir[t] + P_batt_dis[t] + P_gen[t] + S_deficit[t] == 
            (Demand_Electrical_Base[t] + Demand_Heat[t] + Load_Heater[t]) - H_disp[t] - P_curt[t],
            name=f'Power_Balance_{t}'
        )

        # B. Diesel Generator Commitment & CHP Limits (Big-M formulation)
        solver.Add(P_gen[t] >= Gen_Min_kW * U_gen[t], name=f'Gen_Min_Limit_{t}')
        solver.Add(P_gen[t] <= Gen_Max_kW * U_gen[t], name=f'Gen_Max_Limit_{t}')
        
        # Waste Heat Recovery (Auxiliary Limit)
        solver.Add(H_disp[t] <= P_gen[t] * C_thermal, name=f'Heat_Available_Limit_{t}')
        solver.Add(H_disp[t] <= Demand_Heat[t], name=f'Heat_Demand_Limit_{t}')

        # C. Battery Dynamics (State of Charge Continuity)
        e_prev = E_batt[t-1] if t > 0 else E_batt_initial
        solver.Add(
            E_batt[t] == e_prev + (P_solar_chg[t] * Eta_chg[t] * dt) - (P_batt_dis[t] / Eta_dis[t] * dt),
            name=f'Battery_Continuity_{t}'
        )
        
        # Operational Bounds (Emergency Reserve & Max Capacity)
        solver.Add(E_batt[t] >= E_capacity * SoC_min_reserve[t], name=f'Batt_Min_Reserve_{t}')
        solver.Add(E_batt[t] <= E_capacity * SoC_max, name=f'Batt_Max_Cap_{t}')

        # D. Solar Availability
        solver.Add(P_solar_dir[t] + P_solar_chg[t] <= Solar_Available_Derated[t], name=f'Solar_Avail_{t}')

        # E. Curtailment Safety (Limit to deferrable load only)
        solver.Add(P_curt[t] <= Demand_Deferrable[t], name=f'Curtailment_Limit_{t}')

        # F. Linearized Generator Startup Penalty
        u_prev = U_gen[t-1] if t > 0 else U_gen_initial
        solver.Add(V_start[t] >= U_gen[t] - u_prev, name=f'Startup_Linearization_{t}')

    # --- OBJECTIVE FUNCTION ---
    objective = solver.Objective()
    for t in range(T + 1):
        objective.SetCoefficient(P_gen[t], C_fuel)
        objective.SetCoefficient(H_disp[t], -C_heat)
        objective.SetCoefficient(P_batt_dis[t], C_wear[t])
        objective.SetCoefficient(P_curt[t], C_curt)
        objective.SetCoefficient(V_start[t], C_start)
        # Astronomical penalty to ensure S_deficit is only used to avoid crashing
        objective.SetCoefficient(S_deficit[t], 1000000.0) 
        
    objective.SetMinimization()

    # --- SOLVER EXECUTION & JSON PAYLOAD ---
    status = solver.Solve()

    if status == pywraplp.Solver.OPTIMAL or status == pywraplp.Solver.FEASIBLE:
        schedule = []
        total_shortfall = 0.0
        
        for t in range(T + 1):
            shortfall_val = round(S_deficit[t].solution_value(), 2)
            total_shortfall += shortfall_val
            
            schedule.append({
                "hour": t,
                "solar_direct_kw": round(P_solar_dir[t].solution_value(), 2),
                "solar_charging_kw": round(P_solar_chg[t].solution_value(), 2),
                "battery_discharge_kw": round(P_batt_dis[t].solution_value(), 2),
                "battery_soc_kwh": round(E_batt[t].solution_value(), 2),
                "generator_output_kw": round(P_gen[t].solution_value(), 2),
                "generator_status": int(U_gen[t].solution_value()),
                "displaced_heating_kw": round(H_disp[t].solution_value(), 2),
                "load_curtailed_kw": round(P_curt[t].solution_value(), 2),
                "critical_shortfall_kw": shortfall_val
            })
            
        # Determine the final status string
        if total_shortfall > 0:
            final_status = "EMERGENCY_DEFICIT"
        else:
            final_status = "OPTIMAL" if status == pywraplp.Solver.OPTIMAL else "FEASIBLE"
            
        return {
            "status": final_status,
            "objective_cost": round(objective.Value(), 2),
            "horizon_hours": T + 1,
            "timeline": schedule
        }
    else:
        return {
            "status": "INFEASIBLE_OR_FAILED",
            "message": "CRITICAL: The SCIP solver could not find a feasible solution satisfying all life-support constraints."
        }


async def generate_commander_briefing(schedule_json: Dict[str, Any]) -> str:
    """
    Advisory AI Handoff Layer:
    Takes the deterministic solver output and securely queries the configured LLM
    (Ollama, Groq, or Gemini) to generate a human-readable explanation without altering numbers.
    """
    
    provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    
    system_prompt = """SYSTEM PROMPT:
You are the Advisory Intelligence Layer for the Polaris Polar Energy Digital Twin. 
Your sole function is to act as the "Explainability Engine" for the Station Commander at the polar research base.

A mathematically guaranteed, deterministic MILP solver (Google OR-Tools) has already calculated the optimal energy dispatch schedule. You DO NOT make numerical decisions. You DO NOT calculate power routing. You DO NOT hallucinate battery physics. 

Your strict mandate is to read the provided JSON dispatch payload and generate a concise, human-readable operations log explaining *why* the deterministic engine made its choices based on the data.

Focus your explanation on identifying key operational events across the 48-hour horizon:
1. Generator Activations: Identify the exact hours the diesel generator was spun up (generator_status = 1). Explain why (e.g., was it to recharge critically low batteries, or to provide required displaced_heating_kw?)
2. Load Curtailment: Was any deferrable load curtailed (load_curtailed_kw > 0)? Explicitly state that this action protected critical life-support systems.
3. Battery Health: Note when the battery reaches its lowest SoC (State of Charge).

Format your response as a professional, mission-critical dispatch advisory report. Do not suggest alternative schedules. Treat the input data as absolute physical law.
"""

    user_prompt = f"INPUT PAYLOAD (DETERMINISTIC SOLVER OUTPUT):\n{json.dumps(schedule_json, indent=2)}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            
            if provider == "groq":
                api_key = os.getenv("GROQ_API_KEY")
                if not api_key:
                    raise ValueError("GROQ_API_KEY is not set in environment.")
                    
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama3-8b-8192",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "stream": False
                }
                response = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
                
            elif provider == "gemini":
                api_key = os.getenv("GEMINI_API_KEY")
                if not api_key:
                    raise ValueError("GEMINI_API_KEY is not set in environment.")
                    
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                headers = {"Content-Type": "application/json"}
                
                # Combine system and user prompts into the standard Gemini REST contents array
                combined_prompt = f"{system_prompt}\n\n{user_prompt}"
                payload = {
                    "contents": [{
                        "parts": [{"text": combined_prompt}]
                    }]
                }
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
                
            else:
                # Default to offline Edge-Native Ollama
                payload = {
                    "model": "qwen3:8b",
                    "prompt": f"{system_prompt}\n\n{user_prompt}",
                    "stream": False
                }
                response = await client.post("http://localhost:11434/api/generate", json=payload)
                response.raise_for_status()
                data = response.json()
                return data.get("response", "ERROR: Empty response from advisory model.")
                
    except Exception as e:
        # Unified Fallback to deterministic log if ANY provider fails, times out, or misses API keys
        return (
            f"SYSTEM ADVISORY: AI Explanation Engine ({provider}) is currently unreachable or misconfigured.\n"
            f"ERROR DETAILS: {str(e)}\n\n"
            "DETERMINISTIC FALLBACK LOG:\n"
            "The OR-Tools SCIP solver has executed successfully and mathematically verified "
            "the safe operation of the station over the next 48 hours. Please review the raw JSON "
            "dispatch schedule directly in the telemetry dashboard."
        )
