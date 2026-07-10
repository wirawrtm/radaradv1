import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix normalizePosition
new_normalize = """const normalizePosition = (pos: string | undefined): string => {
  if (!pos) return "Unknown";
  const clean = cleanForMatch(pos);
  if (clean === "businessanalyst" || clean === "analyst")
    return "Business Analyst";
  if (clean === "areasalesmanager" || clean === "asm")
    return "Area Sales Manager";
  if (clean === "vegetablessalesmanager" || clean === "vsm")
    return "Vegetables Sales Manager";
  if (clean === "salesmanager" || clean === "sm") return "Sales Manager";
  if (clean === "salesagronomist" || clean === "sa") return "Sales Agronomist";
  if (clean === "businesssolution" || clean === "bs")
    return "Business Solution";
  if (clean === "countryhead") return "Country Head";
  if (clean === "commerciallead") return "Commercial Lead";

  // Custom casing logic for presentation
  if (clean.includes("businessanalyst")) return "Business Analyst";
  if (clean.includes("areasalesmanager") || clean.includes("asm"))
    return "Area Sales Manager";
  if (clean.includes("vegetablessalesmanager"))
    return "Vegetables Sales Manager";
  if (clean.includes("salesmanager") || clean.includes("sm"))
    return "Sales Manager";
  if (
    clean.includes("salesagronomist") ||
    clean.includes("sa") ||
    clean.includes("agronomist")
  )
    return "Sales Agronomist";
  if (clean.includes("businesssolution") || clean.includes("bs"))
    return "Business Solution";
  return pos;
};"""

content = re.sub(r"const normalizePosition = \(pos: string \| undefined\): string => \{.*?\n\};\n", new_normalize + "\n", content, flags=re.DOTALL)

# Fix getPositionRank
new_rank = """const getPositionRank = (pos: string | undefined): number => {
  // Hirarki Posisi (dari yang tertinggi ke terendah):
  const norm = normalizePosition(pos);
  if (norm === "Country Head") return 1;
  if (norm === "Commercial Lead") return 1;
  if (norm === "Business Analyst") return 1;
  if (norm === "Vegetables Sales Manager") return 2;
  if (norm === "Sales Manager") return 2;
  if (norm === "Area Sales Manager") return 3;
  if (norm === "Sales Agronomist") return 4;
  if (norm === "Business Solution") return 5;
  
  const normLower = norm.toLowerCase();
  if (
    normLower.includes("head") || 
    normLower.includes("director") || 
    normLower.includes("vp") || 
    normLower.includes("lead") ||
    normLower.includes("business analyst")
  ) {
    return 1;
  }
  if (normLower.includes("manager")) return 2;
  return 5;
};"""

content = re.sub(r"const getPositionRank = \(pos: string \| undefined\): number => \{.*?\n\};\n", new_rank + "\n", content, flags=re.DOTALL)

# Update default positions everywhere "Sales Manager" is hardcoded
# Search for: "Business Analyst",\n\s*"Sales Manager",\n\s*"Area Sales Manager"
content = re.sub(r'"Sales Manager",\s*"Area Sales Manager"', '"Vegetables Sales Manager",\n      "Area Sales Manager"', content)

# Update default accessRules map
# "Sales Manager": { home: true, partner: true, stock: true, pog: true, overview: false, temp: false, access: false },
content = re.sub(r'"Sales Manager": { home: true, partner: true, stock: true, pog: true, overview: false, temp: false, access: false },', '"Vegetables Sales Manager": { home: true, partner: true, stock: true, pog: true, overview: true, temp: true, access: false },\n      "Commercial Lead": { home: true, partner: true, stock: true, pog: true, overview: true, temp: true, access: false },\n      "Country Head": { home: true, partner: true, stock: true, pog: true, overview: true, temp: true, access: true },', content)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Applied fixes")
