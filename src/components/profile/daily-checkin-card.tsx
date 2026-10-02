import { Pressable, Text, View } from 'react-native'
import { dailyCheckInErrorMessage } from '../../data/daily-checkin'
import { useDailyCheckIn } from '../../features/checkin/use-daily-checkin'
import { useTheme } from '../../state/app-state'
import { useWalletIdentity } from '../../state/wallet-identity'
import { radius, type } from '../../theme/tokens'
import { SEEKASE_SOLANA_NETWORK_LABEL } from '../../data/solana-network'
import { earnedProgressBadges } from '../../data/badges'
import { BadgeChip } from './badge-chip'

export function DailyCheckInCard() {
  const { colors } = useTheme()
  const identity = useWalletIdentity()
  const { statusQuery, checkInMutation } = useDailyCheckIn()
  const status = statusQuery.data
  const streakBadges = earnedProgressBadges({
    collectionCount: 0,
    itemCount: 0,
    longestStreak: status?.longestStreak ?? 0,
  }).filter((badge) => badge.family === 'streak')
  const disabled =
    !identity.isConnected ||
    identity.walletVerification !== 'verified' ||
    Boolean(status?.checkedInToday) ||
    checkInMutation.isPending

  const buttonLabel = checkInMutation.isPending
    ? 'Opening Solana wallet…'
    : status?.checkedInToday
      ? 'Checked in today'
      : `Check in on ${SEEKASE_SOLANA_NETWORK_LABEL}`

  return (
    <View className="mt-5 px-4 py-4" style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
      <Text style={{ ...type.eyebrow, textTransform: 'none', color: colors.faint }}>DAILY CHECK-IN</Text>
      <View className="mt-3 flex-row" style={{ gap: 24 }}>
        <Metric label="Current streak" value={dayCount(status?.currentStreak ?? 0)} />
        <Metric label="Longest" value={dayCount(status?.longestStreak ?? 0)} />
        <Metric label="Total" value={String(status?.totalCheckIns ?? 0)} />
      </View>
      <Text className="mt-3 text-[12px] leading-5" style={{ color: colors.muted }}>
        Creates one signed Solana Memo transaction. Seekase charges no fee; the wallet pays the{' '}
        {SEEKASE_SOLANA_NETWORK_LABEL} network fee.
      </Text>
      {streakBadges.length ? (
        <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
          {streakBadges.map((badge) => (
            <BadgeChip key={badge.id} badge={badge} />
          ))}
        </View>
      ) : null}
      {!identity.isConnected || identity.walletVerification !== 'verified' ? (
        <Text className="mt-2 text-[12px]" style={{ color: colors.faint }}>
          Connect the verified wallet for this account before checking in.
        </Text>
      ) : null}
      {statusQuery.error ? (
        <Text className="mt-2 text-[12px]" style={{ color: colors.danger }}>
          {statusQuery.error.message}
        </Text>
      ) : null}
      {checkInMutation.error && !status?.checkedInToday ? (
        <Text className="mt-2 text-[12px]" style={{ color: colors.danger }}>
          {dailyCheckInErrorMessage(checkInMutation.error)}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        disabled={disabled}
        className="mt-4 items-center py-3"
        style={{ backgroundColor: disabled ? colors.chip : colors.accent, borderRadius: radius.pill }}
        onPress={() => checkInMutation.mutate()}
      >
        <Text className="text-sm font-medium" style={{ color: disabled ? colors.muted : colors.onAccent }}>
          {buttonLabel}
        </Text>
      </Pressable>
    </View>
  )
}

function dayCount(value: number) {
  return `${value} ${value === 1 ? 'day' : 'days'}`
}

function Metric({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme()
  return (
    <View>
      <Text className="text-[16px] font-semibold" style={{ color: colors.ink }}>
        {value}
      </Text>
      <Text className="mt-0.5 text-[11px]" style={{ color: colors.faint }}>
        {label}
      </Text>
    </View>
  )
}
