// Release check for social sharing: reads the BUILT page (dist/index.html) the way Facebook, LinkedIn and X do
// (static HTML, no JavaScript) and verifies the preview card tags and the preview image.
// Run `npm run build` first, then `npm run check:share` (or `npm run check:release`).
import { existsSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const htmlPath = path.join(root, 'dist', 'index.html')
if (!existsSync(htmlPath)) {
  console.error('dist/index.html not found: run `npm run build` first.')
  process.exit(1)
}

const html = readFileSync(htmlPath, 'utf8')
const problems = []
const warnings = []

// Tags are read with a small tokenizer, not [^>]*, because an attribute value may itself contain ">" (e.g. <<TOOL>>).
const tags = (name) => [...html.matchAll(new RegExp(String.raw`<${name}\s(?:[^>"']|"[^"]*"|'[^']*')*>`, 'gi'))].map((match) => {
  const attributes = {}
  for (const attribute of match[0].matchAll(/([a-zA-Z:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    // Vite writes attribute values HTML-escaped (<<TOOL>> becomes &lt;&lt;TOOL&gt;&gt;): decode before checking
    const raw = attribute[3] ?? attribute[4]
    attributes[attribute[1].toLowerCase()] = raw.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  }
  return attributes
})
const metaTags = tags('meta')
const linkTags = tags('link')
const meta = (attr, name) => metaTags.find((tag) => tag[attr] === name)?.content
const link = (rel) => linkTags.find((tag) => tag.rel === rel)?.href

const required = {
  'og:title': meta('property', 'og:title'),
  'og:description': meta('property', 'og:description'),
  'og:url': meta('property', 'og:url'),
  'og:image': meta('property', 'og:image'),
  'og:image:alt': meta('property', 'og:image:alt'),
  'og:type': meta('property', 'og:type'),
  'twitter:card': meta('name', 'twitter:card'),
  'twitter:image:alt': meta('name', 'twitter:image:alt'),
  canonical: link('canonical'),
}

for (const [name, value] of Object.entries(required)) {
  if (!value) problems.push(`${name} is missing or empty`)
  else if (/<<|>>/.test(value)) problems.push(`${name} still has a <<PLACEHOLDER>> (edit src/config/toolConfig.ts): ${value}`)
  else if (value.includes('%VITE_')) problems.push(`${name} was not replaced (check src/config/toolConfig.ts): ${value}`)
}

for (const name of ['og:url', 'og:image', 'canonical']) {
  const value = required[name]
  if (value && !/^https:\/\//i.test(value)) problems.push(`${name} must be an absolute https URL (crawlers cannot resolve relative paths): ${value}`)
}
if (required['twitter:card'] && required['twitter:card'] !== 'summary_large_image') {
  warnings.push(`twitter:card is "${required['twitter:card']}"; summary_large_image shows the large image`)
}
if (required['og:title'] && required['og:title'].length > 90) warnings.push('og:title is longer than 90 characters and may be cut')
if (required['og:description'] && required['og:description'].length > 200) warnings.push('og:description is longer than 200 characters and may be cut')

// The preview image must be a real PNG/JPEG file of the right size, shipped with the build.
const imageUrl = required['og:image']
if (imageUrl && /^https:\/\//i.test(imageUrl) && !/<<|%VITE_/.test(imageUrl)) {
  const relative = new URL(imageUrl).pathname.split('/').slice(-2).join('/') // images/share-preview.png
  const file = path.join(root, 'dist', relative)
  if (!/\.(png|jpe?g)$/i.test(relative)) problems.push(`og:image must be PNG or JPEG (SVG and WebP are not supported by all networks): ${relative}`)
  if (!existsSync(file)) {
    problems.push(`og:image points to ${relative}, but dist/${relative} does not exist (put the file in public/${relative})`)
  } else {
    const buffer = readFileSync(file)
    const bytes = statSync(file).size
    let width
    let height
    if (buffer.subarray(1, 4).toString() === 'PNG') {
      width = buffer.readUInt32BE(16)
      height = buffer.readUInt32BE(20)
    } else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      for (let i = 2; i < buffer.length - 9; ) {
        if (buffer[i] !== 0xff) { i += 1; continue }
        const marker = buffer[i + 1]
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          height = buffer.readUInt16BE(i + 5)
          width = buffer.readUInt16BE(i + 7)
          break
        }
        i += 2 + buffer.readUInt16BE(i + 2)
      }
    } else {
      problems.push(`dist/${relative} is not a valid PNG or JPEG file`)
    }
    if (width && height) {
      if (width < 600 || height < 315) problems.push(`image is ${width}x${height}: Facebook needs at least 600x315 for the large card`)
      else if (width < 1200) warnings.push(`image is ${width}x${height}: 1200x630 gives the sharpest large card`)
      const ratio = width / height
      if (Math.abs(ratio - 1.91) > 0.15) warnings.push(`image ratio is ${ratio.toFixed(2)}:1; 1.91:1 (1200x630) avoids cropping`)
      if (meta('property', 'og:image:width') && Number(meta('property', 'og:image:width')) !== width) {
        warnings.push(`og:image:width says ${meta('property', 'og:image:width')} but the file is ${width} wide`)
      }
    }
    if (bytes > 5 * 1024 * 1024) problems.push(`image is ${(bytes / 1048576).toFixed(1)} MB: X accepts at most 5 MB (Facebook 8 MB)`)
    console.log(`image: dist/${relative}  ${width}x${height}  ${(bytes / 1024).toFixed(0)} KB`)
  }
}

console.log('card:', JSON.stringify({ title: required['og:title'], description: required['og:description'], url: required['og:url'] }))
for (const warning of warnings) console.warn('warning:', warning)
if (problems.length > 0) {
  console.error(`\nSocial sharing check failed (${problems.length}):`)
  for (const problem of problems) console.error('  -', problem)
  process.exit(1)
}
console.log('Social sharing check passed.')
