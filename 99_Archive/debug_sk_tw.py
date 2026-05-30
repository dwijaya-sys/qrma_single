import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '03_Scripts'))
from parser_v3 import parse_qrma_pdf

print("Parsing PDF...")
data = parse_qrma_pdf('QRMA_Ridwan_November_21.pdf')
ref  = data['ref_standards']

targets = [
    'Tingkat Kelembaban Kulit',
    'Tingkat Kehilangan Kelembaban Kulit',
    'Kolagen Sendi',
]

print("\n=== ref_standards for sk-tw and sk-jc sources ===")
for name in targets:
    zones = ref.get(name)
    if zones:
        print(f"\n{name}:")
        for k, v in zones.items():
            print(f"  {k}: {v}")
    else:
        print(f"\n{name}: NOT FOUND in ref_standards")

print("\n=== actual_values ===")
for item in data['items']:
    if item['parameter_name'] in targets:
        print(f"  {item['parameter_name']} = {item['actual_value']}")
