import { categoryLabel, getCategory } from '../data/categories'
import { getCollection } from '../data/mock-data'
import type { Collection, CollectionEdit } from './types'

export function resolveCollection(id: string, edits: Record<string, CollectionEdit> = {}): Collection | undefined {
  const base = getCollection(id)
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
  }
}

export function collectionCategoryLine(collection: Collection) {
  const top = getCategory(collection.categoryId)?.label ?? categoryLabel(collection.categoryId)
  if (collection.subcategory) {
    return `${top} · ${collection.subcategory}`
  }
  return top
}
