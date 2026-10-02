import type { ReactNode } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { BadgeChip } from '../components/profile/badge-chip'
import { Screen } from '../components/ui/screen'
import { BackButton } from '../components/ui/back-button'
import { SEEKASE_SOLANA_NETWORK_LABEL } from '../data/solana-network'
import { SEEKER_VERIFICATION_AVAILABLE } from '../services/seeker-verification'
import { useTheme } from '../state/app-state'
import { useWalletIdentity } from '../state/wallet-identity'
import { radius, space, type } from '../theme/tokens'

export default function CollectorIdentityScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const identity = useWalletIdentity()

  return (
    <Screen padded={false}>
      <View className="flex-row items-center justify-between px-5 pb-3">
        <BackButton onPress={() => router.back()} />
        <Text style={{ ...type.eyebrow, color: colors.faint }}>Collector Identity</Text>
        <View style={{ width: 96 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: space.tabPad }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-5" style={{ ...type.body, color: colors.muted }}>
          Wallet identity is private. Seekase social identity stays separate. Verification can be shown without
          revealing your wallet address or Seeker identity.
        </Text>

        <Section title="Wallet">
          <Text className="text-[15px] font-medium" style={{ color: colors.ink }}>
            {identity.isConnected ? 'Connected' : 'Not connected'}
          </Text>
          <Text className="mt-1 text-[13px]" style={{ color: colors.muted }}>
            Solana Mobile Wallet Adapter · {SEEKASE_SOLANA_NETWORK_LABEL}
          </Text>
          <Text className="mt-2 text-[12px]" style={{ color: colors.faint }}>
            Your wallet is never added to your public collector profile.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={identity.isConnected ? 'Disconnect wallet' : 'Connect Solana wallet'}
            className="mt-4 items-center py-3"
            style={{ backgroundColor: colors.accent, borderRadius: radius.pill }}
            onPress={() => void (identity.isConnected ? identity.disconnectWallet() : identity.connectWallet())}
          >
            <Text className="text-sm font-medium" style={{ color: colors.onAccent }}>
              {identity.connectionStatus === 'connecting'
                ? 'Connecting…'
                : identity.isConnected
                  ? 'Disconnect wallet'
                  : 'Connect Solana Wallet'}
            </Text>
          </Pressable>
          {identity.lastError ? (
            <Text className="mt-3 text-[12px]" style={{ color: colors.danger }}>
              {identity.lastError}
            </Text>
          ) : null}
        </Section>

        <Section title="Wallet verification">
          <Text className="text-[15px] font-medium" style={{ color: colors.ink }}>
            {identity.walletVerification === 'verified'
              ? 'Wallet Verified'
              : identity.walletVerification === 'loading'
                ? 'Checking verification…'
                : identity.walletVerification === 'error'
                  ? 'Verification status unavailable'
                  : 'Not verified'}
          </Text>
          <Text className="mt-2 text-[13px] leading-5" style={{ color: colors.muted }}>
            Wallet Verified means this Seekase account proved control of a Solana wallet by signing a private message.
            It does not mean Seeker Genesis ownership.
          </Text>
          {identity.publicWalletBadge ? (
            <View className="mt-3 items-start">
              <BadgeChip badge={identity.publicWalletBadge} />
            </View>
          ) : null}
          {identity.walletVerifiedAt ? (
            <Text className="mt-2 text-[11px]" style={{ color: colors.faint }}>
              Last verified {new Date(identity.walletVerifiedAt).toLocaleString()}
            </Text>
          ) : null}
        </Section>

        <Section title="Seeker verification">
          <Text className="text-[15px] font-medium" style={{ color: colors.ink }}>
            {identity.verificationLabel}
          </Text>
          {identity.verificationReason ? (
            <Text className="mt-2 text-[13px] leading-5" style={{ color: colors.muted }}>
              {identity.verificationReason}
            </Text>
          ) : (
            <Text className="mt-2 text-[13px] leading-5" style={{ color: colors.muted }}>
              Check the privately linked wallet for a genuine Seeker Genesis Token. The read-only server check never
              publishes the wallet address, token account, or SGT mint.
            </Text>
          )}
          {identity.publicSeekerBadge ? (
            <View className="mt-3 items-start">
              <BadgeChip badge={identity.publicSeekerBadge} />
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Check Seeker eligibility"
            className="mt-4 items-center py-3"
            style={{
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: colors.line,
              opacity: SEEKER_VERIFICATION_AVAILABLE && identity.isConnected ? 1 : 0.55,
            }}
            disabled={
              !SEEKER_VERIFICATION_AVAILABLE || !identity.isConnected || identity.seekerVerification === 'checking'
            }
            onPress={() => void identity.checkSeekerEligibility()}
          >
            <Text className="text-sm font-medium" style={{ color: colors.ink }}>
              {identity.seekerVerification === 'checking'
                ? 'Checking…'
                : SEEKER_VERIFICATION_AVAILABLE
                  ? 'Check Seeker eligibility'
                  : 'Mainnet verification only'}
            </Text>
          </Pressable>
          {identity.verificationCheckedAt ? (
            <Text className="mt-2 text-[11px]" style={{ color: colors.faint }}>
              Last checked {new Date(identity.verificationCheckedAt).toLocaleString()}
            </Text>
          ) : null}
        </Section>

        <Section title="Public profile visibility">
          <Text style={{ ...type.body, color: colors.muted }}>
            Public collectors may see a Seeker Genesis badge only when verification is genuinely verified. Wallet
            address, `.skr`, Seeker username, SGT mint, and balances are never shown publicly.
          </Text>
        </Section>
      </ScrollView>
    </Screen>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme()
  return (
    <View className="mb-5">
      <Text className="mb-2" style={{ ...type.eyebrow, color: colors.faint }}>
        {title}
      </Text>
      <View className="px-4 py-4" style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
        {children}
      </View>
    </View>
  )
}
