import { useEffect, useState } from 'react'
import { getMovies, deleteMovie, addMovie } from '../api/schedulerApi'


export default function ManageMoviesPanel({ onChanged }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    title: '',
    duration_min: '',
    rating: '',
    description: '',
  })

  async function refresh() {
    setLoading(true)
    setMovies(await getMovies())
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function handleDelete(id) {
    if (!window.confirm('Delete this movie and all its showtimes?')) return
    setDeleting(id)
    try {
      await deleteMovie(id)
      await refresh()
      onChanged && onChanged()
    } catch (e) {
      alert('Delete failed: ' + e.message)
    } finally {
      setDeleting(null)
    }
  }

  async function handleAddMovie(e) {
    e.preventDefault()
    setAdding(true)
    try {
      const payload = {
        title: form.title.trim(),
        duration_min: parseInt(form.duration_min, 10),
        rating: form.rating.trim() || 'NR',
        description: form.description.trim(),
      }
      if (!payload.title || isNaN(payload.duration_min) || payload.duration_min <= 0) {
        alert('Please enter a valid title and duration (minutes)')
        setAdding(false)
        return
      }
      await addMovie(payload)
      setForm({ title: '', duration_min: '', rating: '', description: '' })
      await refresh()
      onChanged && onChanged()
    } catch (e) {
      alert('Add movie failed: ' + e.message)
    } finally {
      setAdding(false)
    }
  }
  
  return (
    <div style={styles.panel}>
      <h2 style={styles.panelTitle}>🎞 Movies</h2>
      <form onSubmit={handleAddMovie} style={styles.addForm}>
        <input
          style={styles.input}
          placeholder="Title"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          required
        />
        <input
          style={styles.input}
          placeholder="Duration (min)"
          type="number"
          min={1}
          value={form.duration_min}
          onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))}
          required
        />
        <input
          style={styles.input}
          placeholder="Rating (e.g. PG)"
          value={form.rating}
          onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
        />
        <input
          style={styles.input}
          placeholder="Description"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
        <button type="submit" style={styles.addBtn} disabled={adding}>
          {adding ? 'Adding…' : 'Add Movie'}
        </button>
      </form>
      {loading ? <div>Loading…</div> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {movies.map(m => (
            <li key={m.id} style={styles.movieRow}>
              <span style={styles.movieMeta}>{m.duration_min} min, {m.rating}</span>
              <button
                style={styles.deleteBtn}
                onClick={() => handleDelete(m.id)}
                disabled={deleting === m.id}
                title="Delete movie"
              >✖</button>
            </li>
          ))}
          {movies.length === 0 && <li style={{ color: '#888', fontSize: 13 }}>No movies yet.</li>}
        </ul>
      )}
    </div>
  )
}

const styles = {
  panel: {
    background: '#0f0f0f',
    borderRight: '1px solid #1f1f1f',
    padding: '24px 20px',
    width: 300,
    flexShrink: 0,
    overflowY: 'auto',
    marginBottom: 24,
  },
  panelTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    letterSpacing: '.08em',
    marginBottom: 16,
    color: '#f5c518',
  },
  addForm: {
    display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18,
  },
  input: {
    fontSize: 14, padding: '6px 8px', borderRadius: 4, border: '1px solid #222', background: '#181818', color: '#fff', marginBottom: 0,
  },
  addBtn: {
    background: '#f5c518', color: '#222', border: 'none', borderRadius: 4, padding: '7px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 2,
  },
  movieRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
    borderBottom: '1px solid #222', paddingBottom: 4,
  },
  movieTitle: { fontWeight: 600, fontSize: 15, flex: 1 },
  movieMeta: { fontSize: 12, color: '#aaa', marginRight: 8 },
  deleteBtn: {
    background: 'none', border: 'none', color: '#ff4f4f', fontWeight: 700, cursor: 'pointer', fontSize: 16,
  },
}
