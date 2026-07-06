import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).parent

print("=" * 50)
print("SR FASHION AUTO UPDATE")
print("=" * 50)

def run(script):
    print(f"\n▶ Running {script}...")

    result = subprocess.run(
        [sys.executable, script],
        cwd=PROJECT_DIR
    )

    if result.returncode != 0:
        print(f"\n❌ {script} failed.")
        sys.exit(result.returncode)

    print(f"✅ {script} completed.")

run("export_items.py")
run("git_sync.py")

print("\n🎉 ALL DONE!")