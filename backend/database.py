import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).parent / "movie_manager.db"

def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def initialize_database():
    conn = get_connection()
    cursor = conn.cursor()

    sql = (
        "CREATE TABLE IF NOT EXISTS concessions ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "name TEXT NOT NULL, "
        "category TEXT NOT NULL, "
        "price REAL NOT NULL, "
        "is_active INTEGER NOT NULL DEFAULT 1"
        ")"
    )

    cursor.execute(sql)
    conn.commit()
    conn.close()