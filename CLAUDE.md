# Sanajahti – Project Instructions for Claude Code

## Project Overview

Build a Finnish word game called **Sanajahti** (word hunt), inspired by the Suomen Kuvalehti mobile game. The player is given a 3×3 grid of 9 letters and must find as many valid Finnish words as possible.

---

## Game Rules

- The grid contains 9 letters in a 3×3 layout.
- The **center letter (index 4) is mandatory** — every accepted word must contain it.
- Players can use **any subset of the 9 letters**, but **each individual grid cell can only be used once per word**. If the same letter appears twice in the grid (e.g. two A's), each occurrence is a separate cell and can be used independently. A cell that has already been selected cannot be selected again for the same word.
- Minimum word length: **3 letters**. Maximum: **9 letters**.
- There is no adjacency constraint — letters can be combined freely.
- Only **base forms** (perusmuoto) of Finnish words are accepted — no inflections.
- The puzzle always contains a **9-letter word** that uses all 9 grid letters exactly once. This is the "pangram" of the puzzle — it is always solvable.

## Scoring

Points are awarded per word based on length:

| Length | Points |
|--------|--------|
| 3      | 1      |
| 4      | 2      |
| 5      | 4      |
| 6      | 6      |
| 7      | 9      |
| 8      | 12     |
| 9      | 18     |

The **maximum possible score** for a puzzle is the sum of points for all valid words. Display this to the player.

If a player submits a word they have already found, show an error and award **no points**.

---

## Tech Stack

- **Backend:** Python + FastAPI
- **Database:** SQLite (via SQLAlchemy) — for daily puzzles and leaderboard
- **Frontend:** React (TypeScript)
- **Hosting:** Raspberry Pi home server ("kotipi"), served via Nginx + Cloudflare Tunnel
- **Deployment:** GitHub Actions CI/CD (same pattern as existing projects on kotipi)

---

## Word List

The game uses two word list files:

1. `backend/wordlist/kotus.txt` — base word list from Kotus (Institute for the Languages of Finland). **Gitignored**, downloaded via setup script.
2. `backend/wordlist/custom_words.txt` — manually curated additions. **Committed to repo**. Start as an empty file with a comment header.

At startup, the backend loads both files, merges them into a single set, and keeps only words that:
- Are between 3 and 9 characters long
- Consist only of standard Finnish letters: `[a-zäö]`

### Downloading the Kotus word list

`scripts/download_wordlist.sh`:

```bash
#!/bin/bash
curl -L https://raw.githubusercontent.com/hugovk/everyfinnishword/master/kaikkisanat.txt \
  -o backend/wordlist/kotus.txt
```

### Word list loading

```python
from collections import Counter
import re

def load_words(min_len=3, max_len=9):
    words = set()
    for path in ["wordlist/kotus.txt", "wordlist/custom_words.txt"]:
        try:
            with open(path, encoding="utf-8") as f:
                for line in f:
                    word = line.strip().lower()
                    if min_len <= len(word) <= max_len:
                        if re.fullmatch(r"[a-zäö]+", word):
                            words.add(word)
        except FileNotFoundError:
            pass
    return words
```

---

## Puzzle Generation

### Key constraint: the puzzle must contain a 9-letter pangram word

1. Filter the word list for all **9-letter words**.
2. Pick one at random as the "base word" — its 9 letters become the grid letters.
3. Shuffle the 9 letters randomly. Choose the center letter (index 4) to be a **vowel or common consonant** (not q, x, z, w) — prefer letters that appear in many of the valid words for this puzzle.
4. Run the solver to find all valid words.
5. If solution count is outside 15–80, pick a different base word and retry.
6. The base word itself is always in the solution list.

### Solver

```python
def find_solutions(letters: str, center: str, wordlist: set) -> list[str]:
    letters_lower = letters.lower()
    center_lower = center.lower()
    available = Counter(letters_lower)
    results = []
    for word in wordlist:
        if center_lower not in word:
            continue
        if Counter(word) <= available:
            results.append(word)
    return sorted(results)
```

---

## Daily Puzzle

- One puzzle per calendar day (Finnish time, `Europe/Helsinki`).
- The daily puzzle is **pre-generated and stored in SQLite** on first request of the day.
- All players on the same day see the same puzzle.
- The puzzle date string (ISO, e.g. `"2025-04-17"`) is the primary key.

### SQLite schema

```sql
CREATE TABLE daily_puzzle (
    date TEXT PRIMARY KEY,
    letters TEXT NOT NULL,      -- 9 chars, e.g. "ORTAMASET"
    center TEXT NOT NULL,       -- 1 char, e.g. "M"
    solutions TEXT NOT NULL,    -- JSON array of all valid words
    max_score INTEGER NOT NULL
);

CREATE TABLE leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    word_count INTEGER NOT NULL,
    found_words TEXT NOT NULL,  -- JSON array
    submitted_at TEXT NOT NULL  -- ISO datetime
);
```

---

## Backend API (FastAPI)

### `GET /api/puzzle/today`
Returns today's puzzle. Generates and stores it if it doesn't exist yet.

```json
{
  "date": "2025-04-17",
  "letters": ["O","R","T","A","M","A","S","E","T"],
  "center": "M",
  "center_index": 4,
  "solution_count": 45,
  "max_score": 120
}
```

### `POST /api/validate`
Validates a word against today's puzzle.

Request body:
```json
{ "word": "metro", "date": "2025-04-17" }
```

Success response:
```json
{ "valid": true, "points": 4 }
```

Failure response:
```json
{ "valid": false, "reason": "no_center" }
```

Reason codes:
- `"no_center"` — word does not contain the center letter
- `"not_in_list"` — word not in word list or uses unavailable letters

The `"already_found"` check is handled **client-side only**.

### `GET /api/solutions/today`
Returns all valid words for today's puzzle (called when player gives up).

```json
{ "words": ["armas", "armo", "asema", ...] }
```

### `POST /api/leaderboard`
Submit score to today's leaderboard.

```json
{
  "date": "2025-04-17",
  "username": "Miko",
  "score": 42,
  "word_count": 11,
  "found_words": ["armas", "metro", "matta"]
}
```

Response: `{ "ok": true }`

### `GET /api/leaderboard/today`
Returns today's leaderboard sorted by score descending.

```json
{
  "date": "2025-04-17",
  "entries": [
    { "rank": 1, "username": "Miko", "score": 42, "word_count": 11, "submitted_at": "..." }
  ]
}
```

---

## Frontend (React + TypeScript)

### UI Design

**Grid:**
- 3×3 layout with **no grid lines or borders** between cells.
- Font: **monospace** for all letters (e.g. `font-family: 'Courier New', monospace`).
- Regular letters: large, plain dark text on white/light background.
- Center letter: displayed inside a **dark filled circle**, with **white text** — matches the reference screenshot.
- When a letter has been tapped/selected into the current input word, it turns **red**.

**Input area:**
- Text input field at the top for typing words directly.
- Tapping a grid letter appends it to the input and marks it red.
- A selected (red) cell **cannot be tapped again** — it is disabled until the word is submitted or cleared. This prevents using the same grid cell twice in one word.
- Submit with the ↵ button or pressing Enter.

**Error messages** (shown briefly below input, fade out after ~2 seconds):
- `"Käytä keskellä olevaa kirjainta"` — word does not contain center letter
- `"Ei kelpaa"` — word not in list or uses wrong letters
- `"Sana on jo syötetty"` — already found (no points)

**Progress & scoring:**
- `X/Y sanaa löydetty` — words found vs total available.
- `Pisteet: N / Maksimi: M` — live score and max possible score.

**Found words list:**
- All found words, sorted alphabetically.
- Each entry shows the word and its points: `metro (4p)`.

**Buttons:**
- `Luovuta` — asks for confirmation, then reveals all solutions via `/api/solutions/today`.
- `Lähetä tulokset` — opens a modal to enter a username and submit to leaderboard.

**Leaderboard:**
- Shown below the game or in a modal.
- Fetched from `GET /api/leaderboard/today`.
- Shows rank, username, score, word count.

**Timer:** counts up from 0:00, stops when player gives up or submits results.

**Mobile-first** — compact vertical layout, works well on a phone screen.

### Game State (TypeScript)

```typescript
interface GameState {
  date: string;
  letters: string[];         // 9 letters
  center: string;            // center letter
  centerIndex: number;       // always 4
  solutionCount: number;
  maxScore: number;
  solutions: string[] | null; // null until revealed
  currentInput: string;
  selectedIndices: number[]; // grid positions currently selected
  foundWords: string[];      // words found this session
  score: number;
  timeElapsed: number;
  gameOver: boolean;
}
```

---

## Project Structure

```
sanajahti/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── puzzle.py
│   ├── requirements.txt        # fastapi, uvicorn, sqlalchemy
│   └── wordlist/
│       ├── .gitkeep
│       ├── kotus.txt           # gitignored, downloaded via script
│       └── custom_words.txt    # committed, initially empty
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Grid.tsx
│   │   │   ├── WordInput.tsx
│   │   │   ├── FoundWords.tsx
│   │   │   ├── ScoreDisplay.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── hooks/
│   │   │   └── useGame.ts
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   └── download_wordlist.sh
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## Docker & Deployment

`docker-compose.yml`:
- `backend`: FastAPI via uvicorn on port 8000. Mount `./backend/wordlist` as a volume and `./data` for SQLite persistence.
- `frontend`: Vite production build served by Nginx on port 3000.

GitHub Actions `.github/workflows/deploy.yml`:
1. SSH into kotipi via Tailscale OAuth
2. Pull latest code
3. `docker-compose up -d --build`

Same pattern as viken-tracker.

---

## .gitignore

```
backend/wordlist/kotus.txt
data/
```

---

## Build Order

### Phase 1 – MVP
1. Word list loading
2. Puzzle generation with pangram constraint
3. Solver
4. `/api/puzzle/today` and `/api/validate` endpoints
5. Basic React UI: grid (no lines, monospace font, dark center circle, red selected letters), input field, error messages, found words list
6. Docker setup

### Phase 2 – Full features
7. SQLite daily puzzle persistence
8. Scoring system (points per word length, live score, max score display)
9. `/api/solutions/today` + Luovuta button with confirmation dialog
10. `POST /api/leaderboard` + `GET /api/leaderboard/today`
11. Leaderboard UI + username submit modal
12. Timer
13. GitHub Actions deploy workflow

---

## README

Include:
- Game description and rules
- How to run locally (`docker-compose up`)
- How to download the word list (`scripts/download_wordlist.sh`)
- How to add custom words (`custom_words.txt`)
- Nginx config snippet for `sanajahti.kuggo.org`
- License: MIT
