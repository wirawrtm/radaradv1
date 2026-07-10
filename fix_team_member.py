import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace nonLeafTeamMembersClean usages with just teamMembersCleanSet.has(picClean)

# Pattern 1
p1 = """        teamMembersCleanSet.has(picClean) ||
        nonLeafTeamMembersClean.some((m) => picClean.includes(m));"""
r1 = """        teamMembersCleanSet.has(picClean);"""

# Pattern 2 (indented differently)
p2 = """          teamMembersCleanSet.has(picClean) ||
          nonLeafTeamMembersClean.some((m) => picClean.includes(m));"""
r2 = """          teamMembersCleanSet.has(picClean);"""

content = content.replace(p1, r1)
content = content.replace(p2, r2)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Replaced nonLeaf usages.")
