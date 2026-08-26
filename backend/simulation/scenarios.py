"""
POLARIS Scenarios Engine
Defines disaster, extreme weather, and equipment failure conditions for polar resilience testing.
"""

from typing import Dict, Any, List


SCENARIOS: Dict[str, Dict[str, Any]] = {
    "normal": {
        "id": "normal",
        "name": "Normal Polar Baseline",
        "description": "Standard polar diurnal cycle under nominal operational load and clear/scattered cloud conditions.",
        "solar_multiplier": 1.0,
        "demand_multiplier": 1.0,
        "temp_offset_c": 0.0,
        "wind_multiplier": 1.0,
        "generator_available": True,
        "solar_available": True,
        "battery_capacity_multiplier": 1.0,
        "duration_hours": 48,
        "severity": "LOW",
        "color": "#10b981"
    },
    "polar_storm": {
        "id": "polar_storm",
        "name": "Category-5 Polar Katabatic Storm",
        "description": "48-hour severe blizzard with hurricane-force 95 km/h winds, heavy snowfall, 70% solar blackout, and increased structural heat loss (+25%).",
        "solar_multiplier": 0.30,
        "demand_multiplier": 1.25,
        "temp_offset_c": -12.0,
        "wind_multiplier": 2.4,
        "generator_available": True,
        "solar_available": True,
        "battery_capacity_multiplier": 1.0,
        "duration_hours": 48,
        "severity": "CRITICAL",
        "color": "#38bdf8"
    },
    "solar_failure": {
        "id": "solar_failure",
        "name": "Solar Array Inverter Loss & Snow Burial",
        "description": "Complete loss of solar generation (0 kW) due to main DC bus trip and deep drifting snow cover over PV modules.",
        "solar_multiplier": 0.0,
        "demand_multiplier": 1.0,
        "temp_offset_c": -4.0,
        "wind_multiplier": 1.1,
        "generator_available": True,
        "solar_available": False,
        "battery_capacity_multiplier": 1.0,
        "duration_hours": 48,
        "severity": "HIGH",
        "color": "#f59e0b"
    },
    "generator_failure": {
        "id": "generator_failure",
        "name": "Diesel Generator Mechanical Seizure",
        "description": "Primary diesel generator experiences fuel line freezing and mechanical failure. Microgrid must rely exclusively on solar, battery, and intelligent load shedding.",
        "solar_multiplier": 1.0,
        "demand_multiplier": 1.0,
        "temp_offset_c": -5.0,
        "wind_multiplier": 1.2,
        "generator_available": False,
        "solar_available": True,
        "battery_capacity_multiplier": 1.0,
        "duration_hours": 48,
        "severity": "CRITICAL",
        "color": "#ef4444"
    },
    "extreme_cold": {
        "id": "extreme_cold",
        "name": "Polar Vortex (-48°C Freeze)",
        "description": "Arctic/Antarctic polar vortex causes ambient temperatures to plummet to -48°C. Habitat thermal demand spikes by 40%.",
        "solar_multiplier": 0.85,
        "demand_multiplier": 1.40,
        "temp_offset_c": -22.0,
        "wind_multiplier": 1.8,
        "generator_available": True,
        "solar_available": True,
        "battery_capacity_multiplier": 0.85,
        "duration_hours": 48,
        "severity": "HIGH",
        "color": "#a855f7"
    },
    "load_spike": {
        "id": "load_spike",
        "name": "Emergency Melt-Well & Scientific Surge",
        "description": "Rodriguez water well pump failure triggers emergency heating elements and secondary life support scrubbers (+35% demand spike).",
        "solar_multiplier": 1.0,
        "demand_multiplier": 1.35,
        "temp_offset_c": -2.0,
        "wind_multiplier": 1.0,
        "generator_available": True,
        "solar_available": True,
        "battery_capacity_multiplier": 1.0,
        "duration_hours": 48,
        "severity": "MODERATE",
        "color": "#eab308"
    },
    "combined_failure": {
        "id": "combined_failure",
        "name": "Worst-Case Compound Polar Catastrophe",
        "description": "Simultaneous 48h blizzard, 75% solar loss, diesel generator failure, and extreme thermal load surge (+30%). Maximum stress test for autonomous safety agent.",
        "solar_multiplier": 0.25,
        "demand_multiplier": 1.30,
        "temp_offset_c": -16.0,
        "wind_multiplier": 2.5,
        "generator_available": False,
        "solar_available": True,
        "battery_capacity_multiplier": 0.80,
        "duration_hours": 48,
        "severity": "EMERGENCY",
        "color": "#dc2626"
    }
}
