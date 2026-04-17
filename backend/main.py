import json
from contextlib import asynccontextmanager
from collections import Counter

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from puzzle import load_words, find_solutions, generate_puzzle, word_score, SCORE_TABLE
from database import (
    init_db, today_str, get_puzzle, save_puzzle,
    get_leaderboard, save_leaderboard_entry,
)

wordlist: set[str] = set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global wordlist
    init_db()
    wordlist = load_words()
    print(f"Loaded {len(wordlist)} words")
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_or_create_today() -> dict:
    date = today_str()
    row = get_puzzle(date)
    if row:
        return {
            "date": row.date,
            "letters": json.loads(row.letters),
            "center": row.center,
            "solutions": json.loads(row.solutions),
            "max_score": row.max_score,
        }
    data = generate_puzzle(wordlist)
    save_puzzle(date, data["letters"], data["center"], data["solutions"], data["max_score"])
    return {"date": date, **data}


@app.get("/api/puzzle/today")
def get_today_puzzle():
    data = _get_or_create_today()
    return {
        "date": data["date"],
        "letters": data["letters"],
        "center": data["center"],
        "center_index": 4,
        "solution_count": len(data["solutions"]),
        "max_score": data["max_score"],
    }


class ValidateRequest(BaseModel):
    word: str
    date: str


@app.post("/api/validate")
def validate_word(req: ValidateRequest):
    row = get_puzzle(req.date)
    if not row:
        raise HTTPException(status_code=404, detail="Puzzle not found")

    letters = json.loads(row.letters)
    center = row.center
    word = req.word.strip().lower()

    if center.lower() not in word:
        return {"valid": False, "reason": "no_center"}

    solutions = json.loads(row.solutions)
    if word not in solutions:
        return {"valid": False, "reason": "not_in_list"}

    return {"valid": True, "points": word_score(word)}


@app.get("/api/solutions/today")
def get_solutions():
    data = _get_or_create_today()
    return {"words": data["solutions"]}


class LeaderboardSubmit(BaseModel):
    date: str
    username: str
    score: int
    word_count: int
    found_words: list[str]


@app.post("/api/leaderboard")
def submit_leaderboard(req: LeaderboardSubmit):
    save_leaderboard_entry(req.date, req.username, req.score, req.word_count, req.found_words)
    return {"ok": True}


@app.get("/api/leaderboard/today")
def get_today_leaderboard():
    date = today_str()
    entries = get_leaderboard(date)
    result = []
    for rank, entry in enumerate(entries, 1):
        result.append({
            "rank": rank,
            "username": entry.username,
            "score": entry.score,
            "word_count": entry.word_count,
            "submitted_at": entry.submitted_at,
        })
    return {"date": date, "entries": result}
