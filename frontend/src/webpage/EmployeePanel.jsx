import { useState } from 'react'
import { sellTicket } from '../api/schedulerApi'

export default function EmployeePanel({ showtimes, onSold }) {
  const [selectedAuditorium, setSelectedAuditorium] = useState('')
  const [selectedShowtime, setSelectedShowtime] = useState('')
  const [qty, setQty] = useState(1)
  const [status, setStatus] = useState(null)

  // Get unique auditoriums
  const auditoriums = [...new Set(showtimes.map(s => s.auditorium))]
  // Filter showtimes for selected auditorium
  const filteredShowtimes = showtimes.filter(s => s.auditorium === selectedAuditorium)

  const handleSell = async () => {
    if (!selectedShowtime) return setStatus({ msg: 'Select a showtime', type: 'error' })
    try {
      await sellTicket(selectedShowtime, qty)
      setStatus({ msg: `Sold ${qty} ticket(s)!`, type: 'success' })
      setQty(1)
      onSold && onSold()
    } catch (e) {
      setStatus({ msg: e?.response?.data?.detail || e.message || 'Error', type: 'error' })
    }
  }

  return (
    <div style={{ padding: 20, background: '#181818', borderRadius: 8, marginBottom: 24, maxWidth: 420 }}>
      <h2 style={{ marginBottom: 12 }}>Sell Tickets</h2>
      <div style={{ marginBottom: 10 }}>
        <label>Theater:&nbsp;
          <select value={selectedAuditorium} onChange={e => { setSelectedAuditorium(e.target.value); setSelectedShowtime('') }}>
            <option value="">Select</option>
            {auditoriums.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label>Showtime:&nbsp;
          <select value={selectedShowtime} onChange={e => setSelectedShowtime(e.target.value)} disabled={!selectedAuditorium}>
            <option value="">Select</option>
            {filteredShowtimes.map(s => (
              <option key={s.id} value={s.id}>
                {s.movie_title} @ {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({s.seats_left} left)
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label>Quantity:&nbsp;
          <input type="number" min={1} max={99} value={qty} onChange={e => setQty(Number(e.target.value))} style={{ width: 60 }} />
        </label>
      </div>
      <button onClick={handleSell} style={{ padding: '6px 18px', fontWeight: 600, background: '#f5c518', border: 'none', borderRadius: 4 }}>
        Sell Ticket(s)
      </button>
      {status && <div style={{ marginTop: 10, color: status.type === 'error' ? '#ff4f4f' : '#2ecc40' }}>{status.msg}</div>}
    </div>
  )
}
