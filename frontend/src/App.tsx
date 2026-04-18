import { useState, useRef, useEffect } from 'react'
import { useGame } from './hooks/useGame'
import { Grid } from './components/Grid'
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
    const { state, feedback, loading, tapLetter, submitWord, deleteLetter, mixLetters, giveUp, submitLeaderboard } = useGame()
    const [confirmGiveUp, setConfirmGiveUp] = useState(false)
    const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)
    const [username, setUsername] = useState('')
    const todayKey = state ? `sanasormi_submitted_${state.date}` : null
    const [submitted, setSubmitted] = useState(() =>
      todayKey ? localStorage.getItem(todayKey) === 'true' : false
    )
    const [showLeaderboard, setShowLeaderboard] = useState(() =>
      todayKey ? localStorage.getItem(todayKey) === 'true' : false
    )
    const [showRules, setShowRules] = useState(false)
    const rulesRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!showRules) return
        const handler = (e: MouseEvent) => {
            if (rulesRef.current && !rulesRef.current.contains(e.target as Node)) {
                setShowRules(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showRules])

    useEffect(() => {
        if (!confirmGiveUp) return
        const handler = (e: MouseEvent) => {
            const btn = document.getElementById('give-up-btn')
            if (btn && !btn.contains(e.target as Node)) {
                setConfirmGiveUp(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [confirmGiveUp])

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
        if (todayKey) localStorage.setItem(todayKey, 'true')
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
            gap: '10px',
        }}>
            {/* Title */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h1 style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: '22px',
                    fontWeight: 'bold',
                    margin: 0,
                    letterSpacing: '2px',
                }}>
                    SANASORMI
                </h1>
                <button
                    onClick={() => setShowRules(!showRules)}
                    style={{
                        position: 'absolute', right: 0,
                        width: '22px', height: '22px',
                        borderRadius: '50%',
                        background: '#eee', color: '#666',
                        border: 'none', cursor: 'pointer',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '13px', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0,
                    }}
                >
                    ?
                </button>
                {showRules && (
                    <div ref={rulesRef} style={{
                        position: 'absolute', top: '30px', right: 0, zIndex: 20,
                        background: '#fff', border: '1px solid #ddd', borderRadius: '8px',
                        padding: '14px', width: '220px',
                        fontFamily: "'Courier New', monospace", fontSize: '12px',
                        lineHeight: '1.6', color: '#333',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}>
                        <strong>Säännöt</strong>
                        <ul style={{ margin: '8px 0 0', paddingLeft: '16px' }}>
                            <li>Muodosta sanoja ruudukon kirjaimista</li>
                            <li>Jokainen sana pitää sisältää <strong>keskimmäisen kirjaimen</strong></li>
                            <li>Kutakin kirjainta voi käyttää vain kerran per sana</li>
                            <li>Vähintään 3 kirjainta</li>
                            <li>Vain perusmuodot hyväksytään</li>
                            <li>Uudet kirjaimet joka päivä</li>
                        </ul>
                        <div style={{ marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                            3p=1 · 4p=2 · 5p=4 · 6p=6 · 7p=9 · 8p=12 · 9p=18
                        </div>
                    </div>
                )}
            </div>

            {/* Lopeta peli */}
            {!state.gameOver && (
                <button
                    id="give-up-btn"
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
                    {confirmGiveUp ? 'Oletko varma?' : 'Lopeta ja näytä ratkaisu'}
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

            {/* Current word display */}
            {!state.gameOver && (
                <div style={{
                    width: '100%',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '24px',
                    fontWeight: 'bold',
                    letterSpacing: '4px',
                    textTransform: 'uppercase',
                    color: '#111',
                    borderBottom: '2px solid #ddd',
                }}>
                    {state.currentInput || ''}
                </div>
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
