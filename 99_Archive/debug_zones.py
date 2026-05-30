import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '03_Scripts'))
from parser_v3 import parse_qrma_pdf

print("Parsing PDF...")
data = parse_qrma_pdf('QRMA_Ridwan_November_21.pdf')
ref  = data['ref_standards']

# Parameters that map to bv and sk-sc
targets = [
    'Kekentalan Darah',      # → bv
    'Tingkat Kolagen Kulit', # → sk-sc (possible name)
    'Kolagen Kulit',         # → sk-sc (alternate name)
    'Kadar Kolagen Kulit',   # → sk-sc (alternate name)
]

print("\n=== ref_standards extraction ===")
for name in targets:
    zones = ref.get(name)
    if zones:
        print(f"\n{name}:")
        for k, v in zones.items():
            print(f"  {k}: {v}")
    else:
        print(f"\n{name}: NOT FOUND in ref_standards")

print("\n=== actual_values from items ===")
for item in data['items']:
    if item['parameter_name'] in targets:
        print(f"  {item['parameter_name']} = {item['actual_value']}")
