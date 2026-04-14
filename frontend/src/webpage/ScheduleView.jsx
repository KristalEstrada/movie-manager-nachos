import { useState } from 'react'
import { sellTicket, deleteShowtime } from '../api/schedulerApi'
import CheckoutModal from './CheckoutModal'

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

function clampQty(value, max) {
  const parsed = parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 1) return 1
  return Math.min(parsed, Math.max(1, max))
}

function isPastShowtime(iso) {
  return new Date(iso) <= new Date()
}

function ShowtimeCard({ showtime, onTicketSold, canDelete, salesMode }) {
  const [deleting, setDeleting] = useState(false)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [checkoutError, setCheckoutError] = useState('')

  const pct = Math.round((showtime.tickets_sold / showtime.capacity) * 100)
  const saleLocked = isPastShowtime(showtime.start_time)

  const canCheckout = salesMode === 'customer'
  const canDirectSell = salesMode === 'manager' || salesMode === 'employee'
  const canSell = canCheckout || canDirectSell

  async function handleDelete() {
    if (!window.confirm('Delete this showtime?')) return
    setDeleting(true)

    try {
      await deleteShowtime(showtime.id)
      onTicketSold()
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    } finally {
      setDeleting(false)
    }
  }

  async function handleSell() {
    setLoading(true)
    setMsg(null)
    setCheckoutError('')

    try {
      const res = await sellTicket(showtime.id, qty)
      setConfirmationCode(res.confirmation_code || '')
      setMsg({
        type: 'success',
        text: `✅ Sold ${qty}. Seats left: ${res.seats_left}${res.confirmation_code ? ` · Code: ${res.confirmation_code}` : ''}`,
      })
      onTicketSold()
      return res
    } catch (e) {
      const text = `❌ ${e.message}`
      setMsg({ type: 'error', text })
      setCheckoutError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckoutConfirm() {
    try {
      await handleSell()
    } catch {
      // error already handled above
    }
  }

  function openCheckout() {
    setConfirmationCode('')
    setCheckoutError('')
    setShowCheckout(true)
  }

  function closeCheckout() {
    setShowCheckout(false)
    setCheckoutError('')
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardHeaderLeft}>
          <span style={styles.movieTitle}>{showtime.movie.title}</span>
          <span className="tag rating">{showtime.movie.rating}</span>
        </div>

        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={styles.deleteBtn}
            title="Delete showtime"
          >
            ✖
          </button>
        )}
      </div>

      <div style={styles.timeLine}>
        <span style={styles.timeBlock}>
          🕐 {fmtTime(showtime.start_time)} – {fmtTime(showtime.end_time)}
        </span>
        <span style={styles.dur}>{showtime.movie.duration_min} min</span>
      </div>

      <div style={styles.barWrap}>
        <div
          style={{
            ...styles.barFill,
            width: `${pct}%`,
            background: pct > 85 ? '#e05c00' : '#f5c518',
          }}
        />
      </div>

      <div style={styles.seatInfo}>
        <span>{showtime.seats_left} seats left</span>
        <span style={{ color: '#7a7a7a' }}>
          {showtime.tickets_sold}/{showtime.capacity} sold
        </span>
      </div>

      {canSell && (
        saleLocked ? (
          <div style={styles.disabledText}>
            Sales closed for this showtime.
          </div>
        ) : showtime.seats_left > 0 ? (
          <div style={styles.sellRow}>
            <input
              type="number"
              min={1}
              max={showtime.seats_left}
              value={qty}
              onChange={(e) => setQty(clampQty(e.target.value, showtime.seats_left))}
              style={styles.qtyInput}
            />

            {canCheckout ? (
              <button onClick={openCheckout} disabled={loading} style={styles.sellBtn}>
                Checkout
              </button>
            ) : (
              <button onClick={handleSell} disabled={loading} style={styles.sellBtn}>
                {loading ? '…' : '🎟 Sell Ticket'}
              </button>
            )}
          </div>
        ) : (
          <div style={styles.disabledText}>
            Sold out.
          </div>
        )
      )}

      {msg && (
        <div className={`tag ${msg.type}`} style={{ marginTop: 8, display: 'block' }}>
          {msg.text}
        </div>
      )}

      {showCheckout && (
        <CheckoutModal
          showtime={showtime}
          qty={qty}
          onClose={closeCheckout}
          onConfirm={handleCheckoutConfirm}
          loading={loading}
          confirmationCode={confirmationCode}
          errorMessage={checkoutError}
        />
      )}
    </div>
  )
}

