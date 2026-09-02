from backend.database.db import get_db_connection
from datetime import datetime, timezone

def validate_and_flag_telemetry(station_id: str, telemetry: dict) -> dict:
    """
    Validates physical boundaries of telemetry data.
    Does NOT silently fix data. Writes violations to telemetry_quality table.
    """
    flags = []
    
    # Validation Rules
    if "battery_soc_pct" in telemetry:
        soc = telemetry["battery_soc_pct"]
        # Allow missing/None to be caught
        if soc is not None:
            if soc < 0 or soc > 100:
                flags.append(("battery_soc_pct", "INVALID_RANGE", f"SOC must be between 0 and 100, got {soc}"))

    if "pv_power_kw" in telemetry:
        pv = telemetry["pv_power_kw"]
        if pv is not None and pv < 0:
            flags.append(("pv_power_kw", "NEGATIVE_POWER", f"PV power cannot be negative, got {pv}"))

    if "generator_power_kw" in telemetry and "generator_status" in telemetry:
        gen_kw = telemetry["generator_power_kw"]
        gen_stat = telemetry["generator_status"]
        if gen_kw is not None and gen_stat == "OFF" and gen_kw > 0:
            flags.append(("generator_power_kw", "PHYSICS_VIOLATION", f"Generator is OFF but output is {gen_kw}kW"))
            
    if "p0_load_kw" in telemetry:
        p0 = telemetry["p0_load_kw"]
        if p0 is not None and p0 < 0:
            flags.append(("p0_load_kw", "NEGATIVE_LOAD", f"P0 load cannot be negative, got {p0}"))

    if "p1_load_kw" in telemetry:
        p1 = telemetry["p1_load_kw"]
        if p1 is not None and p1 < 0:
            flags.append(("p1_load_kw", "NEGATIVE_LOAD", f"P1 load cannot be negative, got {p1}"))
            
    if "p2_load_kw" in telemetry:
        p2 = telemetry["p2_load_kw"]
        if p2 is not None and p2 < 0:
            flags.append(("p2_load_kw", "NEGATIVE_LOAD", f"P2 load cannot be negative, got {p2}"))

    # Check for missing required fields (if we want to enforce schema)
    for req in ["pv_power_kw", "p0_load_kw", "battery_soc_pct"]:
        if req not in telemetry or telemetry[req] is None:
            flags.append((req, "MISSING_DATA", f"Required sensor field {req} is missing or null"))

    # Log flags to DB
    if flags:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            ts = telemetry.get("timestamp", datetime.now(timezone.utc).isoformat())
            for field, flag_code, reason in flags:
                cursor.execute("""
                    INSERT INTO telemetry_quality (timestamp, station_id, field, quality_flag, reason)
                    VALUES (?, ?, ?, ?, ?)
                """, (ts, station_id, field, flag_code, reason))
            conn.commit()
        except Exception as e:
            print(f"Failed to write to telemetry_quality DB: {e}")

    # Inject overall quality status into the payload without fixing the raw values
    telemetry["data_quality"] = "FLAGGED" if flags else "OK"
    telemetry["quality_flags"] = flags
    return telemetry
