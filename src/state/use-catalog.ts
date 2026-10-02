import { useMemo } from 'react'
import {
  canDeleteCollection,
  canDeleteItem,
  canEditCollection,
  canEditItem,
  isLocalCollectionId,
  isLocalItemId,
  mergeCollectionsForOwner,
  mergeItemsForCollection,
  mergeResolveCollection,
  mergeResolveItem,
  ownedCollectionCount,
  ownedItemCount,
  searchMergedCollections,
  searchMergedItems,
} from '../data/local-catalog'
import { currentCollector } from '../data/mock-data'
import { useAppState } from './app-state'

/** Merged seed + local catalog accessors for screens. */
export function useCatalog() {
  const state = useAppState()
  const { userCollections, userItems, collectionEdits, itemEdits } = state

  return useMemo(
    () => ({
      userCollections,
      userItems,
      getCollection: (id: string) => mergeResolveCollection(id, userCollections, userItems, collectionEdits),
      getItem: (id: string) => mergeResolveItem(id, userItems, itemEdits),
      itemsForCollection: (collectionId: string) => mergeItemsForCollection(collectionId, userItems, itemEdits),
      collectionsForOwner: (ownerId: string) =>
        mergeCollectionsForOwner(ownerId, userCollections, userItems, collectionEdits),
      ownCollections: mergeCollectionsForOwner(currentCollector.id, userCollections, userItems, collectionEdits),
      ownCollectionCount: ownedCollectionCount(currentCollector.id, userCollections),
      ownItemCount: ownedItemCount(currentCollector.id, userCollections, userItems),
      isLocalCollection: (id: string) => isLocalCollectionId(id, userCollections),
      isLocalItem: (id: string) => isLocalItemId(id, userItems),
      canEditCollection,
      canDeleteCollection: (id: string) => canDeleteCollection(id, userCollections),
      canEditItem,
      canDeleteItem: (id: string) => canDeleteItem(id, userItems),
      searchCollections: (query: string) => searchMergedCollections(query, userCollections, userItems, collectionEdits),
      searchItems: (query: string) => searchMergedItems(query, userItems, itemEdits),
      createCollection: state.createCollection,
      updateUserCollection: state.updateUserCollection,
      deleteUserCollection: state.deleteUserCollection,
      createItem: state.createItem,
      updateUserItem: state.updateUserItem,
      deleteUserItem: state.deleteUserItem,
      updateCollectionEdit: state.updateCollectionEdit,
      updateItemEdit: state.updateItemEdit,
    }),
    [state, userCollections, userItems, collectionEdits, itemEdits],
  )
}
