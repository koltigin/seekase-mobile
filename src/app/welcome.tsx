import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SeekaseLockup } from '../components/brand/seekase-lockup'
import { Screen } from '../components/ui/screen'
import { useAppState, useTheme } from '../state/app-state'
import { useAuth } from '../state/auth'
import { useWalletIdentity } from '../state/wallet-identity'
import { formatError } from '../utils/format-error'
import { requestWalletChallenge, verifyWalletLink, verifyWalletSignIn } from '../repositories/wallet-auth-repository'
import type { WalletSignInPayload } from '../repositories/wallet-auth-repository'
import { radius, type } from '../theme/tokens'

export default function WelcomeScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const auth = useAuth()
  const { backendAvailability, isAuthenticated } = auth
  const { interestsComplete } = useAppState()
  const wallet = useWalletIdentity()
  const router = useRouter()
  const [note, setNote] = useState<string | null>(null)
  const [walletBusy, setWalletBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [appleBusy, setAppleBusy] = useState(false)

  async function continueGoogle() {
    if (googleBusy) return
    setGoogleBusy(true)
    setNote(null)
    try {
      const result = await auth.signInWithGoogle()
      if (!result.ok) {
        if (!result.cancelled && result.error) setNote(result.error.message)
        return
      }
      router.replace(interestsComplete ? '/(tabs)' : '/interests')
    } catch {
      setNote('Could not complete Google sign-in. Check your connection and try again.')
    } finally {
      setGoogleBusy(false)
    }
  }

  async function continueApple() {
    if (appleBusy) return
    setAppleBusy(true)
    setNote(null)
    try {
      const result = await auth.signInWithApple()
      if (!result.ok) {
        if (!result.cancelled && result.error) setNote(result.error.message)
        return
      }
      router.replace(interestsComplete ? '/(tabs)' : '/interests')
    } catch {
      setNote('Could not complete Apple ID sign-in. Check your connection and try again.')
    } finally {
      setAppleBusy(false)
    }
  }

  async function continueWallet() {
    if (walletBusy) return
    setWalletBusy(true)
    setNote(null)
    try {
      // A wallet session can outlive the Seekase account after an interrupted
      // approval. Clear that stale authorization before starting a new account
      // sign-in so Solana Wallet presents a fresh approval sheet.
      if (!isAuthenticated && wallet.isConnected) {
        await wallet.disconnectWallet()
        setNote('Wallet session refreshed. Tap Continue with Solana wallet once more.')
        return
      }
      const intent = isAuthenticated ? 'link' : 'signin'
      let challengePayload: WalletSignInPayload | null = null
      const proof = await wallet.connectAndSignInWallet(async (address) => {
        const challenge = await requestWalletChallenge(address, intent)
        if (!challenge.ok) {
          setNote(challenge.error.message)
          return null
        }
        challengePayload = challenge.data
        return challenge.data
      })
      if (!proof) return
      if (!challengePayload) {
        setNote('The wallet sign-in request was incomplete. Please try again.')
        return
      }
      const proofInput = {
        payload: challengePayload,
        signedAddress: proof.address,
        signedMessage: proof.signedMessage,
        signature: proof.signature,
      }
      const verified = isAuthenticated ? await verifyWalletLink(proofInput) : await verifyWalletSignIn(proofInput)
      if (!verified.ok) {
        setNote(verified.error.message)
        return
      }
      setNote(
        isAuthenticated ? 'Wallet linked to this Seekase account.' : 'Wallet verified. Opening your Seekase account…',
      )
    } finally {
      setWalletBusy(false)
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }}
        showsVerticalScrollIndicator={false}
      >
        <SeekaseLockup width={164} />
        <Text className="mt-4" style={{ ...type.title, color: colors.ink }}>
          Join Seekase
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/onboarding?preview=1')}
          className="mt-3 py-2"
        >
          <Text style={{ ...type.meta, color: colors.ink }}>View introduction →</Text>
        </Pressable>
        <Text className="mt-3" style={{ ...type.body, color: colors.muted }}>
          Start with the wallet built into your Seeker. Other collectors can use a compatible Solana wallet or email.
        </Text>
        <Text className="mt-3" style={{ ...type.meta, color: colors.faint }}>
          {backendAvailability === 'configured'
            ? isAuthenticated
              ? 'Seekase account connected.'
              : 'Choose how you want to join.'
            : 'Account sign-in is unavailable in this build.'}
        </Text>

        <View className="mt-8" style={{ gap: 10 }}>
          <AuthButton
            label={
              walletBusy || wallet.connectionStatus === 'connecting'
                ? 'Opening Solana wallet…'
                : 'Continue with Solana wallet'
            }
            disabled={walletBusy || wallet.connectionStatus === 'connecting'}
            onPress={() => void continueWallet()}
          />
          <AuthButton label="Continue with email" secondary onPress={() => router.push('/account')} />
          <Text className="pt-2 text-center text-[12px] font-medium" style={{ color: colors.faint }}>
            MORE SIGN-IN OPTIONS
          </Text>
          <AuthButton
            label={googleBusy ? 'Opening Google…' : 'Continue with Google'}
            secondary
            disabled={googleBusy || isAuthenticated || auth.googleStatus !== 'available'}
            onPress={() => void continueGoogle()}
          />
          <AuthButton
            label={
              auth.appleStatus === 'available'
                ? appleBusy
                  ? 'Opening Apple ID…'
                  : 'Continue with Apple ID'
                : 'Continue with Apple ID · Coming Soon'
            }
            secondary
            disabled={appleBusy || isAuthenticated || auth.appleStatus !== 'available'}
            onPress={() => void continueApple()}
          />
        </View>
        <Text className="mt-3 text-center text-[13px]" style={{ color: colors.muted }}>
          On Seeker, the first option opens the installed phone wallet. Other Android wallets can connect through Mobile
          Wallet Adapter. Your wallet address stays private inside Seekase.
        </Text>
        {note || wallet.lastError ? (
          <Text className="mt-4 text-center text-[13px] leading-5" style={{ color: colors.muted }}>
            {note ?? formatError(wallet.lastError)}
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  )
}

function AuthButton({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string
  onPress: () => void
  secondary?: boolean
  disabled?: boolean
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      className="items-center py-3.5"
      style={{
        backgroundColor: secondary ? colors.surface : colors.accent,
        borderRadius: radius.pill,
        borderWidth: secondary ? 1 : 0,
        borderColor: colors.line,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Text className="text-sm font-medium" style={{ color: secondary ? colors.ink : colors.onAccent }}>
        {label}
      </Text>
    </Pressable>
  )
}
