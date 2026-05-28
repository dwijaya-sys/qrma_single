import json

with open('01_Data/json/ridwan_2025-11-10.json') as f:
    p = json.load(f)

v = p['values']
for k in ['sk-tw_zone', 'sk-jc_zone', 'sk-tw', 'sk-jc']:
    print(f'{k}: {v.get(k, "NOT IN JSON")}')
