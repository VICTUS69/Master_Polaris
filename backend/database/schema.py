import sqlite3

def create_schema(conn: sqlite3.Connection):
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS stations (
        id TEXT PRIMARY KEY,
        name TEXT,
        lat REAL,
        lon REAL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS environmental_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        station_id TEXT,
        temperature REAL,
        wind REAL,
        irradiance REAL,
        source TEXT,
        quality TEXT,
        raw_payload TEXT,
        FOREIGN KEY (station_id) REFERENCES stations(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS energy_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        station_id TEXT,
        pv_power_kw REAL,
        p0_load_kw REAL,
        p1_load_kw REAL,
        p2_load_kw REAL,
        total_load_kw REAL,
        battery_soc_pct REAL,
        generator_power_kw REAL,
        generator_status TEXT,
        FOREIGN KEY (station_id) REFERENCES stations(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry_quality (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        station_id TEXT,
        field TEXT,
        quality_flag TEXT,
        reason TEXT,
        FOREIGN KEY (station_id) REFERENCES stations(id)
    )
    """)
    
    # Indexes for fast querying
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_env_ts ON environmental_telemetry(timestamp, station_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_eng_ts ON energy_telemetry(timestamp, station_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_qual_ts ON telemetry_quality(timestamp, station_id)")

    conn.commit()
