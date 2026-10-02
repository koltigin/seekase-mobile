import { describe, expect, it } from 'vitest'
import {
  catalogCategoryCounts,
  publicCollectionsInCategory,
  visibleCatalogCategories,
} from '../src/data/public-catalog'
import type { PublicCollectionSummary } from '../src/repositories/discover-repository'

const owner = { id: 'owner-1', displayName: 'Collector', handle: 'collector' }
const collections: PublicCollectionSummary[] = [
  {
    id: 'books-1',
    title: 'Library',
    categoryId: 'books',
    tags: [],
    owner,
    itemCount: 2,
    likeCount: 0,
    createdAt: '2026-09-23T00:00:00.000Z',
  },
  {
    id: 'books-2',
    title: 'First Editions',
    categoryId: 'books',
    tags: [],
    owner,
    itemCount: 1,
    likeCount: 0,
    createdAt: '2026-09-23T00:00:00.000Z',
  },
  {
    id: 'coins-1',
    title: 'Coins',
    categoryId: 'coins',
    tags: [],
    owner,
    itemCount: 3,
    likeCount: 0,
    createdAt: '2026-09-23T00:00:00.000Z',
  },
]

describe('public catalog', () => {
  it('counts public collections by category', () => {
    const counts = catalogCategoryCounts(collections)
    expect(counts.get('books')).toBe(2)
    expect(counts.get('coins')).toBe(1)
    expect(counts.get('art')).toBeUndefined()
  })

  it('filters public collections for a selected category', () => {
    expect(publicCollectionsInCategory(collections, 'books').map((collection) => collection.id)).toEqual([
      'books-1',
      'books-2',
    ])
  })

  it('finds a category by subcategory name', () => {
    expect(visibleCatalogCategories('rangefinder').map((category) => category.id)).toContain('cameras')
  })
})
