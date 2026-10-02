import { covers } from './covers'
import {
  collectibleItems,
  collections,
  collectionsForOwner as seedCollectionsForOwner,
  currentCollector,
  getCollection as getSeedCollection,
  getItem as getSeedItem,
  itemsForCollection as seedItemsForCollection,
} from './mock-data'
import type {
  CollectibleItem,
  Collection,
  CollectionEdit,
  ItemEdit,
  ObjectCondition,
  ObjectStatus,
} from './types'

export type CoverKey = keyof typeof covers

export type LocalCollectionRecord = {
  id: string
  title: string
  ownerId: string
  categoryId: string
  subcategory?: string
  tags?: string[]
  description?: string
  story?: string
  coverKey: CoverKey
  createdAt: string
  updatedAt?: string
}

export type LocalItemRecord = {
  id: string
  collectionId: string
  title: string
  year?: string
  coverKey: CoverKey
  categoryId?: string
  subcategory?: string
  tags?: string[]
  status?: ObjectStatus
  condition?: ObjectCondition
  story?: string
  provenance?: string
  maker?: string
  author?: string
  publisher?: string
  issuer?: string
  manufacturer?: string
  country?: string
  era?: string
  material?: string
  denomination?: string
  edition?: string
  model?: string
  acquisitionYear?: string
  acquisitionPlace?: string
  note?: string
  createdAt: string
  updatedAt?: string
}

export type UserCollectionsMap = Record<string, LocalCollectionRecord>
export type UserItemsMap = Record<string, LocalItemRecord>

const COVER_KEYS = Object.keys(covers) as CoverKey[]

const CATEGORY_COVER: Record<string, CoverKey> = {
  books: 'scifi',
  coins: 'coins',
  stamps: 'stamps',
  'retro-tech': 'walkman',
  cameras: 'cameras',
  'natural-history': 'nature',
  art: 'art',
  paperbacks: 'paperbacks',
}

export function isCoverKey(value: unknown): value is CoverKey {
  return typeof value === 'string' && COVER_KEYS.includes(value as CoverKey)
}

export function coverForCategory(categoryId: string): CoverKey {
  return CATEGORY_COVER[categoryId] ?? 'scifi'
}

export function resolveCover(key: CoverKey | undefined, categoryId?: string) {
  if (key && isCoverKey(key)) {
    return covers[key]
  }
  return covers[coverForCategory(categoryId ?? 'books')]
}

