import { useEffect, useState } from 'react'

export default function ConcessionsPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    is_active: true,
  })

  async function refresh() {
    setLoading(true)
    const res = await fetch('http://localhost:8000/api/concessions')
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleAddConcession(e) {
    e.preventDefault()
    setAdding(true)

    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: parseFloat(form.price),
        is_active: form.is_active,
      }

      if (!payload.name || !payload.category || isNaN(payload.price) || payload.price < 0) {
        alert('Please enter a valid name, category, and price')
        setAdding(false)
        return
      }

      await fetch('http://localhost:8000/api/concessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      setForm({ name: '', category: '', price: '', is_active: true })
      await refresh()
    } catch (e) {
      alert('Add concession failed: ' + e.message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div style={styles.panel}>
      <h2 style={styles.panelTitle}>Concessions</h2>

      <form onSubmit={handleAddConcession} style={styles.addForm}>
        <input
          style={styles.input}
          placeholder="Item name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
        />

        <input
          style={styles.input}
          placeholder="Category"
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          required
        />

        <input
          style={styles.input}
          placeholder="Price"
          type="number"
          step="0.01"
          min="0"
          value={form.price}
          onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
          required
        />

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
          />
          Active item
        </label>

        <button type="submit" style={styles.addBtn} disabled={adding}>
          {adding ? 'Adding…' : 'Add Concession'}
        </button>
      </form>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map(item => (
            <li key={item.id} style={styles.itemRow}>
              <div>
                <span style={styles.itemTitle}>{item.name}</span>
                <div style={styles.itemMeta}>
                  {item.category} • ${Number(item.price).toFixed(2)} • {item.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <li style={{ color: '#888', fontSize: 13 }}>No concessions yet.</li>
          )}
        </ul>
      )}
    </div>
  )
}

const styles = {
  panel: {
    background: '#0f0f0f',
    borderRight: '1px solid #1f1f1f',
    padding: '24px 20px',
    width: 300,
    flexShrink: 0,
    overflowY: 'auto',
    marginBottom: 24,
  },
  panelTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    letterSpacing: '.08em',
    marginBottom: 16,
    color: '#f5c518',
  },
  addForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 18,
  },
  input: {
    fontSize: 14,
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid #222',
    background: '#181818',
    color: '#fff',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#ddd',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  addBtn: {
    background: '#f5c518',
    color: '#222',
    border: 'none',
    borderRadius: 4,
    padding: '7px 0',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    marginTop: 2,
  },
  itemRow: {
    borderBottom: '1px solid #222',
    paddingBottom: 8,
    marginBottom: 8,
  },
  itemTitle: {
    fontWeight: 600,
    fontSize: 15,
  },
  itemMeta: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 3,
  },
}