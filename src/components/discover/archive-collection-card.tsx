import { Image, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { categoryLabel } from '../../data/categories'
import type { Collection } from '../../data/types'
import { useTheme } from '../../state/app-state'
import { radius } from '../../theme/tokens'

export function ArchiveCollectionCard({ collection }: { collection: Collection }) {
  const { colors } = useTheme()
  const router = useRouter()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open collection ${collection.title}`}
      onPress={() => router.push(`/collection/${collection.id}`)}
      className="overflow-hidden"
      style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}
    >
      <Image source={collection.cover} resizeMode="cover" style={{ width: '100%', height: 168 }} />
      <View className="px-4 py-3.5">
        <Text className="text-[17px] font-semibold leading-6" style={{ color: colors.ink }} numberOfLines={2}>
          {collection.title}
        </Text>
        <Text className="mt-1.5 text-[13px]" style={{ color: colors.muted }}>
          {categoryLabel(collection.categoryId)} · {collection.itemCount} objects
        </Text>
      </View>
    </Pressable>
  )
}
