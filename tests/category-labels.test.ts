import { expect, it } from 'vitest'
import { catalogCategories, collectibleLabels } from '../src/data/categories'

it('provides specific terminology for every built-in category', () => {
  for (const category of catalogCategories.filter((entry) => entry.id !== 'other')) {
    const result = collectibleLabels(category.id)
    expect(result.singular, category.id).not.toBe('collectible')
    expect(result.singular, category.id).not.toBe('object')
    expect(result.plural, category.id).toBeTruthy()
  }
})
it('preserves custom category names without guessing their plural', () => {
  expect(collectibleLabels('other', '  Çakmaklar  ')).toEqual({
    singular: 'Çakmaklar entry',
    plural: 'Çakmaklar entries',
    title: 'Çakmaklar — name',
  })
})
it('handles irregular plurals and unknown categories', () => {
  expect(collectibleLabels('watches').plural).toBe('watches / clocks')
  expect(collectibleLabels('maps').plural).toBe('maps / atlases')
  expect(collectibleLabels('future-category').title).toBe('Collectible name')
})
