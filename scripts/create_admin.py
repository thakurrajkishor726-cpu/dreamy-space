"""Create (or promote) an admin user.

    .venv/bin/python scripts/create_admin.py you@example.com "Your Name"

Prompts for the password rather than taking it as an argument, so it doesn't
end up in your shell history.
"""

import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import db  # noqa: E402
from server.security import hash_password  # noqa: E402


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)

    email = sys.argv[1].strip().lower()
    name = sys.argv[2] if len(sys.argv) > 2 else email.split("@")[0]

    db.init_schema()

    existing = db.query_one("SELECT id, is_admin FROM users WHERE email = ?", (email,))
    if existing:
        if existing["is_admin"]:
            print(f"{email} is already an admin.")
        else:
            db.execute("UPDATE users SET is_admin = 1 WHERE id = ?", (existing["id"],))
            db.touch("users", existing["id"])
            print(f"Promoted {email} to admin.")
        return

    password = getpass.getpass("Password (min 8 chars): ")
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters.")
    if password != getpass.getpass("Confirm: "):
        raise SystemExit("Passwords did not match.")

    user_id = db.execute(
        "INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)",
        (name, email, hash_password(password)),
    )
    print(f"Created admin #{user_id}: {email}")


if __name__ == "__main__":
    main()