export function newLocalId(kind: 'col' | 'item') {
  return `local-${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function isLocalCollectionId(id: string, userCollections: UserCollectionsMap) {
  return Boolean(userCollections[id])
}

export function isLocalItemId(id: string, userItems: UserItemsMap) {
  return Boolean(userItems[id])
}

/** Seed Ada cabinets stay editable; only local records are deletable. */
export function canEditCollection(collection: Collection | undefined) {
  return Boolean(collection && collection.ownerId === currentCollector.id)
}

export function canDeleteCollection(id: string, userCollections: UserCollectionsMap) {
  const record = userCollections[id]
  return Boolean(record && record.ownerId === currentCollector.id)
}

export function canEditItem(item: CollectibleItem | undefined, collection: Collection | undefined) {
  return Boolean(item && collection && collection.ownerId === currentCollector.id)
}

export function canDeleteItem(id: string, userItems: UserItemsMap) {
  return Boolean(userItems[id])
}

export function sanitizeUserCollections(raw: unknown): UserCollectionsMap {
  if (!raw || typeof raw !== 'object') {
    return {}
  }
  const next: UserCollectionsMap = {}
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') {
      continue
    }
    const entry = value as Partial<LocalCollectionRecord>
    if (typeof entry.id !== 'string' || typeof entry.title !== 'string' || typeof entry.categoryId !== 'string') {
      continue
    }
    next[id] = {
      id: entry.id,
      title: entry.title,
      ownerId: typeof entry.ownerId === 'string' ? entry.ownerId : currentCollector.id,
      categoryId: entry.categoryId,
      subcategory: entry.subcategory,
      tags: Array.isArray(entry.tags) ? entry.tags.filter((tag): tag is string => typeof tag === 'string') : undefined,
      description: entry.description,
      story: entry.story,
      coverKey: isCoverKey(entry.coverKey) ? entry.coverKey : coverForCategory(entry.categoryId),
      createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
      updatedAt: entry.updatedAt,
    }
  }
  return next
}

export function sanitizeUserItems(raw: unknown): UserItemsMap {
  if (!raw || typeof raw !== 'object') {
    return {}
  }
  const next: UserItemsMap = {}
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') {
      continue
    }
    const entry = value as Partial<LocalItemRecord>
    if (typeof entry.id !== 'string' || typeof entry.title !== 'string' || typeof entry.collectionId !== 'string') {
      continue
    }
    next[id] = {
      id: entry.id,
      collectionId: entry.collectionId,
      title: entry.title,
      year: entry.year,
      coverKey: isCoverKey(entry.coverKey) ? entry.coverKey : coverForCategory(entry.categoryId ?? 'books'),
      categoryId: entry.categoryId,
      subcategory: entry.subcategory,
      tags: Array.isArray(entry.tags) ? entry.tags.filter((tag): tag is string => typeof tag === 'string') : undefined,
      status: entry.status,
      condition: entry.condition,
      story: entry.story,
      provenance: entry.provenance,
      maker: entry.maker,
      author: entry.author,
      publisher: entry.publisher,
      issuer: entry.issuer,
      manufacturer: entry.manufacturer,
      country: entry.country,
      era: entry.era,
      material: entry.material,
      denomination: entry.denomination,
      edition: entry.edition,
      model: entry.model,
      acquisitionYear: entry.acquisitionYear,
      acquisitionPlace: entry.acquisitionPlace,
      note: entry.note,
      createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
      updatedAt: entry.updatedAt,
    }
  }
  return next
}

function itemCountForCollection(collectionId: string, userItems: UserItemsMap) {
  const seedCount = seedItemsForCollection(collectionId).length
  const localCount = Object.values(userItems).filter((item) => item.collectionId === collectionId).length
  if (getSeedCollection(collectionId)) {
    // Prefer live grid size when seed has mock items; otherwise keep seed itemCount for sparse cabinets.
    const live = seedCount + localCount
    return live > 0 ? live : (getSeedCollection(collectionId)?.itemCount ?? 0) + localCount
  }
  return localCount
}

export function hydrateLocalCollection(
  record: LocalCollectionRecord,
  userItems: UserItemsMap,
  edits: Record<string, CollectionEdit> = {},
): Collection {
  const patch = edits[record.id]
  const merged = { ...record, ...patch, tags: patch?.tags ?? record.tags }
  return {
    id: merged.id,
    title: merged.title,
    ownerId: merged.ownerId,
    categoryId: merged.categoryId,
    subcategory: merged.subcategory,
    tags: merged.tags,
    description: merged.description,
    story: merged.story,
    itemCount: itemCountForCollection(merged.id, userItems),
    likeCount: 0,
    followerCount: 0,
    featured: false,
    cover: resolveCover(merged.coverKey, merged.categoryId),
  }
}

export function hydrateLocalItem(record: LocalItemRecord, edits: Record<string, ItemEdit> = {}): CollectibleItem {
  const patch = edits[record.id]
  const merged = { ...record, ...patch, tags: patch?.tags ?? record.tags }
  const image = resolveCover(merged.coverKey, merged.categoryId)
  return {
    id: merged.id,
    collectionId: merged.collectionId,
    title: merged.title,
    year: merged.year,
    image,
    images: [image],
    categoryId: merged.categoryId,
    subcategory: merged.subcategory,
    tags: merged.tags,
    status: merged.status ?? 'in-collection',
    condition: merged.condition,
    story: merged.story,
    provenance: merged.provenance,
    likeCount: 0,
    maker: merged.maker,
    author: merged.author,
    publisher: merged.publisher,
    issuer: merged.issuer,
    manufacturer: merged.manufacturer,
    country: merged.country,
    era: merged.era,
    material: merged.material,
    denomination: merged.denomination,
    edition: merged.edition,
    model: merged.model,
    acquisitionYear: merged.acquisitionYear,
    acquisitionPlace: merged.acquisitionPlace,
    note: merged.note,
  }
}

export function mergeResolveCollection(
  id: string,
  userCollections: UserCollectionsMap,
  userItems: UserItemsMap,
  edits: Record<string, CollectionEdit> = {},
): Collection | undefined {
  const local = userCollections[id]
  if (local) {
    return hydrateLocalCollection(local, userItems, edits)
  }
  const base = getSeedCollection(id)
  if (!base) {
    return undefined
  }
  const patch = edits[id]
  const localExtra = Object.values(userItems).filter((item) => item.collectionId === id).length
  const next: Collection = {
    ...base,
    ...(patch ?? {}),
    tags: patch?.tags ?? base.tags,
    itemCount: itemCountForCollection(id, userItems) || base.itemCount + localExtra,
  }
  return next
}

export function mergeResolveItem(
  id: string,
  userItems: UserItemsMap,
  edits: Record<string, ItemEdit> = {},
): CollectibleItem | undefined {
  const local = userItems[id]
  if (local) {
    return hydrateLocalItem(local, edits)
  }
  const base = getSeedItem(id)
  if (!base) {
    return undefined
  }
  const patch = edits[id]
  if (!patch) {
    return base
  }
  return {
    ...base,
    ...patch,
    tags: patch.tags ?? base.tags,
    year: patch.year ?? base.year,
    story: patch.story ?? base.story,
    provenance: patch.provenance ?? base.provenance,
  }
}

export function mergeItemsForCollection(
  collectionId: string,
  userItems: UserItemsMap,
  edits: Record<string, ItemEdit> = {},
): CollectibleItem[] {
  const seed = seedItemsForCollection(collectionId).map((item) => mergeResolveItem(item.id, userItems, edits)!)
  const local = Object.values(userItems)
    .filter((item) => item.collectionId === collectionId)
    .map((item) => hydrateLocalItem(item, edits))
    .sort((a, b) => {
      const aTime = userItems[a.id]?.createdAt ?? ''
      const bTime = userItems[b.id]?.createdAt ?? ''
      return bTime.localeCompare(aTime)
    })
  return [...local, ...seed]
}

export function mergeCollectionsForOwner(
  ownerId: string,
  userCollections: UserCollectionsMap,
  userItems: UserItemsMap,
  edits: Record<string, CollectionEdit> = {},
): Collection[] {
  const local = Object.values(userCollections)
    .filter((entry) => entry.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((entry) => hydrateLocalCollection(entry, userItems, edits))
  const seed = seedCollectionsForOwner(ownerId).map(
    (entry) => mergeResolveCollection(entry.id, userCollections, userItems, edits)!,
  )
  return [...local, ...seed]
}

export function allMergedCollections(
  userCollections: UserCollectionsMap,
  userItems: UserItemsMap,
  edits: Record<string, CollectionEdit> = {},
): Collection[] {
  const seedIds = new Set(collections.map((entry) => entry.id))
  const seed = collections.map((entry) => mergeResolveCollection(entry.id, userCollections, userItems, edits)!)
  const local = Object.values(userCollections)
    .filter((entry) => !seedIds.has(entry.id))
    .map((entry) => hydrateLocalCollection(entry, userItems, edits))
  return [...local, ...seed]
}

export function allMergedItems(userItems: UserItemsMap, edits: Record<string, ItemEdit> = {}): CollectibleItem[] {
  const seedIds = new Set(collectibleItems.map((entry) => entry.id))
  const seed = collectibleItems.map((entry) => mergeResolveItem(entry.id, userItems, edits)!)
  const local = Object.values(userItems)
    .filter((entry) => !seedIds.has(entry.id))
    .map((entry) => hydrateLocalItem(entry, edits))
  return [...local, ...seed]
}

export function ownedCollectionCount(ownerId: string, userCollections: UserCollectionsMap) {
  return mergeCollectionsForOwner(ownerId, userCollections, {}, {}).length
}

export function ownedItemCount(ownerId: string, userCollections: UserCollectionsMap, userItems: UserItemsMap) {
  const ownedCollectionIds = new Set(
    mergeCollectionsForOwner(ownerId, userCollections, userItems, {}).map((entry) => entry.id),
  )
  return allMergedItems(userItems).filter((item) => ownedCollectionIds.has(item.collectionId)).length
}

export function searchMergedCollections(
  query: string,
  userCollections: UserCollectionsMap,
  userItems: UserItemsMap,
  edits: Record<string, CollectionEdit> = {},
): Collection[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return []
  }
  return allMergedCollections(userCollections, userItems, edits).filter((collection) => {
    const hay = [collection.title, collection.description ?? '', collection.story ?? '', collection.subcategory ?? '', ...(collection.tags ?? [])]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

export function searchMergedItems(
  query: string,
  userItems: UserItemsMap,
  edits: Record<string, ItemEdit> = {},
): CollectibleItem[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return []
  }
  return allMergedItems(userItems, edits).filter((item) => {
    const hay = [item.title, item.year ?? '', item.story ?? '', item.subcategory ?? '', ...(item.tags ?? [])]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}
