# Sanasormi – Project Instructions for Claude Code

## Project Overview

**Sanasormi** is a Finnish daily word game, live at **sanasormi.kuggo.org**. The player is given a 3×3 grid of 9 letters and must find as many valid Finnish words as possible.

---

## Game Rules

- The grid contains 9 letters in a 3×3 layout.
- The **center letter (index 4) is mandatory** — every accepted word must contain it.
- Each grid cell can only be used once per word. No adjacency constraint.
- Minimum word length: **3 letters**. Maximum: **9 letters**.
- Only **base forms** (perusmuoto) of Finnish words are accepted — no inflections.
- Every puzzle contains a **9-letter pangram word** using all 9 grid letters.
- Puzzle word count is capped at **15–50 words**.

## Scoring

| Length | Points |
|--------|--------|
| 3      | 1      |
| 4      | 2      |
| 5      | 4      |
| 6      | 6      |
| 7      | 9      |
| 8      | 12     |
| 9      | 18     |

Praise messages shown on correct word: 1→"jep", 2→"Se", 4→"Hyvä!", 6→"Kyllä se vaan", 9→"Voi juma!", 12→"EBIN", 18→"Legendaarista!!!"

---

## Tech Stack

- **Backend:** Python + FastAPI + SQLAlchemy + SQLite
- **Frontend:** React (TypeScript) + Vite
- **Hosting:** Raspberry Pi ("kotipi") — nginx serves static frontend, Docker runs backend
- **URL:** sanasormi.kuggo.org (Cloudflare Tunnel)
- **Deployment:** GitHub Actions CI/CD

---

## Word List

1. `backend/wordlist/kotus.txt` — Kotus base list. **Gitignored**, download via `./scripts/download_wordlist.sh`.
2. `backend/wordlist/custom_words.txt` — custom additions, committed. Includes Finnish curse words, "hali", "sormettaa".

Words must be 3–9 chars, match `[a-zäö]+`.

---

## Architecture

**Backend only in Docker** (port 8000). Frontend is built by CI and served as static files from `/var/www/html/sanasormi/` by kotipi's nginx.

Nginx config (`sanasormi.nginx`):
```nginx
server {
    listen 8080;
    server_name sanasormi.kuggo.org;
    root /var/www/html/sanasormi;
    index index.html;
    location /api/ { proxy_pass http://localhost:8000; }
    location / { try_files $uri $uri/ /index.html; }
}
```

---

## Local Development

```bash
# Download word list (first time)
./scripts/download_wordlist.sh

# Backend
cd backend && mkdir -p data && uvicorn main:app --reload

# Frontend (separate terminal)
cd frontend && npm run dev
# → http://localhost:5173 (proxies /api to port 8000)
```

---

## Deployment

**GitHub Actions** (`.github/workflows/deploy.yml`):
- **Frontend changes** → build on CI, rsync `dist/` to kotipi at `/var/www/html/sanasormi/`
- **Backend changes** → SSH to kotipi, `git pull && docker-compose up -d --build`

**kotipi details:**
- SSH: `kotipi@100.74.124.45` (Tailscale)
- Project: `/home/kotipi/projects/sanasormi`
- DB: `data/sanajahti.db` (Docker volume)
- Cloudflare tunnel config: `/etc/cloudflared/config.yml`

**Required GitHub secrets:** `TAILSCALE_OAUTH_CLIENT_ID`, `TAILSCALE_OAUTH_CLIENT_SECRET`, `SSH_PRIVATE_KEY`

---

## Database Schema

```sql
CREATE TABLE daily_puzzle (
    date TEXT PRIMARY KEY,      -- "2026-04-18"
    letters TEXT NOT NULL,      -- JSON array of 9 chars
    center TEXT NOT NULL,       -- single char
    solutions TEXT NOT NULL,    -- JSON array
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

## Frontend State

Game state persisted to `localStorage` under key `sanasormi_YYYY-MM-DD`:
- `foundWords`, `score`, `timeElapsed`, `gameOver`, `solutions`
- Leaderboard submission: `sanasormi_submitted_YYYY-MM-DD`

```typescript
interface GameState {
  date: string;
  letters: string[];
  center: string;
  centerIndex: number;       // always 4
  solutionCount: number;
  maxScore: number;
  solutions: string[] | null;
  currentInput: string;
  selectedIndices: number[];
  foundWords: string[];
  score: number;
  timeElapsed: number;
  gameOver: boolean;
}
```

---

## UI Notes

- All player-facing copy is in **Finnish**
- No text input — letters entered by tapping grid cells only
- Center letter: dark circle, turns **green** when selected
- Other letters: turn **red** when selected
- Three action buttons under grid: ⌫ (delete last), ⇌ (mix non-center), ↵ (submit) — enter is black, others gray
- "Lopeta ja näytä ratkaisu" button — turns red on first click, resets if clicking outside, confirms on second click
- Stats display: label on top, bold value below (SANAT / PISTEET / AIKA)
- Feedback area reserved below buttons — green for success, red for errors
- `?` button next to title shows Finnish rules tooltip

---

## Project Structure

```
sanasormi/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── puzzle.py
│   ├── requirements.txt
│   └── wordlist/
│       ├── kotus.txt           # gitignored
│       └── custom_words.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Grid.tsx
│   │   │   ├── FoundWords.tsx
│   │   │   ├── ScoreDisplay.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── ErrorMessage.tsx  (exports FeedbackMessage)
│   │   ├── hooks/
│   │   │   └── useGame.ts
│   │   └── types.ts
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── apple-touch-icon.png
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── manifest.json
│   ├── nginx.conf              # unused in production
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   └── download_wordlist.sh
├── sanasormi.nginx             # nginx config for kotipi
├── docker-compose.yml          # backend only
├── .github/workflows/deploy.yml
└── .gitignore
```
