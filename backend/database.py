import json
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, Column, Integer, String, text
from sqlalchemy.orm import declarative_base, Session

HELSINKI_TZ = timezone(timedelta(hours=2))  # Europe/Helsinki (UTC+2, simplified)

engine = create_engine("sqlite:///data/sanajahti.db", connect_args={"check_same_thread": False})
Base = declarative_base()


class DailyPuzzle(Base):
    __tablename__ = "daily_puzzle"
    date = Column(String, primary_key=True)
    letters = Column(String, nullable=False)   # JSON array
    center = Column(String, nullable=False)
    solutions = Column(String, nullable=False)  # JSON array
    max_score = Column(Integer, nullable=False)


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False)
    username = Column(String, nullable=False)
    score = Column(Integer, nullable=False)
    word_count = Column(Integer, nullable=False)
    found_words = Column(String, nullable=False)  # JSON array
    submitted_at = Column(String, nullable=False)


def init_db():
    Base.metadata.create_all(engine)


def today_str() -> str:
    return datetime.now(HELSINKI_TZ).strftime("%Y-%m-%d")


def get_puzzle(date: str) -> DailyPuzzle | None:
    with Session(engine) as session:
        return session.get(DailyPuzzle, date)


def save_puzzle(date: str, letters: list[str], center: str, solutions: list[str], max_score: int) -> DailyPuzzle:
    puzzle = DailyPuzzle(
        date=date,
        letters=json.dumps(letters),
        center=center,
        solutions=json.dumps(solutions),
        max_score=max_score,
    )
    with Session(engine) as session:
        session.merge(puzzle)
        session.commit()
    return puzzle


def get_leaderboard(date: str) -> list[LeaderboardEntry]:
    with Session(engine) as session:
        return session.query(LeaderboardEntry).filter_by(date=date).order_by(
            LeaderboardEntry.score.desc()
        ).all()


def save_leaderboard_entry(date: str, username: str, score: int, word_count: int, found_words: list[str]) -> None:
    entry = LeaderboardEntry(
        date=date,
        username=username,
        score=score,
        word_count=word_count,
        found_words=json.dumps(found_words),
        submitted_at=datetime.now(timezone.utc).isoformat(),
    )
    with Session(engine) as session:
        session.add(entry)
        session.commit()
