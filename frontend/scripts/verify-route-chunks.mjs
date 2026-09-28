import { readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'))
const summary = JSON.parse(readFileSync('coverage/bundle/summary.json', 'utf8'))
function closure(key, visited = new Set()) {
  if (visited.has(key)) return visited
  visited.add(key)
  for (const imported of manifest[key].imports ?? []) closure(imported, visited)
  return visited
}
const initialFiles = [...closure('index.html')].map((key) => manifest[key].file)
const initialModules = initialFiles
  .flatMap((file) => summary.chunks[file].modules)
  .map((module) => module.id)
for (const page of ['CheckoutPage', 'CheckoutResultPage', 'RecipeDetailPage'])
  assert(!initialModules.includes(`/src/pages/${page}.tsx`), `${page} leaked into initial load`)
for (const page of ['HomePage', 'CatalogPage'])
  assert(initialModules.includes(`/src/pages/${page}.tsx`), `${page} must stay in initial load`)
assert(
  !initialModules.includes('/src/components/admin/AdminLayout.tsx'),
  'Admin layout leaked into initial load',
)
const adminFiles = [...closure('src/pages/admin/AdminPages.tsx')].map((key) => manifest[key].file)
const recipeFile = manifest['src/pages/admin/RecipeFormPage.tsx'].file
for (const file of initialFiles) {
  const chunk = summary.chunks[file]
  assert(
    !Object.keys(chunk.packages).some((pkg) => pkg.startsWith('@dnd-kit/')),
    `dnd-kit leaked into ${file}`,
  )
  assert(
    !chunk.modules.some((m) => m.id.startsWith('/src/pages/admin/')),
    `Admin page leaked into ${file}`,
  )
}
assert(
  !adminFiles.includes(recipeFile),
  'Recipe form must not be loaded by the general admin entry',
)
for (const file of adminFiles)
  assert(
    !Object.keys(summary.chunks[file].packages).some((pkg) => pkg.startsWith('@dnd-kit/')),
    `Orders admin loads dnd-kit: ${file}`,
  )
assert(
  Object.keys(summary.chunks[recipeFile].packages).some((pkg) => pkg.startsWith('@dnd-kit/')),
  'Expected dnd-kit in recipe form chunk',
)
const totals = initialFiles.reduce(
  (result, file) => {
    const asset = summary.assets.find((asset) => asset.file === file)
    result.bytes += asset.bytes
    result.gzipBytes += asset.gzipBytes
    return result
  },
  { bytes: 0, gzipBytes: 0 },
)
const sharedAdminNamedModules = initialFiles
  .flatMap((file) => summary.chunks[file].modules)
  .filter((module) => /\/(features|components)\/admin\//.test(module.id))
const result = { initialFiles, adminFiles, recipeFile, totals, sharedAdminNamedModules }
writeFileSync('coverage/bundle/route-verification.json', JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
