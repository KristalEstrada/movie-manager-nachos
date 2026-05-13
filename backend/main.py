from __future__ import annotations
import json
from copy import deepcopy
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from backend.database import initialize_database
from backend.concessions import ConcessionItem, create_concession_item, get_concession_items, delete_concession_item


app = FastAPI(title="Nachos Movie Manager API")
@app.delete("/api/movies/{movie_id}")
def delete_movie(movie_id: int) -> dict:
    before = len(STORE["movies"])
    STORE["movies"] = [m for m in STORE["movies"] if m.get("id") != movie_id]
    # Remove showtimes referencing this movie
    removed_showtimes = [s for s in STORE["showtimes"] if s.get("movie_id") == movie_id]
    STORE["showtimes"] = [s for s in STORE["showtimes"] if s.get("movie_id") != movie_id]
    save_persistent_store()
    return {"deleted": before - len(STORE["movies"]), "removed_showtimes": len(removed_showtimes)}


@app.delete("/api/showtimes/{showtime_id}")
def delete_showtime(showtime_id: int) -> dict:
    before = len(STORE["showtimes"])
    STORE["showtimes"] = [s for s in STORE["showtimes"] if s.get("id") != showtime_id]
    save_persistent_store()
    return {"deleted": before - len(STORE["showtimes"])}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# In-memory repository that is synchronized with disk persistence.
STORE = {
    "movies": [],
    "showtimes": [],
    "next_id": 1,
}

# Sales log file
SALES_FILE = Path(__file__).resolve().parent / "sales.json"

def load_sales():
    if SALES_FILE.exists():
        with open(SALES_FILE, "r") as f:
            return json.load(f)
    return []

def save_sales(sales):
    with open(SALES_FILE, "w") as f:
        json.dump(sales, f, indent=2)

def generate_confirmation_code(existing_codes):
    import secrets, string
    while True:
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        if code not in existing_codes:
            return code

# Default folder for local persistence and existing behavior compatibility.
DATA_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# This file stores movie/showtime data automatically at each change.
PERSISTENCE_FILE = Path(__file__).resolve().parent / "backend_data.json"


class Movie(BaseModel):
    id: int | None = None
    title: str
    duration_min: int = Field(gt=0)
    rating: str = "NR"
    description: str = ""


class ShowtimeCreate(BaseModel):
    movie_id: int
    start_time: str
    auditorium: str
    capacity: int = Field(default=75, gt=0)


class SaveLoadRequest(BaseModel):
    filename: str


class GenerateTimeOptionsRequest(BaseModel):
    day: str
    duration_min: int = Field(gt=0)
    day_start_hhmm: str
    buffer_min: int = Field(default=15, ge=0)
    count: int = Field(default=5, ge=1, le=20)


class EnforceRoomRequest(BaseModel):
    day: str
    auditorium: str
    movie_title: str


class SellTicketRequest(BaseModel):
    qty: int = Field(default=1, gt=0)


