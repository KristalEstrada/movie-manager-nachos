import { useState, useEffect, useCallback } from 'react'
import { getSchedule } from './api/schedulerApi'
import AddShowtimePanel from './webpage/AddShowTimePanel'
import ManageMoviesPanel from './webpage/ManageMoviesPanel'
import ScheduleView from './webpage/ScheduleView'
import EmployeePanel from './webpage/EmployeePanel'

const MANAGER_PASSWORD = 'nachos-123'
const EMPLOYEE_PASSWORD = 'BestEmployeeEver'

export default function App() {
  const [role, setRole] = useState('customer') // 'customer' | 'manager' | 'employee'
  const [showAccessPanel, setShowAccessPanel] = useState(false)
  const [managerPass, setManagerPass] = useState('')
  const [employeePass, setEmployeePass] = useState('')
  const [authError, setAuthError] = useState('')
  const [showtimes, setShowtimes] = useState([])
  const [loadingInit, setLoadingInit] = useState(true)

  const refreshSchedule = useCallback(async () => {
    try {
      const data = await getSchedule()
      console.log('API data:', data)
      setShowtimes(data.showtimes ?? data)
    } catch (e) {
      console.error('Refresh failed', e)
    }
  }, [])

  useEffect(() => {
    refreshSchedule().finally(() => setLoadingInit(false))
  }, [refreshSchedule])

  function managerLogin() {
    if (managerPass === MANAGER_PASSWORD) {
      setRole('manager')
      setShowAccessPanel(false)
      setAuthError('')
      setManagerPass('')
      setEmployeePass('')
    } else {
      setAuthError('Incorrect manager password')
    }
  }

  function employeeLogin() {
    if (employeePass === EMPLOYEE_PASSWORD) {
      setRole('employee')
      setShowAccessPanel(false)
      setAuthError('')
      setManagerPass('')
      setEmployeePass('')
    } else {
      setAuthError('Incorrect employee password')
    }
  }

  function switchToCustomer() {
    setRole('customer')
    setShowAccessPanel(false)
    setAuthError('')
    setManagerPass('')
    setEmployeePass('')
  }

  function handleClear() {
    setShowtimes([])
  }

  const auditoriumCount = [...new Set(showtimes.map((s) => s.auditorium))].length

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🍿</span>
          <div>
            <div style={styles.logoTitle}>Nachos Movie Manager</div>
            <div style={styles.logoSub}>
              {role === 'manager'
                ? 'Manager mode'
                : role === 'employee'
                  ? 'Employee mode'
                  : 'Customer mode'}
            </div>
          </div>
        </div>

        <div style={styles.headerActions}>
          <button
            onClick={() => {
              setShowAccessPanel((v) => !v)
              setAuthError('')
            }}
            style={styles.btnOutline}
          >
            Access mode
          </button>

          <button onClick={refreshSchedule} style={styles.btnOutline}>
            ↻ Refresh
          </button>

          {role === 'manager' && (
            <button onClick={handleClear} style={styles.btnDanger}>
              🗑 Clear
            </button>
          )}
        </div>
      </header>

      {showAccessPanel && (
        <div style={styles.accessPanel}>
          <div style={styles.accessPanelInner}>
            <div style={styles.accessColumn}>
              <div style={styles.accessHeading}>Customer</div>
              <button onClick={switchToCustomer} style={styles.authButton}>
                Open customer view
              </button>
            </div>

            <div style={styles.accessColumn}>
              <div style={styles.accessHeading}>Employee</div>
              <input
                type="password"
                placeholder="Employee password"
                value={employeePass}
                onChange={(e) => setEmployeePass(e.target.value)}
                style={styles.authInput}
              />
              <button onClick={employeeLogin} style={styles.authButton}>
                Employee login
              </button>
            </div>

            <div style={styles.accessColumn}>
              <div style={styles.accessHeading}>Manager</div>
              <input
                type="password"
                placeholder="Manager password"
                value={managerPass}
                onChange={(e) => setManagerPass(e.target.value)}
                style={styles.authInput}
              />
              <button onClick={managerLogin} style={styles.authButton}>
                Manager login
              </button>
            </div>
          </div>

          {authError && (
            <div className="tag error" style={{ marginTop: 12, marginLeft: 24, marginRight: 24 }}>
              {authError}
            </div>
          )}
        </div>
      )}

      <div style={styles.body}>
        {role === 'manager' && (
          <div style={styles.sidebar}>
            <ManageMoviesPanel onChanged={refreshSchedule} />
            <AddShowtimePanel onAdded={refreshSchedule} />
          </div>
        )}

        {role === 'employee' && (
          <EmployeePanel showtimes={showtimes} onSold={refreshSchedule} />
        )}

        <main style={styles.main}>
          <div style={styles.mainHeader}>
            <div>
              <h1 style={styles.mainTitle}>
                {role === 'manager'
                  ? 'MANAGER SCHEDULE'
                  : role === 'employee'
                    ? 'SELL TICKETS'
                    : "TODAY'S SHOWTIMES"}
              </h1>
              <p style={styles.mainSub}>
                {showtimes.length} showtime{showtimes.length !== 1 ? 's' : ''} · {auditoriumCount}{' '}
                auditorium{auditoriumCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {loadingInit ? (
            <div style={styles.loading}>Loading schedule…</div>
          ) : (
            <ScheduleView
              showtimes={showtimes}
              onRefresh={refreshSchedule}
              salesMode={role}
              canDelete={role === 'manager'}
            />
          )}
        </main>
      </div>
    </div>
  )
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },

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

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  logoIcon: {
    fontSize: 28,
  },

  logoTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    letterSpacing: '.12em',
    color: '#f5c518',
    lineHeight: 1,
  },

  logoSub: {
    fontSize: 11,
    color: '#7a7a7a',
    letterSpacing: '.04em',
    marginTop: 2,
  },

  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  btnOutline: {
    background: 'transparent',
    border: '1px solid #2a2a2a',
    color: '#e8e8e8',
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 6,
    cursor: 'pointer',
  },

  btnDanger: {
    background: 'transparent',
    border: '1px solid #3a1010',
    color: '#ff4f4f',
    padding: '6px 14px',
    fontSize: 13,
    borderRadius: 6,
    cursor: 'pointer',
  },

  accessPanel: {
    background: '#101010',
    borderBottom: '1px solid #1f1f1f',
    padding: '18px 24px',
    flexShrink: 0,
  },

  accessPanelInner: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))',
    gap: 16,
  },

  accessColumn: {
    background: '#151515',
    border: '1px solid #2a2a2a',
    borderRadius: 10,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  accessHeading: {
    fontSize: 14,
    fontWeight: 700,
    color: '#f5c518',
  },

  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },

  sidebar: {
    display: 'flex',
    flexDirection: 'column',
  },

  main: {
    flex: 1,
    padding: '24px 28px',
    overflowY: 'auto',
  },

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

  mainSub: {
    fontSize: 13,
    color: '#7a7a7a',
    marginTop: 6,
  },

  loading: {
    color: '#7a7a7a',
    padding: '40px 0',
    textAlign: 'center',
  },

  authButton: {
    width: '100%',
    padding: '10px 12px',
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
    borderRadius: 6,
    border: '1px solid #333',
    background: '#0f0f0f',
    color: '#fff',
  },
}