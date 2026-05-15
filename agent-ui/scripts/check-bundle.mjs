// Post-build check: fail if production bundle contains dev/localhost strings
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const DIST = process.argv[2] ?? 'dist'
const FORBIDDEN = ['localhost:', '127.0.0.1', '::1']

const jsFiles = readdirSync(DIST + '/assets').filter((f) => f.endsWith('.js'))
const failures = []

for (const file of jsFiles) {
  const content = readFileSync(join(DIST, 'assets', file), 'utf8')
  for (const pattern of FORBIDDEN) {
    if (content.includes(pattern)) {
      failures.push(`${file}: contains "${pattern}"`)
    }
  }
}

if (failures.length > 0) {
  console.error('Build contains forbidden patterns:')
  failures.forEach((f) => console.error(' ', f))
  process.exit(1)
}

console.log('Bundle check passed — no dev strings found.')
