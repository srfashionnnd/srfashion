import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).parent


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


print("=" * 50)
print("SR FASHION AUTO UPDATE")
print("=" * 50)

print("\n▶ Running export_items.py...")

result = subprocess.run(
    [sys.executable, "export_items.py"],
    cwd=PROJECT_DIR
)

# No changes from export script
if result.returncode == 10:
    print("\n✅ No changes found.")
    print("🚫 Git sync skipped.")
    sys.exit(0)

# Export failed
if result.returncode != 0:
    print("\n❌ Export failed.")
    sys.exit(result.returncode)

print("\n▶ Checking repository changes...")

if not repository_has_changes():
    print("\nℹ No repository changes detected.")
    print("⏭ Git commit skipped.")
    print("⏭ Git push skipped.")
    sys.exit(0)

print("\n▶ Running git_sync.py...")

result = subprocess.run(
    [sys.executable, "git_sync.py"],
    cwd=PROJECT_DIR
)

if result.returncode != 0:
    print("\n❌ Git sync failed.")
    sys.exit(result.returncode)

print("\n🎉 WEBSITE UPDATED SUCCESSFULLY!")