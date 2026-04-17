import { useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
}

export function WordInput({ value, onChange, onSubmit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
      placeholder="Kirjoita sana..."
      style={{
        width: '240px',
        boxSizing: 'border-box',
        margin: '0 auto',
        display: 'block',
        padding: '10px 12px',
        fontSize: '20px',
        fontFamily: "'Courier New', monospace",
        border: '2px solid #ccc',
        borderRadius: '6px',
        outline: 'none',
        textTransform: 'lowercase',
      }}
    />
  )
}
