import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).parent

print("=" * 50)
print("SR FASHION AUTO UPDATE")
print("=" * 50)

print("\n▶ Running export_items.py...")

result = subprocess.run(
    [sys.executable, "export_items.py"],
    cwd=PROJECT_DIR
)

# No changes
if result.returncode == 10:
    print("\n✅ No changes found.")
    print("🚫 Git sync skipped.")
    sys.exit(0)

# Error
if result.returncode != 0:
    print("\n❌ Export failed.")
    sys.exit(result.returncode)

print("\n▶ Running git_sync.py...")

result = subprocess.run(
    [sys.executable, "git_sync.py"],
    cwd=PROJECT_DIR
)

if result.returncode != 0:
    print("\n❌ Git sync failed.")
    sys.exit(result.returncode)

print("\n🎉 WEBSITE UPDATED SUCCESSFULLY!")