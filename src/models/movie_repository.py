import sqlite3
from src.models.movie import Movie


class MovieRepository:
    def __init__(self, db_name="movies.db"):
        self.conn = sqlite3.connect(db_name)
        self.create_table()

    def create_table(self):
        query = """
        CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            duration_min INTEGER NOT NULL,
            rating TEXT NOT NULL,
            description TEXT
        )
        """
        self.conn.execute(query)
        self.conn.commit()

    def add_movie(self, movie: Movie):
        query = """
        INSERT INTO movies (title, duration_min, rating, description)
        VALUES (?, ?, ?, ?)
        """
        self.conn.execute(query, (
            movie.title,
            movie.duration_min,
            movie.rating,
            movie.description
        ))
        self.conn.commit()

    def get_all_movies(self):
        cursor = self.conn.execute("SELECT * FROM movies")
        return cursor.fetchall()

    def update_movie(self, movie_id, movie: Movie):
        query = """
        UPDATE movies
        SET title = ?, duration_min = ?, rating = ?, description = ?
        WHERE id = ?
        """
        self.conn.execute(query, (
            movie.title,
            movie.duration_min,
            movie.rating,
            movie.description,
            movie_id
        ))
        self.conn.commit()

    def delete_movie(self, movie_id):
        self.conn.execute("DELETE FROM movies WHERE id = ?", (movie_id,))
        self.conn.commit()