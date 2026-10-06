import { useCallback, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ProfileAccountCatalog, type ProfileCatalogSummary } from '../../components/profile/account-catalog'
import { useAuth } from '../../state/auth'
import { CloudButton } from '../../components/catalog/cloud-controls'
import { BadgeChip } from '../../components/profile/badge-chip'
import { CollectorIdentity } from '../../components/profile/collector-identity'
import { DailyCheckInCard } from '../../components/profile/daily-checkin-card'
import { SocialLinksRow } from '../../components/profile/social-links-row'
import { BadgeIcon } from '../../components/profile/badge-icon'
import { ProfileAvatar } from '../../components/profile/profile-avatar'
import { HeaderIcon } from '../../components/ui/header-icon'
import { IconDots } from '../../components/ui/icons'
import { Screen } from '../../components/ui/screen'
import { earnedBadgesForIds, seekerGenesisBadge } from '../../data/badges'
import { getCategory } from '../../data/categories'
import { getCollectorSocialCounts } from '../../repositories/social-repository'
import { listPublicCollectorBadgeIds } from '../../repositories/discover-repository'
import { useAppState, useTheme } from '../../state/app-state'
import { useWalletIdentity } from '../../state/wallet-identity'
import { radius, space, type } from '../../theme/tokens'

export default function ProfileScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const { profile, previewGenesisBadge } = useAppState()
  const wallet = useWalletIdentity()
  const { publicSeekerBadge, publicWalletBadge } = wallet
  const auth = useAuth()
  const { user } = auth
  const [catalogSummary, setCatalogSummary] = useState<ProfileCatalogSummary>({ collections: 0, items: 0 })
  const socialQuery = useQuery({
    queryKey: ['collector-social-counts', user?.id],
    enabled: Boolean(user),
    retry: false,
    queryFn: async () => {
      const result = await getCollectorSocialCounts(user!.id)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const badgeQuery = useQuery({
    queryKey: ['profile-account-badges', user?.id],
    enabled: Boolean(user),
    retry: false,
    queryFn: async () => {
      const result = await listPublicCollectorBadgeIds(user!.id)
      if (!result.ok) throw new Error(result.error.message)
      return result.data.filter((id) => id !== 'wallet-verified' && id !== 'seeker-genesis')
    },
  })
  const { refetch: refetchSocial } = socialQuery
  const { refetch: refetchBadges } = badgeQuery
  useFocusEffect(
    useCallback(() => {
      if (user) {
        void refetchSocial()
        void refetchBadges()
      }
    }, [refetchBadges, refetchSocial, user]),
  )
  const handle = profile.handle.startsWith('@') ? profile.handle : `@${profile.handle}`
  const interestLabels = profile.interestIds
    .map((id) => getCategory(id)?.shortLabel)
    .filter((label): label is string => Boolean(label))
  const achievementBadges = earnedBadgesForIds(badgeQuery.data ?? [])

  return (
    <Screen padded={false}>
      <View className="flex-row items-center justify-between px-5 pb-4 pt-1">
        <View>
          <Text style={{ ...type.eyebrow, color: colors.faint }}>COLLECTOR PROFILE</Text>
          <Text className="mt-1 text-base font-semibold" style={{ color: colors.ink }}>
            {handle}
          </Text>
        </View>
        <View>
          <HeaderIcon onPress={() => router.push('/settings')}>
            <IconDots color={colors.ink} size={18} />
          </HeaderIcon>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: space.tabPad }}
      >
        <View className="flex-row items-center" style={{ gap: 18 }}>
          <ProfileAvatar path={profile.avatarPath} initials={profile.avatarInitials} color={profile.avatarColor} />
          <View className="flex-1 flex-row flex-wrap" style={{ rowGap: 16 }}>
            <ProfileMetric label="Collections" value={catalogSummary.collections} />
            <ProfileMetric label="Objects" value={catalogSummary.items} />
            <ProfileMetric label="Followers" value={socialQuery.data?.followers ?? 0} />
            <ProfileMetric label="Following" value={socialQuery.data?.following ?? 0} />
          </View>
        </View>

        <View className="mt-5">
          <Text style={{ ...type.title, fontSize: 26, color: colors.ink }}>{profile.displayName}</Text>
          {profile.location ? (
            <Text className="mt-1 text-[13px]" style={{ color: colors.faint }}>
              {profile.location}
            </Text>
          ) : null}
          <Text className="mt-3" style={{ ...type.body, color: colors.ink }}>
            {profile.bio}
          </Text>
          <SocialLinksRow links={profile.socials} />
          {publicWalletBadge || publicSeekerBadge || previewGenesisBadge || achievementBadges.length ? (
            <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
              {publicWalletBadge ? <BadgeChip badge={publicWalletBadge} compact /> : null}
              {publicSeekerBadge ? <BadgeChip badge={publicSeekerBadge} compact /> : null}
              {previewGenesisBadge ? <BadgeChip badge={seekerGenesisBadge} preview compact /> : null}
              {achievementBadges.map((badge) => (
                <BadgeChip key={badge.id} badge={badge} compact />
              ))}
            </View>
          ) : null}
          {user ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View all achievements"
              className="mt-3 self-start flex-row items-center py-2"
              style={{ gap: 7 }}
              onPress={() => router.push('/achievements')}
            >
              <BadgeIcon id="first-collection" family="milestone" size={20} />
              <Text className="text-[13px] font-semibold" style={{ color: colors.ink }}>
                View achievements
              </Text>
            </Pressable>
          ) : null}
        </View>

        {interestLabels.length > 0 ? (
          <View className="mt-5 flex-row flex-wrap" style={{ gap: 6 }}>
            {interestLabels.slice(0, 6).map((label) => (
              <View key={label} className="px-2.5 py-1" style={{ backgroundColor: colors.chip, borderRadius: 999 }}>
                <Text className="text-[11px] font-medium" style={{ color: colors.muted }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          className="mt-5 items-center py-3"
          style={{ borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill }}
          onPress={() => router.push('/edit-profile')}
        >
          <Text className="text-sm font-medium" style={{ color: colors.ink }}>
            Edit profile
          </Text>
        </Pressable>

        {user ? (
          <Pressable
            accessibilityRole="button"
            className="mt-5 items-center py-3"
            style={{ backgroundColor: colors.surface, borderRadius: radius.pill }}
            onPress={() => router.push('/account')}
          >
            <Text className="text-[13px] font-medium" style={{ color: colors.ink }}>
              Manage account
            </Text>
          </Pressable>
        ) : null}

        <CollectorIdentity />

        {user ? <DailyCheckInCard /> : null}

        {user ? (
          <ProfileAccountCatalog key={user.id} ownerId={user.id} onSummary={setCatalogSummary} />
        ) : (
          <View style={{ marginTop: 20 }}>
            <CloudButton label="Sign in for account collections" onPress={() => router.push('/account')} />
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

function ProfileMetric({ label, value }: { label: string; value: number }) {
  const { colors } = useTheme()
  return (
    <View className="w-1/2 items-center">
      <Text className="text-lg font-semibold" style={{ color: colors.ink }}>
        {value.toLocaleString()}
      </Text>
      <Text className="mt-0.5 text-[11px]" style={{ color: colors.muted }}>
        {label}
      </Text>
    </View>
  )
}
