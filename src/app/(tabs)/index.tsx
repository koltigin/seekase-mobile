import { useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { SeekaseLockup } from '../../components/brand/seekase-lockup'
import { CloudCollectionCard } from '../../components/discover/cloud-collection-card'
import { CategoryChips } from '../../components/discover/category-chips'
import { HeaderIcon } from '../../components/ui/header-icon'
import { IconBell, IconSearch } from '../../components/ui/icons'
import { Screen } from '../../components/ui/screen'
import { categoryLabel } from '../../data/categories'
import { listPublicCollections } from '../../repositories/discover-repository'
import {
  followCollector,
  getCloudSocialState,
  likeCollection,
  saveCollection,
  unfollowCollector,
  unlikeCollection,
  unsaveCollection,
} from '../../repositories/social-repository'
import { useTheme } from '../../state/app-state'
import { useAuth } from '../../state/auth'
import { useBlockedCollectors } from '../../state/use-blocked-collectors'
import { radius, space, type } from '../../theme/tokens'

export default function DiscoverScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { colors } = useTheme()
  const { user } = useAuth()
  const { blockedIds } = useBlockedCollectors(user?.id)
  const [categoryId, setCategoryId] = useState('all')
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [socialError, setSocialError] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ['public-discover-collections'],
    queryFn: async () => {
      const result = await listPublicCollections()
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    retry: false,
  })
  const feed = useMemo(
    () =>
      (query.data ?? []).filter(
        (collection) =>
          !blockedIds.includes(collection.owner.id) && (categoryId === 'all' || collection.categoryId === categoryId),
      ),
    [blockedIds, categoryId, query.data],
  )
  const collectors = useMemo(() => {
    const unique = new Map<string, (typeof feed)[number]['owner']>()
    for (const collection of feed) unique.set(collection.owner.id, collection.owner)
    return [...unique.values()].slice(0, 8)
  }, [feed])
  const collectionIds = useMemo(() => (query.data ?? []).map((collection) => collection.id), [query.data])
  const collectorIds = useMemo(
    () => [...new Set((query.data ?? []).map((collection) => collection.owner.id))],
    [query.data],
  )
  const socialQuery = useQuery({
    queryKey: ['cloud-social-state', user?.id, collectionIds.join(','), collectorIds.join(',')],
    enabled: Boolean(user && query.data),
    retry: false,
    queryFn: async () => {
      const result = await getCloudSocialState(user!.id, collectionIds, collectorIds)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const social = socialQuery.data ?? {
    likedCollectionIds: [],
    savedCollectionIds: [],
    followedCollectorIds: [],
  }

  async function runSocialAction(
    key: string,
    action: () => Promise<{ ok: true } | { ok: false; error: { message: string } }>,
  ) {
    if (busyAction || !user || !socialQuery.data) return
    setBusyAction(key)
    setSocialError(null)
    try {
      const result = await action()
      if (!result.ok) setSocialError(result.error.message)
      else {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['public-discover-collections'] }),
          queryClient.invalidateQueries({ queryKey: ['cloud-social-state'] }),
        ])
      }
    } catch {
      setSocialError('Could not confirm that action. Check your connection and try again.')
    }
    setBusyAction(null)
  }

  function toggleLike(collectionId: string) {
    const active = social.likedCollectionIds.includes(collectionId)
    void runSocialAction(`like:${collectionId}`, () =>
      active ? unlikeCollection(user!.id, collectionId) : likeCollection(user!.id, collectionId),
    )
  }

  function toggleSave(collectionId: string) {
    const active = social.savedCollectionIds.includes(collectionId)
    void runSocialAction(`save:${collectionId}`, () =>
      active ? unsaveCollection(user!.id, collectionId) : saveCollection(user!.id, collectionId),
    )
  }

  function toggleFollow(collectorId: string) {
    const active = social.followedCollectorIds.includes(collectorId)
    void runSocialAction(`follow:${collectorId}`, () =>
      active ? unfollowCollector(user!.id, collectorId) : followCollector(user!.id, collectorId),
    )
  }

  return (
    <Screen padded={false}>
      <View className="flex-row items-end justify-between px-5 pb-2">
        <View className="flex-1 pr-3">
          <SeekaseLockup width={136} />
          <Text className="mt-1" style={{ ...type.title, color: colors.ink }}>
            Discover
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <HeaderIcon onPress={() => router.push('/search')}>
            <IconSearch color={colors.ink} size={18} />
          </HeaderIcon>
          <HeaderIcon onPress={() => undefined}>
            <IconBell color={colors.ink} size={18} />
          </HeaderIcon>
        </View>
      </View>
      <Text className="px-5 pb-4" style={{ ...type.body, color: colors.muted }}>
        Cabinets, not listings. Collectors showing what they keep.
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching || socialQuery.isRefetching}
            onRefresh={() => void Promise.all([query.refetch(), socialQuery.refetch()])}
            tintColor={colors.ink}
          />
        }
        contentContainerStyle={{ paddingBottom: space.tabPad }}
      >
        <View className="pl-5">
          <CategoryChips selectedId={categoryId} onSelect={setCategoryId} />
        </View>

        {categoryId === 'all' && collectors.length > 0 ? (
          <View className="mt-6">
            <Text className="mb-3 px-5" style={{ ...type.eyebrow, textTransform: 'none', color: colors.faint }}>
              COLLECTORS TO EXPLORE
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingRight: 28 }}
            >
              {collectors.map((collector) => (
                <Pressable
                  key={collector.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open collector ${collector.displayName}`}
                  onPress={() => router.push(`/public-collector/${collector.id}`)}
                  style={{ width: 158, padding: 14, gap: 5, borderRadius: radius.lg, backgroundColor: colors.surface }}
                >
                  <Text className="text-[15px] font-semibold" style={{ color: colors.ink }} numberOfLines={1}>
                    {collector.displayName}
                  </Text>
                  <Text className="text-[12px]" style={{ color: colors.muted }} numberOfLines={1}>
                    @{collector.handle}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={collector.id === user?.id || Boolean(busyAction) || !socialQuery.data}
                    onPress={(event) => {
                      event.stopPropagation?.()
                      toggleFollow(collector.id)
                    }}
                    style={{ paddingTop: 7, opacity: busyAction || !socialQuery.data ? 0.55 : 1 }}
                  >
                    <Text className="text-[12px] font-semibold" style={{ color: colors.ink }}>
                      {collector.id === user?.id
                        ? 'You'
                        : social.followedCollectorIds.includes(collector.id)
                          ? 'Following'
                          : 'Follow'}
                    </Text>
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View className="mt-7 px-5">
          <Text className="mb-3" style={{ ...type.eyebrow, textTransform: 'none', color: colors.faint }}>
            {(categoryId === 'all' ? 'New cabinets' : categoryLabel(categoryId)).toLocaleUpperCase('en-US')}
          </Text>
          {query.isPending ? (
            <Text style={{ ...type.body, color: colors.muted }}>Loading public collections…</Text>
          ) : null}
          {query.isError ? (
            <View style={{ gap: 14, padding: 18, borderRadius: radius.lg, backgroundColor: colors.surface }}>
              <Text accessibilityRole="alert" style={{ ...type.body, color: colors.danger }}>
                {query.error.message}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => void query.refetch()}>
                <Text style={{ ...type.body, fontWeight: '600', color: colors.ink }}>Try again</Text>
              </Pressable>
            </View>
          ) : null}
          {socialQuery.isError || socialError ? (
            <Text accessibilityRole="alert" style={{ ...type.meta, color: colors.danger, marginBottom: 12 }}>
              {socialError ?? socialQuery.error?.message}
            </Text>
          ) : null}
          {!query.isPending && !query.isError && feed.length === 0 ? (
            <View className="rounded-2xl px-4 py-8" style={{ backgroundColor: colors.surface }}>
              <Text className="text-[15px]" style={{ color: colors.muted }}>
                {categoryId === 'all' ? 'No public collections yet.' : 'No public collections in this category yet.'}
              </Text>
            </View>
          ) : null}
          <View className="gap-4">
            {feed.map((collection) => (
              <CloudCollectionCard
                key={collection.id}
                collection={collection}
                liked={social.likedCollectionIds.includes(collection.id)}
                saved={social.savedCollectionIds.includes(collection.id)}
                busy={Boolean(busyAction) || !socialQuery.data}
                onToggleLike={() => toggleLike(collection.id)}
                onToggleSave={() => toggleSave(collection.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  )
}
