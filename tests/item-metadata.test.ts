import { describe, expect, it } from 'vitest'
import { itemMetadataRows } from '../src/data/item-metadata'
import type { CollectibleItem } from '../src/data/types'

const item: CollectibleItem = { id: 'test', collectionId: 'test', title: 'Test', image: 1 }
describe('category metadata visibility', () => {
  it('shows a stamp issuer entered by the short editor', () => {
    expect(itemMetadataRows({ ...item, categoryId: 'stamps', issuer: 'Postal service' })).toContainEqual({
      label: 'Issuer',
      value: 'Postal service',
    })
  })
  it('retains metadata visibility after moving to another category', () => {
    const result = itemMetadataRows({
      ...item,
      categoryId: 'coins',
      author: 'Author',
      publisher: 'Publisher',
      maker: 'Maker',
    })
    expect(result).toEqual(
      expect.arrayContaining([
        { label: 'Author', value: 'Author' },
        { label: 'Publisher', value: 'Publisher' },
        { label: 'Maker', value: 'Maker' },
      ]),
    )
  })
  it('does not duplicate country and year when category-specific labels exist', () => {
    expect(itemMetadataRows({ ...item, categoryId: 'books', country: 'Türkiye', year: '2020' })).toEqual([
      { label: 'Year', value: '2020' },
      { label: 'Origin', value: 'Türkiye' },
    ])
  })
  it('keeps empty fields hidden and trims displayed values', () => {
    expect(itemMetadataRows({ ...item, categoryId: 'books', publisher: '  Publisher  ', maker: '   ' })).toEqual([
      { label: 'Publisher', value: 'Publisher' },
    ])
  })
})
