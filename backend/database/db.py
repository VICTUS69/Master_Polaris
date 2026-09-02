import sqlite3
import os
from .schema import create_schema

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "polaris.db")

def get_db_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    create_schema(conn)
    return conn
