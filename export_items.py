import pyodbc
import json
from datetime import datetime

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

    print("✅ Connected Successfully!")

    cursor.execute("""
    SELECT
        M.Code,
        M.Name,
        M.D2 AS MRP,
        M.D3 AS SalePrice,
        M.D4 AS PurchasePrice,
        ISNULL(S.Stock, 0) AS Stock
    FROM Master1 M
    LEFT JOIN (
        SELECT
            MasterCode1,
            SUM(Value1) AS Stock
        FROM Tran2
        WHERE MasterCode2 = 201
        GROUP BY MasterCode1
    ) S
        ON M.Code = S.MasterCode1
    WHERE M.MasterType = 6
    ORDER BY M.Name
    """)

    rows = cursor.fetchall()

    items = []

    for row in rows:
        items.append({
            "code": int(row.Code),
            "name": row.Name,
            "mrp": float(row.MRP or 0),
            "sale_price": float(row.SalePrice or 0),
            "purchase_price": float(row.PurchasePrice or 0),
            "stock": float(row.Stock or 0)
        })

    # Save items.json
    with open("items.json", "w", encoding="utf-8") as f:
        json.dump(items, f, indent=4, ensure_ascii=False)

    # Save last-sync.json
    last_sync = {
        "last_updated": datetime.now().strftime("%d %b %Y %I:%M:%S %p")
    }

    with open("last-sync.json", "w", encoding="utf-8") as f:
        json.dump(last_sync, f, indent=4)

    print("✅ items.json created successfully!")
    print("✅ last-sync.json updated!")
    print(f"📦 Total Products: {len(items)}")

    conn.close()

except Exception as e:
    print("\n❌ ERROR:")
    print(e)