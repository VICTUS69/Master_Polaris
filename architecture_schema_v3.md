# POLARIS Architecture Schema v4.0

## AI-Driven Smart Energy Management System & Digital Twin for Polar Research Stations
### Smart India Hackathon 2026 — Problem Statement PS26061

---

<<<<<<< HEAD
## 1. Executive Summary & Core Philosophy

**POLARIS** is an AI-driven, physics-informed microgrid energy management system and digital twin engineered specifically for edge-deployed polar research stations (e.g., Bharati, Maitri in Antarctica, Himadri in the Arctic).

POLARIS operates on the closed-loop paradigm:
$$\text{Observe} \longrightarrow \text{Predict} \longrightarrow \text{Simulate} \longrightarrow \text{Optimize} \longrightarrow \text{Validate} \longrightarrow \text{Act}$$

### Key Innovations:
1. **Polar Physics Integration (PINN Principles)**: Directly accounts for sub-zero battery Arrhenius degradation, dynamic rime-ice accretion on solar arrays, and Combined Heat & Power (CHP) thermal-electrical coupling.
2. **Proactive Google OR-Tools MILP**: Replaces naive reactive SCADA threshold logic with multi-period rolling-horizon Mixed-Integer Linear Programming.
3. **Multi-Agent Explainability Framework**: 4 specialized agents (Scenario, Forecast, Energy Manager, Safety) reasoning in tandem with human-in-the-loop work orders.
4. **Catastrophic Crisis & Edge Resilience**: Local-first 3× SQLite persistence, automatic P0/P1/P2 load hierarchy shedding, thermal death exergy countdown, and asynchronous SOS satellite webhook telemetry.

---

## 2. Project Directory Structure
=======
> [!NOTE]
> `architecture_schema.md` is the primary single source of truth document for the POLARIS project architecture. This file (`architecture_schema_v3.md`) is maintained for backwards compatibility and contains the full v4.0 architecture schema specification.
>>>>>>> 6d73554 (forecast)

---

## 1. System Overview & Core Concept

**POLARIS** is an edge-resilient, AI-driven microgrid energy management system and 3D digital twin designed specifically for extreme polar environments (Antarctic and Arctic research stations like Bharati, Maitri, Himadri, and Dakshin Gangotri).

### System Operational Cycle (CONOPS)
```
<<<<<<< HEAD
Polaris_Latest/
├── architecture_schema_v3.md          ← Master Architecture Schema (Single Source of Truth)
│
├── backend/
│   ├── main.py                        # FastAPI entrypoint — registers all REST & WS routers
│   ├── requirements.txt               # Backend dependencies (fastapi, uvicorn[standard], websockets, ortools, etc.)
│   ├── .env.example                   # Environment configuration (REPLIT_WEBHOOK_URL, OPEN_METEO_API_KEY)
│   │
│   ├── api/                           # REST & WebSocket API Layer
│   │   ├── station.py                 # GET /api/station/presets, POST /api/station/calculate-state
│   │   ├── weather.py                 # GET /api/weather/live
│   │   ├── forecast.py                # POST /api/forecast/run
│   │   ├── optimization.py            # POST /api/optimization/solve
│   │   ├── simulation.py              # POST /api/simulation/run, WS /api/simulation/ws/stream
│   │   ├── crisis.py                  # POST /api/simulation/crisis (Catastrophic Survival Mode)
│   │   └── agents.py                  # POST /api/agents/orchestrate
│   │
│   ├── physics/
│   │   └── polar_physics.py           # Core polar physics equations (Arrhenius, Rime Ice, CHP, Heaters)
│   │
│   ├── optimization/
│   │   └── energy_optimizer.py        # Google OR-Tools SCIP MILP Solver
│   │
│   ├── forecasting/                   # AI Forecasting Pipeline
│   │   ├── solar_forecast.py          # 72-hour solar irradiance & generation forecast
│   │   └── load_forecast.py           # Gradient Boosting Regressor station demand forecast
│   │
│   ├── simulation/                    # Digital Twin Simulation Engines
│   │   ├── engine.py                  # Dual-track runner (Baseline SCADA vs Polaris AI)
│   │   └── scenarios.py               # Disaster scenarios (Polar Storm, Generator Failure, Extreme Cold)
│   │
│   ├── agents/                        # Multi-Agent Orchestration
│   │   └── orchestrator.py            # PolarisAgentOrchestrator (Scenario, Forecast, Energy Mgr, Safety)
│   │
│   ├── database/                      # Data Persistence Layer
│   │   ├── db.py                      # Primary SQLite connection (polaris.db)
│   │   ├── schema.py                  # Core schema: stations, telemetry, data quality
│   │   └── edge_db.py                 # Edge resilience layer (weather_cache & scada_telemetry)
│   │
│   ├── services/                      # Business & Utility Services
│   │   ├── weather_service.py         # Open-Meteo atmospheric integration & caching
│   │   ├── solar_service.py           # Solar geometry & PV power profile generation
│   │   ├── load_service.py            # Thermal & electrical demand aggregators
│   │   ├── optimizer_service.py       # High-level solver invocation wrapper
│   │   ├── data_validator.py          # Telemetry anomaly & plausibility checker
│   │   └── synthetic_telemetry_engine.py # Synthetic sensor noise & katabatic stream generator
│   │
│   ├── data/
│   │   ├── polaris.db                 # Primary SQLite operational database
│   │   ├── weather_cache.sqlite       # Edge DB: Cached weather forecasts with TTL
│   │   ├── scada_telemetry.sqlite     # Edge DB: Sensor streams & immutable crisis audit log
│   │   ├── historical_telemetry.csv   # 15,000+ synthetic katabatic edge-case records
│   │   └── station_presets.py         # Station configurations (Bharati, Maitri, Himadri, McMurdo)
│   │
│   └── scripts/
│       └── generate_synthetic_telemetry.py # CLI script to regenerate synthetic datasets
│
├── frontend/
│   ├── index.html                     # HTML5 entrypoint
│   ├── package.json                   # React, Vite, Tailwind, Zustand, Lucide, Recharts dependencies
│   ├── vite.config.ts                 # Vite bundler & build configuration
│   ├── tailwind.config.js             # Styling tokens (dark mode, cyberpunk polar theme)
│   ├── postcss.config.js              # PostCSS autoprefixer & Tailwind pipeline
│   ├── tsconfig.json                  # TypeScript compiler settings
│   │
│   └── src/
│       ├── main.tsx                   # React root mount
│       ├── App.tsx                    # Main layout, tab navigation, global state synchronization
│       ├── index.css                  # Global styles, scanline animations, CRT glowing borders
│       │
│       ├── api/
│       │   └── client.ts              # Strongly-typed Axios/Fetch API client
│       │
│       ├── store/
│       │   └── usePolarisStore.ts     # Zustand store with auto-reconnecting WebSocket SCADA telemetry
│       │
│       ├── types/
│       │   └── index.ts               # Complete TypeScript interfaces & contracts
│       │
│       ├── pages/
│       │   ├── Dashboard.tsx          # Real-time SCADA control room & crisis trigger
│       │   ├── Simulation.tsx         # 72-hour dual-track comparative digital twin playback
│       │   └── Forecast.tsx           # Multi-horizon weather, rime ice, and load forecast curves
│       │
│       └── components/
│           ├── Header.tsx             # Station switcher, system time, connectivity badges
│           ├── CurrentEnergyCard.tsx  # KPI gauges, battery SoC meter, crisis countdown overlay
│           ├── LoadManagement.tsx     # P0/P1/P2 load table, priority shed switches, status pill
│           ├── EnergyFlow.tsx         # Microgrid energy balance Sankey-style flux diagram
│           ├── DigitalTwin.tsx        # 2.5D/3D visual canvas of station habitats & solar arrays
│           ├── SimulationControls.tsx # 72-hour timeline scrubber, speed multiplier (1x/5x/10x), scenario injector
│           ├── BaselineComparison.tsx # Side-by-side metric cards & delta charts (Fuel, BESS cycles, Genset hours)
│           ├── AgentActivity.tsx      # Multi-agent reasoning log with expandable decision steps
│           ├── ForecastChart.tsx      # Recharts time-series: Irradiance, Wind, Temp, Rime Ice
│           ├── WeatherPanel.tsx       # Live atmospheric dials & katabatic wind warnings
│           ├── StationMap.tsx         # Polar coordinate locator (Leaflet/SVG map)
│           ├── StationConfig.tsx      # Asset ratings (PV kWp, BESS kWh, Generator max kW, Load priorities)
│           ├── OptimizationTimeline.tsx # 24h/72h optimal dispatch schedule Gantt/Stacked Area
│           ├── ExplainabilityModal.tsx # Transparent AI decision reasoning & constraints breakdown
│           ├── FinalReportModal.tsx   # Comprehensive post-simulation fuel & carbon savings audit
│           ├── DataSourcesFooter.tsx  # Sensor lineage, PINN dataset specs, Open-Meteo citations
│           └── PolarisDashboard.tsx    # Live WebSocket-driven telemetry dashboard view
│
└── venv/                              # Python Virtual Environment
=======
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │ OBSERVE  │ ──> │ PREDICT  │ ──> │ SIMULATE │ ──> │ OPTIMIZE │ ──> │ VALIDATE │ ──> │   ACT    │
  └──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
  Live SCADA &     Solar/Load       Dual-Track       Google OR-       Physics &        BESS & Genset
  Sensors          AI Forecasting   Digital Twin     MILP Solver      Safety Checks    Dispatch
>>>>>>> 6d73554 (forecast)
```

