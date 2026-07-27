const fs = require('fs');
const path = require('path');

const viewCode = fs.readFileSync(path.join(__dirname, '../js/insightsView.js'), 'utf8');
const translations = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/translations.json'), 'utf8'));

const matches = viewCode.match(/t\(['"][A-Z0-9_]+['"]\)/g) || [];
const keysUsed = [...new Set(matches.map(m => m.replace(/t\(['"]|['"]\)/g, '')))];

const missing = keysUsed.filter(k => !translations[k]);
console.log('Total keys used in insightsView.js:', keysUsed.length);
console.log('Missing keys in translations.json:', missing);
