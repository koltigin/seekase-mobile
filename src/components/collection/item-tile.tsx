import { Image, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { CollectibleItem } from '../../data/types'
import { useTheme } from '../../state/app-state'
import { radius } from '../../theme/tokens'

export function ItemTile({ item, width }: { item: CollectibleItem; width: number }) {
  const { colors } = useTheme()
  const router = useRouter()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${item.year ? `, ${item.year}` : ''}`}
      onPress={() => router.push(`/item/${item.id}`)}
      style={{ width, backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' }}
    >
      <Image source={item.image} resizeMode="cover" style={{ width: '100%', height: width * 0.92 }} />
      <View className="px-2.5 py-2.5">
        <Text className="text-[13px] font-medium leading-4" style={{ color: colors.ink }} numberOfLines={2}>
          {item.title}
        </Text>
        {item.year ? (
          <Text className="mt-1 text-[11px]" style={{ color: colors.muted }}>
            {item.year}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
}
