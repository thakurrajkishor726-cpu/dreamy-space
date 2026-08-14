"""Seed the testimonials table with the set that was hardcoded in the frontend.

These came from src/data/testimonials.js and are PLACEHOLDER COPY — written
examples, not things real customers said. They are seeded so the page is not
empty while you collect real ones, and so you can edit them in place from the
admin rather than in code.

Replace them before the site goes live. Published testimonials nobody actually
gave are misleading to customers, and in India fall under the Consumer
Protection Act's rules on misleading advertisements.

Idempotent: matches on name + comment, so running it twice adds nothing and
never overwrites an edit you made in the admin.

Run: .venv/bin/python scripts/seed_testimonials.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import db  # noqa: E402

PLACEHOLDERS = [
    {
        "name": "Ananya Sharma",
        "designation": "Homeowner, Whitefield",
        "rating": 5,
        "comment": (
            "We had a narrow kitchen and had almost given up on getting proper storage into it. "
            "They measured everything twice, showed us where each drawer would go, and the tall "
            "unit for the mixer and atta box is the thing I use most."
        ),
    },
    {
        "name": "Vikram Iyer",
        "designation": "Apartment owner, Sarjapur Road",
        "rating": 5,
        "comment": (
            "The wardrobe was quoted with everything itemised, so there were no additions later. "
            "Installation took two days and the team cleaned up properly on the way out."
        ),
    },
    {
        "name": "Meera Krishnan",
        "designation": "Homeowner, JP Nagar",
        "rating": 5,
        "comment": (
            "I wanted a pooja corner that felt separate without taking a whole room. The "
            "backlighting they suggested does exactly that. It is the first thing guests comment on."
        ),
    },
    {
        "name": "Rohit Deshpande",
        "designation": "Director, Anvaya Consulting",
        "rating": 4,
        "comment": (
            "They fitted out our office over a long weekend so we lost no working days. Cable "
            "routing in the meeting rooms was thought through, which is more than the previous "
            "contractor managed."
        ),
    },
    {
        "name": "Priya Nair",
        "designation": "Homeowner, Kanakapura Road",
        "rating": 5,
        "comment": (
            "The sliding wardrobe panels still run smoothly two years on. When one shutter needed "
            "adjusting they came the same week and did not charge for it."
        ),
    },
    {
        "name": "Arjun Reddy",
        "designation": "Villa owner, Electronic City",
        "rating": 5,
        "comment": (
            "The TV unit hides every wire, which was the whole point. They also talked us out of a "
            "more expensive finish that would have shown fingerprints, which I appreciated."
        ),
    },
]


def main() -> None:
    db.init_schema()

    last = db.query_one("SELECT MAX(position) AS max_position FROM testimonials")
    position = (last["max_position"] + 1) if last and last["max_position"] is not None else 0

    added, skipped = 0, 0
    for item in PLACEHOLDERS:
        existing = db.query_one(
            "SELECT id FROM testimonials WHERE name = ? AND comment = ?",
            (item["name"], item["comment"]),
        )
        if existing:
            print(f"  exists  {item['name']}")
            skipped += 1
            continue

        db.execute(
            """
            INSERT INTO testimonials (name, designation, rating, comment, position)
            VALUES (?, ?, ?, ?, ?)
            """,
            (item["name"], item["designation"], item["rating"], item["comment"], position),
        )
        print(f"  added   {item['name']}  ({item['rating']}/5)")
        position += 1
        added += 1

    print(f"\n{added} added, {skipped} already present.")
    if added:
        print("\nThese are placeholders. Replace them with real feedback before launch.")


if __name__ == "__main__":
    main()
