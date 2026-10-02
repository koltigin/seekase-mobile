import { Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { AccountPhoto } from '../../components/catalog/account-photo'
import { CloudButton } from '../../components/catalog/cloud-controls'
import { CloudComments } from '../../components/social/cloud-comments'
import { MessageCollectorButton } from '../../components/messages/message-collector-button'
import { SafetyActions } from '../../components/safety/safety-actions'
import { Screen } from '../../components/ui/screen'
import { categoryLabel } from '../../data/categories'
import { listCollectionItems } from '../../repositories/catalog-repository'
import { getPublicCollection } from '../../repositories/discover-repository'
import { useTheme } from '../../state/app-state'
import { useAuth } from '../../state/auth'
import { radius, type } from '../../theme/tokens'

export default function PublicShowcaseScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const collectionId = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const { colors } = useTheme()
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['public-showcase', collectionId],
    enabled: Boolean(collectionId),
    retry: false,
    queryFn: async () => {
      const [collectionResult, itemsResult] = await Promise.all([
        getPublicCollection(collectionId!),
        listCollectionItems(collectionId!),
      ])
      if (!collectionResult.ok) throw new Error(collectionResult.error.message)
      if (!itemsResult.ok) throw new Error(itemsResult.error.message)
      if (!collectionResult.data) throw new Error('This collection is no longer available.')
      return { collection: collectionResult.data, items: itemsResult.data.filter((item) => Boolean(item.coverPath)) }
    },
  })

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        <CloudButton label="Back to Discover" secondary onPress={() => router.back()} />
        {query.isPending ? <Text style={{ ...type.body, color: colors.muted }}>Loading collection…</Text> : null}
        {query.isError ? (
          <View style={{ gap: 14 }}>
            <Text accessibilityRole="alert" style={{ ...type.body, color: colors.danger }}>
              {query.error.message}
            </Text>
            <CloudButton label="Try again" secondary onPress={() => void query.refetch()} />
          </View>
        ) : null}
        {query.data ? (
          <>
            {query.data.collection.coverPath ? <AccountPhoto path={query.data.collection.coverPath} /> : null}
            <View style={{ gap: 7 }}>
              <Text style={{ ...type.eyebrow, color: colors.faint }}>
                {categoryLabel(query.data.collection.categoryId)}
              </Text>
              <Text style={{ ...type.title, color: colors.ink }}>{query.data.collection.title}</Text>
              <Text style={{ ...type.body, color: colors.ink }}>{query.data.collection.owner.displayName}</Text>
              <Text style={{ ...type.meta, color: colors.muted }}>@{query.data.collection.owner.handle}</Text>
              {query.data.collection.description ? (
                <Text style={{ ...type.body, color: colors.muted }}>{query.data.collection.description}</Text>
              ) : null}
              <Text style={{ ...type.meta, color: colors.muted }}>
                {query.data.collection.itemCount} {query.data.collection.itemCount === 1 ? 'object' : 'objects'} ·{' '}
                {query.data.collection.likeCount} likes
              </Text>
            </View>
            {user && user.id !== query.data.collection.owner.id ? (
              <MessageCollectorButton
                peerId={query.data.collection.owner.id}
                context={{ kind: 'collection', id: query.data.collection.id, title: query.data.collection.title }}
              />
            ) : null}
            <Text style={{ ...type.title, fontSize: 24, color: colors.ink }}>Objects</Text>
            {query.data.items.length === 0 ? (
              <Text style={{ ...type.body, color: colors.muted }}>This collection has no objects yet.</Text>
            ) : (
              query.data.items.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open object ${item.title}`}
                  onPress={() => router.push(`/showcase/item/${item.id}`)}
                  style={{ padding: 14, gap: 10, borderRadius: radius.lg, backgroundColor: colors.surface }}
                >
                  {item.coverPath ? <AccountPhoto path={item.coverPath} compact /> : null}
                  <Text style={{ ...type.body, fontWeight: '600', color: colors.ink }}>{item.title}</Text>
                  {item.author ? (
                    <Text style={{ ...type.meta, color: colors.muted }}>Author · {item.author}</Text>
                  ) : null}
                  {item.publisher ? (
                    <Text style={{ ...type.meta, color: colors.muted }}>Publisher · {item.publisher}</Text>
                  ) : null}
                  {item.year ? <Text style={{ ...type.meta, color: colors.muted }}>Year · {item.year}</Text> : null}
                  {item.story ? <Text style={{ ...type.body, color: colors.muted }}>{item.story}</Text> : null}
                </Pressable>
              ))
            )}
            {user ? (
              <CloudComments target={{ kind: 'collection', id: query.data.collection.id }} userId={user.id} />
            ) : null}
            {user && user.id !== query.data.collection.owner.id ? (
              <SafetyActions
                userId={user.id}
                targetType="collection"
                targetId={query.data.collection.id}
                collectorId={query.data.collection.owner.id}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
