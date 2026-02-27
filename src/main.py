from datetime import datetime

from src.scheduler.scheduler import Scheduler
from src.models.movie import Movie
from src.models.showtime import Showtime


def print_schedule(showtimes: list[Showtime]) -> None:
    print("\n=== MOVIE MANAGER BY NACHOS: SHOWTIMES ===")
    for s in showtimes:
        t = s.start_time.strftime("%I:%M %p")
        print(
            f"{t} | {s.movie.title} ({s.movie.rating}) "
            f"- {s.movie.duration_min} min | {s.auditorium} "
            f"| Seats left: {s.seats_left}"
        )


def main() -> None:
    print("Movie Manager by Nachos starting...")

    sched = Scheduler()

    # OPTIONAL: try to load schedule, but don't crash if schedule.json is old/bad
    try:
        sched.load_schedule("schedule.json")
        print("Loaded schedule.json")
    except Exception as e:
        print(f"(Skipping load) schedule.json not usable yet: {e}")

    # ---- Manager: add movies (manual entry) ----
    print("\n--- Manager: Add a Movie ---")

    add_more = input("Would you like to add a movie? (y/n): ")

    while add_more.lower() == "y":
        title = input("Enter movie title: ")
        duration = int(input("Enter duration (minutes): "))
        rating = input("Enter rating (PG, PG-13, etc): ")

        new_movie = Movie(title, duration, rating)
        sched.add_movie(new_movie)

        print(f"Movie '{title}' added successfully!")

        add_more = input("Add another movie? (y/n): ")

    # ---- Demo movies (so showtimes always work even if user adds none) ----
    minecraft = Movie("A Minecraft Movie", 105, "PG")
    lilo_stitch = Movie("Lilo & Stitch", 100, "PG")
    superman = Movie("Superman", 140, "PG-13")
    zootopia_2 = Movie("Zootopia 2", 110, "PG")
    avatar_fire_ash = Movie("Avatar: Fire and Ash", 190, "PG-13")

    for m in [minecraft, lilo_stitch, superman, zootopia_2, avatar_fire_ash]:
        sched.add_movie(m)

    # ---- Schedule showtimes (realistic times) ----
    sched.add_showtime(Showtime(minecraft, datetime(2026, 7, 10, 10, 0), "Auditorium 1", capacity=75))
    sched.add_showtime(Showtime(lilo_stitch, datetime(2026, 7, 10, 12, 15), "Auditorium 1", capacity=75))
    sched.add_showtime(Showtime(superman, datetime(2026, 7, 10, 14, 30), "Auditorium 1", capacity=75))
    sched.add_showtime(Showtime(zootopia_2, datetime(2026, 7, 10, 16, 50), "Auditorium 1", capacity=75))
    sched.add_showtime(Showtime(avatar_fire_ash, datetime(2026, 7, 10, 19, 15), "Auditorium 1", capacity=75))

    ok = sched.add_showtime(
        Showtime(minecraft, datetime(2026, 7, 10, 10, 30), "Auditorium 1", capacity=75)
    )
    print("Overlap test (should be False):", ok)

    # ---- Customer views schedule ----
    print_schedule(sched.get_schedule())

    # ---- Prevent overselling demo ----
    first = sched.get_schedule()[0]
    print("\n--- Oversell Test ---")
    print("Sell 50 tickets:", "OK" if first.sell_ticket(50) else "SOLD OUT")
    print("Sell 1 more:", "OK" if first.sell_ticket(1) else "NOT Available (would oversell)")

    print_schedule(sched.get_schedule())

    # ---- Save schedule ----
    sched.save_schedule("schedule.json")
    print("\nSaved schedule.json")


if __name__ == "__main__":
    main()