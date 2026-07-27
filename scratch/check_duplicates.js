const fs = require('fs');

const content = fs.readFileSync('data/translations.json', 'utf8');
const lines = content.split('\n');
const seen = {};
const duplicates = [];

lines.forEach((line, idx) => {
  const match = line.match(/^\s*"([^"]+)"\s*:/);
  if (match) {
    const k = match[1];
    // Ignore language code keys inside objects like "EN", "DE", "FR"
    if (k === 'EN' || k === 'DE' || k === 'FR') return;
    if (seen[k]) {
      duplicates.push({ key: k, firstLine: seen[k], duplicateLine: idx + 1 });
    } else {
      seen[k] = idx + 1;
    }
  }
});

console.log('Total translation keys found:', Object.keys(seen).length);
console.log('Duplicate keys count:', duplicates.length);
if (duplicates.length > 0) {
  console.log('Duplicates:', JSON.stringify(duplicates, null, 2));
}
