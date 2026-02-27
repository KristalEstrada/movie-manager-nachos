from dataclasses import dataclass
from datetime import datetime
from .movie import Movie
from datetime import timedelta

@dataclass
class Showtime:
    movie: Movie
    start_time: datetime
    auditorium: str
    capacity: int = 50
    tickets_sold: int = 0

    def sell_ticket(self, qty: int = 1) -> bool:
        if self.tickets_sold + qty > self.capacity:
            return False
        self.tickets_sold += qty
        return True

    @property
    def seats_left(self) -> int:
        return self.capacity - self.tickets_sold
    
    @property
    def end_time(self):
        return self.start_time + timedelta(minutes=self.movie.duration_min)