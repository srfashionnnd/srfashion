import pyodbc
import time
import subprocess

SERVER = "DESKTOP-UA7PBVU"
DATABASE = "BusyComp0004_db12026"

CHECK_INTERVAL = 120   # 2 minutes

connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    f"SERVER={SERVER};"
    f"DATABASE={DATABASE};"
    "Trusted_Connection=yes;"
)

last_vch = None
last_stamp = None

print("===================================")
print(" SR Fashion Auto Sync Started")
print("===================================")

while True:

    try:

        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()

        cursor.execute("""
        SELECT MAX(VchCode)
        FROM Tran1
        """)

        current_vch = cursor.fetchone()[0]

        cursor.execute("""
        SELECT MAX(Stamp)
        FROM Master1
        WHERE MasterType=6
        """)

        current_stamp = cursor.fetchone()[0]

        conn.close()

        print(f"Voucher={current_vch}  Stamp={current_stamp}")

        if last_vch is None:
            last_vch = current_vch
            last_stamp = current_stamp
            print("Initial values saved.")

        elif current_vch != last_vch or current_stamp != last_stamp:

            print("Change detected.")

            subprocess.run(["python", "export_items.py"])

            subprocess.run(["python", "git_sync.py"])

            last_vch = current_vch
            last_stamp = current_stamp

        else:

            print("No changes.")

    except Exception as e:

        print(e)

    time.sleep(CHECK_INTERVAL)