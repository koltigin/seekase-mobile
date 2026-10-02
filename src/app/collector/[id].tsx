import { useEffect, useMemo } from 'react'
import { ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { FollowButton, useFollowerCount } from '../../components/collector/follow-button'
import { CollectionGridCard } from '../../components/discover/collection-card'
import { RelatedItemCard } from '../../components/item/related-item-card'
import { SocialLinksRow } from '../../components/profile/social-links-row'
import { Avatar } from '../../components/ui/avatar'
import { Screen } from '../../components/ui/screen'
import { BackButton } from '../../components/ui/back-button'
import {
  collectorInterestLabels,
  featuredCollectionsForCollector,
  highlightItemsForCollector,
  isOwnCollector,
  resolveCollector,
} from '../../data/collector-resolve'
import { collectionsForOwner } from '../../data/mock-data'
import { useTheme } from '../../state/app-state'
import { collectorHandleDisplay } from '../../utils/collector-nav'
import { radius, space, type } from '../../theme/tokens'

export default function PublicCollectorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors } = useTheme()
  const { width } = useWindowDimensions()
  const collector = useMemo(() => resolveCollector(String(id ?? '')), [id])
  const followerCount = useFollowerCount(collector?.id ?? '', collector?.stats.followers ?? 0)
  const isSelf = collector ? isOwnCollector(collector.id) : false

  useEffect(() => {
    if (isSelf) {
      router.replace('/(tabs)/profile')
    }
  }, [isSelf, router])

  if (!collector) {
    return (
      <Screen>
        <BackButton onPress={() => router.back()} />
        <Text className="mt-8" style={{ ...type.title, color: colors.ink }}>
          Collector not found
        </Text>
        <Text className="mt-2" style={{ ...type.body, color: colors.muted }}>
          This collector profile is unavailable.
        </Text>
      </Screen>
    )
  }

  if (isSelf) {
    return (
      <Screen>
        <Text style={{ ...type.body, color: colors.muted }}>Opening your profile…</Text>
      </Screen>
    )
  }

  const interests = collectorInterestLabels(collector, 5)
  const featured = featuredCollectionsForCollector(collector)
  const allCollections = collectionsForOwner(collector.id)
  const highlights = highlightItemsForCollector(collector.id, 4)
  const gap = 10
  const cardWidth = (width - space.screen * 2 - gap) / 2
  const highlightWidth = (width - space.screen * 2 - gap) / 2

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen padded={false}>
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <BackButton onPress={() => router.back()} />
          <Text style={{ ...type.eyebrow, color: colors.faint }}>Collector</Text>
          <View style={{ width: 96 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: space.tabPad + 24 }}
        >
          <View className="items-center pt-2">
            <Avatar collector={collector} size={96} />
            <Text className="mt-4 text-center" style={{ ...type.title, fontSize: 26, color: colors.ink }}>
              {collector.displayName}
            </Text>
            <Text className="mt-1 text-sm" style={{ color: colors.muted }}>
              {collectorHandleDisplay(collector.handle)}
            </Text>
            {collector.locationText ? (
              <Text className="mt-1 text-[13px]" style={{ color: colors.faint }}>
                {collector.locationText}
              </Text>
            ) : null}
            {collector.joinedAt ? (
              <Text className="mt-2 text-[12px]" style={{ color: colors.faint }}>
                Collecting on Seekase since {collector.joinedAt}
              </Text>
            ) : null}
          </View>

          {collector.bio ? (
            <View className="mt-6">
              <Text style={{ ...type.eyebrow, color: colors.faint }}>About</Text>
              <Text className="mt-2" style={{ ...type.body, color: colors.ink }}>
                {collector.bio}
              </Text>
            </View>
          ) : null}

          {interests.length > 0 ? (
            <View className="mt-5 flex-row flex-wrap" style={{ gap: 6 }}>
              {interests.map((label) => (
                <View key={label} className="px-2.5 py-1" style={{ backgroundColor: colors.chip, borderRadius: 999 }}>
                  <Text className="text-[11px] font-medium" style={{ color: colors.muted }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {collector.socials ? (
            <View className="mt-1 items-center">
              <SocialLinksRow links={collector.socials} />
            </View>
          ) : null}

          <View className="mt-6">
            <FollowButton collectorId={collector.id} fullWidth />
          </View>

          <View
            className="mt-6 flex-row justify-between px-2 py-4"
            style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}
          >
            {(
              [
                ['Collections', allCollections.length || collector.stats.collections],
                ['Objects', collector.stats.items],
                ['Followers', followerCount],
              ] as const
            ).map(([label, value]) => (
              <View key={label} className="flex-1 items-center">
                <Text className="text-lg font-semibold" style={{ color: colors.ink }}>
                  {value.toLocaleString()}
                </Text>
                <Text className="mt-0.5 text-[11px]" style={{ color: colors.muted }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {featured.length > 0 ? (
            <View className="mt-8">
              <Text style={{ ...type.eyebrow, color: colors.faint }}>Featured cabinets</Text>
              <View className="mt-3 flex-row flex-wrap" style={{ gap }}>
                {featured.map((collection) => (
                  <View key={collection.id} style={{ width: cardWidth }}>
                    <CollectionGridCard collection={collection} />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View className="mt-8">
            <Text style={{ ...type.eyebrow, color: colors.faint }}>
              {allCollections.length === 1 ? 'Cabinet' : 'Cabinets'}
            </Text>
            {allCollections.length === 0 ? (
              <Text className="mt-3" style={{ ...type.body, color: colors.muted }}>
                No cabinets shared yet.
              </Text>
            ) : (
              <View className="mt-3 flex-row flex-wrap" style={{ gap }}>
                {allCollections.map((collection) => (
                  <View key={collection.id} style={{ width: cardWidth }}>
                    <CollectionGridCard collection={collection} />
                  </View>
                ))}
              </View>
            )}
          </View>

          {highlights.length > 0 ? (
            <View className="mt-8">
              <Text style={{ ...type.eyebrow, color: colors.faint }}>Highlights</Text>
              <View className="mt-3 flex-row flex-wrap" style={{ gap }}>
                {highlights.map((item) => (
                  <RelatedItemCard key={item.id} item={item} width={highlightWidth} />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </Screen>
    </>
  )
}