---

<<<<<<< HEAD
## 3. Mathematical & Physical Formulations (`backend/physics/polar_physics.py`)

All polar physics calculations are implemented as pure, side-effect-free mathematical functions shared identically across simulation and optimization.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       POLARIS PHYSICS ENGINE MODELS                         │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│  1. Arrhenius Battery   │   2. Rime Ice Accretion │   3. CHP Thermal        │
│     Derating & Heaters  │      Accumulator Model  │      Coupling Model     │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### Model 1: Arrhenius Battery Derating (Cold-Temperature Electrochemical Freeze)
Li-ion (Li-NMC / LFP) battery internal impedance increases exponentially at sub-zero temperatures, dropping round-trip efficiency (RTE) and usable capacity.

1. **Temperature-Adjusted Round-Trip Efficiency (RTE)**:
   $$\text{RTE}(T) = \begin{cases} 
   \text{RTE}_{\text{base}} & \text{if } T \ge T_{\text{ref}} \\
   \max\left(\text{RTE}_{\min}, \;\text{RTE}_{\text{base}} \cdot \exp\left(\alpha \cdot (T - T_{\text{ref}})\right)\right) & \text{if } T < T_{\text{ref}}
   \end{cases}$$
   - $T_{\text{ref}} = -10.0\text{ }^\circ\text{C}$ (Arrhenius onset threshold)
   - $\alpha = 0.025\text{ }^\circ\text{C}^{-1}$ (Decay constant calibrated to ~22% RTE reduction at $-30^\circ\text{C}$)
   - $\text{RTE}_{\min} = 0.60$ (Physical minimum efficiency floor)
   - Symmetric one-way charge/discharge efficiency: $\eta_{\text{chg}}(T) = \eta_{\text{dis}}(T) = \sqrt{\text{RTE}(T)}$

2. **Parasitic Battery Thermal Management Load**:
   $$P_{\text{heater}}(T) = \begin{cases}
   C_{\text{heater\_frac}} \cdot \text{Cap}_{\text{BESS}} & \text{if } T < T_{\text{heater\_on}} \\
   0.0 & \text{if } T \ge T_{\text{heater\_on}}
   \end{cases}$$
   - $T_{\text{heater\_on}} = -20.0\text{ }^\circ\text{C}$
   - $C_{\text{heater\_frac}} = 0.005\text{ kW/kWh}$ (e.g., $3.0\text{ kW}$ firm load on a $600\text{ kWh}$ pack)

