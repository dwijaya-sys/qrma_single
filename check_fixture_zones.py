import json

with open('01_Data/json/fixtures/ridwan_2025-11-10.json') as f:
    p = json.load(f)

v = p['values']
for k in ['bs_zone', 'ins_zone', 'ph_zone', 'ox-ph_zone', 'mt-ug_zone', 'mt-ins_zone']:
    print(f'{k}: {v.get(k, "NOT IN FIXTURE")}')
