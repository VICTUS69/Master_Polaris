import pytest
import sqlite3
from backend.api.crisis import simulate_catastrophic_crisis
from backend.database.edge_db import SCADA_TELEMETRY_DB, get_scada_telemetry_connection

@pytest.mark.asyncio
async def test_catastrophic_crisis_simulation():
    res = await simulate_catastrophic_crisis()
    
    # 1. Verification of status and failure
    assert res.status == 'CRITICAL_SOS'
    assert res.station == 'Bharati Research Station'
    assert res.fault == 'Total Generation Failure'
    
    # 2. Generation completely zeroed
    assert res.generation.solar_kw == 0.0
    assert res.generation.diesel_kw == 0.0
    assert res.generation.total_kw == 0.0
    
    # 3. Battery becomes sole source
    assert res.battery.status == 'SOLE_POWER_SOURCE'
    assert res.battery.available_energy_kwh == 450.0  # 600 kWh * 75%
    
    # 4. Load shedding hierarchy enforced
    # P0 Life support: fully powered
    assert res.load_hierarchy['p0_life_support']['status'] == 'FULLY_POWERED'
    assert res.load_hierarchy['p0_life_support']['total_kw'] > 0.0
    for load in res.load_hierarchy['p0_life_support']['loads']:
        assert load['status'] == 'ACTIVE'
        assert load['power_kw'] > 0.0
        
    # P1 BESS Heating: shed to zero
    assert res.load_hierarchy['p1_bess_heating']['status'] == 'SHED_TO_ZERO'
    assert res.load_hierarchy['p1_bess_heating']['total_kw'] == 0.0
    for load in res.load_hierarchy['p1_bess_heating']['loads']:
        assert load['status'] == 'SHED'
        assert load['power_kw'] == 0.0
        
    # P2 Science and Rover: shed to zero
    assert res.load_hierarchy['p2_science_rover']['status'] == 'SHED_TO_ZERO'
    assert res.load_hierarchy['p2_science_rover']['total_kw'] == 0.0
    for load in res.load_hierarchy['p2_science_rover']['loads']:
        assert load['status'] == 'SHED'
        assert load['power_kw'] == 0.0
        
    # 5. Survival runway calculation
    assert res.survival.p0_exergy_remaining_hours > 0.0
    assert 'Hours' in res.survival.runway_display
    
    # 6. Edge database audit log entry
    conn = get_scada_telemetry_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM crisis_events WHERE station_id = ?', ('bharati',))
    count = cursor.fetchone()[0]
    conn.close()
    assert count >= 1
