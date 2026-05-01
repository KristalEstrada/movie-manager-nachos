from pydantic import BaseModel
from backend.database import get_connection


class ConcessionItem(BaseModel):
    name: str
    category: str
    price: float
    is_active: bool = True


def create_concession_item(item: ConcessionItem):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO concessions (name, category, price, is_active)
        VALUES (?, ?, ?, ?)
        """,
        (item.name, item.category, item.price, int(item.is_active))
    )

    conn.commit()
    item_id = cursor.lastrowid
    conn.close()

    return {
        "id": item_id,
        "name": item.name,
        "category": item.category,
        "price": item.price,
        "is_active": item.is_active
    }


def get_concession_items():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM concessions")
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "category": row["category"],
            "price": row["price"],
            "is_active": bool(row["is_active"])
        }
        for row in rows
    ]
def delete_concession_item(item_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM concessions WHERE id = ?", (item_id,))
    conn.commit()
    deleted_count = cursor.rowcount
    conn.close()

    return {"deleted": deleted_count}