3. **Effective Usable Capacity Derating**:
   $$\text{Cap}_{\text{eff}}(T) = \begin{cases}
   \text{Cap}_{\text{base}} & \text{if } T \ge T_{\text{ref}} \\
   \max\left(0.75 \cdot \text{Cap}_{\text{base}}, \;\text{Cap}_{\text{base}} \cdot \exp(0.5 \cdot \alpha \cdot (T - T_{\text{ref}}))\right) & \text{if } T < T_{\text{ref}}
   \end{cases}$$

---

### Model 2: Rime Ice Accretion Accumulator Variable
Rime ice accumulates dynamically across time steps as supercooled water droplets strike solar PV panels during katabatic winds.

1. **Dynamic Accretion & Melting Rate**:
   $$\Delta \text{Ice}(t) = \begin{cases}
   \text{Base} \cdot \max(0, V_{\text{wind}}(t) - V_{\text{thresh}}) \cdot \left(\frac{\text{RH}(t)}{100}\right) & \text{if } T(t) \le 0^\circ\text{C} \\
   - \text{MeltRate} & \text{if } T(t) > 0^\circ\text{C}
   \end{cases}$$
   - $\text{Base} = 0.08\text{ \%/}(\text{km/h}\cdot\text{h})$
   - $V_{\text{thresh}} = 15.0\text{ km/h}$
   - $\text{MeltRate} = 5.0\text{ \%/h}$
   - Accumulator bound: $\text{Ice}(t) = \min(100.0, \;\max(0.0, \;\text{Ice}(t-1) + \Delta \text{Ice}(t)))$

2. **Solar Generation Derating**:
   $$P_{\text{solar}}(t) = P_{\text{solar, clear}}(t) \cdot \left(1.0 - \text{Ice}(t) \cdot \gamma_{\text{ice}}\right)$$
   - $\gamma_{\text{ice}} = 0.0085$ (At 100% ice coverage, 85% of irradiance is blocked; 15% diffuse light still penetrates)

3. **Human-In-The-Loop Work Order Trigger**:
   - If $\text{Ice}(t) \ge 60.0\%$, the Energy Manager Agent triggers a work order for manual crew clearing.
   - Panel clearing completes after $\Delta t_{\text{crew}} = 2\text{ hours}$, resetting $\text{Ice}(t) = 0.0\%$.

---

### Model 3: Combined Heat & Power (CHP) Waste Heat Recovery
Diesel generators produce electrical energy at ~35% efficiency and recoverable exhaust/jacket heat at ~45% efficiency.

1. **Recoverable Thermal Output**:
   $$Q_{\text{thermal}}(t) = P_{\text{diesel}}(t) \cdot C_{\text{CHP}}$$
   - $C_{\text{CHP}} = \frac{0.45}{0.35} \approx 1.30\text{ kW}_{\text{thermal}}/\text{kW}_{\text{electric}}$

2. **Net Electrical Heating Demand**:
   $$P_{\text{heat, electric}}(t) = \max\left(0.0, \;P_{\text{heat, required}}(t) - Q_{\text{thermal}}(t)\right)$$

3. **Total Station Net Demand**:
   $$P_{\text{net\_demand}}(t) = P_{\text{critical\_electrical}}(t) + P_{\text{deferrable\_electrical}}(t) + P_{\text{heater}}(t) + P_{\text{heat, electric}}(t)$$

---

### Model 4: Exergy Runway & Thermal Death Calculation (Crisis Mode)
In the event of total generation loss ($P_{\text{solar}} = 0, P_{\text{diesel}} = 0$):

$$\text{Survival Hours} = \frac{\text{Battery Available Energy (kWh)}}{P_0\text{ Life Support Demand (kW)}} = \frac{\text{Cap}_{\text{BESS}} \cdot \left(\frac{\text{SoC}}{100}\right)}{\sum_{i \in P_0} P_i}$$

For Bharati Station at $75\%\text{ SoC}$ ($450\text{ kWh}$) and $P_0 = 85.0\text{ kW}$:
$$\text{Runway} = \frac{450\text{ kWh}}{85\text{ kW}} \approx 5.29\text{ Hours} = 5\text{ Hours } 17\text{ Minutes}$$

---

## 4. Google OR-Tools MILP Solver Formulation (`backend/optimization/energy_optimizer.py`)

POLARIS formulates polar microgrid dispatch as a Mixed-Integer Linear Program (MILP) solved using the **SCIP solver** in Google OR-Tools over an $N$-step horizon ($N=72\text{ hours}$, step $\Delta t = 1\text{ hour}$).

### Decision Variables (for each timestep $t \in [0, N-1]$):
- $P_{\text{gen}}(t) \ge 0$: Diesel generator electrical output (kW)
- $u_{\text{gen}}(t) \in \{0, 1\}$: Binary generator running status
- $P_{\text{chg}}(t) \ge 0$: Battery charging power (kW)
- $P_{\text{dis}}(t) \ge 0$: Battery discharging power (kW)
- $u_{\text{chg}}(t), u_{\text{dis}}(t) \in \{0, 1\}$: Complementary charge/discharge binary locks
- $\text{SoC}(t) \in [\text{SoC}_{\min}, \text{SoC}_{\max}]$: Battery state of charge (kWh)
- $P_{\text{curt, P2}}(t) \ge 0$: P2 load curtailment (Science/Rover) (kW)
- $P_{\text{curt, P1}}(t) \ge 0$: P1 load curtailment (BESS thermal) (kW)
- $P_{\text{shortfall}}(t) \ge 0$: Critical P0 unserved load violation penalty (kW)

