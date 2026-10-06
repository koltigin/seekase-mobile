import { useMemo, useRef, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { CloudButton } from '../components/catalog/cloud-controls'
import { Screen } from '../components/ui/screen'
import { BackButton } from '../components/ui/back-button'
import { accountIdentityLabel } from '../data/account-identity'
import { accountModeLabel, useAuth } from '../state/auth'
import { useAppState, useTheme } from '../state/app-state'
import { useWalletIdentity } from '../state/wallet-identity'
import { radius, space, type } from '../theme/tokens'

export default function AccountScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const { demoSignedIn, interestsComplete } = useAppState()
  const auth = useAuth()
  const wallet = useWalletIdentity()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [deletionConfirmation, setDeletionConfirmation] = useState('')
  const scrollRef = useRef<ScrollView>(null)

  const statusLabel = useMemo(
    () =>
      accountModeLabel({
        backendAvailability: auth.backendAvailability,
        isAuthenticated: auth.isAuthenticated,
        demoSignedIn,
      }),
    [auth.backendAvailability, auth.isAuthenticated, demoSignedIn],
  )

  const pending = useRef(false)
  const identityLabel = accountIdentityLabel(auth.user)

  async function submit() {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setNote(null)
    auth.clearAuthError()
    try {
      const result =
        mode === 'signin'
          ? await auth.signInWithEmail(email, password)
          : await auth.signUpWithEmail(email, password, {
              displayName: displayName || undefined,
              handle: handle || undefined,
            })
      if (!result.ok) {
        setNote(result.error.message)
        return
      }
      if (result.needsConfirmation) {
        setNote('Check your email to confirm your account before signing in.')
        return
      }
      setPassword('')
      router.replace(interestsComplete ? '/(tabs)' : '/interests')
    } catch {
      setNote('Could not sign in. Check your connection and try again.')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  async function signOut() {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setNote(null)
    try {
      if (await auth.signOut()) {
        await wallet.disconnectWallet()
        setPassword('')
        setMode('signin')
        router.replace('/welcome')
      }
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  async function deleteAccount() {
    if (pending.current || deletionConfirmation !== 'DELETE') return
    pending.current = true
    setBusy(true)
    setNote(null)
    try {
      if (await auth.deleteAccount()) {
        await wallet.disconnectWallet()
        setDeletionConfirmation('')
        setPassword('')
        router.replace('/welcome')
      }
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete Seekase account?',
      'This permanently deletes your online profile, collections, items, photos, comments, social activity, wallet link, and badges. Collections stored only on this device stay on this phone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete permanently', style: 'destructive', onPress: () => void deleteAccount() },
      ],
    )
  }

  return (
    <Screen padded={false}>
      <View className="flex-row items-center justify-between px-5 pb-3">
        <BackButton
          onPress={() => {
            if (router.canGoBack()) router.back()
            else router.replace(auth.isAuthenticated ? '/(tabs)' : '/welcome')
          }}
        />
        <Text style={{ ...type.eyebrow, color: colors.faint }}>Account</Text>
        <View style={{ width: 96 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={12}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: space.tabPad + 32 }}
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ ...type.title, fontSize: 28, color: colors.ink }}>
            {auth.isAuthenticated ? 'Your account' : 'Welcome to Seekase.'}
          </Text>
          <Text className="mt-3" style={{ ...type.body, color: colors.muted }}>
            {auth.isAuthenticated
              ? 'Manage your account and open your saved collections.'
              : 'Sign in, or create an account to keep your collections online.'}
          </Text>

          {!auth.isAuthenticated ? (
            <View className="mt-4" style={{ gap: 10 }}>
              <CloudButton label="View introduction" secondary onPress={() => router.push('/onboarding?preview=1')} />
              <CloudButton label="All sign-in options" secondary onPress={() => router.replace('/welcome')} />
            </View>
          ) : null}

          <View className="mt-6 px-4 py-4" style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
            <Text style={{ ...type.eyebrow, color: colors.faint }}>Status</Text>
            <Text className="mt-2 text-[15px] font-medium" style={{ color: colors.ink }}>
              {statusLabel}
            </Text>
            {auth.isAuthenticated && identityLabel ? (
              <Text className="mt-1 text-[13px]" style={{ color: colors.muted }}>
                {identityLabel}
              </Text>
            ) : null}
            <Text className="mt-2 text-[12px]" style={{ color: colors.faint }}>
              Wallet / Seeker identity stays separate under Collector Identity.
            </Text>
          </View>

          {auth.backendAvailability === 'unavailable' ? (
            <View className="mt-5 px-4 py-4" style={{ backgroundColor: colors.chip, borderRadius: radius.lg }}>
              <Text className="text-[14px] leading-5" style={{ color: colors.muted }}>
                Account sign-in is unavailable in this build. Check the backend configuration and try again.
              </Text>
            </View>
          ) : auth.isAuthenticated ? (
            <View className="mt-5" style={{ gap: 12 }}>
              <CloudButton
                label="Open account collections"
                disabled={busy}
                onPress={() => router.push('/cloud-collections')}
              />
              <Pressable
                className="items-center py-3"
                style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line }}
                accessibilityRole="button"
                disabled={busy}
                onPress={() => void signOut()}
              >
                <Text className="text-sm font-medium" style={{ color: colors.ink }}>
                  {busy ? 'Signing out…' : 'Sign out'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="mt-5">
              <View className="mb-4 flex-row" style={{ gap: 8 }}>
                {(['signin', 'signup'] as const).map((entry) => {
                  const active = mode === entry
                  return (
                    <Pressable
                      key={entry}
                      disabled={busy}
                      onPress={() => {
                        setMode(entry)
                        setNote(null)
                        auth.clearAuthError()
                      }}
                      className="flex-1 items-center py-2.5"
                      style={{
                        borderRadius: radius.pill,
                        backgroundColor: active ? colors.chipActive : colors.chip,
                      }}
                    >
                      <Text
                        className="text-[13px] font-medium"
                        style={{ color: active ? colors.onAccent : colors.ink }}
                      >
                        {entry === 'signin' ? 'Sign in' : 'Create account'}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              {mode === 'signup' ? (
                <>
                  <Field
                    label="Display name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Collector name"
                    autoCapitalize="words"
                  />
                  <Field
                    label="Username"
                    value={handle}
                    onChangeText={setHandle}
                    placeholder="Choose a username"
                    autoCapitalize="none"
                  />
                </>
              ) : null}
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />

              <Pressable
                className="mt-2 items-center py-3.5"
                style={{ backgroundColor: colors.accent, borderRadius: radius.pill, opacity: busy ? 0.7 : 1 }}
                disabled={busy}
                onPress={() => void submit()}
              >
                <Text className="text-sm font-medium" style={{ color: colors.onAccent }}>
                  {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
                </Text>
              </Pressable>

              <Text className="mt-4 text-[12px] leading-5" style={{ color: colors.faint }}>
                Solana wallet sign-in is available from All sign-in options.
              </Text>
            </View>
          )}

          {note || auth.lastError ? (
            <Text className="mt-4 text-[13px] leading-5" style={{ color: colors.danger }}>
              {note ?? auth.lastError}
            </Text>
          ) : null}

          <View className="mt-8 px-4 py-4" style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
            <Text style={{ ...type.eyebrow, color: colors.faint }}>Local data</Text>
            <Text className="mt-2 text-[13px] leading-5" style={{ color: colors.muted }}>
              Collections saved on this device stay here. Signing in or out does not upload or delete them.
            </Text>
          </View>

          {auth.isAuthenticated ? (
            <View className="mt-5 px-4 py-4" style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
              <Text style={{ ...type.eyebrow, color: colors.danger }}>Delete account</Text>
              <Text className="mt-2 text-[13px] leading-5" style={{ color: colors.muted }}>
                Permanently deletes your online profile, collections, items, photos, comments, social activity, wallet
                link, and badges. Collections stored only on this device stay on this phone.
              </Text>
              <Text className="mt-3 text-[12px] font-medium" style={{ color: colors.faint }}>
                Type DELETE to continue
              </Text>
              <TextInput
                accessibilityLabel="Delete account confirmation"
                value={deletionConfirmation}
                onChangeText={setDeletionConfirmation}
                editable={!busy}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onFocus={() => requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }))}
                className="mt-2 px-4 py-3 text-[15px]"
                style={{ color: colors.ink, backgroundColor: colors.chip, borderRadius: radius.md }}
              />
              <View className="mt-3">
                <CloudButton
                  label={busy ? 'Working…' : 'Delete account permanently'}
                  secondary
                  danger
                  disabled={busy || deletionConfirmation !== 'DELETE'}
                  onPress={confirmDeleteAccount}
                />
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  autoCapitalize?: 'none' | 'words' | 'sentences'
  keyboardType?: 'email-address' | 'default'
}) {
  const { colors } = useTheme()
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[12px] font-medium" style={{ color: colors.faint }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={false}
        keyboardType={keyboardType}
        className="px-4 py-3 text-[15px]"
        style={{
          color: colors.ink,
          backgroundColor: colors.chip,
          borderRadius: radius.md,
        }}
      />
    </View>
  )
}
