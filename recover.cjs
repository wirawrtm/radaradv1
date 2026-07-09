const fs = require('fs');
const content = fs.readFileSync('/tmp/App_from_vite.js', 'utf8');
const match = content.match(/\/\/# sourceMappingURL=data:application\/json;base64,(.*)$/);
if (match) {
    const base64 = match[1];
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    const map = JSON.parse(jsonStr);
    const originalCode = map.sourcesContent[0];
    fs.writeFileSync('src/App.tsx.recovered', originalCode);
    console.log("Recovered successfully!");
} else {
    console.log("No sourcemap found.");
}
