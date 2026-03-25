from dataclasses import dataclass

@dataclass
class Movie:
    title: str
    duration_min: int
    rating: str
    description: str = ""