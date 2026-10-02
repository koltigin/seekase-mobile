import { ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ArchiveCollectionCard } from '../components/discover/archive-collection-card'
import { CloudButton } from '../components/catalog/cloud-controls'
import { Screen } from '../components/ui/screen'
import { BackButton } from '../components/ui/back-button'
import { useTheme } from '../state/app-state'
import { useCatalog } from '../state/use-catalog'
import { radius, space, type } from '../theme/tokens'

export default function DeviceCollectionsScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const { ownCollections } = useCatalog()

  return (
    <Screen padded={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 }}>
        <BackButton onPress={() => router.back()} />
        <Text style={{ ...type.eyebrow, textTransform: 'none', color: colors.faint, flex: 1, textAlign: 'center' }}>
          ON THIS DEVICE
        </Text>
        <View style={{ width: 96 }} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: space.tabPad }}
      >
        <Text style={{ ...type.title, color: colors.ink }}>Device collections</Text>
        <Text style={{ ...type.body, color: colors.muted, marginTop: 10, marginBottom: 20 }}>
          Legacy records stored only on this phone. They stay separate from your public Seekase account unless you
          explicitly recreate them online.
        </Text>
        <View style={{ gap: 10, marginBottom: 24 }}>
          <CloudButton label="Add an item on this device" onPress={() => router.push('/device-add?mode=item')} />
          <CloudButton
            label="Create a device collection"
            secondary
            onPress={() => router.push('/device-add?mode=collection')}
          />
        </View>
        {ownCollections.length === 0 ? (
          <View style={{ padding: 18, borderRadius: radius.lg, backgroundColor: colors.surface }}>
            <Text style={{ ...type.body, color: colors.muted }}>No collections are stored on this device.</Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {ownCollections.map((collection) => (
              <ArchiveCollectionCard key={collection.id} collection={collection} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}
