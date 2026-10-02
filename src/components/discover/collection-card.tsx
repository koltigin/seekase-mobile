import { Image, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { categoryLabel } from '../../data/categories'
import { getCollector } from '../../data/mock-data'
import type { Collection } from '../../data/types'
import { useTheme } from '../../state/app-state'
import { navigateToCollector } from '../../utils/collector-nav'
import { radius } from '../../theme/tokens'
import { ReactionRow } from '../social/reaction-row'
import { Avatar } from '../ui/avatar'

export function CollectionCard({ collection, featured = false }: { collection: Collection; featured?: boolean }) {
  const { colors } = useTheme()
  const router = useRouter()
  const owner = getCollector(collection.ownerId)
  const imageHeight = featured ? 168 : 188

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open collection ${collection.title}`}
      onPress={() => router.push(`/collection/${collection.id}`)}
      className="overflow-hidden"
      style={{ backgroundColor: colors.surface, borderRadius: featured ? radius.xl : radius.lg }}
    >
      <View style={{ height: imageHeight }}>
        <Image source={collection.cover} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
        <View
          style={{
            position: 'absolute',
            left: 12,
            top: 12,
            maxWidth: '85%',
            paddingHorizontal: 10,
            paddingVertical: 4,
            backgroundColor: colors.overlay,
            borderRadius: radius.pill,
          }}
        >
          <Text className="text-[11px] font-semibold uppercase tracking-[1.1px] text-white" numberOfLines={1}>
            {categoryLabel(collection.categoryId)}
          </Text>
        </View>
      </View>
      <View className="px-4 py-3.5">
        <Text className="text-[17px] font-semibold leading-6" style={{ color: colors.ink }} numberOfLines={2}>
          {collection.title}
        </Text>
        <View className="mt-2.5 flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open collector ${owner?.displayName ?? 'Collector'}`}
            className="min-w-0 flex-1 flex-row items-center pr-3"
            onPress={(event) => {
              event.stopPropagation?.()
              if (owner) {
                navigateToCollector(router, owner.id)
              }
            }}
          >
            <Avatar collector={owner} size={26} />
            <View className="ml-2 min-w-0">
              <Text className="text-[13px] font-medium" style={{ color: colors.ink }} numberOfLines={1}>
                {owner?.displayName ?? 'Collector'}
              </Text>
              <Text className="text-[12px]" style={{ color: colors.muted }}>
                {collection.itemCount} objects
              </Text>
            </View>
          </Pressable>
          <ReactionRow likes={collection.likeCount} collectionId={collection.id} />
        </View>
      </View>
    </Pressable>
  )
}

export function CollectionGridCard({ collection }: { collection: Collection }) {
  const { colors } = useTheme()
  const router = useRouter()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open collection ${collection.title}`}
      onPress={() => router.push(`/collection/${collection.id}`)}
      className="overflow-hidden"
      style={{ backgroundColor: colors.surface, borderRadius: radius.md }}
    >
      <Image source={collection.cover} resizeMode="cover" style={{ width: '100%', height: 112 }} />
      <View className="px-3 py-2.5">
        <Text className="text-[13px] font-medium leading-5" style={{ color: colors.ink }} numberOfLines={2}>
          {collection.title}
        </Text>
        <Text className="mt-1 text-[11px]" style={{ color: colors.muted }}>
          {collection.itemCount} · {categoryLabel(collection.categoryId)}
        </Text>
      </View>
    </Pressable>
  )
}
