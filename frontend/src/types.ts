export interface GameState {
  date: string
  letters: string[]
  center: string
  centerIndex: number
  solutionCount: number
  maxScore: number
  solutions: string[] | null
  currentInput: string
  selectedIndices: number[]
  foundWords: string[]
  score: number
  timeElapsed: number
  gameOver: boolean
}

export interface PuzzleResponse {
  date: string
  letters: string[]
  center: string
  center_index: number
  solution_count: number
  max_score: number
}

export interface ValidateResponse {
  valid: boolean
  points?: number
  reason?: string
}
