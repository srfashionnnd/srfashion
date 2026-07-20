import pyodbc
import json
from datetime import datetime
import hashlib
import os
import sys

server = "DESKTOP-UA7PBVU"
database = "BusyComp0004_db12026"

connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    f"SERVER={server};"
    f"DATABASE={database};"
    "Trusted_Connection=yes;"
)

try:
    conn = pyodbc.connect(connection_string)
    cursor = conn.cursor()

    print("Connected Successfully.")

    cursor.execute("""
    SELECT
        M.Alias AS Alias,
        G.Name AS GroupName,
        M.Name AS ProductName,
        M.PrintName,
        M.D3 AS SalePrice,
        M.D2 AS MRP,
        M.D4 AS PurchasePrice,
        ISNULL(S.Stock, 0) AS Stock
    FROM Master1 M
    LEFT JOIN Master1 G
        ON G.Code = M.ParentGrp
       AND G.MasterType = 5
    LEFT JOIN (
        SELECT
            MasterCode1,
            SUM(Value1) AS Stock
        FROM Tran2
        WHERE MasterCode2 = 201
        GROUP BY MasterCode1
    ) S
        ON S.MasterCode1 = M.Code
    WHERE M.MasterType = 6
    ORDER BY G.Name, M.Name
    """)

    rows = cursor.fetchall()

    items = []

    for row in rows:
        items.append({
            "alias": (row.Alias or "").strip(),
            "group": (row.GroupName or "").strip(),
            "name": (row.ProductName or "").strip(),
            "print_name": (row.PrintName or "").strip(),
            "sale_price": float(row.SalePrice or 0),
            "mrp": float(row.MRP or 0),
            "purchase_price": float(row.PurchasePrice or 0),
            "stock": float(row.Stock or 0)
        })

    new_json = json.dumps(items, indent=4, ensure_ascii=False)

    old_json = ""
    old_last_sync_json = ""

    if os.path.exists("items.json"):
        with open("items.json", "r", encoding="utf-8") as f:
            old_json = f.read()

    if os.path.exists("last-sync.json"):
        with open("last-sync.json", "r", encoding="utf-8") as f:
            old_last_sync_json = f.read()

    new_hash = hashlib.md5(new_json.encode("utf-8")).hexdigest()
    old_hash = hashlib.md5(old_json.encode("utf-8")).hexdigest()

    last_sync = {
        "last_updated": datetime.now().strftime("%d %b %Y %I:%M:%S %p")
    }

    new_last_sync_json = json.dumps(last_sync, indent=4)

    with open("last-sync.json", "w", encoding="utf-8") as f:
        f.write(new_last_sync_json)

    if new_hash != old_hash:
        with open("items.json", "w", encoding="utf-8") as f:
            f.write(new_json)

        print("Changes detected.")
        print("items.json updated.")
        print("last-sync.json refreshed.")
        print(f"Total Products: {len(items)}")

        conn.close()
        sys.exit(0)

    if old_last_sync_json != new_last_sync_json:
        print("Sync metadata refreshed.")
        print("last-sync.json updated.")

        conn.close()
        sys.exit(0)

    print("No data changes detected.")
    print("Nothing to update.")

    conn.close()
    sys.exit(10)

except Exception as e:
    print()
    print("ERROR:")
    print(str(e))
    sys.exit(1)