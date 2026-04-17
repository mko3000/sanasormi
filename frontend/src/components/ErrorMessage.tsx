import { useEffect, useState } from 'react'
import { FeedbackMsg } from '../hooks/useGame'

interface Props {
  feedback: FeedbackMsg | null
}

export function FeedbackMessage({ feedback }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (feedback) {
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 1800)
      return () => clearTimeout(t)
    }
  }, [feedback?.key])

  return (
    <div style={{
      minHeight: '24px',
      fontFamily: "'Courier New', monospace",
      fontSize: '15px',
      fontWeight: feedback?.type === 'success' ? 'bold' : 'normal',
      textAlign: 'center',
      color: !feedback || !visible
        ? 'transparent'
        : feedback.type === 'success' ? '#2e7d32' : '#c00',
      transition: 'color 0.3s',
    }}>
      {feedback?.text ?? ''}
    </div>
  )
}
