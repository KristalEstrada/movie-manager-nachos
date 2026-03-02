from datetime import date

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
        length = int(input("Enter movie length (minutes): ").strip())

        # rating isn't in your new requirement, but your print shows rating
        rating = input("Enter rating (optional, press Enter for NR): ").strip() or "NR"

        # Enforce rule: one movie per room per day
        if not sched.enforce_one_movie_per_room_per_day(today, auditorium, title):
            print(f"❌ {auditorium} already has a different movie scheduled today.")
            continue

        movie = Movie(title, length, rating)
        sched.add_movie(movie)

        # Generate dynamic options 1-5 based on length (+ buffer)
        options = sched.generate_time_options(today, length, day_start_hhmm="10:00", buffer_min=15, count=5)

        print("\nPick options 1-5 for showtimes (auto-generated from movie length):")
        for opt in options:
            print(f"{opt.option_num}) {opt.start_time.strftime('%I:%M %p')} - {opt.end_time.strftime('%I:%M %p')}")

        picks_raw = input("Enter picks like 1,3,5 (or press Enter to skip): ").strip()
        if not picks_raw:
            print("Skipping this room (no times chosen).")
            continue

        picks = [p.strip() for p in picks_raw.split(",") if p.strip()]
        for p in picks:
            if not p.isdigit():
                print(f"⚠️ Skipping invalid pick: {p}")
                continue
            n = int(p)
            match = next((o for o in options if o.option_num == n), None)
            if not match:
                print(f"⚠️ Pick out of range (1-5): {p}")
                continue

            ok = sched.add_showtime(Showtime(movie, match.start_time, auditorium, capacity=75))
            if not ok:
                print(f"❌ Overlap blocked in {auditorium} at {match.start_time.strftime('%I:%M %p')}")
            else:
                print(f"✅ Added {auditorium}: {match.start_time.strftime('%I:%M %p')} ({title})")

    # ---- Print final schedule ----
    print_schedule(sched.get_schedule())

    # ---- Save schedule ----
    sched.save_schedule("schedule.json")
    print("\nSaved schedule.json")


if __name__ == "__main__":
    main()