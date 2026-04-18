import { useState, useEffect, useCallback, useRef } from 'react'
import { GameState, PuzzleResponse, ValidateResponse } from '../types'

const INITIAL_STATE: Omit<GameState, 'date' | 'letters' | 'center' | 'centerIndex' | 'solutionCount' | 'maxScore'> = {
  solutions: null,
  currentInput: '',
  selectedIndices: [],
  foundWords: [],
  score: 0,
  timeElapsed: 0,
  gameOver: false,
}

export type FeedbackMsg = { text: string; key: number; type: 'error' | 'success' }

const PRAISE: Record<number, string> = { 1: 'jep', 2: 'Se', 4: 'Hyvä!', 6: 'Kyllä se vaan', 9: 'Voi juma!', 12: 'EBIN', 18: 'Legendaarista!!!' }

type SavedProgress = {
  date: string
  foundWords: string[]
  score: number
  timeElapsed: number
  gameOver: boolean
  solutions: string[] | null
}

function loadProgress(date: string): Partial<SavedProgress> {
  try {
    const raw = localStorage.getItem(`sanasormi_${date}`)
    if (!raw) return {}
    const saved: SavedProgress = JSON.parse(raw)
    if (saved.date !== date) return {}
    return saved
  } catch {
    return {}
  }
}

function saveProgress(state: GameState) {
  const saved: SavedProgress = {
    date: state.date,
    foundWords: state.foundWords,
    score: state.score,
    timeElapsed: state.timeElapsed,
    gameOver: state.gameOver,
    solutions: state.solutions,
  }
  localStorage.setItem(`sanasormi_${state.date}`, JSON.stringify(saved))
}

export function useGame() {
  const [state, setState] = useState<GameState | null>(null)
  const [feedback, setFeedback] = useState<FeedbackMsg | null>(null)
  const [loading, setLoading] = useState(true)
  const errorKeyRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/puzzle/today')
      .then((r) => r.json())
      .then((data: PuzzleResponse) => {
        const saved = loadProgress(data.date)
        setState({
          ...INITIAL_STATE,
          date: data.date,
          letters: data.letters,
          center: data.center,
          centerIndex: data.center_index,
          solutionCount: data.solution_count,
          maxScore: data.max_score,
          foundWords: saved.foundWords ?? [],
          score: saved.score ?? 0,
          timeElapsed: saved.timeElapsed ?? 0,
          gameOver: saved.gameOver ?? false,
          solutions: saved.solutions ?? null,
        })
        setLoading(false)
      })
  }, [])

  // Persist state changes to localStorage
  useEffect(() => {
    if (state) saveProgress(state)
  }, [state?.foundWords, state?.score, state?.timeElapsed, state?.gameOver, state?.solutions])

  // Timer
  useEffect(() => {
    if (!state || state.gameOver) return
    timerRef.current = setInterval(() => {
      setState((s) => s ? { ...s, timeElapsed: s.timeElapsed + 1 } : s)
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state?.gameOver, state === null])

  const showFeedback = useCallback((text: string, type: 'error' | 'success') => {
    errorKeyRef.current += 1
    setFeedback({ text, key: errorKeyRef.current, type })
    setTimeout(() => setFeedback(null), 2000)
  }, [])

  const tapLetter = useCallback((index: number) => {
    setState((s) => {
      if (!s || s.selectedIndices.includes(index)) return s
      return {
        ...s,
        currentInput: s.currentInput + s.letters[index],
        selectedIndices: [...s.selectedIndices, index],
      }
    })
  }, [])

  const clearInput = useCallback(() => {
    setState((s) => s ? { ...s, currentInput: '', selectedIndices: [] } : s)
  }, [])

  const deleteLetter = useCallback(() => {
    setState((s) => {
      if (!s || s.currentInput.length === 0) return s
      return {
        ...s,
        currentInput: s.currentInput.slice(0, -1),
        selectedIndices: s.selectedIndices.slice(0, -1),
      }
    })
  }, [])

  const mixLetters = useCallback(() => {
    setState((s) => {
      if (!s) return s
      const letters = [...s.letters]
      const centerIndex = s.centerIndex
      const indices = letters.map((_, i) => i).filter((i) => i !== centerIndex)
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[letters[indices[i]], letters[indices[j]]] = [letters[indices[j]], letters[indices[i]]]
      }
      return { ...s, letters, currentInput: '', selectedIndices: [] }
    })
  }, [])

  const submitWord = useCallback(async () => {
    if (!state) return
    const word = state.currentInput.trim().toLowerCase()
    if (word.length < 3) return

    if (state.foundWords.includes(word)) {
      showFeedback('Sana on jo syötetty', 'error')
      clearInput()
      return
    }

    const res = await fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, date: state.date }),
    })
    const data: ValidateResponse = await res.json()

    if (data.valid && data.points !== undefined) {
      const praise = PRAISE[data.points] ?? 'Hyvä!'
      showFeedback(`${praise} +${data.points}p`, 'success')
      setState((s) => {
        if (!s) return s
        return {
          ...s,
          foundWords: [...s.foundWords, word].sort(),
          score: s.score + data.points!,
          currentInput: '',
          selectedIndices: [],
        }
      })
    } else {
      if (data.reason === 'no_center') {
        showFeedback('Käytä keskellä olevaa kirjainta', 'error')
      } else {
        showFeedback('Ei kelpaa', 'error')
      }
      clearInput()
    }
  }, [state, showFeedback, clearInput])

  const giveUp = useCallback(async () => {
    const res = await fetch('/api/solutions/today')
    const data: { words: string[] } = await res.json()
    setState((s) => s ? { ...s, solutions: data.words, gameOver: true } : s)
  }, [])

  const submitLeaderboard = useCallback(async (username: string) => {
    if (!state) return
    await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: state.date,
        username,
        score: state.score,
        word_count: state.foundWords.length,
        found_words: state.foundWords,
      }),
    })
  }, [state])

  return { state, feedback, loading, tapLetter, submitWord, clearInput, deleteLetter, mixLetters, giveUp, submitLeaderboard }
}
