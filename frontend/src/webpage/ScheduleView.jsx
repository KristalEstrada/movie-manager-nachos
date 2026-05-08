import { useState } from 'react'
import { sellTicket, deleteShowtime } from '../api/schedulerApi'

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function MovieDetailModal({ movie, onClose }) { // To show movie details to customers when a movie is clicked
  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>{movie.title}</h2>
          <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        </div>
        <div style={modalStyles.content}>
          <div style={modalStyles.meta}>
            <span className="tag rating">{movie.rating}</span>
            <span style={modalStyles.duration}>{movie.duration_min} minutes</span>
          </div>
          <p style={modalStyles.description}>{movie.description}</p>
        </div>
      </div>
    </div>
  )
}

function ShowtimeCard({ showtime, onTicketSold, canDelete, onMovieClick }) {
    const [deleting, setDeleting] = useState(false)
    async function handleDelete() {
      if (!window.confirm('Delete this showtime?')) return;
      setDeleting(true)
      try {
        await deleteShowtime(showtime.id)
        onTicketSold()
      } catch (e) {
        alert('Delete failed: ' + e.message)
      } finally {
        setDeleting(false)
      }
    }
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const pct = Math.round((showtime.tickets_sold / showtime.capacity) * 100)

  const canSell = showtime.canSell;

  async function handleSell() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await sellTicket(showtime.id, qty)
      setMsg({ type: 'success', text: `✅ Sold ${qty}. Seats left: ${res.seats_left}` })
      onTicketSold()
    } catch (e) {
      setMsg({ type: 'error', text: `❌ ${e.message}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.card}>
      {/* Movie title + rating */}
      <div style={styles.cardHeader}>
        <span 
          style={{ ...styles.movieTitle, cursor: 'pointer' }} // related to the movie detail modal. makes title clickable
          onClick={() => onMovieClick && onMovieClick(showtime.movie)}
        >
          {showtime.movie.title}
        </span>
        <span className="tag rating">{showtime.movie.rating}</span>
        {canDelete && (
          <button onClick={handleDelete} disabled={deleting} style={{ background: 'none', border: 'none', color: '#ff4f4f', fontWeight: 700, cursor: 'pointer', fontSize: 16 }} title="Delete showtime">✖</button>
        )}
      </div>

      {/* Times */}
      <div style={styles.timeLine}>
        <span style={styles.timeBlock}>
          🕐 {fmtTime(showtime.start_time)} – {fmtTime(showtime.end_time)}
        </span>
        <span style={styles.dur}>{showtime.movie.duration_min} min</span>
      </div>

      {/* Capacity bar */}
      <div style={styles.barWrap}>
        <div style={{ ...styles.barFill, width: `${pct}%`, background: pct > 85 ? '#e05c00' : '#f5c518' }} />
      </div>
      <div style={styles.seatInfo}>
        <span>{showtime.seats_left} seats left</span>
        <span style={{ color: '#7a7a7a' }}>{showtime.tickets_sold}/{showtime.capacity} sold</span>
      </div>

      {/* Sell ticket */}
      {canSell && showtime.seats_left > 0 ? (
        <div style={styles.sellRow}>
          <input
            type="number"
            min={1}
            max={showtime.seats_left}
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ ...styles.qtyInput }}
          />
          <button onClick={handleSell} disabled={loading} style={styles.sellBtn}>
            {loading ? '…' : '🎟 Sell Ticket'}
          </button>
        </div>
      ) : (
        !canSell && <div style={{ color: '#7a7a7a', fontSize: 12, marginTop: 8 }}></div>
      )}

      {msg && (
        <div className={`tag ${msg.type}`} style={{ marginTop: 8, display: 'block' }}>
          {msg.text}
        </div>
      )}
    </div>
  )
}

export default function ScheduleView({ showtimes, onRefresh, canSell = true, canDelete = false }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAuditorium, setSelectedAuditorium] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);

  // Sort showtimes by start_time
  const sortedShowtimes = [...showtimes].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  // Get unique dates from showtimes
  const uniqueDates = Array.from(new Set(sortedShowtimes.map(s => s.start_time.slice(0, 10))));

  // Get unique auditoriums from showtimes
  const uniqueAuditoriums = Array.from(new Set(sortedShowtimes.map(s => s.auditorium)));

  // Filter showtimes by selected date (if any)
  const filteredByDate = selectedDate
    ? sortedShowtimes.filter(s => s.start_time.slice(0, 10) === selectedDate)
    : sortedShowtimes;

  // Filter by selected auditorium (if any)
  const filteredShowtimes = selectedAuditorium
    ? filteredByDate.filter(s => s.auditorium === selectedAuditorium)
    : filteredByDate;

  if (!filteredShowtimes.length) {
    return (
      <div style={styles.empty}>
        <span style={{ fontSize: 40 }}>🎬</span>
        <p>No showtimes scheduled yet.</p>
        <p style={{ color: '#7a7a7a', fontSize: 13 }}>Add a movie in the panel on the left.</p>
      </div>
    )
  }

  // Group by auditorium
  const grouped = {};
  filteredShowtimes.forEach((s) => {
    if (!grouped[s.auditorium]) grouped[s.auditorium] = [];
    grouped[s.auditorium].push(s);
  });

  return (
    <div>
      {/* Date filter for customers only */}
      {!canSell && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ marginRight: 8 }}>Filter by date:</label>
          <select
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: '4px 8px', fontSize: 14 }}
          >
            <option value=''>All Dates</option>
            {uniqueDates.map(date => (
              <option key={date} value={date}>{fmtDate(date)}</option>
            ))}
          </select>
          <label style={{ marginLeft: 16, marginRight: 8 }}>Filter by auditorium:</label>
          <select
            value={selectedAuditorium}
            onChange={e => setSelectedAuditorium(e.target.value)}
            style={{ padding: '4px 8px', fontSize: 14 }}
          >
            <option value=''>All Auditoriums</option>
            {uniqueAuditoriums.map(aud => (
              <option key={aud} value={aud}>{aud}</option>
            ))}
          </select>
        </div>
      )}
      {Object.entries(grouped).map(([aud, shows]) => (
        <div key={aud} style={styles.group}>
          <h3 style={styles.audTitle}>🏟 {aud}</h3>
          <p style={styles.dateLabel}>{fmtDate(shows[0].start_time)}</p>
          <div style={styles.cards}>
            {shows.map((s) => (
              <ShowtimeCard key={s.id} showtime={s} onTicketSold={onRefresh} canDelete={canDelete} onMovieClick={setSelectedMovie} />
            ))}
          </div>
        </div>
      ))}
      {selectedMovie && (
        <MovieDetailModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
        />
      )}
    </div>
  );
}

const styles = {
  empty: {
    textAlign: 'center',
    padding: '60px 0',
    color: '#9a9a9a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  group: { marginBottom: 32 },
  audTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 26,
    letterSpacing: '.08em',
    color: '#f5c518',
    marginBottom: 2,
  },
  dateLabel: { fontSize: 12, color: '#7a7a7a', marginBottom: 12 },
  cards: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  card: {
    background: '#161616',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    padding: '14px 16px',
    width: 260,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  movieTitle: { fontWeight: 700, fontSize: 15, lineHeight: 1.3 },
  timeLine: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  timeBlock: { fontSize: 13, color: '#e8e8e8', fontFamily: 'var(--font-mono)' },
  dur: { fontSize: 12, color: '#7a7a7a' },
  barWrap: { background: '#2a2a2a', borderRadius: 99, height: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99, transition: 'width .4s' },
  seatInfo: { display: 'flex', justifyContent: 'space-between', fontSize: 12 },
  sellRow: { display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 },
  qtyInput: { width: 56, padding: '5px 8px', fontSize: 13, textAlign: 'center' },
  sellBtn: {
    flex: 1,
    background: '#f5c518',
    color: '#000',
    padding: '6px 10px',
    fontWeight: 600,
    fontSize: 13,
  },
}

const modalStyles = {
  overlay: {
    position: 'fixed', 
    inset: 0, 
    background: 'rgba(0,0,0,.75)',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#161616', 
    border: '1px solid #2a2a2a',
    borderRadius: 12, 
    padding: 28, 
    width: 460, 
    maxWidth: '95vw',
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 16 
  },
  title: { 
    fontFamily: 'var(--font-display)', 
    fontSize: 28, 
    letterSpacing: '.06em', 
    color: '#f5c518',
    margin: 0,
  },
  closeBtn: {
    background: 'transparent', 
    color: '#7a7a7a', 
    fontSize: 18,
    padding: '2px 6px', 
    border: '1px solid #2a2a2a', 
    borderRadius: 6,
    cursor: 'pointer',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  duration: {
    fontSize: 14,
    color: '#7a7a7a',
  },
  description: {
    fontSize: 16,
    color: '#e8e8e8',
    lineHeight: 1.5,
    margin: 0,
  },
}
