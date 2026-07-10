import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix allPos
allPos_target = """  const allPos = useMemo(() => {
    const list = Object.keys(accessRules || {});
    const defaults = [
      "Business Analyst",
      "Vegetables Sales Manager",
      "Area Sales Manager",
      "Sales Agronomist",
      "Business Solution",
    ];
    defaults.forEach(d => {
      if (!list.includes(d)) list.push(d);
    });
    return list;
  }, [accessRules]);"""

allPos_new = """  const allPos = useMemo(() => {
    const list = Object.keys(accessRules || {});
    // Remove obsolete 'Sales Manager' if it's still lingering in rules
    const filteredList = list.filter(p => p !== "Sales Manager");
    const defaults = [
      "Business Analyst",
      "Vegetables Sales Manager",
      "Area Sales Manager",
      "Sales Agronomist",
      "Business Solution",
    ];
    defaults.forEach(d => {
      if (!filteredList.includes(d)) filteredList.push(d);
    });
    return filteredList;
  }, [accessRules]);"""

content = content.replace(allPos_target, allPos_new)

# Fix allPositionsList
allPositionsList_target = """  const allPositionsList = useMemo(() => {
    const list = Object.keys(accessRules || {});
    const defaults = [
      "Business Analyst",
      "Vegetables Sales Manager",
      "Area Sales Manager",
      "Sales Agronomist",
      "Business Solution"
    ];
    defaults.forEach(d => {
      if (!list.includes(d)) list.push(d);
    });
    return list;
  }, [accessRules]);"""

allPositionsList_new = """  const allPositionsList = useMemo(() => {
    const list = Object.keys(accessRules || {});
    // Clean up obsolete 'Sales Manager'
    const filteredList = list.filter(p => p !== "Sales Manager");
    const defaults = [
      "Business Analyst",
      "Vegetables Sales Manager",
      "Area Sales Manager",
      "Sales Agronomist",
      "Business Solution"
    ];
    defaults.forEach(d => {
      if (!filteredList.includes(d)) filteredList.push(d);
    });
    return filteredList;
  }, [accessRules]);"""

content = content.replace(allPositionsList_target, allPositionsList_new)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Fixed obsolete 'Sales Manager' from lists")
