import csv

csv_path = "01_Data/csv/ridwan_2025-11-10.csv"

with open(csv_path, newline="", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

print(f"Total rows in CSV: {len(rows)}")
print()

for i, row in enumerate(rows):
    print(f"Row {i+1}:")
    print(f"  bv_zone    = {row.get('bv_zone', 'MISSING')}")
    print(f"  mt-tg_zone = {row.get('mt-tg_zone', 'MISSING')}")
    print(f"  sk-sc_zone = {row.get('sk-sc_zone', 'MISSING')}")
    print()
