from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Nachos Movie Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STORE = {
    "showtimes": [],
    "next_id": 1,
}

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)


class Movie(BaseModel):
    title: str
    duration_min: int = Field(gt=0)
    rating: str = "NR"
    description: str = ""


class ShowtimeCreate(BaseModel):
    movie: Movie
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


@app.get("/api/schedule")
def get_schedule() -> List[dict]:
    showtimes = sorted(STORE["showtimes"], key=lambda s: (s["auditorium"], s["start_time"]))
    return [showtime_response(s) for s in showtimes]


@app.post("/api/schedule/save")
def save_schedule(req: SaveLoadRequest) -> dict:
    path = filename_path(req.filename)
    payload = {"showtimes": STORE["showtimes"], "next_id": STORE["next_id"]}
    path.write_text(json.dumps(payload, indent=2))
    return {"message": f"Saved schedule to {path.name}", "path": str(path)}


@app.post("/api/schedule/load")
def load_schedule(req: SaveLoadRequest) -> dict:
    path = filename_path(req.filename)
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {path.name}")

    payload = json.loads(path.read_text())
    STORE["showtimes"] = payload.get("showtimes", [])
    STORE["next_id"] = payload.get("next_id", len(STORE["showtimes"]) + 1)
    return {"message": f"Loaded schedule from {path.name}", "showtimes": get_schedule()}


@app.post("/api/schedule/clear")
def clear_schedule() -> dict:
    STORE["showtimes"] = []
    STORE["next_id"] = 1
    return {"message": "Schedule cleared"}


@app.post("/api/movies")
def add_movie(movie: Movie) -> dict:
    return movie.model_dump()


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


@app.post("/api/enforce-room")
def enforce_room(req: EnforceRoomRequest) -> dict:
    for show in STORE["showtimes"]:
        same_day = show["start_time"].startswith(req.day)
        same_room = show["auditorium"] == req.auditorium
        different_movie = show["movie"]["title"].strip().lower() != req.movie_title.strip().lower()
        if same_day and same_room and different_movie:
            return {"allowed": False}
    return {"allowed": True}


@app.post("/api/showtime")
def add_showtime(showtime: ShowtimeCreate) -> dict:
    start = parse_dt(showtime.start_time)
    end = start + timedelta(minutes=showtime.movie.duration_min)

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
        "movie": showtime.movie.model_dump(),
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "auditorium": showtime.auditorium,
        "capacity": showtime.capacity,
        "tickets_sold": 0,
    }
    STORE["showtimes"].append(new_show)
    STORE["next_id"] += 1
    return showtime_response(new_show)


@app.post("/api/showtimes/{showtime_id}/sell-ticket")
def sell_ticket(showtime_id: int, req: SellTicketRequest) -> dict:
    show = next((s for s in STORE["showtimes"] if s["id"] == showtime_id), None)
    if show is None:
        raise HTTPException(status_code=404, detail="Showtime not found")

    seats_left = show["capacity"] - show["tickets_sold"]
    if req.qty > seats_left:
        raise HTTPException(status_code=400, detail=f"Only {seats_left} seats left")

    show["tickets_sold"] += req.qty
    return {
        "message": f"Sold {req.qty} ticket(s)",
        "tickets_sold": show["tickets_sold"],
        "seats_left": show["capacity"] - show["tickets_sold"],
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
