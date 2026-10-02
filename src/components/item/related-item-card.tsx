import { Image, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { CollectibleItem } from '../../data/types'
import { useTheme } from '../../state/app-state'
import { radius } from '../../theme/tokens'

export function RelatedItemCard({ item, width }: { item: CollectibleItem; width: number }) {
  const { colors } = useTheme()
  const router = useRouter()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
      onPress={() => router.push(`/item/${item.id}`)}
      style={{ width }}
    >
      <View className="overflow-hidden" style={{ height: width * 0.92, borderRadius: radius.md }}>
        <Image source={item.image} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
      </View>
      <Text className="mt-2 text-[13px] font-medium" style={{ color: colors.ink }} numberOfLines={2}>
        {item.title}
      </Text>
      {item.year ? (
        <Text className="mt-0.5 text-[11px]" style={{ color: colors.muted }}>
          {item.year}
        </Text>
      ) : null}
    </Pressable>
  )
}
