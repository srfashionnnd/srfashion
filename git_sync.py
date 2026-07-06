import subprocess
import os
from datetime import datetime

REPO_PATH = r"C:\Users\ASUS\Desktop\srfashionndclaude"

def run(command):
    result = subprocess.run(
        command,
        cwd=REPO_PATH,
        shell=True,
        capture_output=True,
        text=True
    )

    if result.stdout:
        print(result.stdout)

    if result.stderr:
        print(result.stderr)

    return result.returncode

print("===================================")
print("SR FASHION GIT AUTO SYNC")
print("===================================\n")

# Git Add
print("1. Adding changes...")
run("git add .")

# Git Commit
print("2. Creating commit...")

commit_message = "Auto Sync " + datetime.now().strftime("%d %b %Y %I:%M %p")

run(f'git commit -m "{commit_message}"')

# Git Push
print("3. Pushing to GitHub...")
run("git push")

print("\n✅ Git Sync Finished")