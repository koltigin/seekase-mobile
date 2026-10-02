import { getCollection, getItem } from './mock-data'
import { categoryLabel, getCategory } from './categories'
import type { CollectibleItem, Collection, ItemEdit } from './types'

export function resolveItem(id: string, edits: Record<string, ItemEdit>): CollectibleItem | undefined {
  const base = getItem(id)
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

export function itemCategoryLine(item: CollectibleItem, collection?: Collection): string {
  const resolvedCollection = collection ?? getCollection(item.collectionId)
  const categoryId = item.categoryId ?? resolvedCollection?.categoryId
  const category = categoryId ? getCategory(categoryId) : undefined
  const top = category?.label ?? (categoryId ? categoryLabel(categoryId) : 'Object')
  if (item.subcategory) {
    return `${top} · ${item.subcategory}`
  }
  if (resolvedCollection?.subcategory) {
    return `${top} · ${resolvedCollection.subcategory}`
  }
  return top
}
