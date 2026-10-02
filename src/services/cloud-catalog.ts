import type { Collection, CollectibleItem } from '../data/types'
import { requireCloudAccount } from '../repositories/cloud-access'
import * as catalog from '../repositories/catalog-repository'
import type { RepoResult } from '../repositories/errors'

export type CloudCatalogSnapshot = { collections: Collection[]; items: CollectibleItem[] }
export type CloudCatalogAction =
  | { kind: 'create-collection'; input: catalog.CloudCollectionInput }
  | { kind: 'update-collection'; id: string; input: Partial<catalog.CloudCollectionInput> }
  | { kind: 'delete-collection'; id: string }
  | { kind: 'create-ungrouped-item'; input: Omit<catalog.CloudItemInput, 'collectionId'> }
  | { kind: 'create-item'; input: catalog.CloudItemInput }
  | { kind: 'update-item'; id: string; input: Partial<catalog.CloudItemInput> }
  | { kind: 'delete-item'; id: string }

export function unwrapRepo<T>(result: RepoResult<T>): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

function assertActive(signal?: AbortSignal) {
  if (signal?.aborted) throw new Error('Request cancelled.')
}

export async function loadCloudCatalog(ownerId: string, signal?: AbortSignal): Promise<CloudCatalogSnapshot> {
  unwrapRepo(await requireCloudAccount(ownerId, signal))
  assertActive(signal)
  const [collectionResult, itemResult] = await Promise.all([
    catalog.listOwnCollections(ownerId, signal),
    catalog.listOwnItems(ownerId, signal),
  ])
  assertActive(signal)
  const items = unwrapRepo(itemResult)
  const counts = new Map<string, number>()
  for (const item of items) counts.set(item.collectionId, (counts.get(item.collectionId) ?? 0) + 1)
  const collections = unwrapRepo(collectionResult).map((collection) => ({
    ...collection,
    itemCount: counts.get(collection.id) ?? 0,
  }))
  return { collections, items }
}

/** Explicit user actions only. No automatic local import, offline queue or write retry. */
export async function changeCloudCatalog(
  ownerId: string,
  action: CloudCatalogAction,
  signal?: AbortSignal,
): Promise<string | true> {
  unwrapRepo(await requireCloudAccount(ownerId, signal))
  assertActive(signal)
  switch (action.kind) {
    case 'create-collection':
      return unwrapRepo(await catalog.createCloudCollection(ownerId, action.input, signal)).id
    case 'update-collection':
      return unwrapRepo(await catalog.updateCloudCollection(ownerId, action.id, action.input, signal)).id
    case 'delete-collection':
      return unwrapRepo(await catalog.deleteCloudCollection(ownerId, action.id, signal))
    case 'create-ungrouped-item': {
      // No automatic retries: a network failure may already have committed a write.
      const collections = unwrapRepo(await catalog.listOwnCollections(ownerId, signal))
      assertActive(signal)
      let group = collections.find((entry) => entry.title === 'My objects' && entry.categoryId === 'other')
      if (!group) {
        group = unwrapRepo(
          await catalog.createCloudCollection(
            ownerId,
            {
              title: 'My objects',
              categoryId: 'other',
              description: 'Objects you can organize into collections later.',
            },
            signal,
          ),
        )
      }
      assertActive(signal)
      return unwrapRepo(await catalog.createCloudItem(ownerId, { ...action.input, collectionId: group.id }, signal)).id
    }
    case 'create-item':
      return unwrapRepo(await catalog.createCloudItem(ownerId, action.input, signal)).id
    case 'update-item':
      return unwrapRepo(await catalog.updateCloudItem(ownerId, action.id, action.input, signal)).id
    case 'delete-item':
      return unwrapRepo(await catalog.deleteCloudItem(ownerId, action.id, signal))
  }
}
