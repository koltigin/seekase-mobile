import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AccountPhoto } from '../components/catalog/account-photo'
import type { PhotoDraft } from '../services/pick-photo'
import { Screen } from '../components/ui/screen'
import { BackButton } from '../components/ui/back-button'
import { CloudButton } from '../components/catalog/cloud-controls'
import { CloudEditor, type CloudEditorTarget } from '../components/catalog/cloud-editor'
import { CloudComments } from '../components/social/cloud-comments'
import { categoryLabel, collectibleLabels } from '../data/categories'
import { itemMetadataRows } from '../data/item-metadata'
import { useAuth } from '../state/auth'
import { useTheme } from '../state/app-state'
import { useCloudCatalog } from '../state/use-cloud-catalog'
import type { CloudCatalogAction } from '../services/cloud-catalog'
import { radius, type } from '../theme/tokens'

export default function CloudCollectionsScreen() {
  const { user } = useAuth()
  const { colors } = useTheme()
  const router = useRouter()
  if (!user)
    return (
      <Screen>
        <View style={{ gap: 20 }}>
          <Text style={{ ...type.title, color: colors.ink }}>Account collections</Text>
          <Text style={{ ...type.body, color: colors.muted }}>
            Sign in to keep collections with your account. Collections on this device stay separate.
          </Text>
          <CloudButton label="Open account" onPress={() => router.replace('/account')} />
          <CloudButton label="Device collections" secondary onPress={() => router.replace('/device-collections')} />
        </View>
      </Screen>
    )
  // Discard drafts, errors and cache immediately when the signed-in account changes.
  return <AccountCatalogSession key={user.id} ownerId={user.id} />
}

function AccountCatalogSession({ ownerId }: { ownerId: string }) {
  const [client] = useState(() => new QueryClient())
  useEffect(() => () => client.clear(), [client])
  return (
    <QueryClientProvider client={client}>
      <AccountCatalog ownerId={ownerId} />
    </QueryClientProvider>
  )
}