### Objective Function:
$$\min \sum_{t=0}^{N-1} \Big[ C_{\text{fuel}} \cdot P_{\text{gen}}(t) + C_{\text{om}} \cdot u_{\text{gen}}(t) + C_{\text{start}} \cdot \max(0, u_{\text{gen}}(t) - u_{\text{gen}}(t-1)) + C_{\text{deg}} \cdot (P_{\text{chg}}(t) + P_{\text{dis}}(t)) + w_{\text{p2}} \cdot P_{\text{curt, P2}}(t) + w_{\text{p1}} \cdot P_{\text{curt, P1}}(t) + w_{\text{crit}} \cdot P_{\text{shortfall}}(t) \Big]$$

### Constraints:
1. **Instantaneous Power Balance**:
   $$P_{\text{solar}}(t) + P_{\text{gen}}(t) + P_{\text{dis}}(t) = P_{\text{net\_demand}}(t) + P_{\text{chg}}(t) - P_{\text{curt, P2}}(t) - P_{\text{curt, P1}}(t) - P_{\text{shortfall}}(t)$$
2. **Dynamic SoC State Transition with Arrhenius Efficiencies**:
   $$\text{SoC}(t+1) = \text{SoC}(t) + \left( P_{\text{chg}}(t) \cdot \eta_{\text{chg}}(T_t) - \frac{P_{\text{dis}}(t)}{\eta_{\text{dis}}(T_t)} \right) \Delta t$$
3. **Generator Operating Bounds & Anti-Wet-Stacking Floor**:
   $$u_{\text{gen}}(t) \cdot P_{\text{gen, min}} \le P_{\text{gen}}(t) \le u_{\text{gen}}(t) \cdot P_{\text{gen, max}} \quad (P_{\text{gen, min}} \ge 0.40 \cdot P_{\text{gen, max}})$$
4. **Battery C-Rate & Complementarity**:
   $$P_{\text{chg}}(t) \le u_{\text{chg}}(t) \cdot P_{\text{bess, max}}, \quad P_{\text{dis}}(t) \le u_{\text{dis}}(t) \cdot P_{\text{bess, max}}, \quad u_{\text{chg}}(t) + u_{\text{dis}}(t) \le 1$$

---

## 5. Multi-Agent Orchestration Framework (`backend/agents/orchestrator.py`)

POLARIS deploys four specialized autonomous agents operating in structured negotiation:

```mermaid
graph TD
    A[Scenario Agent] -->|Injects Katabatic Storm/Disaster| B[Forecast Agent]
    B -->|Generates 72h Irradiance, Wind, Temp, Rime Ice| C[Energy Manager Agent]
    C -->|Formulates MILP Dispatch & Crew Work Orders| D[Safety Agent]
    D -->|Validates SoC Reserve & Fuel Bounds| E{Violations?}
    E -->|Yes: Apply Override Protocols| C
    E -->|No: Approve Dispatch Plan| F[Digital Twin & SCADA Controller]
```

1. **Scenario Agent**: Defines environmental triggers (e.g., Polar Storm, Total Solar Dropout, Genset Failure, Extreme Katabatic Freeze).
2. **Forecast Agent**: Synthesizes Open-Meteo predictions with PINN rime-ice models to output 72h hazard projections.
3. **Energy Manager Agent**: Solves the MILP dispatch, schedules pre-storm battery charging, and triggers human-in-the-loop mechanical panel clearing when ice $\ge 60\%$.
4. **Safety Agent**: Enforces hard constraints (minimum 30% battery reserve before blizzards, maximum generator thermal limits, 0% P0 life-support curtailment).

---

## 6. Complete REST & WebSocket API Specification

### REST Endpoints Summary:

| Method | Endpoint | Description | Key Request / Query Parameters | Response Object |
|--------|----------|-------------|--------------------------------|-----------------|
| `GET` | `/` | Root API status & directory | None | System info & endpoint catalog |
| `GET` | `/health` | Healthcheck | None | `{"status": "healthy"}` |
| `GET` | `/api/station/presets` | Get preset polar station specs | None | `Dict[str, StationConfig]` |
| `POST` | `/api/station/calculate-state` | Compute static state from inputs | Station config payload | `StationStateResponse` |
| `GET` | `/api/weather/live` | Live atmospheric telemetry | `lat`, `lon` (float query params) | `WeatherResponse` |
| `POST` | `/api/forecast/run` | Run 72-hour AI forecast | `station_id`, `scenario_id` | `ForecastResult` |
| `POST` | `/api/optimization/solve` | Run Google OR-Tools MILP | Station, weather, horizons | `OptimizationResult` |
| `POST` | `/api/simulation/run` | Run full 72h dual-track sim | Station, scenario, solver config | `SimulationResult` |
| `POST` | `/api/simulation/crisis` | Trigger Catastrophic SOS Mode | None | `CrisisResponse` |
| `POST` | `/api/agents/orchestrate` | Trigger multi-agent reasoning loop | Station, weather, scenario | `AgentOrchestrationResponse` |
| `WS` | `/api/simulation/ws/stream` | Real-time SCADA telemetry stream | WebSocket connection | Continuous `PolarisSystemState` JSON |

---

## 7. Catastrophic Crisis Protocol & SOS Webhook

### Route: `POST /api/simulation/crisis` (`backend/api/crisis.py`)

When triggered, the system enforces non-negotiable survival rules:
1. Solar generation is forced to $0\text{ kW}$ (panels iced/damaged).
2. Diesel generators are forced to $0\text{ kW}$ (genset fuel/mechanical blackout).
3. P1 (BESS Heating) is shed to $0\text{ kW}$ (cells sacrifice cycle longevity to save crew).
4. P2 (Science, Labs, Computing, Rover Chargers) are shed to $0\text{ kW}$.
5. P0 (Life Support Thermal, Comms, Water & Air Scrubbers) remains $100\%$ powered ($85.0\text{ kW}$).
6. Thermal death exergy runway is calculated and delivered to UI.
7. Asynchronous SOS satellite webhook is fired to `REPLIT_WEBHOOK_URL` (or logged locally).
8. Crisis event is recorded into immutable `scada_telemetry.sqlite` ledger.

