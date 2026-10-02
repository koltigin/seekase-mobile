import { expect, it } from 'vitest'
import categoryIconPaths from '../assets/brand/category-icon-paths.json'
import { categories } from '../src/data/categories'

it('provides one vector icon for every category and the All control', () => {
  expect(Object.keys(categoryIconPaths).sort()).toEqual(categories.map((category) => category.id).sort())
})

it('keeps every icon path non-empty and free from text glyphs', () => {
  for (const [id, path] of Object.entries(categoryIconPaths)) {
    expect(path.length, id).toBeGreaterThan(10)
    expect(path, id).toMatch(/^[0-9A-Za-z .,-]+$/)
  }
})
