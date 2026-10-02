import { Pressable, Text } from 'react-native'
import { useAppState, useTheme } from '../../state/app-state'
import { radius } from '../../theme/tokens'

type Props = {
  collectorId: string
  compact?: boolean
  /** When true, fills available width (e.g. profile header). */
  fullWidth?: boolean
}

export function FollowButton({ collectorId, compact = false, fullWidth = false }: Props) {
  const { colors } = useTheme()
  const { social, toggleFollowCollector } = useAppState()
  const following = social.followedCollectorIds.includes(collectorId)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: following }}
      accessibilityLabel={following ? 'Unfollow collector' : 'Follow collector'}
      onPress={() => toggleFollowCollector(collectorId)}
      className={compact ? 'items-center px-3.5 py-2' : 'items-center px-5 py-3'}
      style={{
        backgroundColor: following ? colors.chip : colors.accent,
        borderRadius: radius.pill,
        alignSelf: fullWidth ? 'stretch' : undefined,
        flex: fullWidth ? 1 : undefined,
      }}
    >
      <Text
        className={compact ? 'text-[12px] font-medium' : 'text-sm font-medium'}
        style={{ color: following ? colors.ink : colors.onAccent }}
      >
        {following ? 'Following' : 'Follow'}
      </Text>
    </Pressable>
  )
}

/** Mock follower total + local follow delta (prototype-consistent). */
export function useFollowerCount(collectorId: string, baseFollowers: number) {
  const { social } = useAppState()
  const following = social.followedCollectorIds.includes(collectorId)
  return baseFollowers + (following ? 1 : 0)
}
