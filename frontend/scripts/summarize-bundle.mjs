import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { gzipSync, brotliCompressSync } from 'node:zlib'
const stats = JSON.parse(readFileSync('coverage/bundle/stats.json', 'utf8'))
const chunks = {}
for (const meta of Object.values(stats.nodeMetas)) {
  const match = meta.id.match(/\/node_modules\/((?:@[^/]+\/)?[^/]+)/)
  const group = match?.[1] ?? (meta.id.startsWith('/src/') ? 'application' : 'other')
  for (const [chunk, partId] of Object.entries(meta.moduleParts)) {
    const size = stats.nodeParts[partId].renderedLength
    const entry = (chunks[chunk] ??= { packages: {}, modules: [] })
    entry.packages[group] = (entry.packages[group] ?? 0) + size
    entry.modules.push({ id: meta.id, size })
  }
}
const assets = readdirSync('dist/assets')
  .filter((name) => /\.(js|css)$/.test(name))
  .map((name) => {
    const data = readFileSync(`dist/assets/${name}`)
    return {
      file: `assets/${name}`,
      bytes: data.length,
      gzipBytes: gzipSync(data).length,
      brotliBytes: brotliCompressSync(data).length,
    }
  })
const summary = {
  units:
    'bytes; module attribution from visualizer source maps; compressed sizes are whole-file sizes',
  assets,
  chunks,
}
writeFileSync('coverage/bundle/summary.json', JSON.stringify(summary, null, 2))
for (const asset of assets) console.log(asset)
for (const [chunk, data] of Object.entries(chunks)) {
  console.log(
    chunk,
    Object.entries(data.packages).sort((a, b) => b[1] - a[1]),
  )
  console.log(
    'Admin modules',
    data.modules
      .filter((m) => /\/(pages|features|components)\/admin\//.test(m.id))
      .reduce((a, m) => a + m.size, 0),
  )
  console.log(
    'Top application',
    data.modules
      .filter((m) => m.id.startsWith('/src/'))
      .sort((a, b) => b.size - a.size)
      .slice(0, 12),
  )
}
