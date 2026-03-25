import { useState } from 'react'
import {
  generateTimeOptions,
  enforceRoom,
  addShowtime,
} from '../api/schedulerApi'
import TimeOptionsModal from './TimeOptionsModal'

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function AddShowtimePanel({ onAdded }) {
  const [form, setForm] = useState({
    room: '',
    title: '',
    duration_min: '',
    rating: 'NR',
    description: '',
    capacity: '75',
    day: today(),
    buffer_min: '15',
    day_start: '10:00',
  })
  const [options, setOptions]   = useState([])
  const [showModal, setShowModal] = useState(false)
  const [log, setLog]           = useState([])  // activity log
  const [loading, setLoading]   = useState(false)

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function pushLog(msg, type = 'info') {
    setLog((l) => [{ msg, type, id: Date.now() + Math.random() }, ...l].slice(0, 20))
  }

  async function handleGenerateOptions(e) {
    e.preventDefault()
    if (!form.room || !form.title || !form.duration_min) {
      pushLog('Fill in Room #, Movie Title, and Duration first.', 'error')
      return
    }
    setLoading(true)
    try {
      const auditorium = `Auditorium ${form.room}`

      // Enforce one movie per room per day
      const { allowed } = await enforceRoom(form.day, auditorium, form.title)
      if (!allowed) {
        pushLog(`❌ ${auditorium} already has a different movie on ${form.day}`, 'error')
        setLoading(false)
        return
      }

      const opts = await generateTimeOptions({
        day: form.day,
        duration_min: parseInt(form.duration_min),
        day_start_hhmm: form.day_start,
        buffer_min: parseInt(form.buffer_min),
        count: 5,
      })
      setOptions(opts)
      setShowModal(true)
    } catch (err) {
      pushLog(`❌ ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleOptionSelected(opt) {
    setShowModal(false)
    const auditorium = `Auditorium ${form.room}`
    try {
      const st = await addShowtime({
        movie: {
          title: form.title,
          duration_min: parseInt(form.duration_min),
          rating: form.rating || 'NR',
          description: form.description,
        },
        start_time: opt.start_time,
        auditorium,
        capacity: parseInt(form.capacity) || 75,
      })
      pushLog(
        `✅ Added "${form.title}" to ${auditorium} at ${new Date(opt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        'success',
      )
      onAdded()
    } catch (err) {
      pushLog(`❌ ${err.message}`, 'error')
    }
  }

  return (
    <div style={styles.panel}>
      <h2 style={styles.panelTitle}>📋 Assign Showtime</h2>

      <form onSubmit={handleGenerateOptions} style={styles.form}>
        {/* Date */}
        <div className="field">
          <label>Date</label>
          <input type="date" value={form.day} onChange={(e) => set('day', e.target.value)} />
        </div>

        {/* Room */}
        <div className="field">
          <label>Room #</label>
          <input
            type="number"
            min={1}
            placeholder="e.g. 1"
            value={form.room}
            onChange={(e) => set('room', e.target.value)}
            required
          />
        </div>

        {/* Movie title */}
        <div className="field">
          <label>Movie Title</label>
          <input
            type="text"
            placeholder="Inception"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />
        </div>

        {/* Duration */}
        <div className="field">
          <label>Duration (minutes)</label>
          <input
            type="number"
            min={1}
            placeholder="148"
            value={form.duration_min}
            onChange={(e) => set('duration_min', e.target.value)}
            required
          />
        </div>

        {/* Rating */}
        <div className="field">
          <label>Rating</label>
          <select value={form.rating} onChange={(e) => set('rating', e.target.value)}>
            {['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Capacity */}
        <div className="field">
          <label>Seat Capacity</label>
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => set('capacity', e.target.value)}
          />
        </div>

        {/* Advanced */}
        <details style={styles.advanced}>
          <summary style={styles.advSummary}>Advanced scheduling options</summary>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="field">
              <label>Day starts at</label>
              <input type="time" value={form.day_start} onChange={(e) => set('day_start', e.target.value)} />
            </div>
            <div className="field">
              <label>Buffer between shows (min)</label>
              <input
                type="number"
                min={0}
                value={form.buffer_min}
                onChange={(e) => set('buffer_min', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Description (optional)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Short synopsis…"
              />
            </div>
          </div>
        </details>

        <button type="submit" style={styles.generateBtn} disabled={loading}>
          {loading ? 'Loading…' : '🎬 Generate Time Options'}
        </button>
      </form>

      {/* Activity log */}
      {log.length > 0 && (
        <div style={styles.logBox}>
          <p style={styles.logTitle}>Activity</p>
          {log.map((l) => (
            <div key={l.id} className={`tag ${l.type === 'error' ? 'error' : l.type === 'success' ? 'success' : ''}`}
              style={{ marginBottom: 5, display: 'block', whiteSpace: 'normal', lineHeight: 1.4, padding: '5px 8px' }}>
              {l.msg}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TimeOptionsModal
          options={options}
          movieTitle={form.title}
          auditorium={`Auditorium ${form.room}`}
          onConfirm={handleOptionSelected}
          onClose={() => setShowModal(false)}
        />
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
  },
  panelTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 26,
    letterSpacing: '.08em',
    marginBottom: 20,
    color: '#f5c518',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  advanced: { fontSize: 13 },
  advSummary: {
    cursor: 'pointer', color: '#7a7a7a', fontSize: 12,
    textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600,
  },
  generateBtn: {
    background: '#f5c518',
    color: '#000',
    padding: '10px 0',
    fontWeight: 700,
    fontSize: 14,
    width: '100%',
    marginTop: 6,
  },
  logBox: { marginTop: 20 },
  logTitle: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em',
    color: '#7a7a7a', fontWeight: 600, marginBottom: 8,
  },
}
