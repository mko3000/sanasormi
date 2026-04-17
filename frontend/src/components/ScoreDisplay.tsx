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

export function ScoreDisplay({ found, total, score, maxScore, timeElapsed }: Props) {
  return (
    <div style={{
      fontFamily: "'Courier New', monospace",
      fontSize: '14px',
      color: '#444',
      display: 'flex',
      justifyContent: 'space-between',
      width: '240px',
      margin: '0 auto',
    }}>
      <span>{found}/{total} sanaa</span>
      <span>Pisteet: {score}/{maxScore}</span>
      <span>{formatTime(timeElapsed)}</span>
    </div>
  )
}