```mermaid
sequenceDiagram
    participant UI as React SCADA Dashboard
    participant API as FastAPI /api/simulation/crisis
    participant DB as scada_telemetry.sqlite
    participant WH as Satellite Webhook (REPLIT_WEBHOOK_URL)

    UI->>API: POST /api/simulation/crisis
    API->>API: Force Solar=0 kW, Diesel=0 kW
    API->>API: Shed P1 (Heater) & P2 (Science) to 0 kW
    API->>API: Calculate Runway: 450 kWh / 85 kW = 5h 17m
    API->>DB: INSERT INTO crisis_events (...)
    API->>WH: POST Webhook Payload (Fire-and-Forget)
    API-->>UI: Return CrisisResponse JSON
    UI->>UI: Flash Emergency Red UI, Start Countdown Timer, Zero Gauges
```

### SOS Webhook Payload Schema:
=======
## 2. Complete Project Directory Structure

```
Master_Polaris/
├── architecture_schema.md             ← Single Source of Truth (v4.0)
├── architecture_schema_v3.md          ← THIS FILE (Synced to v4.0)
│
├── backend/
│   ├── main.py                        # FastAPI entrypoint — CORS & REST/WS router registration
│   ├── requirements.txt               # Dependencies (fastapi, uvicorn, ortools, httpx, sqlite3, pydantic)
│   ├── .env.example                   # Environment variables (REPLIT_WEBHOOK_URL, OLLAMA_HOST)
│   │
│   ├── api/                           # REST & WebSocket API endpoints
│   │   ├── station.py                 # GET /api/station/presets, POST /api/station/calculate-state
│   │   ├── weather.py                 # GET /api/weather/live (Open-Meteo API & Edge Cache)
│   │   ├── forecast.py                # POST /api/forecast/run (Solar & Load AI prediction)
│   │   ├── optimization.py            # POST /api/optimization/solve (OR-Tools MILP schedule)
│   │   ├── simulation.py              # POST /api/simulation/run, WS /api/simulation/ws/stream
│   │   ├── crisis.py                  # POST /api/simulation/crisis (Catastrophic Crisis & SOS)
│   │   └── agents.py                  # POST /api/agents/orchestrate (Multi-agent AI cycle)
│   │
│   ├── database/                      # Data persistence & edge resilience
│   │   ├── db.py                      # Primary SQLite connection (polaris.db)
│   │   ├── schema.py                  # Operational database table definitions
│   │   └── edge_db.py                 # Edge-deployed resilient SQLite layer
│   │
│   ├── data/                          # Data files & SQLite databases
│   │   ├── polaris.db                 # Primary operational database
│   │   ├── weather_cache.sqlite       # Edge DB: Cached weather forecasts with TTL
│   │   ├── scada_telemetry.sqlite     # Edge DB: SCADA sensor logs & immutable crisis log
│   │   ├── historical_telemetry.csv   # 15,000+ synthetic katabatic edge-case telemetry records
│   │   └── station_presets.py         # Polar station configurations (Bharati, Maitri, etc.)
│   │
│   ├── physics/                       # Polar Physics Engine (Pure Side-Effect-Free Functions)
│   │   └── polar_physics.py           # Arrhenius RTE decay, Rime ice accumulator, CHP coupling
│   │
│   ├── optimization/                  # Mathematical MILP Dispatch Engine
│   │   └── energy_optimizer.py        # Google OR-Tools SCIP MILP solver & heuristic fallback
│   │
│   ├── forecasting/                   # AI Forecasting Pipeline
│   │   ├── solar_forecast.py          # Physics-informed solar irradiance & PV prediction
│   │   └── load_forecast.py           # Thermal & electrical baseline load forecaster
│   │
│   ├── simulation/                    # Dual-Track Digital Twin Simulation
│   │   ├── engine.py                  # Sequential comparison engine (Baseline SCADA vs POLARIS AI)
│   │   └── scenarios.py               # Disaster & extreme storm scenario definitions
│   │
│   ├── agents/                        # Multi-Agent AI Orchestration
│   │   └── orchestrator.py            # Forecast, Energy Manager, Safety & Qwen3 LLM Agents
│   │
│   ├── services/                      # Service Layer & Synthetic Telemetry Generators
│   │   ├── data_validator.py          # Telemetry range & quality check service
│   │   ├── load_service.py            # Station load calculation service
│   │   ├── solar_service.py           # Solar irradiance & shading service
│   │   ├── optimizer_service.py       # Wrapper service for energy optimizer
│   │   └── synthetic_telemetry_engine.py # Synthetic SCADA generator for polar edge-cases
│   │
│   └── scripts/                       # Database initialization & generation scripts
│       └── generate_synthetic_telemetry.py # Telemetry database seeder
│
└── frontend/
    ├── src/
    │   ├── App.tsx                    # Root React component — routing & state management
    │   ├── main.tsx                   # Vite application entrypoint
    │   ├── index.css                  # Tailwind CSS global styling
    │   │
    │   ├── api/
    │   │   └── client.ts              # REST API client & Axios/Fetch wrappers
    │   │
    │   ├── components/                # React Dashboard UI Components
    │   │   ├── Header.tsx             # Navigation header & resilience indicator
    │   │   ├── CurrentEnergyCard.tsx  # Microgrid KPI cards & Crisis countdown timer
    │   │   ├── LoadManagement.tsx     # P0/P1/P2 priority load shedding UI table
    │   │   ├── EnergyFlow.tsx         # Real-time Sankey energy flow diagram
    │   │   ├── DigitalTwin.tsx        # 3D canvas render of polar station
    │   │   ├── SimulationControls.tsx # Dual-track simulation playback controls
    │   │   ├── BaselineComparison.tsx # Baseline vs POLARIS AI metric comparisons
    │   │   ├── AgentActivity.tsx      # Multi-agent decision feed log
    │   │   ├── ForecastChart.tsx      # Solar & load prediction timelines
    │   │   ├── WeatherPanel.tsx       # Live atmospheric & katabatic telemetry
    │   │   ├── StationMap.tsx         # Interactive Leaflet Antarctic map
    │   │   ├── StationConfig.tsx      # Equipment & fuel configuration controls
    │   │   ├── OptimizationTimeline.tsx # 24h optimal dispatch schedule
    │   │   ├── ExplainabilityModal.tsx # AI decision transparency modal
    │   │   ├── FinalReportModal.tsx   # Simulation run summary report
    │   │   ├── DataSourcesFooter.tsx  # Data lineage & pipeline specs
    │   │   └── PolarisDashboard.tsx    # Live WebSocket SCADA telemetry dashboard
    │   │
    │   ├── pages/
    │   │   ├── Dashboard.tsx          # Real-time control & crisis tab
    │   │   ├── Simulation.tsx         # Digital twin simulation tab
    │   │   └── Forecast.tsx           # AI forecast & optimization tab
    │   │
    │   ├── store/
    │   │   └── usePolarisStore.ts     # Zustand global store & WebSocket handler
    │   │
    │   └── types/
    │       └── index.ts               # TypeScript types & API response contracts
    │
    ├── index.html                     # HTML index template
    ├── vite.config.ts                 # Vite bundler configuration
    ├── tailwind.config.js             # Tailwind CSS configuration
    ├── postcss.config.js              # PostCSS plugins
    ├── tsconfig.json                  # TypeScript compiler configuration
    └── package.json                   # Frontend dependencies & scripts
```

