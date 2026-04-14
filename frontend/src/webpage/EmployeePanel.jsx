import { useMemo, useState } from 'react'
import { sellTicket } from '../api/schedulerApi'

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function toDateKey(iso) {
  return new Date(iso).toISOString().slice(0, 10)
}

function isPastShowtime(iso) {
  return new Date(iso) < new Date()
}

export default function EmployeePanel({ showtimes, onSold }) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedAuditorium, setSelectedAuditorium] = useState('')
  const [selectedShowtime, setSelectedShowtime] = useState('')
  const [qty, setQty] = useState(1)
  const [status, setStatus] = useState(null)

  const sortedShowtimes = useMemo(() => {
    return [...showtimes].sort(
      (a, b) => new Date(a.start_time) - new Date(b.start_time)
    )
  }, [showtimes])

  const uniqueDates = useMemo(() => {
    return Array.from(new Set(sortedShowtimes.map((s) => toDateKey(s.start_time))))
  }, [sortedShowtimes])

  const dateFilteredShowtimes = useMemo(() => {
    return selectedDate
      ? sortedShowtimes.filter((s) => toDateKey(s.start_time) === selectedDate)
      : sortedShowtimes
  }, [sortedShowtimes, selectedDate])

  const auditoriums = useMemo(() => {
    return [...new Set(dateFilteredShowtimes.map((s) => s.auditorium))]
  }, [dateFilteredShowtimes])

  const filteredShowtimes = useMemo(() => {
    return dateFilteredShowtimes.filter((s) => {
      if (!selectedAuditorium) return false
      return s.auditorium === selectedAuditorium
    })
  }, [dateFilteredShowtimes, selectedAuditorium])

  const selectedShow = filteredShowtimes.find((s) => String(s.id) === String(selectedShowtime))
  const saleLocked = selectedShow ? isPastShowtime(selectedShow.start_time) : false

  const handleSell = async () => {
    if (!selectedDate) {
      return setStatus({ msg: 'Select a date', type: 'error' })
    }

    if (!selectedAuditorium) {
      return setStatus({ msg: 'Select a theater', type: 'error' })
    }

    if (!selectedShowtime) {
      return setStatus({ msg: 'Select a showtime', type: 'error' })
    }

    if (saleLocked) {
      return setStatus({
        msg: 'Sales are disabled for showtimes that have already started or passed.',
        type: 'error',
      })
    }

    try {
      const res = await sellTicket(selectedShowtime, qty)
      setStatus({
        msg: `Sold ${qty} ticket(s). Confirmation code: ${res.confirmation_code}`,
        type: 'success',
        code: res.confirmation_code,
      })
      setQty(1)
      onSold && onSold()
    } catch (e) {
      setStatus({
        msg: e.message || 'Error',
        type: 'error',
      })
    }
  }

  return (
    <div style={styles.panel}>
      <h2 style={styles.title}>Employee Ticket Sales</h2>

      <div style={styles.row}>
        <label style={styles.label}>
          Date
          <select
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setSelectedAuditorium('')
              setSelectedShowtime('')
              setStatus(null)
            }}
            style={styles.select}
          >
            <option value="">Select date</option>
            {uniqueDates.map((date) => (
              <option key={date} value={date}>
                {fmtDate(date)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={styles.row}>
        <label style={styles.label}>
          Theater
          <select
            value={selectedAuditorium}
            onChange={(e) => {
              setSelectedAuditorium(e.target.value)
              setSelectedShowtime('')
              setStatus(null)
            }}
            disabled={!selectedDate}
            style={styles.select}
          >
            <option value="">Select</option>
            {auditoriums.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={styles.row}>
        <label style={styles.label}>
          Showtime
          <select
            value={selectedShowtime}
            onChange={(e) => {
              setSelectedShowtime(e.target.value)
              setStatus(null)
            }}
            disabled={!selectedAuditorium}
            style={styles.select}
          >
            <option value="">Select</option>
            {filteredShowtimes.map((s) => {
              const locked = isPastShowtime(s.start_time)
              return (
                <option key={s.id} value={s.id}>
                  {(s.movie?.title || s.movie_title || 'Movie')} @ {fmtTime(s.start_time)} ({s.seats_left} left){locked ? ' — closed' : ''}
                </option>
              )
            })}
          </select>
        </label>
      </div>

      {selectedShow && (
        <div style={styles.showMeta}>
          <div><strong>{selectedShow.movie?.title || selectedShow.movie_title || 'Movie'}</strong></div>
          <div>{fmtDate(selectedShow.start_time)} · {fmtTime(selectedShow.start_time)}</div>
          <div>{selectedShow.auditorium}</div>
          <div>{selectedShow.seats_left} seats left</div>
          {saleLocked && (
            <div style={styles.lockedText}>
              Sales are closed because this showtime is already in the past.
            </div>
          )}
        </div>
      )}

      <div style={styles.row}>
        <label style={styles.label}>
          Quantity
          <input
            type="number"
            min={1}
            max={selectedShow?.seats_left || 99}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            style={styles.input}
          />
        </label>
      </div>

      <button
        onClick={handleSell}
        disabled={!selectedShow || saleLocked}
        style={{
          ...styles.button,
          opacity: !selectedShow || saleLocked ? 0.6 : 1,
          cursor: !selectedShow || saleLocked ? 'not-allowed' : 'pointer',
        }}
      >
        Sell Ticket(s)
      </button>

      {status && (
        <div
          style={{
            ...styles.status,
            color: status.type === 'error' ? '#ff8e8e' : '#7dff9b',
            borderColor: status.type === 'error' ? '#5a2222' : '#1f4d2d',
            background: status.type === 'error' ? '#2a1111' : '#102416',
          }}
        >
          <div>{status.msg}</div>
          {status.code && (
            <div style={styles.codeBox}>
              {status.code}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  panel: {
    padding: 20,
    background: '#181818',
    borderRadius: 8,
    marginBottom: 24,
    maxWidth: 420,
    border: '1px solid #2a2a2a',
  },
  title: {
    marginBottom: 14,
    color: '#f5c518',
  },
  row: {
    marginBottom: 12,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 14,
    color: '#ddd',
  },
  select: {
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #333',
    background: '#0f0f0f',
    color: '#fff',
  },
  input: {
    width: 80,
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #333',
    background: '#0f0f0f',
    color: '#fff',
  },
  button: {
    padding: '10px 18px',
    fontWeight: 600,
    background: '#f5c518',
    border: 'none',
    borderRadius: 6,
    color: '#000',
  },
  showMeta: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    background: '#111',
    border: '1px solid #2a2a2a',
    color: '#ddd',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  lockedText: {
    marginTop: 6,
    color: '#ff8e8e',
    fontSize: 13,
  },
  status: {
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    border: '1px solid',
    fontSize: 14,
  },
  codeBox: {
    marginTop: 10,
    fontFamily: 'monospace',
    fontSize: 24,
    letterSpacing: '.12em',
    fontWeight: 700,
    color: '#f5c518',
    background: '#000',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '10px 12px',
    textAlign: 'center',
  },
}