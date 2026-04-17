interface Props {
  found: number
  total: number
  score: number
  maxScore: number
  timeElapsed: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(1, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111' }}>
        {value}
      </div>
    </div>
  )
}

export function ScoreDisplay({ found, total, score, maxScore, timeElapsed }: Props) {
  return (
    <div style={{
      fontFamily: "'Courier New', monospace",
      display: 'flex',
      justifyContent: 'space-between',
      width: '240px',
      margin: '0 auto',
    }}>
      <Stat label="Sanat" value={`${found}/${total}`} />
      <Stat label="Pisteet" value={`${score}/${maxScore}`} />
      <Stat label="Aika" value={formatTime(timeElapsed)} />
    </div>
  )
}
