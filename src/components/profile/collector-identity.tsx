import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../../state/app-state'
import { useWalletIdentity } from '../../state/wallet-identity'
import { radius } from '../../theme/tokens'

/** Compact private identity summary for Profile — never shows wallet address. */
export function CollectorIdentity() {
  const { colors } = useTheme()
  const router = useRouter()
  const { isConnected, seekerVerification, walletVerification } = useWalletIdentity()
  const verifiedCount = Number(walletVerification === 'verified') + Number(seekerVerification === 'verified')
  const summary = verifiedCount
    ? `${verifiedCount} verified ${verifiedCount === 1 ? 'credential' : 'credentials'}`
    : isConnected
      ? 'Wallet and Seeker verification settings'
      : 'Connect and verify a private wallet'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open collector identity"
      onPress={() => router.push('/collector-identity')}
      className="mt-4 px-4 py-3"
      style={{ backgroundColor: colors.chip, borderRadius: radius.md }}
    >
      <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
        <View className="flex-1">
          <Text className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: colors.faint }}>
            Collector Identity
          </Text>
          <Text className="mt-1 text-[13px]" style={{ color: colors.muted }}>
            {summary} · Address stays private
          </Text>
        </View>
        <Text className="text-[13px] font-medium" style={{ color: colors.ink }}>
          Manage →
        </Text>
      </View>
    </Pressable>
  )
}
