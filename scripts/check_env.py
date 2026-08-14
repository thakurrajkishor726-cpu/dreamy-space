"""Compare .env against what the code actually reads.

Catches the two ways config drifts as a codebase changes: a variable the code
now needs that .env never gained, and a variable .env still carries that
nothing reads any more.

    .venv/bin/python scripts/check_env.py
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SERVER_PATTERN = re.compile(r'os\.environ\.get\(\s*"([A-Z_]+)"')
CLIENT_PATTERN = re.compile(r"import\.meta\.env\.([A-Z_]+)")
ENV_LINE = re.compile(r"^([A-Z_]+)=(.*)$")

# Read by the code but genuinely optional — absence is not a problem.
OPTIONAL = {
    "CATALOGUE_DB_PATH",
    "JWT_TTL_HOURS",
    "CLOUDINARY_FOLDER",
    "VITE_CLOUDINARY_FOLDER",
    # Intentionally blank in development — Vite proxies /api to :8000.
    "VITE_API_BASE_URL",
}
# Consumed by tooling rather than by an import.meta.env / os.environ lookup.
EXTRA_ALLOWED = {"ALLOWED_ORIGINS"}


def scan(directory: Path, pattern: re.Pattern, suffixes: set[str]) -> set[str]:
    found = set()
    for path in directory.rglob("*"):
        if path.suffix in suffixes and path.is_file():
            found |= set(pattern.findall(path.read_text(encoding="utf-8", errors="ignore")))
    return found


def main() -> int:
    env_path = ROOT / ".env"
    if not env_path.exists():
        print("No .env found. Copy .env.example to .env first.")
        return 1

    defined, blank = set(), set()
    for line in env_path.read_text().splitlines():
        match = ENV_LINE.match(line.strip())
        if match:
            defined.add(match.group(1))
            if not match.group(2).strip():
                blank.add(match.group(1))

    needed = scan(ROOT / "api", SERVER_PATTERN, {".py"})
    needed |= scan(ROOT / "src", CLIENT_PATTERN, {".js", ".jsx"})

    missing = sorted(needed - defined - OPTIONAL)
    empty = sorted((needed & blank) - OPTIONAL)
    unused = sorted(defined - needed - OPTIONAL - EXTRA_ALLOWED)

    for name in missing:
        print(f"MISSING  {name}  — the code reads it, .env doesn't define it")
    for name in empty:
        print(f"EMPTY    {name}  — defined but blank")
    for name in unused:
        print(f"UNUSED   {name}  — in .env, nothing reads it")

    if not (missing or empty or unused):
        print(f"OK — {len(needed)} variables, all present and filled.")
        return 0

    # Empty values are usually "not set up yet" rather than broken config, so
    # only a genuinely missing or stale key is worth a non-zero exit.
    return 1 if (missing or unused) else 0


if __name__ == "__main__":
    sys.exit(main())
