import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """      if (parentDepth <= maxThreshold) {
        const matched = Object.keys(teamProfiles).find(
          (k) => cleanForMatch(k) === parentClean,
        );
        return matched || profile.upline;
      }
      current = parentClean;
    }
    return realRootName;
  };

  const result = calculate();"""

replacement = """      if (parentDepth <= maxThreshold) {
        const matched = Object.keys(teamProfiles).find(
          (k) => cleanForMatch(k) === parentClean,
        );
        return matched || profile.upline;
      }
      current = parentClean;
    }
    return picName;
  };

  const result = calculate();"""

if target in content:
    content = content.replace(target, replacement)
    with open("src/App.tsx", "w") as f:
        f.write(content)
    print("Fixed getDdaOfUser!")
else:
    print("Could not find target block")
