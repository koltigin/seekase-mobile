import type { ReactNode } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { BadgeChip } from '../components/profile/badge-chip'
import { Screen } from '../components/ui/screen'
import { BackButton } from '../components/ui/back-button'
import { accountIdentityLabel } from '../data/account-identity'
import { seekerGenesisBadge } from '../data/badges'
import { accountModeLabel, useAuth } from '../state/auth'
import { useAppState, useTheme, type ThemePreference } from '../state/app-state'
import { radius, space, type } from '../theme/tokens'
import Constants from 'expo-constants'

const themes: { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

export default function SettingsScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const {
    themePreference,
    setThemePreference,
    resetOnboarding,
    clearLocalCatalog,
    clearLocalActivity,
    clearLocalSocialData,
    previewGenesisBadge,
    setPreviewGenesisBadge,
    demoSignedIn,
  } = useAppState()
  const auth = useAuth()
  const accountDetail = accountModeLabel({
    backendAvailability: auth.backendAvailability,
    isAuthenticated: auth.isAuthenticated,
    demoSignedIn,
  })
  const identityLabel = accountIdentityLabel(auth.user)

  return (
    <Screen padded={false}>
      <View className="flex-row items-center justify-between px-5 pb-3">
        <BackButton label="Close" onPress={() => router.back()} />
        <Text style={{ ...type.eyebrow, textTransform: 'none', color: colors.faint }}>SETTINGS</Text>
        <View style={{ width: 96 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: space.tabPad }}>
        <Section title="Account">
          <Row label="Seekase account" detail={accountDetail} onPress={() => router.push('/account')} />
          <Row label="Profile" detail="Edit collector identity" onPress={() => router.push('/edit-profile')} />
          {auth.isAuthenticated && identityLabel ? (
            <Text className="mt-2 text-[12px]" style={{ color: colors.faint }}>
              Signed in as {identityLabel}
            </Text>
          ) : null}
        </Section>

        <Section title="On this device">
          <Row
            label="Device collections"
            detail="Local records · separate from your account"
            onPress={() => router.push('/device-collections')}
          />
          <Row label="Saved on this device" detail="Legacy local saves" onPress={() => router.push('/saved')} />
          <Text className="mt-2 text-[13px]" style={{ color: colors.muted }}>
            These records stay on this phone. Nothing is uploaded automatically.
          </Text>
        </Section>

        <Section title="Appearance">
          <View className="flex-row" style={{ gap: 8 }}>
            {themes.map((option) => {
              const active = themePreference === option.id
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setThemePreference(option.id)}
                  className="flex-1 items-center py-2.5"
                  style={{
                    borderRadius: radius.pill,
                    backgroundColor: active ? colors.chipActive : colors.chip,
                  }}
                >
                  <Text className="text-[13px] font-medium" style={{ color: active ? colors.onAccent : colors.ink }}>
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Section>

        <Section title="Collecting">
          <Row label="Interests" detail="What you collect" onPress={() => router.push('/edit-profile')} />
        </Section>

        <Section title="Collector Identity">
          <Row
            label="Wallet & Seeker verification"
            detail="Private · optional Solana Mobile"
            onPress={() => router.push('/collector-identity')}
          />
          <Text className="mt-3 text-[13px]" style={{ color: colors.muted }}>
            Network is Mainnet. Your wallet address is never added to your public collector profile.
          </Text>
        </Section>

        <Section title="Help">
          <Row
            label="Support & recovery"
            detail="Account access, local data, and check-in help"
            onPress={() => router.push('/support')}
          />
        </Section>

        <Section title="Privacy">
          <Text style={{ ...type.body, color: colors.muted }}>
            Account collections are publicly readable. Wallet identity and device-only collections stay private.
          </Text>
        </Section>

        <Section title="About">
          <Row label="About Seekase" detail="SEEKer + showCASE" />
          <Row label="Replay introduction" onPress={() => router.push('/onboarding?preview=1')} />
          <Row label="Version" detail={Constants.expoConfig?.version ?? '1.0.0'} />
        </Section>

        {__DEV__ ? (
          <Section title="Developer">
            <Text className="mb-3 text-[13px]" style={{ color: colors.muted }}>
              Badge preview is labeled Preview and does not claim Seeker verification or token ownership. Genuine
              verification lives under Collector Identity and only shows a public badge when status is verified.
            </Text>
            <BadgeChip badge={seekerGenesisBadge} preview />
            <Pressable className="mt-4" onPress={() => setPreviewGenesisBadge(!previewGenesisBadge)}>
              <Text className="text-sm font-medium" style={{ color: colors.ink }}>
                {previewGenesisBadge ? 'Hide badge preview on Profile' : 'Show badge preview on Profile'}
              </Text>
            </Pressable>
            <Text className="mt-2 text-[12px]" style={{ color: colors.muted }}>
              Social/catalog/activity resets below do not disconnect the wallet or clear verification state.
            </Text>
            <Pressable
              className="mt-5 items-center py-3"
              style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line }}
              onPress={() => {
                void clearLocalCatalog()
              }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.ink }}>
                Clear local collections & items
              </Text>
            </Pressable>
            <Text className="mt-2 text-[12px]" style={{ color: colors.muted }}>
              Removes only cabinets and objects you created on this device. Seed demo content and onboarding stay.
            </Text>
            <Pressable
              className="mt-5 items-center py-3"
              style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line }}
              onPress={() => {
                void clearLocalActivity()
              }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.ink }}>
                Clear local activity
              </Text>
            </Pressable>
            <Text className="mt-2 text-[12px]" style={{ color: colors.muted }}>
              Clears your local activity trail only. Seed activity and catalog content stay.
            </Text>
            <Pressable
              className="mt-5 items-center py-3"
              style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line }}
              onPress={() => {
                void clearLocalSocialData()
              }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.ink }}>
                Reset local social data
              </Text>
            </Pressable>
            <Text className="mt-2 text-[12px]" style={{ color: colors.muted }}>
              Clears likes, saves, follows, and local activity. Does not reset onboarding, theme, or profile.
            </Text>
            <Pressable
              className="mt-5 items-center py-3"
              style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line }}
              onPress={() => {
                void resetOnboarding().then(() => router.replace('/onboarding'))
              }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.ink }}>
                Reset onboarding
              </Text>
            </Pressable>
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme()
  return (
    <View className="mb-6">
      <Text className="mb-2" style={{ ...type.eyebrow, textTransform: 'none', color: colors.faint }}>
        {title.toLocaleUpperCase('en-US')}
      </Text>
      <View className="px-4 py-4" style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
        {children}
      </View>
    </View>
  )
}

function Row({ label, detail, onPress }: { label: string; detail?: string; onPress?: () => void }) {
  const { colors } = useTheme()
  const inner = (
    <View className="py-2">
      <Text className="text-[15px] font-medium" style={{ color: colors.ink }}>
        {label}
      </Text>
      {detail ? (
        <Text className="mt-0.5 text-[13px]" style={{ color: colors.muted }}>
          {detail}
        </Text>
      ) : null}
    </View>
  )
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner
}
