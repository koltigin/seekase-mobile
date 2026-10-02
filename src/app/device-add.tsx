import { useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CloudEditor } from '../components/catalog/cloud-editor'
import { Screen } from '../components/ui/screen'
import { coverForCategory } from '../data/local-catalog'
import type { CloudCatalogAction } from '../services/cloud-catalog'
import { useCatalog } from '../state/use-catalog'

export default function DeviceAddScreen() {
  const params = useLocalSearchParams<{ mode?: string; collectionId?: string }>()
  const mode = params.mode === 'collection' ? 'collection' : 'item'
  return (
    <DeviceAddSession
      key={`${mode}:${params.collectionId ?? ''}`}
      mode={mode}
      initialCollectionId={typeof params.collectionId === 'string' ? params.collectionId : undefined}
    />
  )
}

function DeviceAddSession({
  mode,
  initialCollectionId,
}: {
  mode: 'collection' | 'item'
  initialCollectionId?: string
}) {
  const catalog = useCatalog()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const saving = useRef(false)
  const groupId = useRef<string | null>(null)

  function save(action: CloudCatalogAction) {
    if (saving.current) return
    saving.current = true
    try {
      if (action.kind === 'create-collection') {
        const id = catalog.createCollection({ ...action.input, subcategory: action.input.subcategoryId })
        if (!id) throw new Error('Could not save the collection.')
        router.replace(`/collection/${id}`)
        return
      }
      if (action.kind !== 'create-item' && action.kind !== 'create-ungrouped-item') {
        throw new Error('This device action is not available.')
      }
      let collectionId = action.kind === 'create-item' ? action.input.collectionId : groupId.current
      if (!collectionId) {
        collectionId =
          (catalog.userCollections &&
            Object.values(catalog.userCollections).find(
              (entry) => entry.title === 'My objects' && entry.categoryId === 'other',
            )?.id) ||
          null
      }
      if (!collectionId) {
        collectionId = catalog.createCollection({
          title: 'My objects',
          categoryId: 'other',
          description: 'Objects you can organize into collections later.',
        })
      }
      if (!collectionId) throw new Error('Could not save. Please try again.')
      groupId.current = collectionId
      const id = catalog.createItem({
        ...action.input,
        collectionId,
        subcategory: action.input.subcategoryId,
        coverKey: coverForCategory(action.input.categoryId),
      })
      if (!id) throw new Error('Could not save the item. Your collection is still available.')
      router.replace(`/item/${id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save.')
      saving.current = false
    }
  }

  return (
    <Screen>
      <CloudEditor
        destination="device"
        target={
          mode === 'collection'
            ? { kind: 'collection' }
            : {
                kind: 'item',
                collection: initialCollectionId ? catalog.getCollection(initialCollectionId) : undefined,
              }
        }
        collections={mode === 'item' ? catalog.ownCollections : undefined}
        busy={false}
        error={error}
        onSave={save}
        onCancel={() => router.back()}
      />
    </Screen>
  )
}
