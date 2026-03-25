import { useState, useEffect, useCallback } from 'react'
import { getSchedule } from './api/schedulerApi'
import AddShowtimePanel from './webpage/AddShowTimePanel'
import ScheduleView from './webpage/ScheduleView'

export default function App() {
  const [showtimes, setShowtimes] = useState([])
  const [status, setStatus]       = useState(null)   // { msg, type }
  const [loadingInit, setLoadingInit] = useState(true)

 const refreshSchedule = useCallback(async () => {
  try {
    const data = await getSchedule()
    console.log("API data:", data)
    setShowtimes(data.showtimes ?? data)
  } catch (e) {
    console.error('Refresh failed', e)
  }
}, [])

  useEffect(() => {
    refreshSchedule().finally(() => setLoadingInit(false))
  }, [refreshSchedule])

 function flashStatus(msg, type = 'success') {
  setStatus({ msg, type })
  setTimeout(() => setStatus(null), 3500)
}

function handleSave() {
  flashStatus('Use the Python app to save schedule.json, then copy it into frontend/public.', 'error')
}

async function handleLoad() {
  try {
    await refreshSchedule()
    flashStatus('✅ Schedule loaded from frontend/public/schedule.json')
  } catch (e) {
    flashStatus('❌ Load failed', 'error')
  }
}

function handleClear() {
  setShowtimes([])
  flashStatus('Cleared view only. Backend file was not changed.', 'error')
}
 

  return (
    <div style={styles.root}>
      {/* ── Top bar ── */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🍿</span>
          <div>
            <div style={styles.logoTitle}>Nachos Movie Manager</div>
            <div style={styles.logoSub}>by Nachos · Location 1</div>
          </div>
        </div>

        <div style={styles.headerActions}>
          {status && (
            <span className={`tag ${status.type === 'error' ? 'error' : 'success'}`} style={{ fontSize: 13, padding: '5px 10px' }}>
              {status.msg}
            </span>
          )}
          <button onClick={handleLoad} style={styles.btnOutline}>📂 Load</button>
          <button onClick={handleSave} style={styles.btnOutline}>💾 Save</button>
          <button onClick={handleClear} style={styles.btnDanger}>🗑 Clear</button>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div style={styles.body}>
        {/* Left sidebar: add form */}
        <AddShowtimePanel onAdded={refreshSchedule} />

        {/* Right: schedule */}
        <main style={styles.main}>
          <div style={styles.mainHeader}>
            <div>
              <h1 style={styles.mainTitle}>TODAY'S SCHEDULE</h1>
              <p style={styles.mainSub}>
                {showtimes.length} showtime{showtimes.length !== 1 ? 's' : ''} ·{' '}
                {[...new Set(showtimes.map((s) => s.auditorium))].length} auditorium(s)
              </p>
            </div>
            <button onClick={refreshSchedule} style={styles.refreshBtn}>↻ Refresh</button>
          </div>

          {loadingInit ? (
            <div style={styles.loading}>Loading schedule…</div>
          ) : (
            <ScheduleView showtimes={showtimes} onRefresh={refreshSchedule} />
          )}
        </main>
      </div>
    </div>
  )
}

const styles = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    height: 60,
    background: '#0a0a0a',
    borderBottom: '1px solid #1f1f1f',
    flexShrink: 0,
    gap: 16,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 12 },
  logoIcon: { fontSize: 28 },
  logoTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    letterSpacing: '.12em',
    color: '#f5c518',
    lineHeight: 1,
  },
  logoSub: { fontSize: 11, color: '#7a7a7a', letterSpacing: '.04em', marginTop: 2 },

  headerActions: { display: 'flex', alignItems: 'center', gap: 8 },
  btnOutline: {
    background: 'transparent',
    border: '1px solid #2a2a2a',
    color: '#e8e8e8',
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 500,
  },
  btnDanger: {
    background: 'transparent',
    border: '1px solid #3a1010',
    color: '#ff4f4f',
    padding: '6px 14px',
    fontSize: 13,
  },

  body: { display: 'flex', flex: 1, overflow: 'hidden' },

  main: { flex: 1, padding: '24px 28px', overflowY: 'auto' },
  mainHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  mainTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 36,
    letterSpacing: '.12em',
    color: '#e8e8e8',
    lineHeight: 1,
  },
  mainSub: { fontSize: 13, color: '#7a7a7a', marginTop: 6 },
  refreshBtn: {
    background: 'transparent',
    border: '1px solid #2a2a2a',
    color: '#7a7a7a',
    padding: '6px 12px',
    fontSize: 13,
    borderRadius: 6,
  },
  loading: { color: '#7a7a7a', padding: '40px 0', textAlign: 'center' },
}
