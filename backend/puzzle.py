import random
import re
from collections import Counter


SCORE_TABLE = {3: 1, 4: 2, 5: 4, 6: 6, 7: 9, 8: 12, 9: 18}

PREFERRED_CENTER = set("aeiouäöylnrst")


def load_words(min_len=3, max_len=9) -> set[str]:
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


def find_solutions(letters: str, center: str, wordlist: set[str]) -> list[str]:
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


def word_score(word: str) -> int:
    return SCORE_TABLE.get(len(word), 0)


def _pick_center(letters: str, solutions_by_center: dict[str, list]) -> str:
    """Pick the center letter that maximizes solution count, preferring common letters."""
    best = max(
        letters,
        key=lambda c: (len(solutions_by_center.get(c, [])), c in PREFERRED_CENTER),
    )
    return best


def generate_puzzle(wordlist: set[str], max_attempts: int = 200) -> dict:
    nine_letter_words = [w for w in wordlist if len(w) == 9]
    if not nine_letter_words:
        raise RuntimeError("No 9-letter words in word list")

    random.shuffle(nine_letter_words)

    for base_word in nine_letter_words[:max_attempts]:
        letters_list = list(base_word)
        random.shuffle(letters_list)

        # Try each position as center, pick best valid one
        candidate_centers = [c for c in set(letters_list) if c in PREFERRED_CENTER]
        if not candidate_centers:
            candidate_centers = list(set(letters_list))

        best_center = None
        best_solutions = None
        best_count = 0

        for center_char in candidate_centers:
            solutions = find_solutions("".join(letters_list), center_char, wordlist)
            count = len(solutions)
            if 15 <= count <= 50 and count > best_count:
                best_count = count
                best_center = center_char
                best_solutions = solutions

        if best_center is None:
            continue

        # Place center letter at index 4
        idx = letters_list.index(best_center)
        letters_list[idx], letters_list[4] = letters_list[4], letters_list[idx]

        max_score = sum(word_score(w) for w in best_solutions)
        return {
            "letters": letters_list,
            "center": best_center,
            "solutions": best_solutions,
            "max_score": max_score,
        }

    raise RuntimeError("Could not generate a valid puzzle after max attempts")

