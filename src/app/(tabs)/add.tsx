import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../components/ui/screen'
import { ScreenHeader } from '../../components/ui/screen-header'
import { useTheme } from '../../state/app-state'
import { useAuth } from '../../state/auth'
import { radius, space, type } from '../../theme/tokens'

export default function AddScreen() {
  const { colors } = useTheme()
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  function openAccountDestination(destination: '/cloud-collections?add=object' | '/cloud-collections?add=collection') {
    router.push(isAuthenticated ? destination : '/account')
  }

  return (
    <Screen padded={false}>
      <ScreenHeader eyebrow="Grow your collection" title="Add" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: space.tabPad }}>
        <Text style={{ ...type.body, color: colors.muted }}>
          Add something you collect or start a new collection. Every public object needs a photo. New collections
          appear publicly after their first photographed object is added.
        </Text>

        <View style={{ gap: 12, marginTop: 24 }}>
          <ChoiceCard
            title="Add a collectible"
            body="Add a book, coin, miniature, artwork, device, or any other item. You can choose a collection or organize it later."
            onPress={() => openAccountDestination('/cloud-collections?add=object')}
            primary
          />
          <ChoiceCard
            title="Create a collection"
            body="Create a named group such as My Library, Model Cars, or Ottoman Coins."
            onPress={() => openAccountDestination('/cloud-collections?add=collection')}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(isAuthenticated ? '/cloud-collections' : '/account')}
            style={{ alignItems: 'center', paddingVertical: 14 }}
          >
            <Text style={{ ...type.meta, fontWeight: '600', color: colors.ink }}>Manage my collections</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 24, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface }}>
          <Text style={{ ...type.eyebrow, textTransform: 'none', color: colors.faint }}>ACCOUNT STORAGE</Text>
          <Text style={{ ...type.meta, color: colors.muted, marginTop: 7 }}>
            Nothing already stored on this phone is uploaded automatically. Legacy device collections remain under
            Settings.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  )
}

function ChoiceCard({
  title,
  body,
  onPress,
  primary = false,
}: {
  title: string
  body: string
  onPress: () => void
  primary?: boolean
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={{
        minHeight: 118,
        justifyContent: 'center',
        padding: 18,
        borderRadius: radius.lg,
        borderWidth: primary ? 0 : 1,
        borderColor: colors.line,
        backgroundColor: primary ? colors.accent : colors.surface,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '600', color: primary ? colors.onAccent : colors.ink }}>{title}</Text>
      <Text style={{ ...type.meta, color: primary ? colors.onAccent : colors.muted, marginTop: 7 }}>{body}</Text>
    </Pressable>
  )
}
