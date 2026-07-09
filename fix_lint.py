with open("src/App.tsx", "r") as f:
    content = f.read()

target = """  // If teamProfiles exists directly on userData:
  if (computedTeamProfiles) {
    const foundKey = Object.keys(computedTeamProfiles).find(
      (k) => cleanForMatch(k) === cleanName,
    );
    if (
      foundKey &&
      computedTeamProfiles[foundKey]?.level !== undefined &&
      computedTeamProfiles[foundKey]?.level !== null &&
      String(computedTeamProfiles[foundKey]?.level).trim() !== ""
    ) {
      const parsed = parseLevelStr(computedTeamProfiles[foundKey].level);
      if (!isNaN(parsed)) return parsed;
    }
  }"""

if target in content:
    with open("src/App.tsx", "w") as f:
        f.write(content.replace(target, ""))
    print("Replaced!")
else:
    print("Target not found.")
