from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional

from src.models.movie import Movie
from src.models.showtime import Showtime


@dataclass(frozen=True)
class TimeOption:
    option_num: int
    start_time: datetime
    end_time: datetime


class Scheduler:
    """
    One-theater scheduling logic.

    - Prevents overlapping showtimes per auditorium/room.
    - Can generate 5 time options based on movie length (+ buffer).
    - Saves/loads schedule.json
    """

    def __init__(self) -> None:
        self._movies: List[Movie] = []
        self._showtimes: List[Showtime] = []

    # ---------- Basic getters ----------
    def add_movie(self, movie: Movie) -> None:
        self._movies.append(movie)

    def get_schedule(self) -> list[Showtime]:
        return sorted(self._showtimes, key=lambda s: (s.auditorium, s.start_time))

    # ---------- Overlap rules ----------
    @staticmethod
    def _overlaps(a: Showtime, b: Showtime) -> bool:
        # touching is allowed: end == start is NOT overlap
        return a.start_time < b.end_time and b.start_time < a.end_time

    def add_showtime(self, showtime: Showtime) -> bool:
        """Returns True if added, False if blocked due to overlap in same auditorium."""
        for existing in self._showtimes:
            if existing.auditorium == showtime.auditorium and self._overlaps(existing, showtime):
                return False
        self._showtimes.append(showtime)
        return True

    # ---------- Manager workflow helpers ----------
    def generate_time_options(
        self,
        day: date,
        movie_duration_min: int,
        *,
        day_start_hhmm: str = "10:00",
        buffer_min: int = 15,
        count: int = 5,
    ) -> list[TimeOption]:
        """
        Generates options 1..count.
        Each option start time steps forward by (duration + buffer).
        """
        first_start = datetime.strptime(f"{day.isoformat()} {day_start_hhmm}", "%Y-%m-%d %H:%M")
        step = timedelta(minutes=movie_duration_min + buffer_min)

        options: list[TimeOption] = []
        current = first_start
        for i in range(1, count + 1):
            end = current + timedelta(minutes=movie_duration_min)
            options.append(TimeOption(i, current, end))
            current = current + step
        return options

    def enforce_one_movie_per_room_per_day(
        self,
        day: date,
        auditorium: str,
        movie_title: str,
    ) -> bool:
        """
        True if allowed, False if room already has a different movie that day.
        """
        for s in self._showtimes:
            if s.auditorium == auditorium and s.start_time.date() == day:
                if s.movie.title != movie_title:
                    return False
        return True

    # ---------- Save / Load ----------
    def save_schedule(self, filename: str) -> None:
        data = []
        for s in self._showtimes:
            data.append(
                {
                    "auditorium": s.auditorium,
                    "capacity": getattr(s, "capacity", None),  # if your Showtime stores it
                    "start_time": s.start_time.isoformat(),
                    "movie": {
                        "title": s.movie.title,
                        "duration_min": s.movie.duration_min,
                        "rating": s.movie.rating,
                    },
                }
            )
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load_schedule(self, filename: str) -> None:
        with open(filename, "r", encoding="utf-8") as f:
            data = json.load(f)

        self._showtimes.clear()
        self._movies.clear()

        # reuse movie objects by title to avoid duplicates
        movie_by_title: Dict[str, Movie] = {}

        for item in data:
            m = item["movie"]
            title = m["title"]
            duration = int(m["duration_min"])
            rating = m.get("rating", "NR")

            if title not in movie_by_title:
                movie_by_title[title] = Movie(title, duration, rating)
                self.add_movie(movie_by_title[title])

            movie_obj = movie_by_title[title]
            start_time = datetime.fromisoformat(item["start_time"])
            auditorium = item["auditorium"]
            capacity = item.get("capacity", 75) or 75

            self._showtimes.append(Showtime(movie_obj, start_time, auditorium, capacity=capacity))