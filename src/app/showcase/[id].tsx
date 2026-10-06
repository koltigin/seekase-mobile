import { useEffect, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AccountPhoto } from '../../components/catalog/account-photo'
import { CloudButton } from '../../components/catalog/cloud-controls'
import { CloudComments } from '../../components/social/cloud-comments'
import { MessageCollectorButton } from '../../components/messages/message-collector-button'
import { SafetyActions } from '../../components/safety/safety-actions'
import { Screen } from '../../components/ui/screen'
import { categoryLabel } from '../../data/categories'
import { listCollectionItems } from '../../repositories/catalog-repository'
import { getPublicCollection, recordPublicCollectionView } from '../../repositories/discover-repository'
import {
  getCloudSocialState,
  likeCollection,
  saveCollection,
  unlikeCollection,
  unsaveCollection,
} from '../../repositories/social-repository'
import { useTheme } from '../../state/app-state'
import { useAuth } from '../../state/auth'
import { radius, type } from '../../theme/tokens'
import { IconBookmark, IconHeart } from '../../components/ui/icons'

export default function PublicShowcaseScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const collectionId = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [socialError, setSocialError] = useState<string | null>(null)
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
  const socialQuery = useQuery({
    queryKey: ['cloud-social-state', user?.id, collectionId ?? '', ''],
    enabled: Boolean(user && collectionId),
    retry: false,
    queryFn: async () => {
      const result = await getCloudSocialState(user!.id, [collectionId!], [])
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const liked = Boolean(collectionId && socialQuery.data?.likedCollectionIds.includes(collectionId))
  const saved = Boolean(collectionId && socialQuery.data?.savedCollectionIds.includes(collectionId))

  useEffect(() => {
    const ownerId = query.data?.collection.owner.id
    if (!user || !collectionId || !ownerId || user.id === ownerId) return
    void recordPublicCollectionView(collectionId).then((result) => {
      if (result.ok) void queryClient.invalidateQueries({ queryKey: ['public-showcase', collectionId] })
    })
  }, [collectionId, query.data?.collection.owner.id, queryClient, user])

  async function runSocialAction(
    key: string,
    action: () => Promise<{ ok: true } | { ok: false; error: { message: string } }>,
  ) {
    if (busyAction || !user || !collectionId || !socialQuery.data) return
    setBusyAction(key)
    setSocialError(null)
    try {
      const result = await action()
      if (!result.ok) setSocialError(result.error.message)
      else {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['public-showcase', collectionId] }),
          queryClient.invalidateQueries({ queryKey: ['public-discover-collections'] }),
          queryClient.invalidateQueries({ queryKey: ['cloud-social-state'] }),
        ])
      }
    } catch {
      setSocialError('Could not confirm that action. Check your connection and try again.')
    }
    setBusyAction(null)
  }

  function goBack() {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)')
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: 18, paddingBottom: 160 }}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
                {query.data.collection.likeCount} likes · {query.data.collection.commentCount} comments ·{' '}
                {query.data.collection.viewCount} viewers
              </Text>
            </View>
            {user ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <SocialButton
                  label={liked ? 'Liked' : 'Like collection'}
                  active={liked}
                  disabled={Boolean(busyAction) || !socialQuery.data}
                  icon={<IconHeart color={liked ? colors.onAccent : colors.like} size={16} filled={liked} />}
                  onPress={() =>
                    void runSocialAction(`like:${collectionId}`, () =>
                      liked ? unlikeCollection(user.id, collectionId!) : likeCollection(user.id, collectionId!),
                    )
                  }
                />
                <SocialButton
                  label={saved ? 'Saved' : 'Save collection'}
                  active={saved}
                  disabled={Boolean(busyAction) || !socialQuery.data}
                  icon={<IconBookmark color={saved ? colors.onAccent : colors.ink} size={16} filled={saved} />}
                  onPress={() =>
                    void runSocialAction(`save:${collectionId}`, () =>
                      saved ? unsaveCollection(user.id, collectionId!) : saveCollection(user.id, collectionId!),
                    )
                  }
                />
              </View>
            ) : (
              <CloudButton label="Sign in to like or save" secondary onPress={() => router.push('/welcome')} />
            )}
            {socialError || socialQuery.isError ? (
              <Text accessibilityRole="alert" style={{ ...type.meta, color: colors.danger }}>
                {socialError ?? 'Could not load your collection reactions.'}
              </Text>
            ) : null}
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
      <View
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: Math.max(insets.bottom, 12),
          padding: 6,
          borderRadius: radius.pill,
          backgroundColor: colors.background,
        }}
      >
        <CloudButton label="Back to Discover" secondary onPress={goBack} />
      </View>
    </Screen>
  )
}

function SocialButton({
  label,
  icon,
  active,
  disabled,
  onPress,
}: {
  label: string
  icon: ReactNode
  active: boolean
  disabled: boolean
  onPress: () => void
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 46,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.line,
        backgroundColor: active ? colors.accent : colors.surface,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {icon}
      <Text style={{ ...type.meta, fontWeight: '600', color: active ? colors.onAccent : colors.ink }}>{label}</Text>
    </Pressable>
  )
}