def parse_dt(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid datetime: {value}") from exc


def showtime_response(showtime: dict) -> dict:
    item = deepcopy(showtime)
    item["seats_left"] = item["capacity"] - item["tickets_sold"]
    return item


def filename_path(filename: str) -> Path:
    safe = Path(filename).name
    if not safe.endswith(".json"):
        safe += ".json"
    return DATA_DIR / safe


def load_persistent_store() -> None:
    """Load repository data from disk persistence file at startup."""
    if not PERSISTENCE_FILE.exists():
        return

    try:
        payload = json.loads(PERSISTENCE_FILE.read_text())
        STORE["showtimes"] = payload.get("showtimes", [])
        STORE["movies"] = payload.get("movies", [])

        # Reconstruct missing movies from showtimes if needed
        movie_ids = {m["id"] for m in STORE["movies"] if "id" in m}
        referenced_ids = {s["movie_id"] for s in STORE["showtimes"] if "movie_id" in s}
        missing_ids = referenced_ids - movie_ids
        if missing_ids:
            # Try to reconstruct minimal movie entries from showtimes
            for s in STORE["showtimes"]:
                mid = s.get("movie_id")
                if mid in missing_ids:
                    # Try to get movie info from showtime (if present)
                    movie_info = s.get("movie") or {}
                    reconstructed = {
                        "id": mid,
                        "title": movie_info.get("title", f"Movie {mid}"),
                        "duration_min": movie_info.get("duration_min", 90),
                        "rating": movie_info.get("rating", "NR"),
                        "description": movie_info.get("description", "Recovered movie")
                    }
                    STORE["movies"].append(reconstructed)
            print(f"Recovered {len(missing_ids)} missing movies from showtimes.")

        # Keep next_id safe if stored value is missing.
        if "next_id" in payload:
            STORE["next_id"] = payload["next_id"]
        else:
            STORE["next_id"] = (max((s.get("id", 0) for s in STORE["showtimes"]), default=0) + 1)

        print(f"Loaded persistence from {PERSISTENCE_FILE}")
    except Exception as exc:
        print(f"Error loading persistence from {PERSISTENCE_FILE}: {exc}")


def save_persistent_store() -> None:
    """Persist current repository state to disk after each mutation."""
    payload = {
        "showtimes": STORE["showtimes"],
        "movies": STORE["movies"],
        "next_id": STORE["next_id"],
    }
    PERSISTENCE_FILE.write_text(json.dumps(payload, indent=2))


@app.on_event("startup")
def app_startup() -> None:
    load_persistent_store()
    initialize_database()



@app.get("/api/schedule")
def get_schedule() -> List[dict]:
    showtimes = sorted(STORE["showtimes"], key=lambda s: (s["auditorium"], s["start_time"]))
    movies_by_id = {m["id"]: m for m in STORE["movies"]}
    result = []
    for s in showtimes:
        show = deepcopy(s)
        movie = movies_by_id.get(show.get("movie_id"))
        if movie:
            show["movie"] = movie
        result.append(showtime_response(show))
    return result


@app.post("/api/schedule/save")
def save_schedule(req: SaveLoadRequest) -> dict:
    path = filename_path(req.filename)
    payload = {
        "showtimes": STORE["showtimes"],
        "movies": STORE.get("movies", []),
        "next_id": STORE["next_id"],
    }
    path.write_text(json.dumps(payload, indent=2))

    # Also persist to the internal backend storage file for restarts.
    save_persistent_store()

    return {"message": f"Saved schedule to {path.name}", "path": str(path)}


@app.post("/api/schedule/load")
def load_schedule(req: SaveLoadRequest) -> dict:
    path = filename_path(req.filename)
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {path.name}")

    payload = json.loads(path.read_text())
    STORE["showtimes"] = payload.get("showtimes", [])
    STORE["movies"] = payload.get("movies", [])
    STORE["next_id"] = payload.get("next_id", len(STORE["showtimes"]) + 1)

    # Persist loaded data into the default backend persistence file.
    save_persistent_store()

    return {"message": f"Loaded schedule from {path.name}", "showtimes": get_schedule()}


@app.post("/api/schedule/clear")
def clear_schedule() -> dict:
    STORE["showtimes"] = []
    STORE["movies"] = []
    STORE["next_id"] = 1
    save_persistent_store()
    return {"message": "Schedule cleared"}


@app.post("/api/movies")
def add_movie(movie: Movie) -> dict:
    # Assign unique ID
    movie_id = max([m.get("id", 0) for m in STORE["movies"]], default=0) + 1
    movie_data = movie.model_dump()
    movie_data["id"] = movie_id
    STORE["movies"].append(movie_data)
    save_persistent_store()
    return movie_data


@app.get("/api/movies")
def list_movies() -> List[dict]:
    return deepcopy(STORE["movies"])

@app.post("/api/enforce-room")
def enforce_room(req: EnforceRoomRequest) -> dict:
    return {"allowed": True}


@app.post("/api/generate-time-options")
def generate_time_options(req: GenerateTimeOptionsRequest) -> List[dict]:
    try:
        base = datetime.fromisoformat(f"{req.day}T{req.day_start_hhmm}:00")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date or time format") from exc

    slots = []
    spacing = timedelta(minutes=req.duration_min + req.buffer_min)
    duration = timedelta(minutes=req.duration_min)

    for idx in range(req.count):
        start = base + idx * spacing
        end = start + duration
        slots.append(
            {
                "option_num": idx + 1,
                "start_time": start.isoformat(),
                "end_time": end.isoformat(),
            }
        )

    return slots


@app.post("/api/showtime")
def add_showtime(showtime: ShowtimeCreate):
    # Find movie by ID
    movie = next((m for m in STORE["movies"] if m.get("id") == showtime.movie_id), None)
    
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    start = parse_dt(showtime.start_time)
    end = start + timedelta(minutes=movie["duration_min"])
    for existing in STORE["showtimes"]:
        if existing["auditorium"] != showtime.auditorium:
            continue
        existing_start = parse_dt(existing["start_time"])
        existing_end = parse_dt(existing["end_time"])
        overlaps = start < existing_end and end > existing_start
        if overlaps:
            raise HTTPException(status_code=409, detail="Showtime overlaps an existing show in this auditorium")

    new_show = {
        "id": STORE["next_id"],
        "movie_id": movie["id"],
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "auditorium": showtime.auditorium,
        "capacity": showtime.capacity,
        "tickets_sold": 0,
    }
    STORE["showtimes"].append(new_show)
    STORE["next_id"] += 1
    save_persistent_store()
    # Attach movie details for response
    resp = deepcopy(new_show)
    resp["movie"] = movie
    return showtime_response(resp)



@app.post("/api/showtimes/{showtime_id}/sell-ticket")
def sell_ticket(showtime_id: int, req: SellTicketRequest) -> dict:
    show = next((s for s in STORE["showtimes"] if s["id"] == showtime_id), None)
    if show is None:
        raise HTTPException(status_code=404, detail="Showtime not found")

    seats_left = show["capacity"] - show["tickets_sold"]
    if req.qty > seats_left:
        raise HTTPException(status_code=400, detail=f"Only {seats_left} seats left")

    show["tickets_sold"] += req.qty
    save_persistent_store()

    # Record sale in sales log
    sales = load_sales()
    existing_codes = {sale["confirmation_code"] for sale in sales}
    confirmation_code = generate_confirmation_code(existing_codes)
    sale_record = {
        "showtime_id": showtime_id,
        "qty": req.qty,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "confirmation_code": confirmation_code,
    }
    sales.append(sale_record)
    save_sales(sales)

    return {
        "message": f"Sold {req.qty} ticket(s)",
        "tickets_sold": show["tickets_sold"],
        "seats_left": show["capacity"] - show["tickets_sold"],
        "confirmation_code": confirmation_code,
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    return fastapi_error_response(exc.status_code, exc.detail)


def fastapi_error_response(status_code: int, detail: str):
    from fastapi.responses import JSONResponse

    return JSONResponse(status_code=status_code, content={"message": detail})


@app.get("/")
def root() -> dict:
    return {"message": "Nachos Movie Manager API is running"}
@app.get("/api/concessions")
def read_concessions():
    return get_concession_items()


@app.post("/api/concessions")
def add_concession(item: ConcessionItem):
    return create_concession_item(item)

@app.delete("/api/concessions/{item_id}")
def delete_concession(item_id: int):
    return delete_concession_item(item_id)
        
    