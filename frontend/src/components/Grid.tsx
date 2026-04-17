interface Props {
  letters: string[]
  centerIndex: number
  selectedIndices: number[]
  onTap: (index: number) => void
}

export function Grid({ letters, centerIndex, selectedIndices, onTap }: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
      width: '240px',
      margin: '0 auto',
    }}>
      {letters.map((letter, i) => {
        const isCenter = i === centerIndex
        const isSelected = selectedIndices.includes(i)

        let bg = '#f5f5f5'
        let color = '#111'
        if (isCenter) {
          bg = isSelected ? '#2e7d32' : '#222'
          color = '#fff'
        } else if (isSelected) {
          color = '#e00'
        }

        return (
          <button
            key={i}
            onClick={() => onTap(i)}
            disabled={isSelected}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: isCenter ? '50%' : '8px',
              background: bg,
              color,
              fontSize: '28px',
              fontFamily: "'Courier New', monospace",
              fontWeight: 'bold',
              border: 'none',
              cursor: isSelected ? 'default' : 'pointer',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {letter.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
