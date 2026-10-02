import type { PublicCollectionSummary } from '../repositories/discover-repository'
import { catalogCategories, searchCategories } from './categories'

export function catalogCategoryCounts(collections: PublicCollectionSummary[]) {
  const counts = new Map<string, number>()
  for (const collection of collections) {
    counts.set(collection.categoryId, (counts.get(collection.categoryId) ?? 0) + 1)
  }
  return counts
}

export function visibleCatalogCategories(query: string) {
  return query.trim() ? searchCategories(query) : catalogCategories
}

export function publicCollectionsInCategory(collections: PublicCollectionSummary[], categoryId: string) {
  return collections.filter((collection) => collection.categoryId === categoryId)
}