---

## 3. High-Level Component & Layer Architecture

```mermaid
graph TD
    subgraph Frontend Layer [React 18 / TypeScript / Vite]
        UI[Polaris Dashboard Pages]
        Store[Zustand Store: usePolarisStore]
        ApiClient[API Client: client.ts]
        3DTwin[3D DigitalTwin Canvas]
    end

    subgraph Backend API Layer [FastAPI / Uvicorn]
        RouterStation[Station Router /api/station]
        RouterWeather[Weather Router /api/weather]
        RouterForecast[Forecast Router /api/forecast]
        RouterOpt[Optimization Router /api/optimization]
        RouterSim[Simulation Router /api/simulation]
        RouterCrisis[Crisis Router /api/simulation/crisis]
        RouterAgents[Agents Router /api/agents]
    end

    subgraph Core Physics & AI Engines [Python Engines]
        PhysicsEngine[Polar Physics Engine: Arrhenius + Rime Ice + CHP]
        OptimizerEngine[Google OR-Tools MILP Solver: SCIP]
        Forecaster[AI Solar & Load Forecasters]
        AgentOrchestrator[Multi-Agent Orchestrator: Qwen3 / Ollama]
        DualTrackEngine[Dual-Track Simulation Engine]
    end

    subgraph Edge Resilience & Persistence Layer [SQLite]
        PrimaryDB[(polaris.db)]
        WeatherCache[(weather_cache.sqlite)]
        ScadaDB[(scada_telemetry.sqlite)]
    end

    subgraph External Systems & Services
        OpenMeteo[Open-Meteo Weather API]
        SOSWebhook[Replit SOS Webhook Endpoint]
    end

    UI <--> Store
    Store <--> ApiClient
    ApiClient <--> Backend API Layer

    RouterStation --> Core Physics & AI Engines
    RouterWeather --> WeatherCache
    RouterWeather --> OpenMeteo
    RouterForecast --> Forecaster
    RouterOpt --> OptimizerEngine
    RouterSim --> DualTrackEngine
    RouterCrisis --> ScadaDB
    RouterCrisis --> SOSWebhook
    RouterAgents --> AgentOrchestrator

    Core Physics & AI Engines --> PhysicsEngine
    Core Physics & AI Engines --> PrimaryDB
    DualTrackEngine --> ScadaDB
```

---

## 4. Phase 2 Polar Physics Engine Details

The POLARIS Physics Engine (`backend/physics/polar_physics.py`) provides pure, side-effect-free physics functions used consistently across both the sequential simulation engine and the mathematical optimizer.

```mermaid
classDiagram
    class PolarPhysicsEngine {
        +compute_arrhenius_rte(base_rte, temp_c) (eta_chg, eta_dis)
        +compute_battery_parasitic_load(batt_cap_kwh, temp_c) float
        +compute_arrhenius_capacity_derate(base_capacity_kwh, temp_c) float
        +compute_ice_trajectory(weather_forecast, initial_ice, clear_hours) List~float~
        +apply_ice_solar_derating(solar_ideal, ice_pct) float
        +compute_chp_heat_available(p_gen_kw, c_thermal) float
        +compute_chp_heat_displaced(p_gen_kw, heat_demand, c_thermal) float
        +compute_net_electrical_heating(total_heat, p_gen_kw, c_thermal) float
    }
```

### 1. Arrhenius Battery Derating
- **Physics**: Li-ion internal resistance increases exponentially below $-10^\circ\text{C}$.
$$\text{RTE}_{\text{adj}} = \text{RTE}_{\text{base}} \cdot e^{\alpha (T - T_{\text{ref}})} \quad \text{for } T < -10^\circ\text{C} \quad (\alpha = 0.025)$$
- **Parasitic Heating**: BMS thermal management heating blankets activate below $-20^\circ\text{C}$, consuming $0.5\%$ of battery capacity per hour ($3.0\text{ kW}$ for a $600\text{ kWh}$ BESS bank).

### 2. Rime Ice Accretion Accumulator
- **Accretion Model**: Driven by katabatic winds ($\ge 15\text{ km/h}$) and relative snowfall.
$$\Delta \text{Ice} = \left(\frac{v_{\text{wind}}}{100}\right) \times (1 + 2 \cdot \text{Snowfall}) \times 8.0 \quad [\%/\text{hr}]$$
- **Solar Derating**: Up to $85\%$ solar blockage at $100\%$ ice coverage ($15\%$ diffuse light passes through).

