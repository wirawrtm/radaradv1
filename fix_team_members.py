import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """    return rawList;
  }, [
    kiosks,
    userData,
    userData?.name,
    userData?.subordinates,
    userData?.position,
    computedTeamProfiles,
    employees,
  ]);"""

replacement = """    // Deduplicate the list to prevent key collision React errors
    const seen = new Set();
    const uniqueList = [];
    for (const name of rawList) {
      const clean = cleanForMatch(name);
      if (!seen.has(clean)) {
        seen.add(clean);
        uniqueList.push(name);
      }
    }
    return uniqueList;
  }, [
    kiosks,
    userData,
    userData?.name,
    userData?.subordinates,
    userData?.position,
    computedTeamProfiles,
    employees,
  ]);"""

if target in content:
    with open("src/App.tsx", "w") as f:
        f.write(content.replace(target, replacement))
    print("Replaced!")
else:
    print("Target not found.")