export default function ScheduleView({
  showtimes,
  onRefresh,
  salesMode = 'customer',
  canDelete = false,
}) {
  const [selectedDate, setSelectedDate] = useState('')

  const sortedShowtimes = [...showtimes].sort(
    (a, b) => new Date(a.start_time) - new Date(b.start_time),
  )

  const uniqueDates = Array.from(
    new Set(sortedShowtimes.map((s) => s.start_time.slice(0, 10))),
  )

  // Get unique auditoriums from showtimes
  const uniqueAuditoriums = Array.from(new Set(sortedShowtimes.map(s => s.auditorium)));

  // Filter showtimes by selected date (if any)
  const filteredByDate = selectedDate
    ? sortedShowtimes.filter(s => s.start_time.slice(0, 10) === selectedDate)
    : sortedShowtimes;
  const filteredShowtimes = selectedDate
    ? sortedShowtimes.filter((s) => s.start_time.slice(0, 10) === selectedDate)
    : sortedShowtimes

  // Filter by selected auditorium (if any)
  const filteredShowtimes = selectedAuditorium
    ? filteredByDate.filter(s => s.auditorium === selectedAuditorium)
    : filteredByDate;

  if (!filteredShowtimes.length) {
    return (
      <div style={styles.empty}>
        <span style={{ fontSize: 40 }}>🎬</span>
        <p>No showtimes scheduled yet.</p>
        <p style={{ color: '#7a7a7a', fontSize: 13 }}>
          {salesMode === 'manager'
            ? 'Add a movie in the panel on the left.'
            : 'Check back soon for available showtimes.'}
        </p>
      </div>
    )
  }

  const grouped = {}
  filteredShowtimes.forEach((s) => {
    if (!grouped[s.auditorium]) grouped[s.auditorium] = []
    grouped[s.auditorium].push(s)
  })

  return (
    <div>
      {(salesMode === 'customer' || salesMode === 'employee') && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ marginRight: 8 }}>Filter by date:</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '4px 8px', fontSize: 14 }}
          >
            <option value="">All Dates</option>
            {uniqueDates.map((date) => (
              <option key={date} value={date}>
                {fmtDate(date)}
              </option>
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
              <ShowtimeCard
                key={s.id}
                showtime={s}
                onTicketSold={onRefresh}
                canDelete={canDelete}
                salesMode={salesMode}
              />
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
  dateLabel: {
    fontSize: 12,
    color: '#7a7a7a',
    marginBottom: 12,
  },
  cards: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
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
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  movieTitle: {
    fontWeight: 700,
    fontSize: 15,
    lineHeight: 1.3,
  },
  timeLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBlock: {
    fontSize: 13,
    color: '#e8e8e8',
    fontFamily: 'var(--font-mono)',
  },
  dur: {
    fontSize: 12,
    color: '#7a7a7a',
  },
  barWrap: {
    background: '#2a2a2a',
    borderRadius: 99,
    height: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
    transition: 'width .4s',
  },
  seatInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
  },
  sellRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  qtyInput: {
    width: 56,
    padding: '5px 8px',
    fontSize: 13,
    textAlign: 'center',
    borderRadius: 6,
    border: '1px solid #333',
    background: '#0f0f0f',
    color: '#fff',
  },
  sellBtn: {
    flex: 1,
    background: '#f5c518',
    color: '#000',
    padding: '6px 10px',
    fontWeight: 600,
    fontSize: 13,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#ff4f4f',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 16,
  },
  disabledText: {
    color: '#7a7a7a',
    fontSize: 12,
    marginTop: 8,
  },
}