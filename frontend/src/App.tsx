import { useState } from 'react'
import { useGame } from './hooks/useGame'
import { Grid } from './components/Grid'
import { WordInput } from './components/WordInput'
import { FeedbackMessage } from './components/ErrorMessage'
import { ScoreDisplay } from './components/ScoreDisplay'
import { FoundWords } from './components/FoundWords'
import { Leaderboard } from './components/Leaderboard'

const GRID_WIDTH = 240

const btnBase: React.CSSProperties = {
  flex: 1,
  padding: '10px 0',
  fontFamily: "'Courier New', monospace",
  fontSize: '16px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
}

const btnGray: React.CSSProperties = { ...btnBase, background: '#eee', color: '#333' }
const btnBlack: React.CSSProperties = { ...btnBase, background: '#222', color: '#fff' }

export function App() {
  const { state, feedback, loading, tapLetter, setInput, submitWord, deleteLetter, mixLetters, giveUp, submitLeaderboard } = useGame()
  const [confirmGiveUp, setConfirmGiveUp] = useState(false)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)
  const [username, setUsername] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  if (loading || !state) {
    return <div style={{ textAlign: 'center', marginTop: '40px', fontFamily: 'monospace' }}>Ladataan...</div>
  }

  const handleGiveUp = () => {
    if (!confirmGiveUp) { setConfirmGiveUp(true); return }
    setConfirmGiveUp(false)
    giveUp()
  }

  const handleLeaderboardSubmit = async () => {
    if (!username.trim()) return
    await submitLeaderboard(username.trim())
    setSubmitted(true)
    setShowLeaderboardModal(false)
    setShowLeaderboard(true)
  }

  return (
    <div style={{
      width: `${GRID_WIDTH}px`,
      margin: '0 auto',
      padding: '20px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* Title */}
      <h1 style={{
        textAlign: 'center',
        fontFamily: "'Courier New', monospace",
        fontSize: '22px',
        fontWeight: 'bold',
        margin: 0,
        letterSpacing: '2px',
      }}>
        SANASORMI
      </h1>

      {/* Lopeta peli */}
      {!state.gameOver && (
        <button
          onClick={handleGiveUp}
          style={{
            width: '100%',
            padding: '8px',
            fontFamily: "'Courier New', monospace",
            fontSize: '14px',
            background: confirmGiveUp ? '#c00' : '#eee',
            color: confirmGiveUp ? '#fff' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {confirmGiveUp ? 'Oletko varma?' : 'Lopeta peli'}
        </button>
      )}

      {/* Score */}
      <ScoreDisplay
        found={state.foundWords.length}
        total={state.solutionCount}
        score={state.score}
        maxScore={state.maxScore}
        timeElapsed={state.timeElapsed}
      />

      {/* Input */}
      {!state.gameOver && (
        <WordInput
          value={state.currentInput}
          onChange={setInput}
          onSubmit={submitWord}
        />
      )}

      {/* Grid */}
      <Grid
        letters={state.letters}
        centerIndex={state.centerIndex}
        selectedIndices={state.selectedIndices}
        onTap={tapLetter}
      />

      {/* Action buttons under grid */}
      {!state.gameOver && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={btnGray} onClick={deleteLetter}>⌫</button>
          <button style={btnGray} onClick={mixLetters}>⇌</button>
          <button style={btnBlack} onClick={submitWord}>↵</button>
        </div>
      )}

      {/* Feedback message (reserved space) */}
      <FeedbackMessage feedback={feedback} />

      {/* Lähetä tulokset after game over */}
      {state.gameOver && !submitted && (
        <button
          onClick={() => setShowLeaderboardModal(true)}
          style={{ ...btnBlack, width: '100%' }}
        >
          Lähetä tulokset
        </button>
      )}

      <FoundWords words={state.foundWords} solutions={state.solutions} />

      {(showLeaderboard || submitted) && <Leaderboard />}

      {/* Leaderboard modal */}
      {showLeaderboardModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '24px',
            width: '260px', fontFamily: "'Courier New', monospace",
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            <h2 style={{ margin: 0, fontSize: '16px' }}>Lähetä tulokset</h2>
            <div style={{ fontSize: '14px', color: '#555' }}>
              Pisteet: {state.score} | Sanat: {state.foundWords.length}
            </div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLeaderboardSubmit()}
              placeholder="Nimimerkki"
              autoFocus
              style={{
                padding: '8px', fontSize: '16px',
                fontFamily: "'Courier New', monospace",
                border: '2px solid #ccc', borderRadius: '6px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowLeaderboardModal(false)}
                style={{ ...btnGray, flex: 1, padding: '8px' }}
              >
                Peruuta
              </button>
              <button
                onClick={handleLeaderboardSubmit}
                style={{ ...btnBlack, flex: 1, padding: '8px' }}
              >
                Lähetä
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
