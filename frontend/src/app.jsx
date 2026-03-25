import { useState, useEffect, useCallback } from 'react'
import { getSchedule } from './api/schedulerApi'
import AddShowtimePanel from './webpage/AddShowTimePanel'
import ManageMoviesPanel from './webpage/ManageMoviesPanel'
import ScheduleView from './webpage/ScheduleView'

const MANAGER_PASSWORD = 'nachos-123'

export default function App() {
  const [role, setRole] = useState(null) // null | 'customer' | 'manager'
  const [managerPass, setManagerPass] = useState('')
  const [authError, setAuthError] = useState('')
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
 

  function managerLogin() {
    if (managerPass === MANAGER_PASSWORD) {
      setRole('manager')
      setAuthError('')
    } else {
      setAuthError('Incorrect manager password')
    }
  }

  if (!role) {
    return (
      <div style={{ ...styles.root, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div style={styles.authCard}>
          <h2 style={{ marginBottom: 14 }}>Choose Access Mode</h2>
          <button style={styles.authButton} onClick={() => setRole('customer')}>👥 Customer view</button>
          <div style={{ margin: '16px 0', textAlign: 'center' }}>or</div>
          <input
            type="password"
            placeholder="Manager password"
            value={managerPass}
            onChange={(e) => setManagerPass(e.target.value)}
            style={styles.authInput}
          />
          <button style={styles.authButton} onClick={managerLogin}>🛠 Manager login</button>
          {authError && <div className="tag error" style={{ marginTop: 10 }}>{authError}</div>}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🍿</span>
          <div>
            <div style={styles.logoTitle}>Nachos Movie Manager</div>
            <div style={styles.logoSub}>{role === 'manager' ? 'Manager mode' : 'Customer mode'}</div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => setRole(null)} style={styles.btnOutline}>↩ Switch role</button>
          <button onClick={refreshSchedule} style={styles.btnOutline}>↻ Refresh</button>
          {role === 'manager' && <button onClick={handleClear} style={styles.btnDanger}>🗑 Clear</button>}
        </div>
      </header>

      <div style={styles.body}>
        {role === 'manager' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <ManageMoviesPanel onChanged={refreshSchedule} />
            <AddShowtimePanel onAdded={refreshSchedule} />
          </div>
        )}

        <main style={styles.main}>
          <div style={styles.mainHeader}>
            <div>
              <h1 style={styles.mainTitle}>{role === 'manager' ? "MANAGER SCHEDULE" : "TODAY'S SHOWTIMES"}</h1>
              <p style={styles.mainSub}>
                {showtimes.length} showtime{showtimes.length !== 1 ? 's' : ''} ·{' '}
                {[...new Set(showtimes.map((s) => s.auditorium))].length} auditorium(s)
              </p>
            </div>
          </div>
          {loadingInit ? (
            <div style={styles.loading}>Loading schedule…</div>
          ) : (
            <ScheduleView showtimes={showtimes} onRefresh={refreshSchedule} canSell={role === 'manager'} canDelete={role === 'manager'} />
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
  authCard: {
    width: 320,
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: 10,
    padding: 20,
    boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
    textAlign: 'center',
  },
  authButton: {
    width: '100%',
    padding: '10px 12px',
    margin: '6px 0',
    fontSize: 14,
    borderRadius: 6,
    border: '1px solid #2a2a2a',
    background: '#f5c518',
    color: '#000',
    fontWeight: 600,
    cursor: 'pointer',
  },
  authInput: {
    width: '100%',
    padding: '8px 10px',
    marginBottom: 10,
    borderRadius: 6,
    border: '1px solid #333',
    background: '#0f0f0f',
    color: '#fff',
  },
}
