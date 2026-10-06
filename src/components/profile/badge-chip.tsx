import { Text, View } from 'react-native'
import type { CollectorBadge } from '../../data/badges'
import { useTheme } from '../../state/app-state'
import { radius } from '../../theme/tokens'
import { BadgeIcon } from './badge-icon'

export function BadgeChip({
  badge,
  preview = false,
  compact = false,
}: {
  badge: CollectorBadge
  preview?: boolean
  compact?: boolean
}) {
  const { colors } = useTheme()
  if (badge.state === 'hidden' && !preview) {
    return null
  }

  const label = preview && badge.state !== 'verified' ? `${badge.label} · Preview` : badge.label

  return (
    <View
      accessibilityLabel={`${label}. ${badge.description}`}
      className="self-center flex-row items-center"
      style={{
        gap: compact ? 6 : 8,
        minHeight: compact ? 34 : 40,
        paddingHorizontal: compact ? 10 : 12,
        paddingVertical: compact ? 6 : 8,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface,
      }}
    >
      <BadgeIcon id={badge.id} family={badge.family} size={compact ? 19 : 24} />
      <Text
        className="font-semibold"
        style={{ color: colors.ink, fontSize: compact ? 10 : 11, letterSpacing: compact ? 0.75 : 1 }}
      >
        {label.toLocaleUpperCase('en-US')}
      </Text>
    </View>
  )
}
