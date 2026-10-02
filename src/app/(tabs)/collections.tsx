import { useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CategoryIcon } from '../../components/category/category-icon'
import { CloudCollectionCard } from '../../components/discover/cloud-collection-card'
import { IconSearch } from '../../components/ui/icons'
import { Screen } from '../../components/ui/screen'
import { ScreenHeader } from '../../components/ui/screen-header'
import { getCategory } from '../../data/categories'
import { catalogCategoryCounts, publicCollectionsInCategory, visibleCatalogCategories } from '../../data/public-catalog'
import { listPublicCollections } from '../../repositories/discover-repository'
import {
  getCloudSocialState,
  likeCollection,
  saveCollection,
  unlikeCollection,
  unsaveCollection,
} from '../../repositories/social-repository'
import { useTheme } from '../../state/app-state'
import { useAuth } from '../../state/auth'
import { useBlockedCollectors } from '../../state/use-blocked-collectors'
import { radius, space, type } from '../../theme/tokens'

export default function CollectionsScreen() {
  const { colors } = useTheme()
  const { user } = useAuth()
  const { blockedIds } = useBlockedCollectors(user?.id)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [socialError, setSocialError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['public-discover-collections'],
    queryFn: async () => {
      const result = await listPublicCollections(100)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    retry: false,
  })
  const collections = useMemo(
    () => (query.data ?? []).filter((collection) => !blockedIds.includes(collection.owner.id)),
    [blockedIds, query.data],
  )
  const categoryCounts = useMemo(() => catalogCategoryCounts(collections), [collections])
  const visibleCategories = useMemo(() => visibleCatalogCategories(search), [search])
  const selectedCategory = selectedCategoryId ? getCategory(selectedCategoryId) : undefined
  const selectedCollections = useMemo(
    () => (selectedCategoryId ? publicCollectionsInCategory(collections, selectedCategoryId) : []),
    [collections, selectedCategoryId],
  )
  const collectionIds = useMemo(() => collections.map((collection) => collection.id), [collections])
  const socialQuery = useQuery({
    queryKey: ['cloud-social-state', user?.id, collectionIds.join(','), ''],
    enabled: Boolean(user && query.data),
    retry: false,
    queryFn: async () => {
      const result = await getCloudSocialState(user!.id, collectionIds, [])
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const social = socialQuery.data ?? { likedCollectionIds: [], savedCollectionIds: [], followedCollectorIds: [] }

  async function runSocialAction(
    key: string,
    action: () => Promise<{ ok: true } | { ok: false; error: { message: string } }>,
  ) {
    if (busyAction || !user || !socialQuery.data) return
    setBusyAction(key)
    setSocialError(null)
    try {
      const result = await action()
      if (!result.ok) setSocialError(result.error.message)
      else {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['public-discover-collections'] }),
          queryClient.invalidateQueries({ queryKey: ['cloud-social-state'] }),
        ])
      }
    } catch {
      setSocialError('Could not confirm that action. Check your connection and try again.')
    }
    setBusyAction(null)
  }

  function toggleLike(collectionId: string) {
    const active = social.likedCollectionIds.includes(collectionId)
    void runSocialAction(`like:${collectionId}`, () =>
      active ? unlikeCollection(user!.id, collectionId) : likeCollection(user!.id, collectionId),
    )
  }

  function toggleSave(collectionId: string) {
    const active = social.savedCollectionIds.includes(collectionId)
    void runSocialAction(`save:${collectionId}`, () =>
      active ? unsaveCollection(user!.id, collectionId) : saveCollection(user!.id, collectionId),
    )
  }

  function openCategory(categoryId: string) {
    setSelectedCategoryId(categoryId)
    setSearch('')
  }

  return (
    <Screen padded={false}>
      <ScreenHeader eyebrow="Explore the catalog" title="Collections" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching || socialQuery.isRefetching}
            onRefresh={() => void Promise.all([query.refetch(), socialQuery.refetch()])}
            tintColor={colors.ink}
          />
        }
        contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: space.tabPad }}
      >
        <Text style={{ ...type.body, color: colors.muted }}>
          Browse every kind of collectible and the public collections shared by collectors.
        </Text>

        {selectedCategory ? (
          <View style={{ marginTop: 22 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show all categories"
              onPress={() => setSelectedCategoryId(null)}
              style={{ alignSelf: 'flex-start', paddingVertical: 8 }}
            >
              <Text style={{ ...type.meta, fontWeight: '600', color: colors.ink }}>← All categories</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.md,
                  backgroundColor: colors.surface,
                }}
              >
                <CategoryIcon categoryId={selectedCategory.id} color={colors.ink} size={24} />
              </View>
              <Text style={{ ...type.title, flex: 1, fontSize: 24, color: colors.ink }}>{selectedCategory.label}</Text>
            </View>
            {selectedCategory.subcategories.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {selectedCategory.subcategories.map((subcategory) => (
                  <View
                    key={subcategory.id}
                    style={{
                      paddingHorizontal: 11,
                      paddingVertical: 7,
                      borderRadius: radius.pill,
                      backgroundColor: colors.surface,
                    }}
                  >
                    <Text style={{ ...type.meta, color: colors.muted }}>{subcategory.label}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Text
              style={{
                ...type.eyebrow,
                textTransform: 'none',
                color: colors.faint,
                marginTop: 26,
                marginBottom: 12,
              }}
            >
              PUBLIC COLLECTIONS · {selectedCollections.length}
            </Text>
            {query.isPending ? <Text style={{ ...type.body, color: colors.muted }}>Loading collections…</Text> : null}
            {!query.isPending && !query.isError && selectedCollections.length === 0 ? (
              <View style={{ padding: 18, borderRadius: radius.lg, backgroundColor: colors.surface }}>
                <Text style={{ ...type.body, color: colors.muted }}>No public collections in this category yet.</Text>
              </View>
            ) : null}
            <View style={{ gap: 16 }}>
              {selectedCollections.map((collection) => (
                <CloudCollectionCard
                  key={collection.id}
                  collection={collection}
                  liked={social.likedCollectionIds.includes(collection.id)}
                  saved={social.savedCollectionIds.includes(collection.id)}
                  busy={Boolean(busyAction) || !socialQuery.data}
                  onToggleLike={() => toggleLike(collection.id)}
                  onToggleSave={() => toggleSave(collection.id)}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 14,
                borderRadius: radius.md,
                backgroundColor: colors.surface,
              }}
            >
              <IconSearch color={colors.faint} size={18} />
              <TextInput
                accessibilityLabel="Search collection categories"
                value={search}
                onChangeText={setSearch}
                placeholder="Search categories or subcategories"
                placeholderTextColor={colors.faint}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                style={{ flex: 1, minHeight: 50, color: colors.ink, fontSize: 15 }}
              />
            </View>

            <Text
              style={{
                ...type.eyebrow,
                textTransform: 'none',
                color: colors.faint,
                marginTop: 24,
                marginBottom: 10,
              }}
            >
              {search.trim()
                ? `${visibleCategories.length} MATCHING CATEGORIES`
                : `${visibleCategories.length} CATEGORIES`}
            </Text>
            {visibleCategories.length === 0 ? (
              <View style={{ padding: 18, borderRadius: radius.lg, backgroundColor: colors.surface }}>
                <Text style={{ ...type.body, color: colors.muted }}>No category matches this search.</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {visibleCategories.map((category) => {
                  const publicCount = categoryCounts.get(category.id) ?? 0
                  return (
                    <Pressable
                      key={category.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${category.label}`}
                      onPress={() => openCategory(category.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        minHeight: 68,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: radius.md,
                        backgroundColor: colors.surface,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 13,
                          borderRadius: radius.sm,
                          backgroundColor: colors.background,
                        }}
                      >
                        <CategoryIcon categoryId={category.id} color={colors.ink} size={22} />
                      </View>
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>{category.label}</Text>
                        <Text style={{ ...type.meta, color: colors.muted, marginTop: 3 }}>
                          {publicCount} public {publicCount === 1 ? 'collection' : 'collections'}
                          {category.subcategories.length ? ` · ${category.subcategories.length} subcategories` : ''}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 20, color: colors.faint }}>›</Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
          </View>
        )}

        {query.isError ? (
          <View
            style={{ gap: 12, marginTop: 16, padding: 18, borderRadius: radius.lg, backgroundColor: colors.surface }}
          >
            <Text accessibilityRole="alert" style={{ ...type.body, color: colors.danger }}>
              {query.error.message}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => void query.refetch()}>
              <Text style={{ ...type.body, fontWeight: '600', color: colors.ink }}>Try again</Text>
            </Pressable>
          </View>
        ) : null}
        {socialQuery.isError || socialError ? (
          <Text accessibilityRole="alert" style={{ ...type.meta, color: colors.danger, marginTop: 14 }}>
            {socialError ?? socialQuery.error?.message}
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
