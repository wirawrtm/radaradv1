import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """  const userAccess = useMemo(() => {
    if (!userData) return {};

    const isAdmin = userData.level && String(userData.level).toLowerCase().trim() === "admin";
    if (isAdmin) {
      return {
        home: true,
        partner: true,
        stock: true,
        pog: true,
        overview: true,
        temp: true,
        access: true,
      };
    }"""

replacement = """  const userAccess = useMemo(() => {
    if (!userData) return {};"""

if target in content:
    with open("src/App.tsx", "w") as f:
        f.write(content.replace(target, replacement))
    print("Replaced!")
else:
    print("Target not found. Let's try regex")
    
    match = re.search(r"const isAdmin = userData\.level.*?access: true,\s+\};\s+\}", content, re.DOTALL)
    if match:
        with open("src/App.tsx", "w") as f:
            f.write(content.replace(match.group(0), ""))
        print("Replaced via regex!")
