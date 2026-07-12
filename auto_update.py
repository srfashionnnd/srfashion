import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).parent


def inventory_data_changed():
    try:
        head_result = subprocess.run(
            ["git", "rev-parse", "HEAD:items.json"],
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            check=False,
        )
        if head_result.returncode != 0:
            return True

        current_result = subprocess.run(
            ["git", "hash-object", "items.json"],
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            check=False,
        )
        if current_result.returncode != 0:
            return True

        return head_result.stdout.strip() != current_result.stdout.strip()
    except Exception:
        return True


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

print("\n▶ Verifying whether inventory data changed...")
if not inventory_data_changed():
    print("\nℹ Inventory data unchanged.")
    print("ℹ Sync timestamp updated locally.")
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