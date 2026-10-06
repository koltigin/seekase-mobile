import { Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../components/ui/screen'
import { BackButton } from '../components/ui/back-button'
import { useTheme } from '../state/app-state'
import { radius, space, type } from '../theme/tokens'

const supportUrl = process.env.EXPO_PUBLIC_SUPPORT_URL?.trim()
const supportEmail = 'support@seekase.app'

export default function SupportScreen() {
  const router = useRouter()
  const { colors } = useTheme()

  return (
    <Screen padded={false}>
      <View className="flex-row items-center justify-between px-5 pb-3">
        <BackButton onPress={() => router.back()} />
        <Text style={{ ...type.eyebrow, color: colors.faint }}>HELP & SUPPORT</Text>
        <View style={{ width: 96 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: space.tabPad }}>
        <Text className="mb-3" style={{ ...type.title, color: colors.ink }}>
          Support & recovery
        </Text>
        <Text className="mb-5 text-[14px] leading-6" style={{ color: colors.muted }}>
          Follow the matching recovery path below. Never share your wallet recovery phrase, private key, password, or
          one-time code with Seekase support.
        </Text>

        <HelpCard title="Wallet account">
          Reconnect the same Solana wallet you originally used. Your wallet address remains private inside Seekase. A
          display name, username, or .skr name cannot replace wallet ownership proof.
        </HelpCard>

        <HelpCard title="Email account">
          Sign in with the same email address used to create the account. If you cannot regain access, use the official
          support page for the available recovery options.
        </HelpCard>

        <HelpCard title="Collections on this phone">
          Device-only collections stay on this phone and are not silently uploaded. They cannot be restored from your
          online account after the app data or phone is erased.
        </HelpCard>

        <HelpCard title="Daily check-in">
          If a wallet transaction completed but the status did not refresh, return to Profile and refresh before trying
          again. Seekase allows one verified check-in per UTC day.
        </HelpCard>

        <View className="mt-1 px-4 py-4" style={{ borderRadius: radius.lg, backgroundColor: colors.surface }}>
          <Text style={{ ...type.eyebrow, color: colors.faint }}>CONTACT</Text>
          <Text className="mt-2 text-[13px] leading-5" style={{ color: colors.muted }}>
            {supportUrl
              ? 'Open the official Seekase support page. Include the issue and app version, but never include wallet secrets.'
              : 'The official support address will be added before the public release.'}
          </Text>
          {supportUrl ? (
            <Pressable
              accessibilityRole="link"
              className="mt-4 items-center py-3.5"
              style={{ borderRadius: radius.pill, backgroundColor: colors.accent }}
              onPress={() => void Linking.openURL(supportUrl)}
            >
              <Text className="text-sm font-medium" style={{ color: colors.onAccent }}>
                Open Seekase support
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Email ${supportEmail}`}
            className="mt-3 items-center py-3.5"
            style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line }}
            onPress={() => void Linking.openURL(`mailto:${supportEmail}`)}
          >
            <Text className="text-sm font-medium" style={{ color: colors.ink }}>
              {supportEmail}
            </Text>
          </Pressable>
        </View>

        <Text className="mt-6 text-center text-[13px]" style={{ color: colors.muted }}>
          Built with ❤️ by KolTigin on Solana.
        </Text>
      </ScrollView>
    </Screen>
  )
}

function HelpCard({ title, children }: { title: string; children: string }) {
  const { colors } = useTheme()
  return (
    <View className="mb-4 px-4 py-4" style={{ borderRadius: radius.lg, backgroundColor: colors.surface }}>
      <Text className="text-[16px] font-semibold" style={{ color: colors.ink }}>
        {title}
      </Text>
      <Text className="mt-2 text-[13px] leading-5" style={{ color: colors.muted }}>
        {children}
      </Text>
    </View>
  )
}
