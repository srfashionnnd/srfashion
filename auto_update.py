import subprocess
import sys
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path(__file__).parent
LOG_FILE = PROJECT_DIR / "auto_update.log"


def log(message):
    timestamp = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    line = f"[{timestamp}] {message}"

    # Console (ignore Unicode issues in Task Scheduler)
    try:
        print(line)
    except UnicodeEncodeError:
        pass

    # Log file
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def repository_has_changes():
    """Return True if any tracked file has changed."""
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=PROJECT_DIR,
        capture_output=True,
        text=True,
        check=False,
    )
    return bool(result.stdout.strip())


log("=" * 50)
log("SR FASHION AUTO UPDATE")
log("=" * 50)

log("Running export_items.py...")

result = subprocess.run(
    [sys.executable, "export_items.py"],
    cwd=PROJECT_DIR
)

# No changes from export script
if result.returncode == 10:
    log("No changes found.")
    log("Git sync skipped.")
    sys.exit(0)

# Export failed
if result.returncode != 0:
    log("Export failed.")
    sys.exit(result.returncode)

log("Checking repository changes...")

if not repository_has_changes():
    log("No repository changes detected.")
    log("Git commit skipped.")
    log("Git push skipped.")
    sys.exit(0)

log("Running git_sync.py...")

result = subprocess.run(
    [sys.executable, "git_sync.py"],
    cwd=PROJECT_DIR
)

if result.returncode != 0:
    log("Git sync failed.")
    sys.exit(result.returncode)

log("WEBSITE UPDATED SUCCESSFULLY!")