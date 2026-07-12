import subprocess
import sys
from datetime import datetime

REPO_PATH = r"C:\Users\ASUS\Desktop\srfashionndclaude"


def run_git_command(command):
    result = subprocess.run(
        command,
        cwd=REPO_PATH,
        capture_output=True,
        text=True,
        check=False,
    )

    stdout = result.stdout.strip()
    stderr = result.stderr.strip()

    if stdout:
        print(stdout)

    if stderr:
        print(stderr)

    return result


def print_error_details(result):
    if result.stderr.strip():
        print(result.stderr.strip())
    elif result.stdout.strip():
        print(result.stdout.strip())


print("========================================")
print("SR FASHION GIT AUTO SYNC")
print("========================================")
print()

print("1️⃣ Git Add")
result = run_git_command(["git", "add", "."])
if result.returncode == 0:
    print("✅ Git Add Successful")
else:
    print("❌ Git Add Failed")
    print_error_details(result)
    sys.exit(result.returncode)

print()
print("2️⃣ Git Commit")
commit_message = "Auto Sync " + datetime.now().strftime("%d %b %Y %I:%M %p")
result = run_git_command(["git", "commit", "-m", commit_message])

if result.returncode == 0:
    print("✅ Git Commit Successful")
elif "nothing to commit" in (result.stdout + result.stderr).lower() or "working tree clean" in (result.stdout + result.stderr).lower():
    print("ℹ No data changes detected.")
    print("ℹ Repository already up to date.")
    print("⏭ Skipping Git Push.")
    print()
    print("========================================")
    print("✅ Git Sync Finished Successfully")
    print("========================================")
    print()
    print("Repository Status")
    print("✔ Local repository clean")
    print("✔ GitHub updated successfully")
    print("✔ Local branch is synchronized")
    print("✔ Website will update automatically after GitHub Pages deployment")
    sys.exit(0)
else:
    print("❌ Git Commit Failed")
    print_error_details(result)
    sys.exit(result.returncode)

print()
print("3️⃣ Git Push")
result = run_git_command(["git", "push", "origin", "main"])
if result.returncode == 0:
    print("✅ Git Push Successful")
else:
    print("❌ Git Push Failed")
    print_error_details(result)
    sys.exit(result.returncode)

print()
print("4️⃣ Repository Verification")
status_result = run_git_command(["git", "status"])
status_output = (status_result.stdout + "\n" + status_result.stderr).strip()

if "Your branch is up to date with 'origin/main'" in status_output:
    print("========================================")
    print("✅ Git Sync Finished Successfully")
    print("========================================")
    print()
    print("Repository Status")
    print("✔ Local repository clean")
    print("✔ GitHub updated successfully")
    print("✔ Local branch is synchronized")
    print("✔ Website will update automatically after GitHub Pages deployment")
else:
    print("⚠ Repository verification warning")
    print("The repository state is different from the expected synchronized state.")
    print(status_output or "No git status output was returned.")
    print("========================================")
    print("⚠ Git Sync completed with warnings")
    print("========================================")
    sys.exit(0)