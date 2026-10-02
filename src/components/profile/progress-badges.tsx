import { Text, View } from 'react-native'
import { earnedBadgesForIds, earnedProgressBadges } from '../../data/badges'
import { useTheme } from '../../state/app-state'
import { type } from '../../theme/tokens'
import { BadgeChip } from './badge-chip'
import { BadgeIcon } from './badge-icon'

export function ProgressBadges({
  collectionCount,
  itemCount,
  largestCategoryItemCount = 0,
  longestStreak = 0,
  badgeIds,
  showHeading = true,
  compact = false,
}: {
  collectionCount: number
  itemCount: number
  largestCategoryItemCount?: number
  longestStreak?: number
  badgeIds?: string[]
  showHeading?: boolean
  compact?: boolean
}) {
  const { colors } = useTheme()
  const badges = badgeIds
    ? earnedBadgesForIds(badgeIds)
    : earnedProgressBadges({ collectionCount, itemCount, largestCategoryItemCount, longestStreak })
  if (!badges.length) return null
  return (
    <View style={{ gap: showHeading ? 10 : 0 }}>
      {showHeading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BadgeIcon id={badges[0]?.id ?? 'first-collection'} family={badges[0]?.family ?? 'milestone'} size={24} />
          <Text style={{ ...type.eyebrow, color: colors.faint }}>Achievements</Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {badges.map((badge) => (
          <BadgeChip key={badge.id} badge={badge} compact={compact} />
        ))}
      </View>
    </View>
  )
}
