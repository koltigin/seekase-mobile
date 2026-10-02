import { useCallback, useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { loadCloudCatalog } from '../../services/cloud-catalog'
import { categoryLabel } from '../../data/categories'
import { useTheme } from '../../state/app-state'
import { AccountPhoto } from '../catalog/account-photo'
import { CloudButton } from '../catalog/cloud-controls'
import { radius, type } from '../../theme/tokens'

/** Isolated account cache: never display previous-account or demo catalog rows. */
export type ProfileCatalogSummary = { collections: number; items: number }

export function ProfileAccountCatalog({
  ownerId,
  onSummary,
}: {
  ownerId: string
  onSummary?: (summary: ProfileCatalogSummary) => void
}) {
  const [client] = useState(() => new QueryClient())
  useEffect(() => () => client.clear(), [client])
  return (
    <QueryClientProvider client={client}>
      <AccountContent ownerId={ownerId} onSummary={onSummary} />
    </QueryClientProvider>
  )
}

function AccountContent({
  ownerId,
  onSummary,
}: {
  ownerId: string
  onSummary?: (summary: ProfileCatalogSummary) => void
}) {
  const { colors } = useTheme()
  const router = useRouter()
  const query = useQuery({
    queryKey: ['profile-account-catalog', ownerId],
    queryFn: ({ signal }) => loadCloudCatalog(ownerId, signal),
    retry: false,
    staleTime: 0,
    enabled: false,
  })
  const { refetch } = query
  useFocusEffect(
    useCallback(() => {
      void refetch()
    }, [refetch]),
  )
  useEffect(() => {
    if (!query.data) return
    onSummary?.({ collections: query.data.collections.length, items: query.data.items.length })
  }, [onSummary, query.data])
  return (
    <View style={{ gap: 14, marginTop: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ ...type.title, fontSize: 23, color: colors.ink }}>Collections</Text>
        <Pressable
          accessibilityRole="button"
          disabled={query.isFetching}
          onPress={() => void refetch()}
          style={{ padding: 12 }}
        >
          <Text style={{ ...type.meta, color: colors.muted }}>{query.isFetching ? 'Refreshing…' : 'Refresh'}</Text>
        </Pressable>
      </View>
      {query.isError ? (
        <Text accessibilityRole="alert" style={{ ...type.body, color: colors.danger }}>
          {query.error.message}
        </Text>
      ) : null}
      {query.isPending ? <Text style={{ color: colors.muted }}>Loading your collections…</Text> : null}
      {query.data && !query.isError ? (
        <>
          <Text style={{ ...type.body, color: colors.ink }}>
            {query.data.collections.length} collections · {query.data.items.length} saved items
          </Text>
          {query.data.collections.length === 0 ? (
            <Text style={{ ...type.body, color: colors.muted }}>Your first collection starts with an item.</Text>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
            {query.data.collections.map((collection) => {
              const photo = query.data.items.find((item) => item.collectionId === collection.id && item.coverPath)
              const ungrouped = collection.title === 'My objects' && collection.categoryId === 'other'
              return (
                <Pressable
                  key={collection.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${ungrouped ? 'Ungrouped items' : collection.title}`}
                  onPress={() => router.push({ pathname: '/cloud-collections', params: { collection: collection.id } })}
                  style={{
                    width: '48%',
                    aspectRatio: 1,
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{ flex: 1, backgroundColor: colors.chip, justifyContent: 'center', alignItems: 'stretch' }}
                  >
                    {photo?.coverPath ? (
                      <AccountPhoto path={photo.coverPath} compact fill />
                    ) : (
                      <View style={{ alignItems: 'center', paddingHorizontal: 12, gap: 5 }}>
                        <Text style={{ textAlign: 'center', color: colors.ink, fontSize: 15, fontWeight: '600' }}>
                          Draft
                        </Text>
                        <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 12 }} numberOfLines={2}>
                          Add a photographed object to publish
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ padding: 10, gap: 3 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }} numberOfLines={1}>
                      {ungrouped ? 'Ungrouped items' : collection.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>
                      {categoryLabel(collection.categoryId)} · {collection.itemCount}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </>
      ) : null}
      <CloudButton label="Add to collection" onPress={() => router.push('/cloud-collections?add=object')} />
    </View>
  )
}
