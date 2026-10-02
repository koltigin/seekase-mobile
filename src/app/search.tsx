import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Avatar } from '../components/ui/avatar'
import { Screen } from '../components/ui/screen'
import { BackButton } from '../components/ui/back-button'
import { searchCollectors } from '../data/collector-resolve'
import { categoryLabel } from '../data/categories'
import { useTheme } from '../state/app-state'
import { useCatalog } from '../state/use-catalog'
import { navigateToCollector } from '../utils/collector-nav'
import { radius, type } from '../theme/tokens'

export default function SearchScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const catalog = useCatalog()
  const [query, setQuery] = useState('')

  const collectors = useMemo(() => searchCollectors(query), [query])
  const cabinets = useMemo(() => catalog.searchCollections(query), [catalog, query])
  const objects = useMemo(() => catalog.searchItems(query).slice(0, 12), [catalog, query])
  const hasQuery = query.trim().length > 0
  const empty = hasQuery && collectors.length === 0 && cabinets.length === 0 && objects.length === 0

  return (
    <Screen padded={false}>
      <View className="px-5 pb-3">
        <BackButton label="Close" onPress={() => router.back()} />
        <Text className="mt-5" style={{ ...type.title, color: colors.ink }}>
          Search
        </Text>
        <Text className="mt-2" style={{ ...type.body, color: colors.muted }}>
          Collectors, cabinets, objects, categories, and tags.
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Ada, stamps, retro tech…"
          placeholderTextColor={colors.faint}
          autoFocus
          className="mt-5 px-4 py-3.5 text-[15px]"
          style={{ backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.md }}
        />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {!hasQuery ? (
          <View className="mt-2 px-4 py-5" style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
            <Text style={{ ...type.body, color: colors.muted }}>
              Try a collector name, specialty, collection title, or category.
            </Text>
          </View>
        ) : null}

        {empty ? (
          <View className="mt-2 px-4 py-5" style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
            <Text style={{ ...type.body, color: colors.muted }}>
              Nothing matched “{query.trim()}”. Try another collector or category word.
            </Text>
          </View>
        ) : null}

        {collectors.length > 0 ? (
          <View className="mt-4">
            <Text className="mb-3" style={{ ...type.eyebrow, color: colors.faint }}>
              Collectors
            </Text>
            {collectors.map((collector) => (
              <Pressable
                key={collector.id}
                accessibilityRole="button"
                accessibilityLabel={`Open collector ${collector.displayName}`}
                onPress={() => navigateToCollector(router, collector.id)}
                className="mb-2 flex-row items-center px-3 py-3"
                style={{ backgroundColor: colors.surface, borderRadius: radius.md }}
              >
                <Avatar collector={collector} size={40} />
                <View className="ml-3 min-w-0 flex-1">
                  <Text className="text-[15px] font-semibold" style={{ color: colors.ink }} numberOfLines={1}>
                    {collector.displayName}
                  </Text>
                  <Text className="text-[13px]" style={{ color: colors.muted }} numberOfLines={1}>
                    {collector.handle}
                    {collector.specialties?.[0] ? ` · ${collector.specialties[0]}` : ''}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {cabinets.length > 0 ? (
          <View className="mt-5">
            <Text className="mb-3" style={{ ...type.eyebrow, color: colors.faint }}>
              Cabinets
            </Text>
            {cabinets.map((collection) => (
              <Pressable
                key={collection.id}
                accessibilityRole="button"
                accessibilityLabel={`Open collection ${collection.title}`}
                onPress={() => router.push(`/collection/${collection.id}`)}
                className="mb-2 px-3 py-3"
                style={{ backgroundColor: colors.surface, borderRadius: radius.md }}
              >
                <Text className="text-[15px] font-semibold" style={{ color: colors.ink }} numberOfLines={1}>
                  {collection.title}
                </Text>
                <Text className="mt-0.5 text-[13px]" style={{ color: colors.muted }} numberOfLines={1}>
                  {categoryLabel(collection.categoryId)} · {collection.itemCount} objects
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {objects.length > 0 ? (
          <View className="mt-5">
            <Text className="mb-3" style={{ ...type.eyebrow, color: colors.faint }}>
              Objects
            </Text>
            {objects.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Open object ${item.title}`}
                onPress={() => router.push(`/item/${item.id}`)}
                className="mb-2 px-3 py-3"
                style={{ backgroundColor: colors.surface, borderRadius: radius.md }}
              >
                <Text className="text-[15px] font-semibold" style={{ color: colors.ink }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="mt-0.5 text-[13px]" style={{ color: colors.muted }} numberOfLines={1}>
                  {item.year ? `${item.year} · ` : ''}
                  {item.categoryId ? categoryLabel(item.categoryId) : 'Object'}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