### 3. Combined Heat & Power (CHP) Coupling
- **Thermal Recovery**: Diesel generator produces recoverable waste heat from jacket coolant and exhaust.
$$Q_{\text{recoverable}} = P_{\text{generator}} \times 1.3 \quad [\text{kW}_{\text{thermal}}/\text{kW}_{\text{electrical}}]$$
- **Heating Displacement**: Displaces electrical habitat heating load, directly reducing diesel fuel consumption.

---

## 5. Google OR-Tools MILP Energy Optimizer

The optimizer (`backend/optimization/energy_optimizer.py`) solves optimal microgrid unit commitment and dispatch over $24\text{h}$ or $72\text{h}$ horizons.

```mermaid
flowchart LR
    Input[Weather & Station Inputs] --> Preprocess[Pre-compute Physics Constants]
    Preprocess --> MILP[Google OR-Tools SCIP MILP Solver]
    
    subgraph MILP Formulation
        Vars[Decision Variables: P_gen, P_chg, P_dis, SOC, H_displaced]
        Obj[Objective: Min Fuel Cost + Wear Cost - CHP Heat Credit]
        Constraints[Constraints: Power Balance, Battery SOC, Ramp Limits, Genset Min Load]
    end

    MILP --> DecisionVars
    DecisionVars --> Result[Optimal 24h Schedule JSON]
```

### Objective Function
$$\min \sum_{t=1}^{T} \left( C_{\text{fuel}} \cdot P_{\text{gen}}[t] + C_{\text{wear}}(T[t]) \cdot P_{\text{dis}}[t] - C_{\text{CHP}} \cdot H_{\text{displaced}}[t] \right)$$

---

## 6. Catastrophic Crisis & Emergency SOS Workflow

### Load Shedding Priority Hierarchy
| Priority Tier | Load Category | Description | Shedding Protocol | Bharati Preset Load |
|---|---|---|---|---|
| **P0** | Life Support | Habitat thermal, satellite communications, air/water scrubbers | **NEVER SHED** — Powered until battery depletion | 85.0 kW |
| **P1** | BESS Heating | Battery thermal management parasitic heater | **SHED FIRST** — Sacrifices battery degradation for human life | 15.0 kW |
| **P2** | Science & Rover | High-performance computing, science labs, rover charging | **SHED IMMEDIATELY** — Set to 0 kW in grid emergency | 127.0 kW |

### Thermal Death Runway Calculation
$$\text{Survival Hours} = \frac{\text{Battery Available Energy (kWh)}}{\text{P0 Load (kW)}} = \frac{600\text{ kWh} \times 0.75}{85.0\text{ kW}} = 5.29\text{ Hours } (5\text{h } 17\text{m})$$

### Crisis Execution Flow Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant UI as React UI Dashboard
    participant API as FastAPI /api/simulation/crisis
    participant EdgeDB as scada_telemetry.sqlite
    participant Webhook as Replit SOS Webhook

    UI->>API: POST /api/simulation/crisis
    API->>API: Load Bharati Station Configuration
    API->>API: Set Solar = 0 kW, Diesel = 0 kW
    API->>API: Shed P1 (BESS Heater) & P2 (Science/Rover) → 0 kW
    API->>API: Calculate Survival Runway: 450 kWh / 85 kW = 5.29 hrs
    API->>EdgeDB: Log immutable crisis record into crisis_events table
    API->>Webhook: POST SOS Payload JSON (Async fire-and-forget)
    Webhook-->>API: HTTP 200 OK
    API-->>UI: CrisisResponse JSON Payload
    UI->>UI: Trigger Emergency UI Modal, Countdown Timer & Zero Gauges
```

### SOS Webhook JSON Payload Schema
>>>>>>> 6d73554 (forecast)
```json
{
  "status": "CRITICAL_SOS",
  "station": "Bharati",
  "fault": "Total Generation Failure",
  "p0_exergy_remaining_hours": 5.29,
<<<<<<< HEAD
  "timestamp": "2026-09-05T10:45:00Z",
=======
  "timestamp": "2026-09-05T09:38:00Z",
>>>>>>> 6d73554 (forecast)
  "battery_soc_pct": 75.0,
  "p0_load_kw": 85.0,
  "battery_energy_kwh": 450.0
}
```

---

<<<<<<< HEAD
## 8. Frontend Architecture & Component Tree

The frontend is built with **React 18 + TypeScript + Vite + Tailwind CSS + Zustand + Lucide Icons + Recharts**.

```
App.tsx
├── Header.tsx (Navigation tabs, station switcher, edge database resilience status)
│
├── [Tab: Dashboard] (Dashboard.tsx)
│   ├── WeatherPanel.tsx (Ambient temp, katabatic wind, solar irradiance, ice alerts)
│   ├── CurrentEnergyCard.tsx (KPI dials, battery SoC meter, CRISIS COUNTDOWN TIMER OVERLAY)
│   ├── LoadManagement.tsx (P0/P1/P2 load table, shedding toggle switches, power bar)
│   ├── EnergyFlow.tsx (Interactive flux diagram: Generation -> BESS -> Critical/Thermal/Science)
│   ├── DigitalTwin.tsx (2.5D visual render canvas of station dome & solar array)
│   └── StationConfig.tsx (Hardware ratings: PV kWp, BESS kWh, Diesel max kW)
│
├── [Tab: Simulation] (Simulation.tsx)
│   ├── SimulationControls.tsx (72h scrubber, play/pause, 1x/5x/10x speed, scenario dropdown)
│   ├── BaselineComparison.tsx (Side-by-side metric cards: Baseline SCADA vs Polaris AI)
│   └── AgentActivity.tsx (Live multi-agent explainability stream: Scenario, Forecast, Energy, Safety)
│
├── [Tab: Forecast] (Forecast.tsx)
│   ├── ForecastChart.tsx (Irradiance 72h curve, Wind speed envelope, Load forecast)
│   └── OptimizationTimeline.tsx (MILP 72-hour stacked dispatch timeline)
│
├── ExplainabilityModal.tsx (Deep-dive AI mathematical reasoning & constraint audit)
├── FinalReportModal.tsx (Post-simulation audit: fuel saved, CO2 avoided, battery cycles saved)
└── DataSourcesFooter.tsx (PINN dataset specs, Open-Meteo lineage, edge DB status)
```

### State Management (`frontend/src/store/usePolarisStore.ts`):
- **Store**: `usePolarisStore` (Zustand).
- **WebSocket Connection**: Connects to `ws://localhost:8000/api/simulation/ws/stream`.
- **Auto-Reconnect**: High-availability retry loop with backoff.
- **Granular Selectors**: Prevents unnecessary DOM re-renders by selecting individual scalars (`simulation_hour`, `temperature_c`, `battery_soc_pct`, `critical_shortfall_kw`).

