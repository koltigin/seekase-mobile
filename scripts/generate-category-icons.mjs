import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'assets/brand/category-icon-paths.json')
const output = path.join(root, 'assets/brand/icons/categories')
const icons = JSON.parse(await readFile(source, 'utf8'))

await mkdir(output, { recursive: true })

for (const [id, d] of Object.entries(icons)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="${d}" stroke="#F3EEE4" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>\n`
  await writeFile(path.join(output, `${id}.svg`), svg)
}

console.log(`Generated ${Object.keys(icons).length} category icons in ${path.relative(root, output)}`)
