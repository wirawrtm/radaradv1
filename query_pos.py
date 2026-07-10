import json
data = json.load(open('local_sheets_db.json'))
emps = data.get('employee', [])
positions = set()
for e in emps[1:]:
    if len(e) > 3:
        positions.add(e[3])
print(positions)
