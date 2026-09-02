import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_telemetry(output_path="backend/data/historical_telemetry.csv", years=2):
    # 2 years of hourly data -> 2 * 365 * 24 = 17520 rows
    hours = 365 * 24 * years
    start_date = datetime(2024, 1, 1)
    
    timestamps = [start_date + timedelta(hours=i) for i in range(hours)]
    months = [t.month for t in timestamps]
    hour_of_day = [t.hour for t in timestamps]
    
    days_of_year = np.array([t.timetuple().tm_yday for t in timestamps])
    
    # Temperature: Sine wave -30C to -2C + Gaussian noise.
    # Amplitude = 14, Offset = -16. Max at summer (Jan/Dec)
    base_temp = -16 + 14 * np.cos((days_of_year - 15) / 365.0 * 2 * np.pi)
    noise_temp = np.random.normal(0, 3, hours)
    temperature_c = base_temp + noise_temp
    
    # Wind Speed: Base 15-35 + katabatic storms
    base_wind = np.random.uniform(15, 35, hours)
    # 2% chance of katabatic storm
    storm_mask = np.random.rand(hours) < 0.02
    base_wind[storm_mask] += np.random.uniform(40, 75, sum(storm_mask))
    wind_kmh = np.clip(base_wind, 0, 110)
    
    # Solar Irradiance: based on solar elevation. Polar night May-July.
    solar_irradiance = np.zeros(hours)
    for i in range(hours):
        t = timestamps[i]
        doy = days_of_year[i]
        h = hour_of_day[i]
        if 121 <= doy <= 212: # roughly May to July
            solar_irradiance[i] = 0
        else:
            if 6 <= h <= 18:
                season_factor = max(0, 1 + np.cos((doy - 15) / 365.0 * 2 * np.pi))
                daily_curve = np.sin((h - 6) / 12.0 * np.pi)
                solar_irradiance[i] = daily_curve * 800 * (season_factor / 2.0)
            else:
                solar_irradiance[i] = 0
                
    cloud_noise = np.random.uniform(0.5, 1.0, hours)
    solar_irradiance = solar_irradiance * cloud_noise
    
    # Electrical Load: Base 180 + occupancy (higher during day) + random 40 spikes
    occupancy_scaling = np.array([10 if (8 <= h <= 20) else 0 for h in hour_of_day])
    spike_mask = np.random.rand(hours) < 0.05
    spikes = spike_mask * 40
    demand_electrical_kw = 180 + occupancy_scaling + spikes + np.random.normal(0, 2, hours)
    
    # Thermal Heating Load: Load_heat = Base + alpha * (0 - T_ambient)
    base_heat = 50
    demand_thermal_kw = base_heat + 2.5 * (0 - temperature_c)
    demand_thermal_kw = np.maximum(base_heat, demand_thermal_kw) + np.random.normal(0, 2, hours)
    
    df = pd.DataFrame({
        "timestamp": timestamps,
        "month": months,
        "hour": hour_of_day,
        "temperature_c": temperature_c,
        "wind_kmh": wind_kmh,
        "solar_irradiance_wm2": solar_irradiance,
        "demand_electrical_kw": np.round(demand_electrical_kw, 2),
        "demand_thermal_kw": np.round(demand_thermal_kw, 2)
    })
    
    # Ensure data dir exists, script is meant to be run from project root
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} rows of synthetic telemetry at {output_path}")

if __name__ == '__main__':
    # Script might be run from root or from scripts folder
    output_file = "backend/data/historical_telemetry.csv"
    if not os.path.exists("backend"):
        output_file = "../data/historical_telemetry.csv"
    generate_telemetry(output_file)
