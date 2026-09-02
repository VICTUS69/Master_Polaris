"""
POLARIS Scenarios Engine
Defines disaster, extreme weather, and equipment failure conditions for polar resilience testing.

Phase 2 changes:
  - Removed `battery_capacity_multiplier` (static video-game logic).
    Battery capacity derating is now handled dynamically by the Arrhenius model
    in backend/physics/polar_physics.py based on per-timestep temperature.
  - Added `initial_ice_pct`: starting rime ice coverage on PV panels at t=0.
    Ice then accumulates / melts dynamically across the simulation horizon.
  - Added `humidity_factor_override`: optional scenario-specific ice aggressiveness
    coefficient (None = use physics default).
  - `solar_multiplier` now represents AMBIENT CLOUD / DIFFUSE REDUCTION only.
    Rime ice derating is layered on top multiplicatively via the ice accumulator.
"""

from typing import Dict, Any, Optional


SCENARIOS: Dict[str, Dict[str, Any]] = {
    "normal": {
        "id": "normal",
        "name": "Normal Polar Baseline",
        "description": (
            "Standard polar diurnal cycle under nominal operational load and "
            "clear/scattered cloud conditions. Minimal icing, full battery performance."
        ),
        "solar_multiplier": 1.0,        # Clear/scattered cloud ambient factor
        "demand_multiplier": 1.0,
        "temp_offset_c": 0.0,
        "wind_multiplier": 1.0,
        "generator_available": True,
        "solar_available": True,
        # --- Phase 2 ice parameters ---
        "initial_ice_pct": 0.0,         # No ice at start
        "humidity_factor_override": None,
        # --- Removed: battery_capacity_multiplier ---
        "duration_hours": 48,
        "severity": "LOW",
        "color": "#10b981"
    },
    "polar_storm": {
        "id": "polar_storm",
        "name": "Category-5 Polar Katabatic Storm",
        "description": (
            "48-hour severe blizzard with hurricane-force 95 km/h winds, heavy snowfall, "
            "and increased structural heat loss (+25%). Solar suppression is now governed "
            "dynamically by rime ice accumulation — panels reach ~65% ice coverage by hour 12."
        ),
        # Ambient cloud/blowing-snow diffuse reduction only (not the main solar suppressor)
        "solar_multiplier": 0.55,
        "demand_multiplier": 1.25,
        "temp_offset_c": -12.0,
        "wind_multiplier": 2.4,
        "generator_available": True,
        "solar_available": True,
        # --- Phase 2 ice parameters ---
        "initial_ice_pct": 5.0,         # Storm is already developing at t=0
        "humidity_factor_override": 1.8, # High humidity in blizzard conditions
        # --- Removed: battery_capacity_multiplier ---
        "duration_hours": 48,
        "severity": "CRITICAL",
        "color": "#38bdf8"
    },
    "solar_failure": {
        "id": "solar_failure",
        "name": "Solar Array Inverter Loss & Snow Burial",
        "description": (
            "Complete loss of solar generation (0 kW) due to main DC bus trip and "
            "deep drifting snow cover over PV modules. Ice accumulator is irrelevant "
            "as solar_available=False disables the array entirely."
        ),
        "solar_multiplier": 0.0,
        "demand_multiplier": 1.0,
        "temp_offset_c": -4.0,
        "wind_multiplier": 1.1,
        "generator_available": True,
        "solar_available": False,       # Array is offline — ice state not applied
        # --- Phase 2 ice parameters ---
        "initial_ice_pct": 0.0,
        "humidity_factor_override": None,
        # --- Removed: battery_capacity_multiplier ---
        "duration_hours": 48,
        "severity": "HIGH",
        "color": "#f59e0b"
    },
    "generator_failure": {
        "id": "generator_failure",
        "name": "Diesel Generator Mechanical Seizure",
        "description": (
            "Primary diesel generator experiences fuel line freezing and mechanical failure. "
            "Microgrid must rely exclusively on solar, battery, and intelligent load shedding. "
            "Mild icing from cold snap wind."
        ),
        "solar_multiplier": 1.0,
        "demand_multiplier": 1.0,
        "temp_offset_c": -5.0,
        "wind_multiplier": 1.2,
        "generator_available": False,
        "solar_available": True,
        # --- Phase 2 ice parameters ---
        "initial_ice_pct": 2.0,         # Light icing from the cold snap
        "humidity_factor_override": None,
        # --- Removed: battery_capacity_multiplier ---
        "duration_hours": 48,
        "severity": "CRITICAL",
        "color": "#ef4444"
    },
    "extreme_cold": {
        "id": "extreme_cold",
        "name": "Polar Vortex (-48°C Freeze)",
        "description": (
            "Antarctic polar vortex drives ambient temperature to -48°C. "
            "Habitat thermal demand spikes +40%. Arrhenius model now dynamically "
            "derate batteries to ~78% efficiency and activates the 3 kW parasitic "
            "battery heater. Mild icing from persistent cold-wind."
        ),
        "solar_multiplier": 0.85,       # Slight cloud cover; ice is the primary solar suppressor
        "demand_multiplier": 1.40,
        "temp_offset_c": -22.0,         # Pushes ambient to ~-48°C at Bharati baseline
        "wind_multiplier": 1.8,
        "generator_available": True,
        "solar_available": True,
        # --- Phase 2 ice parameters ---
        "initial_ice_pct": 10.0,        # Pre-existing ice from cold buildup
        "humidity_factor_override": 0.8, # Cold polar vortex = dry air, slower accretion
        # --- Removed: battery_capacity_multiplier: 0.85 (now Arrhenius-governed) ---
        "duration_hours": 48,
        "severity": "HIGH",
        "color": "#a855f7"
    },
    "load_spike": {
        "id": "load_spike",
        "name": "Emergency Melt-Well & Scientific Surge",
        "description": (
            "Rodriguez water well pump failure triggers emergency heating elements "
            "and secondary life support scrubbers (+35% demand spike). "
            "Moderate conditions — minimal icing."
        ),
        "solar_multiplier": 1.0,
        "demand_multiplier": 1.35,
        "temp_offset_c": -2.0,
        "wind_multiplier": 1.0,
        "generator_available": True,
        "solar_available": True,
        # --- Phase 2 ice parameters ---
        "initial_ice_pct": 0.0,
        "humidity_factor_override": None,
        # --- Removed: battery_capacity_multiplier ---
        "duration_hours": 48,
        "severity": "MODERATE",
        "color": "#eab308"
    },
    "combined_failure": {
        "id": "combined_failure",
        "name": "Worst-Case Compound Polar Catastrophe",
        "description": (
            "Simultaneous 48h blizzard, diesel generator failure, and extreme thermal "
            "load surge (+30%). Maximum stress test for the autonomous safety agent. "
            "Ice accumulates to 80%+ by hour 10, Arrhenius drives battery efficiency below 70%, "
            "and the parasitic heater fires. No CHP credit available (no generator)."
        ),
        "solar_multiplier": 0.55,       # Cloud factor; ice does the rest
        "demand_multiplier": 1.30,
        "temp_offset_c": -16.0,
        "wind_multiplier": 2.5,
        "generator_available": False,
        "solar_available": True,
        # --- Phase 2 ice parameters ---
        "initial_ice_pct": 15.0,        # Pre-storm ice already building
        "humidity_factor_override": 2.0, # Extreme blizzard humidity
        # --- Removed: battery_capacity_multiplier: 0.80 (now Arrhenius-governed) ---
        "duration_hours": 48,
        "severity": "EMERGENCY",
        "color": "#dc2626"
    }
}
