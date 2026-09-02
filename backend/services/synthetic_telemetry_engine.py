import random
import numpy as np
from datetime import datetime, timezone
from backend.services.data_validator import validate_and_flag_telemetry
from backend.database.db import get_db_connection

class SyntheticSensorEngine:
    """
    Pipeline B: Station Sensor Telemetry
    Generates physically consistent trajectories (not independent random values)
    and deliberately injects realistic sensor imperfections (noise, drift, missing values).
    """
    def __init__(self, station_id: str, config: dict = None):
        self.station_id = station_id
        # Configuration for sensor imperfections
        self.config = config or {
            "noise_std_dev": 1.5,      # std dev for gaussian noise
            "missing_data_prob": 0.02, # 2% chance of sensor dropout (null value)
            "sensor_drift_rate": 0.05  # accumulation rate of drift
        }
        self.drift_accumulators = {
            "pv": 0.0,
            "p0": 0.0,
            "p1": 0.0,
            "p2": 0.0,
            "soc": 0.0
        }
        
        # Physical State Trackers (integrated over time)
        self.current_soc = 80.0

    def _apply_imperfections(self, field: str, true_value: float) -> float:
        """Injects missing values, gaussian noise, and sensor drift."""
        if random.random() < self.config["missing_data_prob"]:
            return None # Simulates a sensor dropout
            
        # Add random walk drift
        self.drift_accumulators[field] += random.gauss(0, self.config["sensor_drift_rate"])
        value_with_drift = true_value + self.drift_accumulators[field]
        
        # Add gaussian measurement noise
        noise = random.gauss(0, self.config["noise_std_dev"])
        measured_value = value_with_drift + noise
        
        # IMPORTANT: We DO NOT clamp values here. The data validator must catch 
        # impossible values (e.g., SOC = 102% or P0 = -5kW) in the next step.
        return round(measured_value, 2)

    def generate_step(self, weather_data: dict) -> dict:
        """
        Generates 1 timestep of physically-grounded telemetry based on environmental state.
        Saves directly to energy_telemetry table.
        """
        temp = weather_data.get("temperature_c", -15.0)
        irradiance = weather_data.get("solar_irradiance_wm2", 0.0)
        
        # --- PHYSICS BASELINE MODEL ---
        
        # 1. PV Power (simplified: irradiance * area * efficiency * temp derating)
        temp_derating = 1.0 + ((temp - 25.0) * -0.004)
        true_pv = max(0, irradiance * 0.18 * temp_derating)
        
        # 2. P0 Load (Critical: Life support, comms, primary heating)
        # Heating increases linearly as temp drops below indoor setpoint (20C)
        delta_t = max(0, 20 - temp)
        true_p0 = 50.0 + (delta_t * 2.5)
        
        # 3. P1 Load (Battery Thermal Jacketing)
        # Activates heavily to protect batteries when temp drops below -10C
        true_p1 = max(0, (-10 - temp) * 1.5) if temp < -10 else 0.0
        
        # 4. P2 Load (Deferrable/General)
        true_p2 = 45.0 + random.uniform(-5, 10)
        
        true_total_load = true_p0 + true_p1 + true_p2
        
        # 5. Battery State Integration
        # simplified: 1 hour timestep, 600kWh capacity
        net_power = true_pv - true_total_load
        self.current_soc += (net_power / 600.0) * 100.0
        
        # True physics caps SOC at bounds
        self.current_soc = max(0.0, min(100.0, self.current_soc))
        
        # 6. Generator Logic (Rule based: turns on if SOC drops below 30%)
        true_gen_status = "ON" if self.current_soc < 30.0 else "OFF"
        true_gen_kw = 250.0 if true_gen_status == "ON" else 0.0
        
        if true_gen_status == "ON":
            self.current_soc += (true_gen_kw / 600.0) * 100.0
            self.current_soc = min(100.0, self.current_soc)

        # --- IMPERFECTION INJECTION ---
        measured = {
            "timestamp": weather_data.get("timestamp", datetime.now(timezone.utc).isoformat()),
            "station_id": self.station_id,
            "pv_power_kw": self._apply_imperfections("pv", true_pv),
            "p0_load_kw": self._apply_imperfections("p0", true_p0),
            "p1_load_kw": self._apply_imperfections("p1", true_p1),
            "p2_load_kw": self._apply_imperfections("p2", true_p2),
            "total_load_kw": round(true_total_load + random.gauss(0, 2), 2),
            "battery_soc_pct": self._apply_imperfections("soc", self.current_soc),
            # Inject deliberate impossible relationships occasionally for the validator to catch
            "generator_power_kw": true_gen_kw if random.random() > 0.02 else true_gen_kw + 50.0, 
            "generator_status": true_gen_status if random.random() > 0.02 else ("ON" if true_gen_status == "OFF" else "OFF")
        }

        # --- VALIDATION ---
        validated_telemetry = validate_and_flag_telemetry(self.station_id, measured)
        
        # --- PIPELINE B DB INGESTION ---
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO energy_telemetry 
                (timestamp, station_id, pv_power_kw, p0_load_kw, p1_load_kw, p2_load_kw, total_load_kw, battery_soc_pct, generator_power_kw, generator_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                validated_telemetry.get("timestamp"),
                self.station_id,
                validated_telemetry.get("pv_power_kw"),
                validated_telemetry.get("p0_load_kw"),
                validated_telemetry.get("p1_load_kw"),
                validated_telemetry.get("p2_load_kw"),
                validated_telemetry.get("total_load_kw"),
                validated_telemetry.get("battery_soc_pct"),
                validated_telemetry.get("generator_power_kw"),
                validated_telemetry.get("generator_status")
            ))
            conn.commit()
        except Exception as e:
            print(f"Failed to persist Pipeline B telemetry: {e}")

        return validated_telemetry
