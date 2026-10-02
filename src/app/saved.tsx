import { useMemo, useState } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../components/ui/screen'
import { BackButton } from '../components/ui/back-button'
import { categoryLabel } from '../data/categories'
import { useAppState, useTheme } from '../state/app-state'
import { useCatalog } from '../state/use-catalog'
import { radius, space, type } from '../theme/tokens'

type SavedTab = 'objects' | 'cabinets'

export default function SavedScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const { social } = useAppState()
  const catalog = useCatalog()
  const [tab, setTab] = useState<SavedTab>('objects')

  const savedItems = useMemo(() => {
    return (social.savedItemIds ?? [])
      .map((id) => catalog.getItem(id))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  }, [catalog, social.savedItemIds])

  const savedCollections = useMemo(() => {
    return (social.savedCollectionIds ?? [])
      .map((id) => catalog.getCollection(id))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  }, [catalog, social.savedCollectionIds])

  const empty =
    (tab === 'objects' && savedItems.length === 0) || (tab === 'cabinets' && savedCollections.length === 0)

  return (
    <Screen padded={false}>
      <View className="flex-row items-center justify-between px-5 pb-3">
        <BackButton onPress={() => router.back()} />
        <Text style={{ ...type.eyebrow, color: colors.faint }}>Saved</Text>
        <View style={{ width: 96 }} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: space.tabPad }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-5" style={{ ...type.body, color: colors.muted }}>
          Objects and cabinets you marked to revisit — kept on this device.
        </Text>

        <View className="mb-5 flex-row" style={{ gap: 8 }}>
          {(
            [
              ['objects', 'Objects'],
              ['cabinets', 'Cabinets'],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id
            return (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                className="flex-1 items-center py-2.5"
                style={{ borderRadius: radius.pill, backgroundColor: active ? colors.chipActive : colors.chip }}
              >
                <Text className="text-[13px] font-medium" style={{ color: active ? colors.onAccent : colors.ink }}>
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {empty ? (
          <View className="px-4 py-6" style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
            <Text style={{ ...type.body, color: colors.muted }}>Nothing saved yet.</Text>
            <Pressable className="mt-3" onPress={() => router.push('/(tabs)')}>
              <Text className="text-sm font-medium" style={{ color: colors.ink }}>
                Explore Discover
              </Text>
            </Pressable>
          </View>
        ) : tab === 'objects' ? (
          <View style={{ gap: 10 }}>
            {savedItems.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Open object ${item.title}`}
                onPress={() => router.push(`/item/${item.id}`)}
                className="flex-row overflow-hidden"
                style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}
              >
                <Image source={item.image} resizeMode="cover" style={{ width: 84, height: 84 }} />
                <View className="min-w-0 flex-1 justify-center px-3.5 py-3">
                  <Text className="text-[15px] font-semibold" style={{ color: colors.ink }} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text className="mt-1 text-[12px]" style={{ color: colors.muted }} numberOfLines={1}>
                    {item.year ? `${item.year} · ` : ''}
                    {item.categoryId ? categoryLabel(item.categoryId) : 'Object'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {savedCollections.map((collection) => (
              <Pressable
                key={collection.id}
                accessibilityRole="button"
                accessibilityLabel={`Open collection ${collection.title}`}
                onPress={() => router.push(`/collection/${collection.id}`)}
                className="flex-row overflow-hidden"
                style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}
              >
                <Image source={collection.cover} resizeMode="cover" style={{ width: 84, height: 84 }} />
                <View className="min-w-0 flex-1 justify-center px-3.5 py-3">
                  <Text className="text-[15px] font-semibold" style={{ color: colors.ink }} numberOfLines={2}>
                    {collection.title}
                  </Text>
                  <Text className="mt-1 text-[12px]" style={{ color: colors.muted }} numberOfLines={1}>
                    {categoryLabel(collection.categoryId)} · {collection.itemCount} objects
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}
