import { useEffect, useState } from 'react'

interface Entry {
  rank: number
  username: string
  score: number
  word_count: number
  submitted_at: string
}

export function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([])

  useEffect(() => {
    fetch('/api/leaderboard/today')
      .then((r) => r.json())
      .then((d) => setEntries(d.entries))
  }, [])

  if (entries.length === 0) return null

  return (
    <div style={{ width: '240px', margin: '0 auto', fontFamily: "'Courier New', monospace" }}>
      <h3 style={{ fontSize: '14px', color: '#444', marginBottom: '8px' }}>Tulostaulukko</h3>
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
