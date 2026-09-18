import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`])
}
const artifacts = files('dist')
const terms = ['pub_', 'priv_', 'prv_', 'secret', 'api_key', 'token', 'VITE_']
const scan = terms.map(term => ({ term, files: artifacts.flatMap(file => {
  const content = readFileSync(file, 'utf8')
  const exact = content.split(term).length - 1
  const insensitive = content.toLowerCase().split(term.toLowerCase()).length - 1
  return insensitive ? [{ file, exact, insensitive }] : []
}) }))
const fixtures = ['mockServiceWorker', 'setupWorker', 'setupServer', 'msw', 'makeProduct', 'makeCart', 'fixtureDate', 'audit-only', 'test-access', 'VM-TEST-001', 'Kimchi de prueba', 'Quinua de prueba']
const fixtureMatches = fixtures.flatMap(term => artifacts.filter(file => readFileSync(file, 'utf8').includes(term)).map(file => ({ term, file })))
const placeholders = ['Nombre por confirmar', 'Por confirmar', 'Teléfono por confirmar', 'Correo por confirmar', 'picsum.photos', 'images.pexels.com', 'placeholder-product']
const placeholderMatches = placeholders.flatMap(term => artifacts.filter(file => readFileSync(file, 'utf8').includes(term)).map(file => ({ term, file })))
const modules = Object.values(JSON.parse(readFileSync('coverage/bundle/stats.json', 'utf8')).nodeMetas)
const testModules = modules.filter(module => /\/src\/test\/|\.test\.|\/node_modules\/(msw|@mswjs|vitest|@testing-library)\//.test(module.id)).map(module => module.id)
const result = { artifacts, scan, fixtureMatches, placeholderMatches, testModules, note: 'Only matching terms/counts are stored, never adjacent potential secret values. Review token matches manually; zero matches is not proof against every possible secret format.' }
mkdirSync('coverage/hygiene', { recursive: true })
writeFileSync('coverage/hygiene/production.json', JSON.stringify(result, null, 2))
if (fixtureMatches.length || testModules.length) throw new Error('Test code found in production output; inspect coverage/hygiene/production.json')
console.log('Saved production audit; secret-pattern and placeholder matches require review.')
