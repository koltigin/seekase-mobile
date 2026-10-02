import { ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Screen } from '../components/ui/screen'
import { publishedBadgeCatalog } from '../data/badges'
import { listPublicCollectorBadgeIds } from '../repositories/discover-repository'
import { useTheme } from '../state/app-state'
import { useAuth } from '../state/auth'
import { radius, space, type } from '../theme/tokens'
import { BadgeIcon } from '../components/profile/badge-icon'
import { BackButton } from '../components/ui/back-button'

export default function AchievementsScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const { user } = useAuth()
  const badgeQuery = useQuery({
    queryKey: ['account-achievement-badges', user?.id],
    enabled: Boolean(user),
    retry: false,
    queryFn: async () => {
      const result = await listPublicCollectorBadgeIds(user!.id)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const earnedIds = new Set(badgeQuery.data ?? [])
  const earnedCount = publishedBadgeCatalog.filter((badge) => earnedIds.has(badge.id)).length

  return (
    <Screen padded={false}>
      <View className="flex-row items-center justify-between px-5 pb-3">
        <BackButton onPress={() => router.back()} />
        <View className="flex-row items-center" style={{ gap: 7 }}>
          <BadgeIcon id="first-collection" family="milestone" size={22} />
          <Text style={{ ...type.eyebrow, color: colors.faint }}>Achievements</Text>
        </View>
        <View style={{ width: 96 }} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: space.tabPad }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-2" style={{ ...type.body, color: colors.muted }}>
          Verified account achievements from your public catalog, wallet identity, SGT eligibility, and Solana
          check-ins. Achievement badges are not NFTs.
        </Text>
        <Text className="mb-5 text-[13px]" style={{ color: colors.faint }}>
          {earnedCount} of {publishedBadgeCatalog.length} earned
        </Text>

        {badgeQuery.isError ? (
          <Text accessibilityRole="alert" className="mb-4 text-[13px]" style={{ color: colors.danger }}>
            {badgeQuery.error.message}
          </Text>
        ) : null}

        <View style={{ gap: 10 }}>
          {publishedBadgeCatalog.map((entry) => {
            const earned = earnedIds.has(entry.id)
            return (
              <View
                key={entry.id}
                className="px-4 py-4"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  opacity: earned ? 1 : 0.62,
                }}
              >
                <View className="flex-row items-start" style={{ gap: 12 }}>
                  <BadgeIcon id={entry.id} family={entry.family} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text
                      className="text-[11px] font-semibold uppercase tracking-[1.1px]"
                      style={{ color: colors.faint }}
                    >
                      {earned ? 'Earned' : 'Locked'}
                    </Text>
                    <Text className="mt-1 text-[16px] font-semibold" style={{ color: colors.ink }}>
                      {entry.label}
                    </Text>
                    <Text className="mt-1 text-[13px] leading-5" style={{ color: colors.muted }}>
                      {entry.description}
                    </Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </Screen>
  )
}
