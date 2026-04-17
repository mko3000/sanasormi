const SCORE_TABLE: Record<number, number> = { 3: 1, 4: 2, 5: 4, 6: 6, 7: 9, 8: 12, 9: 18 }

interface Props {
  words: string[]
  solutions: string[] | null
}

export function FoundWords({ words, solutions }: Props) {
  const allWords = solutions ?? words

  return (
    <div style={{
      width: '240px',
      margin: '0 auto',
      fontFamily: "'Courier New', monospace",
    }}>
      {solutions && (
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>
          Kaikki sanat:
        </div>
      )}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
      }}>
        {allWords.map((w) => {
          const found = words.includes(w)
          const pts = SCORE_TABLE[w.length] ?? 0
          return (
            <span
              key={w}
              style={{
                fontSize: '13px',
                color: found ? '#111' : solutions ? '#bbb' : '#111',
                background: found ? '#e8f5e9' : 'transparent',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {w} <span style={{ color: '#888' }}>({pts}p)</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
