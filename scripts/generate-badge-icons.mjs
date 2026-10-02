import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'assets/brand/badge-icon-paths.json')
const output = path.join(root, 'assets/brand/badges/achievements')
const icons = JSON.parse(await readFile(source, 'utf8'))

await mkdir(output, { recursive: true })

for (const [id, paths] of Object.entries(icons)) {
  const accent = paths.accent ? `<path d="${paths.accent}" fill="#C47B6A"/>` : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="${paths.primary}" stroke="#F3EEE4" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>${accent}</svg>\n`
  await writeFile(path.join(output, `${id}.svg`), svg)
}

console.log(`Generated ${Object.keys(icons).length} badge icons in ${path.relative(root, output)}`)
