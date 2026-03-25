import { useState } from 'react'
import { sellTicket } from '../api/schedulerApi'

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function ShowtimeCard({ showtime, onTicketSold }) {
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
        <span style={styles.movieTitle}>{showtime.movie.title}</span>
        <span className="tag rating">{showtime.movie.rating}</span>
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
        !canSell && <div style={{ color: '#7a7a7a', fontSize: 12, marginTop: 8 }}>Customer view: ticket sales are disabled.</div>
      )}

      {msg && (
        <div className={`tag ${msg.type}`} style={{ marginTop: 8, display: 'block' }}>
          {msg.text}
        </div>
      )}
    </div>
  )
}

export default function ScheduleView({ showtimes, onRefresh, canSell = true }) {
  if (!showtimes.length) {
    return (
      <div style={styles.empty}>
        <span style={{ fontSize: 40 }}>🎬</span>
        <p>No showtimes scheduled yet.</p>
        <p style={{ color: '#7a7a7a', fontSize: 13 }}>Add a movie in the panel on the left.</p>
      </div>
    )
  }

  // Group by auditorium
  const grouped = {}
  showtimes.forEach((s) => {
    if (!grouped[s.auditorium]) grouped[s.auditorium] = []
    grouped[s.auditorium].push(s)
  })

  return (
    <div>
      {Object.entries(grouped).map(([aud, shows]) => (
        <div key={aud} style={styles.group}>
          <h3 style={styles.audTitle}>🏟 {aud}</h3>
          <p style={styles.dateLabel}>{fmtDate(shows[0].start_time)}</p>
          <div style={styles.cards}>
            {shows.map((s) => (
              <ShowtimeCard key={s.id} showtime={s} onTicketSold={onRefresh} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
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
