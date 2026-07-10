import json
with open('local_sheets_db.json') as f:
    data = json.load(f)
    employees = data.get("employee", [])
    headers = employees[0]
    for e in employees[1:]:
        if len(e) > 3:
            pos = e[3].lower()
            if "sales manager" in pos:
                print(f"{e[0]} - {e[3]} - {e[9] if len(e) > 9 else ''}")
