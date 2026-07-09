with open("server.ts", "r") as f:
    content = f.read()

content = content.replace("const uniqKey = cleanName + \"_\" + cleanUser;", "const uniqKey = cleanName;")
with open("server.ts", "w") as f:
    f.write(content)
print("Updated deduplication to just use cleanName")
