"""
POLARIS Edge-Deployed SQLite Resilience Layer
Provides dual edge databases for offline operation at polar research stations:
  1. weather_cache.sqlite — Cached Open-Meteo forecasts for connectivity-resilient operation
  2. scada_telemetry.sqlite — Local SCADA sensor telemetry and crisis event logging
"""

import sqlite3
import os
from datetime import datetime, timezone

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

WEATHER_CACHE_DB = os.path.join(DATA_DIR, "weather_cache.sqlite")
SCADA_TELEMETRY_DB = os.path.join(DATA_DIR, "scada_telemetry.sqlite")


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def get_weather_cache_connection() -> sqlite3.Connection:
    """Returns a connection to the weather cache edge database."""
    _ensure_data_dir()
    conn = sqlite3.connect(WEATHER_CACHE_DB, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    _create_weather_cache_schema(conn)
    return conn


def get_scada_telemetry_connection() -> sqlite3.Connection:
    """Returns a connection to the SCADA telemetry edge database."""
    _ensure_data_dir()
    conn = sqlite3.connect(SCADA_TELEMETRY_DB, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    _create_scada_telemetry_schema(conn)
    return conn


def _create_weather_cache_schema(conn: sqlite3.Connection):
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cached_forecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        station_id TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        forecast_json TEXT NOT NULL,
        fetched_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        source TEXT DEFAULT 'open-meteo'
    )
    """)
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_cache_station ON cached_forecasts(station_id, expires_at)"
    )
    conn.commit()


def _create_scada_telemetry_schema(conn: sqlite3.Connection):
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        station_id TEXT NOT NULL,
        sensor_type TEXT NOT NULL,
        value REAL,
        unit TEXT,
        quality TEXT DEFAULT 'GOOD'
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS crisis_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        station_id TEXT NOT NULL,
        fault_type TEXT NOT NULL,
        p0_load_kw REAL,
        battery_soc_pct REAL,
        survival_hours REAL,
        webhook_fired INTEGER DEFAULT 0,
        webhook_response TEXT
    )
    """)
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_sensor_ts ON sensor_readings(timestamp, station_id)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_crisis_ts ON crisis_events(timestamp, station_id)"
    )
    conn.commit()


def log_crisis_event(
    station_id: str,
    fault_type: str,
    p0_load_kw: float,
    battery_soc_pct: float,
    survival_hours: float,
    webhook_fired: bool = False,
    webhook_response: str = "",
) -> int:
    """Logs an immutable crisis event to the SCADA telemetry edge database."""
    conn = get_scada_telemetry_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO crisis_events
                (timestamp, station_id, fault_type, p0_load_kw, battery_soc_pct, survival_hours, webhook_fired, webhook_response)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                station_id,
                fault_type,
                p0_load_kw,
                battery_soc_pct,
                survival_hours,
                1 if webhook_fired else 0,
                webhook_response,
            ),
        )
        conn.commit()
        return cursor.lastrowid or 0
    finally:
        conn.close()


# Initialize both edge databases on module import
_ensure_data_dir()
