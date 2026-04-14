from datetime import date

from src.scheduler.scheduler import Scheduler
from src.models.showtime import Showtime
from src.models.movie import Movie
from src.models.movie_repository import MovieRepository


def print_schedule(showtimes: list[Showtime]) -> None:
    print("\n=== MOVIE MANAGER BY NACHOS: SHOWTIMES ===")
    for showtime in showtimes:
        time_str = showtime.start_time.strftime("%I:%M %p")
        print(
            f"{time_str} | {showtime.movie.title} ({showtime.movie.rating}) "
            f"- {showtime.movie.duration_min} min | {showtime.auditorium} "
            f"| Seats left: {showtime.seats_left}"
        )


def main() -> None:
    print("Movie Manager by Nachos starting...")
    # ---- TEST MOVIE STORAGE ----
    repo = MovieRepository()

    test_movie = Movie(
        title="Inception",
        duration_min=148,
        rating="PG-13",
        description="A mind-bending thriller"
    )

    repo.add_movie(test_movie)

    print("\nMovies in DB:")
    for movie in repo.get_all_movies():
        print(movie)

    sched = Scheduler()

    # Try loading prior schedule
    try:
        sched.load_schedule("schedule.json")
        print("Loaded schedule.json")
    except Exception as e:
        print(f"(Skipping load) schedule.json not usable yet: {e}")

    # ---- Manager picks theater location ----
    print("\n--- Manager: Pick Theater Location ---")
    print("1) Location 1")
    location = input("Pick location (1): ").strip() or "1"
    if location != "1":
        print("Only Location 1 is available right now. Using Location 1.")
    print("Using Location 1.")

    today = date.today()

    # ---- Manager assigns one movie per room per day ----
    print("\n--- Manager: Assign Movie to Room (All Day) ---")

    while True:
        room_num = input("\nEnter room # (or type 'done'): ").strip().lower()
        if room_num == "done":
            break
        if not room_num.isdigit():
            print("Please enter a number like 1, 2, 3... or 'done'.")
            continue

        auditorium = f"Auditorium {room_num}"

        title = input("Enter movie name: ").strip()
        try:
            length = int(input("Enter movie length (minutes): ").strip())
        except ValueError:
            print("❌ Please enter a valid number for movie length.")
            continue
        rating = input("Enter rating (optional, press Enter for NR): ").strip() or "NR"

        if not sched.enforce_one_movie_per_room_per_day(today, auditorium, title):
            print(f"❌ {auditorium} already has a different movie scheduled today.")
            continue

        movie = Movie(title, length, rating)
        sched.add_movie(movie)

        options = sched.generate_time_options(
            today,
            length,
            day_start_hhmm="10:00",
            buffer_min=15,
            count=5
        )

        print("\nPick options 1-5 for showtimes (auto-generated from movie length):")
        for option in options:
            print(f"{option.option_num}) {option.start_time.strftime('%I:%M %p')} - {option.end_time.strftime('%I:%M %p')}")

        picks_raw = input("Enter picks like 1,3,5 (or press Enter to skip): ").strip()
        if not picks_raw:
            print("Skipping this room (no times chosen).")
            continue

        picks = [p.strip() for p in picks_raw.split(",") if p.strip()]
        for pick in picks:
            if not pick.isdigit():
                print(f"⚠️ Skipping invalid pick: {pick}")
                continue
            pick_num = int(pick)
            match = next((opt for opt in options if opt.option_num == pick_num), None)
            if not match:
                print(f"⚠️ Pick out of range (1-5): {pick}")
                continue

            ok = sched.add_showtime(Showtime(movie, match.start_time, auditorium, capacity=75))
            if not ok:
                print(f"❌ Overlap blocked in {auditorium} at {match.start_time.strftime('%I:%M %p')}")
            else:
                print(f"✅ Added {auditorium}: {match.start_time.strftime('%I:%M %p')} ({title})")

    print_schedule(sched.get_schedule())

    sched.save_schedule("schedule.json")
    print("\nSaved schedule.json")

    # ---- Filter schedule by room ----
    print("\n--- Filter Schedule by Room ---")
    filter_room = input("Enter room number to filter (or press Enter for all): ").strip()
    if filter_room:
        filtered_showtimes = [s for s in sched.get_schedule() if s.auditorium == f"Auditorium {filter_room}"]
        if filtered_showtimes:
            print_schedule(filtered_showtimes)
        else:
            print(f"No showtimes found for Auditorium {filter_room}.")
    else:
        print_schedule(sched.get_schedule())


if __name__ == "__main__":
    main()