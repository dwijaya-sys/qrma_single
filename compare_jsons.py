import json

files = [
    '01_Data/json/ridwan_2025-11-10.json',
    '01_Data/json/fixtures/ridwan_2025-11-10.json',
]

for f in files:
    try:
        with open(f) as fh:
            p = json.load(fh)
        v = p['values']
        sk_jc     = v.get('sk-jc',      'NOT IN FILE')
        sk_jc_zone= v.get('sk-jc_zone', 'NOT IN FILE')
        sk_ec     = v.get('sk-ec',      'NOT IN FILE')
        print(f'\n{f}')
        print(f'  sk-jc:      {sk_jc}')
        print(f'  sk-jc_zone: {sk_jc_zone}')
        print(f'  sk-ec:      {sk_ec}')
    except FileNotFoundError:
        print(f'\n{f}: FILE NOT FOUND')