function AccountCatalog({ ownerId }: { ownerId: string }) {
  const { colors } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ add?: string; collection?: string }>()
  const { query, change, busy } = useCloudCatalog(ownerId)
  const [collectionId, setCollectionId] = useState<string | null>(params.collection ?? null)
  const [itemId, setItemId] = useState<string | null>(null)
  const [editor, setEditor] = useState<CloudEditorTarget | null>(
    params.add === 'object' ? { kind: 'item' } : params.add === 'collection' ? { kind: 'collection' } : null,
  )
  const [confirmation, setConfirmation] = useState<{ action: CloudCatalogAction; title: string } | null>(null)
  const [writeError, setWriteError] = useState<string | null>(null)
  const collection = query.data?.collections.find((entry) => entry.id === collectionId)
  const items = query.data?.items.filter((entry) => entry.collectionId === collectionId) ?? []
  const item = items.find((entry) => entry.id === itemId)

  async function save(action: CloudCatalogAction, photo?: PhotoDraft) {
    setWriteError(null)
    try {
      const result = await change(action, photo)
      if (result === null) return
      setEditor(null)
      setConfirmation(null)
      if (action.kind === 'create-collection' && typeof result === 'string') setCollectionId(result)
      if (action.kind === 'create-ungrouped-item') {
        setCollectionId(null)
        setItemId(null)
      }
      if (action.kind === 'create-item' && typeof result === 'string') setItemId(result)
      if ((action.kind === 'update-item' || action.kind === 'create-item') && action.input.collectionId)
        setCollectionId(action.input.collectionId)
      if (action.kind === 'delete-item') setItemId(null)
      if (action.kind === 'delete-collection') {
        setCollectionId(null)
        setItemId(null)
      }
    } catch (error) {
      setWriteError(
        error instanceof Error
          ? error.message
          : 'Could not confirm the change. Refresh your account collections before trying again.',
      )
    }
  }

  function openEditor(target: CloudEditorTarget) {
    setWriteError(null)
    setEditor(target)
  }
  function back() {
    if (busy) return
    if (itemId) setItemId(null)
    else if (collectionId) setCollectionId(null)
    else router.back()
  }

  if (editor)
    return (
      <Screen>
        <CloudEditor
          target={editor}
          collections={query.data?.collections ?? []}
          busy={busy}
          error={writeError}
          onSave={(action, photo) => void save(action, photo)}
          onCancel={() => {
            setEditor(null)
            setWriteError(null)
          }}
        />
      </Screen>
    )

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 20 }}>
        <BackButton onPress={back} disabled={busy} />
        <Text style={{ ...type.eyebrow, textTransform: 'none', color: colors.faint }}>ACCOUNT COLLECTIONS</Text>
      </View>
      <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 100 }}>
        <Text style={{ ...type.title, color: colors.ink }}>
          {item?.title ??
            (collection?.title === 'My objects' && collection.categoryId === 'other'
              ? 'Ungrouped items'
              : collection?.title) ??
            'Your account collections'}
        </Text>
        <Text style={{ ...type.meta, color: colors.muted }}>
          These collections are saved online. A collection appears publicly after it contains at least one
          photographed object. Your device collections stay on this device.
        </Text>
        <CloudButton
          label={query.isFetching ? 'Refreshing…' : 'Refresh from account'}
          secondary
          disabled={busy || query.isFetching}
          onPress={() => void query.refetch()}
        />
        {collection?.title === 'My objects' && collection.categoryId === 'other' && !item ? (
          <Text style={{ ...type.meta, color: colors.muted }}>
            Items added without choosing a collection. Open an item and edit it to choose a collection.
          </Text>
        ) : null}
        {query.isPending ? (
          <Text accessibilityLiveRegion="polite" style={{ ...type.body, color: colors.muted }}>
            Loading your collections…
          </Text>
        ) : null}
        {query.isError ? (
          <View style={{ gap: 12 }}>
            <Text accessibilityRole="alert" style={{ ...type.body, color: colors.danger }}>
              {query.error.message}
            </Text>
            <CloudButton label="Try again" secondary onPress={() => void query.refetch()} disabled={query.isFetching} />
            <CloudButton label="Device collections" secondary onPress={() => router.replace('/device-collections')} />
          </View>
        ) : null}
        {writeError ? (
          <Text accessibilityRole="alert" style={{ ...type.body, color: colors.danger }}>
            {writeError}
          </Text>
        ) : null}
        {confirmation ? (
          <View style={{ padding: 18, backgroundColor: colors.surface, borderRadius: radius.lg, gap: 12 }}>
            <Text style={{ ...type.body, color: colors.ink }}>Delete “{confirmation.title}”?</Text>
            <Text style={{ ...type.meta, color: colors.muted }}>
              {confirmation.action.kind === 'delete-collection'
                ? 'This permanently deletes this account collection and all its objects.'
                : 'This permanently deletes this object from your account.'}{' '}
              Device collections are unaffected.
            </Text>
            <CloudButton
              label={busy ? 'Deleting…' : 'Delete permanently'}
              secondary
              danger
              disabled={busy}
              onPress={() => void save(confirmation.action)}
            />
            <CloudButton label="Keep it" secondary disabled={busy} onPress={() => setConfirmation(null)} />
          </View>
        ) : null}
        {!query.isPending && !query.isError && !confirmation ? (
          <>
            {collectionId && !collection ? (
              <>
                <Text style={{ ...type.body, color: colors.muted }}>This collection is no longer available.</Text>
                <CloudButton
                  label="All account collections"
                  secondary
                  onPress={() => {
                    setCollectionId(null)
                    setItemId(null)
                  }}
                />
              </>
            ) : itemId && !item ? (
              <>
                <Text style={{ ...type.body, color: colors.muted }}>This object is no longer available.</Text>
                <CloudButton label="Back to collection" secondary onPress={() => setItemId(null)} />
              </>
            ) : item && collection ? (
              <>
                <Text style={{ ...type.eyebrow, color: colors.faint }}>
                  {categoryLabel(item.categoryId ?? collection.categoryId)}
                </Text>
                {item.subcategory ? (
                  <Text style={{ ...type.meta, color: colors.muted }}>{item.subcategory}</Text>
                ) : null}
                {item.tags?.length ? (
                  <Text style={{ ...type.meta, color: colors.muted }}>{item.tags.join(' · ')}</Text>
                ) : null}
                <AccountPhoto path={item.coverPath} />
                {item.story ? <Text style={{ ...type.body, color: colors.ink }}>{item.story}</Text> : null}
                {item.provenance ? (
                  <Text style={{ ...type.body, color: colors.muted }}>Provenance · {item.provenance}</Text>
                ) : null}
                {itemMetadataRows(item).map((row) => (
                  <View key={row.label} style={{ gap: 4 }}>
                    <Text style={{ ...type.eyebrow, color: colors.faint }}>{row.label}</Text>
                    <Text style={{ ...type.body, color: colors.ink }}>{row.value}</Text>
                  </View>
                ))}
                <CloudComments target={{ kind: 'item', id: item.id }} userId={ownerId} />
                <CloudButton
                  label={`Edit ${collectibleLabels(item.categoryId ?? collection.categoryId, item.subcategory).singular}`}
                  disabled={busy}
                  onPress={() => openEditor({ kind: 'item', collection, value: item })}
                />
                <CloudButton
                  label={`Delete ${collectibleLabels(item.categoryId ?? collection.categoryId, item.subcategory).singular}`}
                  secondary
                  danger
                  disabled={busy}
                  onPress={() => {
                    setWriteError(null)
                    setConfirmation({ action: { kind: 'delete-item', id: item.id }, title: item.title })
                  }}
                />
                <CloudButton label="Back to collection" secondary disabled={busy} onPress={() => setItemId(null)} />
              </>
            ) : collection ? (
              <>
                <Text style={{ ...type.eyebrow, color: colors.faint }}>
                  {categoryLabel(collection.categoryId)} · {items.length}{' '}
                  {items.length === 1
                    ? collectibleLabels(collection.categoryId, collection.subcategory).singular
                    : collectibleLabels(collection.categoryId, collection.subcategory).plural}
                </Text>
                {collection.description ? (
                  <Text style={{ ...type.body, color: colors.ink }}>{collection.description}</Text>
                ) : null}
                {collection.subcategory ? (
                  <Text style={{ ...type.meta, color: colors.muted }}>{collection.subcategory}</Text>
                ) : null}
                {collection.tags?.length ? (
                  <Text style={{ ...type.meta, color: colors.muted }}>{collection.tags.join(' · ')}</Text>
                ) : null}
                <CloudButton
                  label={`Add ${collectibleLabels(collection.categoryId, collection.subcategory).singular}`}
                  disabled={busy}
                  onPress={() => openEditor({ kind: 'item', collection })}
                />
                <CloudButton
                  label="Edit collection"
                  secondary
                  disabled={busy}
                  onPress={() => openEditor({ kind: 'collection', value: collection })}
                />
                {items.length === 0 ? (
                  <Text style={{ ...type.body, color: colors.muted }}>
                    Draft collection. Add its first photographed object to publish it.
                  </Text>
                ) : null}
                {items.map((entry) => (
                  <CatalogRow
                    key={entry.id}
                    title={entry.title}
                    photoPath={entry.coverPath}
                    detail={
                      [entry.year, entry.categoryId === 'books' ? entry.publisher : entry.maker, entry.author]
                        .filter(Boolean)
                        .join(' · ') || 'View object'
                    }
                    onPress={() => setItemId(entry.id)}
                  />
                ))}
                <CloudComments target={{ kind: 'collection', id: collection.id }} userId={ownerId} />
                <CloudButton
                  label="Delete collection"
                  secondary
                  danger
                  disabled={busy}
                  onPress={() => {
                    setWriteError(null)
                    setConfirmation({
                      action: { kind: 'delete-collection', id: collection.id },
                      title: collection.title,
                    })
                  }}
                />
              </>
            ) : (
              <>
                <CloudButton label="Add object" disabled={busy} onPress={() => openEditor({ kind: 'item' })} />
                <CloudButton
                  label="Create account collection (optional)"
                  disabled={busy}
                  onPress={() => openEditor({ kind: 'collection' })}
                />
                {query.data?.collections.length === 0 ? (
                  <Text style={{ ...type.body, color: colors.muted }}>
                    Add your first object. You can organize objects into collections later.
                  </Text>
                ) : null}
                {query.data?.collections.map((entry) => (
                  <CatalogRow
                    key={entry.id}
                    title={
                      entry.title === 'My objects' && entry.categoryId === 'other' ? 'Ungrouped items' : entry.title
                    }
                    photoPath={
                      query.data?.items.find((photoItem) => photoItem.collectionId === entry.id && photoItem.coverPath)
                        ?.coverPath
                    }
                    detail={`${categoryLabel(entry.categoryId)} · ${entry.itemCount} ${entry.itemCount === 1 ? collectibleLabels(entry.categoryId, entry.subcategory).singular : collectibleLabels(entry.categoryId, entry.subcategory).plural}`}
                    onPress={() => {
                      setCollectionId(entry.id)
                      setWriteError(null)
                    }}
                  />
                ))}
              </>
            )}
          </>
        ) : null}
        <CloudButton label="Go to Discover" secondary disabled={busy} onPress={() => router.replace('/(tabs)')} />
      </ScrollView>
    </Screen>
  )
}

function CatalogRow({
  title,
  detail,
  onPress,
  photoPath,
}: {
  title: string
  detail: string
  onPress: () => void
  photoPath?: string
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={{
        padding: 22,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.line,
        gap: 8,
      }}
    >
      <AccountPhoto path={photoPath} compact />
      <Text style={{ ...type.eyebrow, color: colors.faint }}>{detail}</Text>
      <Text style={{ ...type.title, fontSize: 23, color: colors.ink }}>{title}</Text>
      <Text style={{ ...type.meta, color: colors.muted }}>Open →</Text>
    </Pressable>
  )
}