---

## 9. Data Persistence & Edge Resilience Layer

POLARIS implements a tri-database architecture for uninterrupted edge operation during Antarctic satellite blackouts:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           3× SQLITE EDGE STORAGE                            │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│ 1. polaris.db           │ 2. weather_cache.sqlite │ 3. scada_telemetry.     │
│    Primary DB           │    Weather TTL Cache    │    sqlite (Crisis Log)  │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

1. **`polaris.db`** (`backend/database/schema.py`):
   - `stations`: Physical station configurations, solar capacities, battery ratings.
   - `telemetry`: Historical sensor records.
   - `data_quality_flags`: Sensor outlier and plausibility validation flags.

2. **`weather_cache.sqlite`** (`backend/database/edge_db.py`):
   - `cached_forecasts`: Stores Open-Meteo responses with TTL for full offline capability.

3. **`scada_telemetry.sqlite`** (`backend/database/edge_db.py`):
   - `sensor_readings`: High-frequency sensor streams (voltage, current, temperature).
   - `crisis_events`: Immutable audit ledger recording every SOS activation, runway, and webhook status.

---

## 10. Execution & Run Commands

### Prerequisites:
- Python 3.10+ in active virtual environment (`venv`)
- Node.js 18+ and npm

### 1. Backend Startup:
```bash
# Activate virtualenv (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install / update backend dependencies
pip install -r backend/requirements.txt

# Start FastAPI backend server
uvicorn backend.main:app --reload --port 8000
```
*Backend API will be live at `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.*

### 2. Frontend Startup:
```bash
# Navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend SCADA Dashboard will be live at `http://localhost:5173`.*

---

*Document Version: 3.0 — Comprehensive Polaris Digital Twin Master Schema*  
*Last Updated: September 2026*  
*Smart India Hackathon 2026 — Problem Statement PS26061*
=======
## 7. Edge-Deployed SQLite Resilience Layer

POLARIS implements a 3-tier SQLite storage topology to guarantee mission-critical reliability during satellite blackouts.

```mermaid
erDiagram
    cached_forecasts {
        INTEGER id PK
        TEXT station_id
        REAL latitude
        REAL longitude
        TEXT forecast_json
        TEXT fetched_at
        TEXT expires_at
        TEXT source
    }

    sensor_readings {
        INTEGER id PK
        TEXT timestamp
        TEXT station_id
        TEXT sensor_type
        REAL value
        TEXT unit
        TEXT quality
    }

    crisis_events {
        INTEGER id PK
        TEXT timestamp
        TEXT station_id
        TEXT fault_type
        REAL p0_load_kw
        REAL battery_soc_pct
        REAL survival_hours
        INTEGER webhook_fired
        TEXT webhook_response
    }
```

1. **Primary Database (`polaris.db`)**: Holds long-term station state, preset configurations, and historical baseline runs.
2. **Weather Cache Edge DB (`weather_cache.sqlite`)**: Caches Open-Meteo hourly weather forecasts with expiration TTL to maintain offline forecast capability.
3. **SCADA Telemetry Edge DB (`scada_telemetry.sqlite`)**: High-frequency sensor logger and immutable ledger for emergency crisis events.

---

## 8. Multi-Agent AI Orchestration

POLARIS features a 4-agent autonomous swarm (`backend/agents/orchestrator.py`):

```mermaid
graph LR
    ForecastAgent[Forecast Agent] --> EnergyMgr[Energy Manager Agent]
    EnergyMgr --> SafetyAgent[Safety & Resilience Agent]
    SafetyAgent --> AdvisoryLLM[Advisory LLM Agent: Qwen3 / Ollama]
    AdvisoryLLM --> ControlAction[Microgrid Control Action]
```

1. **Forecast Agent**: Evaluates katabatic wind trends, solar irradiance, and rime ice buildup.
2. **Energy Manager Agent**: Calls the OR-Tools MILP optimizer to generate candidate microgrid schedules.
3. **Safety & Resilience Agent**: Enforces hard battery SOC bounds, generator ramp rates, and P0 life-support reservations.
4. **Advisory LLM Agent**: Provides natural-language explainability and operational recommendations powered by an edge-deployed Qwen3 model.

---

## 9. AI Pipeline & Model Specifications

| Parameter | Value / Specification |
|---|---|
| **Training Corpus** | 15,000+ Synthetic Katabatic Edge-Case Records |
| **Optimization Engine** | Google OR-Tools MILP (SCIP Solver) |
| **Weather Telemetry** | Open-Meteo High-Resolution Atmospheric API |
| **Physics Engines** | Arrhenius Battery Decay + Rime Ice Accumulator + CHP Thermal Recovery |
| **Edge Advisory Model** | Qwen3:8B via Ollama |
| **Edge Storage** | 3× Resilient SQLite Layer |

---

*Document Version: 4.0 — Synced Version Reference*  
*Last Updated: September 2026*  
*Project: POLARIS — AI Polar Energy Resilience Platform & Digital Twin*  
*Problem Statement: Smart India Hackathon 2026 PS26061*
>>>>>>> 6d73554 (forecast)
