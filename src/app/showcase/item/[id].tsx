import { ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { AccountPhoto } from '../../../components/catalog/account-photo'
import { CloudButton } from '../../../components/catalog/cloud-controls'
import { CloudComments } from '../../../components/social/cloud-comments'
import { MessageCollectorButton } from '../../../components/messages/message-collector-button'
import { Screen } from '../../../components/ui/screen'
import { categoryLabel } from '../../../data/categories'
import { getCloudItem } from '../../../repositories/catalog-repository'
import { getPublicCollection } from '../../../repositories/discover-repository'
import { useTheme } from '../../../state/app-state'
import { useAuth } from '../../../state/auth'
import { radius, type } from '../../../theme/tokens'

function Detail({ label, value }: { label: string; value?: string }) {
  const { colors } = useTheme()
  if (!value) return null
  return (
    <View style={{ gap: 3 }}>
      <Text style={{ ...type.eyebrow, color: colors.faint }}>{label}</Text>
      <Text style={{ ...type.body, color: colors.ink }}>{value}</Text>
    </View>
  )
}

export default function PublicObjectScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const itemId = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const { colors } = useTheme()
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['public-object', itemId],
    enabled: Boolean(itemId),
    retry: false,
    queryFn: async () => {
      const itemResult = await getCloudItem(itemId!)
      if (!itemResult.ok) throw new Error(itemResult.error.message)
      if (!itemResult.data?.coverPath) throw new Error('This object is no longer available.')
      const collectionResult = await getPublicCollection(itemResult.data.collectionId)
      if (!collectionResult.ok) throw new Error(collectionResult.error.message)
      if (!collectionResult.data) throw new Error('This collection is no longer available.')
      return { item: itemResult.data, collection: collectionResult.data }
    },
  })

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        <CloudButton label="Back to collection" secondary onPress={() => router.back()} />
        {query.isPending ? <Text style={{ ...type.body, color: colors.muted }}>Loading object…</Text> : null}
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
            {query.data.item.coverPath ? <AccountPhoto path={query.data.item.coverPath} /> : null}
            <View style={{ gap: 7 }}>
              <Text style={{ ...type.eyebrow, color: colors.faint }}>
                {categoryLabel(query.data.item.categoryId ?? query.data.collection.categoryId)}
              </Text>
              <Text style={{ ...type.title, color: colors.ink }}>{query.data.item.title}</Text>
              <Text style={{ ...type.body, color: colors.ink }}>{query.data.collection.title}</Text>
              <Text style={{ ...type.meta, color: colors.muted }}>
                {query.data.collection.owner.displayName} · @{query.data.collection.owner.handle}
              </Text>
            </View>
            {user && user.id !== query.data.collection.owner.id ? (
              <MessageCollectorButton
                peerId={query.data.collection.owner.id}
                context={{ kind: 'item', id: query.data.item.id, title: query.data.item.title }}
              />
            ) : null}
            <View style={{ padding: 16, gap: 14, borderRadius: radius.lg, backgroundColor: colors.surface }}>
              <Detail label="AUTHOR" value={query.data.item.author} />
              <Detail label="PUBLISHER" value={query.data.item.publisher} />
              <Detail label="MAKER" value={query.data.item.maker} />
              <Detail label="YEAR OR DATE" value={query.data.item.year} />
              <Detail label="CONDITION" value={query.data.item.condition} />
              <Detail label="STATUS" value={query.data.item.status} />
            </View>
            {query.data.item.story ? (
              <View style={{ gap: 7 }}>
                <Text style={{ ...type.eyebrow, color: colors.faint }}>STORY</Text>
                <Text style={{ ...type.body, color: colors.muted }}>{query.data.item.story}</Text>
              </View>
            ) : null}
            {query.data.item.provenance ? (
              <View style={{ gap: 7 }}>
                <Text style={{ ...type.eyebrow, color: colors.faint }}>PROVENANCE</Text>
                <Text style={{ ...type.body, color: colors.muted }}>{query.data.item.provenance}</Text>
              </View>
            ) : null}
            {query.data.item.tags?.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {query.data.item.tags.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: radius.pill,
                      backgroundColor: colors.surface,
                    }}
                  >
                    <Text style={{ ...type.meta, color: colors.muted }}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {user ? <CloudComments target={{ kind: 'item', id: query.data.item.id }} userId={user.id} /> : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
