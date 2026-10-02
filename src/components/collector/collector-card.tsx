import { Image, Pressable, Text, View, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { collectorInterestLabels, representativeCoverForCollector } from '../../data/collector-resolve'
import type { Collector } from '../../data/types'
import { useTheme } from '../../state/app-state'
import { collectorHandleDisplay, navigateToCollector } from '../../utils/collector-nav'
import { radius } from '../../theme/tokens'
import { Avatar } from '../ui/avatar'
import { FollowButton } from './follow-button'

export function CollectorCard({ collector }: { collector: Collector }) {
  const { colors } = useTheme()
  const { fontScale } = useWindowDimensions()
  const router = useRouter()
  const interests = collectorInterestLabels(collector, 2)
  const cover = representativeCoverForCollector(collector.id)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open collector ${collector.displayName}`}
      onPress={() => navigateToCollector(router, collector.id)}
      className="overflow-hidden"
      style={{
        width: 196,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
      }}
    >
      {cover ? (
        <Image source={cover} resizeMode="cover" style={{ width: '100%', height: 88 }} />
      ) : (
        <View style={{ width: '100%', height: 88, backgroundColor: colors.chip }} />
      )}
      <View className="px-3 pb-3 pt-2.5">
        <View className="flex-row items-center">
          <Avatar collector={collector} size={36} />
          <View className="ml-2 min-w-0 flex-1">
            <Text className="text-[14px] font-semibold" style={{ color: colors.ink }} numberOfLines={1}>
              {collector.displayName}
            </Text>
            <Text className="text-[12px]" style={{ color: colors.muted }} numberOfLines={1}>
              {collectorHandleDisplay(collector.handle)}
            </Text>
          </View>
        </View>
        <View style={{ minHeight: 32 * fontScale, marginTop: 8 }}>
          <Text style={{ color: colors.faint, fontSize: 12, lineHeight: 16 }} numberOfLines={2}>
            {interests.join(' · ')}
          </Text>
        </View>
        <View className="mt-3">
          <FollowButton collectorId={collector.id} compact />
        </View>
      </View>
    </Pressable>
  )
}
