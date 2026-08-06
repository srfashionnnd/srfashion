import pyodbc
import time
import subprocess
import os
import sys

SERVER = "DESKTOP-UA7PBVU"
DATABASE = "BusyComp0004_db12026"

# TEST = 10 seconds
# PRODUCTION = 120 seconds
CHECK_INTERVAL = 10

connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    f"SERVER={SERVER};"
    f"DATABASE={DATABASE};"
    "Trusted_Connection=yes;"
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

last_vch = None
last_stamp = None

print("===================================")
print(" SR Fashion Auto Sync Started")
print("===================================")

while True:
    try:

        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()

        # Latest Voucher
        cursor.execute("""
            SELECT MAX(VchCode)
            FROM Tran1
        """)
        current_vch = cursor.fetchone()[0]

        # Latest Product Master Stamp
        cursor.execute("""
            SELECT MAX(Stamp)
            FROM Master1
            WHERE MasterType = 6
        """)
        current_stamp = cursor.fetchone()[0]

        conn.close()

        print(f"\nVoucher={current_vch}  Stamp={current_stamp}")

        # First Run
        if last_vch is None:
            last_vch = current_vch
            last_stamp = current_stamp
            print("Initial values saved.")

        # Change Detected
        elif current_vch != last_vch or current_stamp != last_stamp:

            print("Change detected.")
            print("Running Export...")

            export_result = subprocess.run(
                [sys.executable, os.path.join(BASE_DIR, "export_items.py")],
                cwd=BASE_DIR
            )

            if export_result.returncode == 0:

                print("Data changed. Starting Git Sync...")

                subprocess.run(
                    [sys.executable, os.path.join(BASE_DIR, "git_sync.py")],
                    cwd=BASE_DIR
                )

            elif export_result.returncode == 10:

                print("No JSON changes.")
                print("Git Sync skipped.")

            else:

                print("Export failed.")

            last_vch = current_vch
            last_stamp = current_stamp

        else:

            print("No changes detected.")

    except Exception as e:

        print("ERROR:", e)

    print(f"Sleeping {CHECK_INTERVAL} seconds...")
    time.sleep(CHECK_INTERVAL)