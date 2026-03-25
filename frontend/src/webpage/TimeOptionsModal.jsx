function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  export default function TimeOptionsModal({ options, movieTitle, auditorium, onConfirm, onClose }) {
    return (
      <div style={overlay}>
        <div style={modal}>
          <div style={header}>
            <div>
              <h2 style={title}>Pick Showtimes</h2>
              <p style={sub}>
                <strong>{movieTitle}</strong> · {auditorium}
              </p>
            </div>
            <button onClick={onClose} style={closeBtn}>✕</button>
          </div>
  
          <p style={hint}>Click time slots to toggle selection, then confirm.</p>
  
          <div style={grid}>
            {options.map((opt) => (
              <TimeSlot key={opt.option_num} option={opt} onSelect={onConfirm} />
            ))}
          </div>
  
          <button onClick={onClose} style={cancelBtn}>Cancel – don't add any</button>
        </div>
      </div>
    )
  }
  
  function TimeSlot({ option, onSelect }) {
    return (
      <button onClick={() => onSelect(option)} style={slot}>
        <span style={optNum}>Option {option.option_num}</span>
        <span style={times}>
          {fmtTime(option.start_time)} → {fmtTime(option.end_time)}
        </span>
      </button>
    )
  }
  
  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  }
  const modal = {
    background: '#161616', border: '1px solid #2a2a2a',
    borderRadius: 12, padding: 28, width: 460, maxWidth: '95vw',
  }
  const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }
  const title = { fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '.06em', color: '#f5c518' }
  const sub = { fontSize: 13, color: '#9a9a9a', marginTop: 2 }
  const closeBtn = {
    background: 'transparent', color: '#7a7a7a', fontSize: 18,
    padding: '2px 6px', border: '1px solid #2a2a2a', borderRadius: 6,
  }
  const hint = { fontSize: 12, color: '#7a7a7a', marginBottom: 16 }
  const grid = { display: 'flex', flexDirection: 'column', gap: 8 }
  const slot = {
    background: '#1f1f1f', border: '1px solid #2a2a2a', color: '#e8e8e8',
    borderRadius: 8, padding: '12px 16px', textAlign: 'left',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    transition: 'border-color .15s, background .15s',
  }
  const optNum = { fontSize: 12, color: '#7a7a7a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }
  const times = { fontFamily: 'var(--font-mono)', fontSize: 15, color: '#f5c518' }
  const cancelBtn = {
    marginTop: 18, width: '100%', background: 'transparent',
    border: '1px solid #2a2a2a', color: '#7a7a7a', padding: '9px 0', borderRadius: 6, fontSize: 13,
  }
  