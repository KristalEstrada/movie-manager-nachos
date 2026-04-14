//checkoutmodal with confirm code from .json file
import { useMemo } from 'react'

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

export default function CheckoutModal({
  showtime,
  qty,
  onClose,
  onConfirm,
  loading = false,
  confirmationCode = '',
  errorMessage = '',
}) {
  const ticketLabel = useMemo(() => {
    return `${qty} ticket${qty !== 1 ? 's' : ''}`
  }, [qty])

  const purchaseComplete = Boolean(confirmationCode)

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {purchaseComplete ? 'Purchase Confirmed' : 'Checkout'}
          </h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.summary}>
          <div style={styles.movieTitle}><strong>{showtime.movie.title}</strong></div>
          <div>{fmtDate(showtime.start_time)} · {fmtTime(showtime.start_time)}</div>
          <div>{showtime.auditorium}</div>
          <div>{ticketLabel}</div>
        </div>

        {!purchaseComplete ? (
          <>
            <p style={styles.note}>
              Confirm this order to receive the same confirmation code that is saved in the backend sales log.
            </p>

            {errorMessage ? (
              <div style={styles.errorBox}>{errorMessage}</div>
            ) : null}

            <button onClick={onConfirm} disabled={loading} style={styles.confirmBtn}>
              {loading ? 'Processing…' : 'Confirm purchase'}
            </button>
          </>
        ) : (
          <>
            <div style={styles.successBox}>
              <div style={styles.successLabel}>Confirmation Code</div>
              <div style={styles.codeBox}>{confirmationCode}</div>
              <div style={styles.codeSubtext}>
                This matches the code saved in <code>backend/sales.json</code>.
              </div>
            </div>

            <button onClick={onClose} style={styles.confirmBtn}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    width: 420,
    maxWidth: '94vw',
    background: '#161616',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: 24,
    color: '#fff',
    boxShadow: '0 18px 40px rgba(0,0,0,.45)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: '#f5c518',
    margin: 0,
  },
  closeBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#aaa',
    borderRadius: 6,
    padding: '4px 8px',
    cursor: 'pointer',
  },
  summary: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 18,
    color: '#d8d8d8',
  },
  movieTitle: {
    fontSize: 18,
    color: '#fff',
  },
  note: {
    fontSize: 13,
    color: '#b8b8b8',
    lineHeight: 1.5,
    marginBottom: 16,
  },
  successBox: {
    background: '#0f0f0f',
    border: '1px solid #2a2a2a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  successLabel: {
    fontSize: 12,
    color: '#9a9a9a',
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  codeBox: {
    fontFamily: 'monospace',
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: '.18em',
    color: '#f5c518',
    background: '#000',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '14px 10px',
    marginBottom: 10,
  },
  codeSubtext: {
    fontSize: 12,
    color: '#9a9a9a',
  },
  errorBox: {
    background: '#2a1111',
    border: '1px solid #5a2222',
    color: '#ffb3b3',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 14,
    fontSize: 13,
  },
  confirmBtn: {
    width: '100%',
    background: '#f5c518',
    color: '#000',
    border: 'none',
    borderRadius: 8,
    padding: '10px 12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
}
