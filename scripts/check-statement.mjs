// Release check: fails while the accessibility statement still contains <<PLACEHOLDERS>>.
// Run `npm run check:statement` before publishing a tool built from this template.
import { readFileSync } from 'node:fs'

const file = new URL('../src/accessibility/statementConfig.ts', import.meta.url)
const source = readFileSync(file, 'utf8')
const lines = source.split('\n')
const found = lines
  .map((line, index) => ({ line, number: index + 1 }))
  // comments and the documentation block may mention the placeholder syntax
  .filter(({ line }) => /<<[^>]+>>/.test(line) && !line.trim().startsWith('*') && !line.trim().startsWith('//'))

if (found.length > 0) {
  console.error(`Accessibility statement still has ${found.length} placeholder line(s):`)
  for (const { line, number } of found) console.error(`  src/accessibility/statementConfig.ts:${number}  ${line.trim()}`)
  process.exit(1)
}
console.log('Accessibility statement: no placeholders left.')
