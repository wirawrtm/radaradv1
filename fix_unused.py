import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = re.sub(r'const nonLeafTeamMembersClean = .*?\.filter\(Boolean\);', '', content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Removed unused nonLeafTeamMembersClean variables.")
