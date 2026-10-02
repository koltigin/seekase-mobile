import { getCategory } from './categories'
import {
  collections,
  collectionsForOwner,
  collectibleItems,
  collectors,
  currentCollector,
  getCollection,
  getCollector,
  itemsForCollection,
} from './mock-data'
import type { CollectibleItem, Collection, Collector } from './types'

export function normalizeCollectorHandle(handle: string) {
  return handle.replace(/^@/, '').toLowerCase()
}

/** Resolve by stable id or handle (with/without @). */
export function resolveCollector(idOrHandle: string): Collector | undefined {
  const raw = idOrHandle.trim()
  if (!raw) {
    return undefined
  }
  const byId = getCollector(raw)
  if (byId) {
    return byId
  }
  const needle = normalizeCollectorHandle(raw)
  return collectors.find((collector) => normalizeCollectorHandle(collector.handle) === needle)
}

export function isOwnCollector(collectorId: string) {
  return collectorId === currentCollector.id
}

export function collectorInterestLabels(collector: Collector, limit = 4) {
  const fromIds =
    collector.interestIds
      ?.map((id) => getCategory(id)?.shortLabel)
      .filter((label): label is string => Boolean(label)) ?? []
  const specialties = collector.specialties ?? []
  const merged = [...specialties, ...fromIds.filter((label) => !specialties.includes(label))]
  return merged.slice(0, limit)
}

export function featuredCollectionsForCollector(collector: Collector): Collection[] {
  const owned = collectionsForOwner(collector.id)
  if (collector.featuredCollectionIds?.length) {
    const featured = collector.featuredCollectionIds
      .map((id) => getCollection(id))
      .filter((entry): entry is Collection => {
        return entry != null && entry.ownerId === collector.id
      })
    if (featured.length > 0) {
      return featured
    }
  }
  return owned.filter((collection) => collection.featured).slice(0, 3)
}

/** Distinct objects owned via the collector’s cabinets — for profile highlights. */
export function highlightItemsForCollector(collectorId: string, limit = 6): CollectibleItem[] {
  const ownedIds = new Set(collectionsForOwner(collectorId).map((collection) => collection.id))
  return collectibleItems.filter((item) => ownedIds.has(item.collectionId)).slice(0, limit)
}

export function itemsOwnedCount(collectorId: string) {
  const ownedIds = new Set(collectionsForOwner(collectorId).map((collection) => collection.id))
  const fromMock = collectibleItems.filter((item) => ownedIds.has(item.collectionId)).length
  return fromMock
}

/** Collectors shown on Discover (exclude self). Prefer featured domains. */
export function discoverCollectors(limit = 6): Collector[] {
  const preferred = ['lina', 'omar', 'kenji', 'elise']
  const ordered = preferred
    .map((id) => getCollector(id))
    .filter((entry): entry is Collector => Boolean(entry))
  const rest = collectors.filter(
    (collector) => collector.id !== currentCollector.id && !preferred.includes(collector.id),
  )
  return [...ordered, ...rest].slice(0, limit)
}

export function searchCollectors(query: string): Collector[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return []
  }
  return collectors.filter((collector) => {
    const hay = [
      collector.id,
      collector.displayName,
      collector.handle,
      collector.bio,
      collector.locationText ?? '',
      ...(collector.specialties ?? []),
      ...(collector.interestIds ?? []).map((id) => getCategory(id)?.label ?? ''),
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

export function searchCollections(query: string): Collection[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return []
  }
  return collections.filter((collection) => {
    const owner = getCollector(collection.ownerId)
    const hay = [
      collection.title,
      collection.description ?? '',
      collection.story ?? '',
      collection.subcategory ?? '',
      ...(collection.tags ?? []),
      owner?.displayName ?? '',
      getCategory(collection.categoryId)?.label ?? '',
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

export function representativeCoverForCollector(collectorId: string) {
  const featured = featuredCollectionsForCollector(getCollector(collectorId) ?? currentCollector)
  if (featured[0]) {
    return featured[0].cover
  }
  const owned = collectionsForOwner(collectorId)
  return owned[0]?.cover
}

export function sampleItemsFromCollection(collectionId: string, limit = 1) {
  return itemsForCollection(collectionId).slice(0, limit)
}
