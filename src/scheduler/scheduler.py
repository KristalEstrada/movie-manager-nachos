from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime, timedelta

from src.models.movie import Movie
from src.models.showtime import Showtime


class Scheduler:
    def __init__(self):
        self.movies: list[Movie] = []
        self.showtimes: list[Showtime] = []

    def add_movie(self, movie: Movie):
        self.movies.append(movie)

    def _end_time(self, s: Showtime) -> datetime:
        # Movie end = start + duration
        return s.start_time + timedelta(minutes=s.movie.duration_min)

    def _overlaps(self, a: Showtime, b: Showtime) -> bool:
        # Only block overlaps in the SAME auditorium
        if a.auditorium != b.auditorium:
            return False

        a_start, a_end = a.start_time, self._end_time(a)
        b_start, b_end = b.start_time, self._end_time(b)

        # Overlap rule: start before other ends AND end after other starts
        return a_start < b_end and a_end > b_start

    def add_showtime(self, showtime: Showtime) -> bool:
        new_start = showtime.start_time
        new_end = showtime.end_time

        for existing in self.showtimes:
            # Only block overlap in the SAME auditorium (single theater logic)
            if existing.auditorium != showtime.auditorium:
                continue

            existing_start = existing.start_time
            existing_end = existing.end_time

            # Overlap rule: (start < other_end) AND (other_start < end)
            overlaps = (new_start < existing_end) and (existing_start < new_end)
            if overlaps:
                return False

        self.showtimes.append(showtime)
        return True
    def get_schedule(self):
        return sorted(self.showtimes, key=lambda s: s.start_time)

    # ---------- Save / Load ----------
    def save_schedule(self, filepath: str = "schedule.json") -> None:
        data = []
        for s in self.get_schedule():
            data.append(
                {
                    "title": s.movie.title,
                    "rating": s.movie.rating,
                    "duration_min": s.movie.duration_min,
                    "start_time": s.start_time.isoformat(),
                    "auditorium": s.auditorium,
                    "capacity": s.capacity,
                    "tickets_sold": getattr(s, "tickets_sold", 0),
                }
            )
        Path(filepath).write_text(json.dumps(data, indent=2), encoding="utf-8")

    def load_schedule(self, filepath: str = "schedule.json") -> None:
        path = Path(filepath)
        if not path.exists():
            return

        raw = json.loads(path.read_text(encoding="utf-8"))
        self.showtimes = []

        for item in raw:
            movie = Movie(item["title"], item["duration_min"], item["rating"])

            # keep movies list updated (avoid duplicates by title)
            if not any(m.title == movie.title for m in self.movies):
                self.movies.append(movie)

            st = Showtime(
                movie,
                datetime.fromisoformat(item["start_time"]),
                item["auditorium"],
                capacity=item["capacity"],
            )

            if hasattr(st, "tickets_sold"):
                st.tickets_sold = item.get("tickets_sold", 0)

            self.showtimes.append(st)