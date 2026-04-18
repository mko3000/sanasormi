import { useEffect, useState, useCallback } from 'react'

interface Entry {
  rank: number
  username: string
  score: number
  word_count: number
  submitted_at: string
}

export function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchEntries = useCallback(() => {
    setRefreshing(true)
    fetch('/api/leaderboard/today')
      .then((r) => r.json())
      .then((d) => { setEntries(d.entries); setRefreshing(false) })
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  if (entries.length === 0) return null

  return (
    <div style={{ fontFamily: "'Courier New', monospace" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '14px', color: '#444', margin: 0 }}>Tulostaulukko</h3>
        <button
          onClick={fetchEntries}
          title="Päivitä"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', color: '#888', padding: '0 2px',
            display: 'flex', alignItems: 'center',
            transform: refreshing ? 'rotate(360deg)' : 'none',
            transition: refreshing ? 'transform 0.5s linear' : 'none',
          }}
        >
          ↻
        </button>
      </div>
      <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: '#888' }}>
            <th style={{ textAlign: 'left' }}>#</th>
            <th style={{ textAlign: 'left' }}>Nimi</th>
            <th style={{ textAlign: 'right' }}>Pisteet</th>
            <th style={{ textAlign: 'right' }}>Sanat</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.rank}>
              <td>{e.rank}</td>
              <td>{e.username}</td>
              <td style={{ textAlign: 'right' }}>{e.score}</td>
              <td style={{ textAlign: 'right' }}>{e.word_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
