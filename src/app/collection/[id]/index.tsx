import { useMemo, useState, type ReactNode } from 'react'
import { Dimensions, Image, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CommentRow } from '../../../components/collection/comment-row'
import { ItemTile } from '../../../components/collection/item-tile'
import { FollowButton } from '../../../components/collector/follow-button'
import { Avatar } from '../../../components/ui/avatar'
import { HeaderIcon } from '../../../components/ui/header-icon'
import { IconBack, IconBookmark, IconComment, IconHeart, IconShare } from '../../../components/ui/icons'
import { commentsForCollection, currentCollector, getCollector } from '../../../data/mock-data'
import { collectionCategoryLine } from '../../../data/collection-resolve'
import { useAppState, useTheme } from '../../../state/app-state'
import { useCatalog } from '../../../state/use-catalog'
import { navigateToCollector } from '../../../utils/collector-nav'
import { radius, space, type } from '../../../theme/tokens'

type SortKey = 'cabinet' | 'title' | 'year'

const gap = 12
const screenWidth = Dimensions.get('window').width
const tileWidth = (screenWidth - space.screen * 2 - gap) / 2

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { social, localComments, toggleLikeCollection, toggleSaveCollection, addLocalComment } = useAppState()
  const catalog = useCatalog()

  const collection = catalog.getCollection(String(id ?? ''))
  const owner = collection ? getCollector(collection.ownerId) : undefined
  const isOwn = collection?.ownerId === currentCollector.id
  const liked = collection ? social.likedCollectionIds.includes(collection.id) : false
  const saved = collection ? social.savedCollectionIds.includes(collection.id) : false

  const [storyOpen, setStoryOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('cabinet')
  const [draft, setDraft] = useState('')

  const comments = useMemo(() => {
    if (!collection) {
      return []
    }
    const locals = localComments.filter((entry) => entry.collectionId === collection.id)
    return [...locals, ...commentsForCollection(collection.id)]
  }, [collection, localComments])

  const items = useMemo(() => {
    if (!collection) {
      return []
    }
    let list = catalog.itemsForCollection(collection.id)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (entry) =>
          entry.title.toLowerCase().includes(q) ||
          (entry.year ?? '').includes(q) ||
          (entry.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
      )
    }
    if (sort === 'title') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    } else if (sort === 'year') {
      list = [...list].sort((a, b) => (b.year ?? '').localeCompare(a.year ?? ''))
    }
    return list
  }, [catalog, collection, query, sort])

  if (!collection || !owner) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.background }}>
        <Text style={{ ...type.title, fontSize: 24, color: colors.ink }}>Collection not found</Text>
        <Pressable className="mt-5" onPress={() => router.back()}>
          <Text className="text-sm font-medium" style={{ color: colors.muted }}>
            Go back
          </Text>
        </Pressable>
      </View>
    )
  }

  const likeCount = collection.likeCount + (liked ? 1 : 0)
  const description = collection.description ?? 'A cabinet of objects kept with care.'
  const story = collection.story
  const shareTitle = collection.title
  const shareOwner = owner.displayName
  const collectionId = collection.id

  async function shareCollection() {
    try {
      await Share.share({
        message: `${shareTitle} by ${shareOwner} on Seekase`,
        title: shareTitle,
      })
    } catch {
      // User dismissed share sheet.
    }
  }

  function submitComment() {
    addLocalComment(collectionId, draft)
    setDraft('')
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: space.tabPad + 32 }}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ height: 280 }}>
          <Image source={collection.cover} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          <View className="absolute inset-0" style={{ backgroundColor: 'rgba(12,10,8,0.22)' }} />
          <View className="absolute left-4 right-4 flex-row justify-between" style={{ top: insets.top + 8 }}>
            <HeaderIcon onPress={() => router.back()}>
              <IconBack color="#FBF8F2" size={18} />
            </HeaderIcon>
            {isOwn ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit collection"
                onPress={() => router.push(`/collection/${collection.id}/edit`)}
                className="px-3.5 py-2"
                style={{ backgroundColor: colors.overlay, borderRadius: radius.pill }}
              >
                <Text className="text-[12px] font-medium text-white">Edit</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View className="px-5 pt-5">
          <Text style={{ ...type.eyebrow, color: colors.faint }}>{collectionCategoryLine(collection)}</Text>
          <Text className="mt-1" style={{ ...type.title, fontSize: 28, color: colors.ink }}>
            {collection.title}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open collector ${owner.displayName}`}
            className="mt-4 flex-row items-center"
            onPress={() => navigateToCollector(router, owner.id)}
          >
            <Avatar collector={owner} size={40} />
            <View className="ml-3 min-w-0 flex-1">
              <Text className="text-[15px] font-semibold" style={{ color: colors.ink }} numberOfLines={1}>
                {owner.displayName}
              </Text>
              <Text className="text-[13px]" style={{ color: colors.muted }}>
                {owner.handle}
              </Text>
            </View>
          </Pressable>

          <View className="mt-5 flex-row" style={{ gap: 18 }}>
            <Stat label="Objects" value={String(items.length)} />
            <Stat label="Likes" value={String(likeCount)} />
            <Stat label="Saves" value={String(collection.followerCount ?? 0)} />
          </View>

          <Text className="mt-5" style={{ ...type.body, color: colors.ink }}>
            {description}
          </Text>
          {story ? (
            <>
              {storyOpen ? (
                <Text className="mt-3" style={{ ...type.body, color: colors.muted }}>
                  {story}
                </Text>
              ) : null}
              <Pressable className="mt-2 self-start" onPress={() => setStoryOpen((value) => !value)}>
                <Text className="text-sm font-medium" style={{ color: colors.ink }}>
                  {storyOpen ? 'Show less' : 'Read more'}
                </Text>
              </Pressable>
            </>
          ) : null}

          {(collection.tags?.length ?? 0) > 0 ? (
            <View className="mt-4 flex-row flex-wrap" style={{ gap: 6 }}>
              {collection.tags?.map((tag) => (
                <View key={tag} className="px-2.5 py-1" style={{ backgroundColor: colors.chip, borderRadius: 999 }}>
                  <Text className="text-[11px] font-medium" style={{ color: colors.muted }}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View className="mt-5 flex-row" style={{ gap: 8 }}>
            <ActionButton
              label={liked ? 'Unlike' : 'Like'}
              active={liked}
              onPress={() => toggleLikeCollection(collection.id)}
              icon={<IconHeart color={liked ? colors.onAccent : colors.ink} size={15} filled={liked} />}
            />
            <ActionButton
              label={saved ? 'Remove from saved' : 'Save'}
              active={saved}
              onPress={() => toggleSaveCollection(collection.id)}
              icon={<IconBookmark color={saved ? colors.onAccent : colors.ink} size={15} filled={saved} />}
            />
            <ActionButton
              label="Share"
              onPress={() => void shareCollection()}
              icon={<IconShare color={colors.ink} size={15} />}
            />
          </View>

          {!isOwn ? (
            <View className="mt-3">
              <FollowButton collectorId={owner.id} fullWidth />
            </View>
          ) : null}
        </View>

        <View className="mt-8 px-5">
          <View className="mb-3 flex-row items-end justify-between">
            <Text style={{ ...type.eyebrow, color: colors.faint }}>The cabinet</Text>
            <View className="flex-row items-center" style={{ gap: 12 }}>
              {isOwn ? (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/device-add',
                      params: { mode: 'item', collectionId: collection.id },
                    })
                  }
                >
                  <Text className="text-[12px] font-medium" style={{ color: colors.ink }}>
                    Add object
                  </Text>
                </Pressable>
              ) : null}
              <Text className="text-[12px]" style={{ color: colors.faint }}>
                {items.length} shown
              </Text>
            </View>
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search within this collection"
            placeholderTextColor={colors.faint}
            className="mb-3 px-4 py-3 text-[14px]"
            style={{ backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.md }}
          />
          <View className="mb-4 flex-row" style={{ gap: 8 }}>
            {(
              [
                ['cabinet', 'Cabinet'],
                ['title', 'A–Z'],
                ['year', 'Year'],
              ] as const
            ).map(([key, label]) => {
              const active = sort === key
              return (
                <Pressable
                  key={key}
                  onPress={() => setSort(key)}
                  className="px-3 py-1.5"
                  style={{ borderRadius: 999, backgroundColor: active ? colors.chipActive : colors.chip }}
                >
                  <Text className="text-[12px] font-medium" style={{ color: active ? colors.onAccent : colors.ink }}>
                    {label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          {items.length === 0 ? (
            <View className="px-4 py-8" style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
              <Text style={{ ...type.body, color: colors.muted }}>
                {query.trim()
                  ? 'No objects match that search.'
                  : isOwn
                    ? 'This cabinet is empty. Add the first object.'
                    : 'No objects in this cabinet yet.'}
              </Text>
              {isOwn && !query.trim() ? (
                <Pressable
                  className="mt-3"
                  onPress={() =>
                    router.push({
                      pathname: '/device-add',
                      params: { mode: 'item', collectionId: collection.id },
                    })
                  }
                >
                  <Text className="text-sm font-medium" style={{ color: colors.ink }}>
                    Add first object
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between" style={{ rowGap: gap }}>
              {items.map((entry) => (
                <ItemTile key={entry.id} item={entry} width={tileWidth} />
              ))}
            </View>
          )}
        </View>

        <View className="mt-8 px-5">
          <View className="mb-2 flex-row items-center">
            <IconComment color={colors.faint} size={15} />
            <Text className="ml-2" style={{ ...type.eyebrow, color: colors.faint }}>
              Comments
            </Text>
          </View>
          <View className="px-4" style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
            {comments.length === 0 ? (
              <Text className="py-5" style={{ ...type.body, color: colors.muted }}>
                No comments yet. Start the conversation.
              </Text>
            ) : (
              comments.map((comment, index) => (
                <CommentRow key={comment.id} comment={comment} last={index === comments.length - 1} />
              ))
            )}
          </View>
          <View className="mt-3 flex-row items-center" style={{ gap: 8 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Add a comment"
              placeholderTextColor={colors.faint}
              className="flex-1 px-4 py-3 text-[14px]"
              style={{ backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.md }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Post comment"
              onPress={submitComment}
              className="px-4 py-3"
              style={{ backgroundColor: colors.accent, borderRadius: radius.pill }}
            >
              <Text className="text-sm font-medium" style={{ color: colors.onAccent }}>
                Post
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme()
  return (
    <View>
      <Text className="text-[17px] font-semibold" style={{ color: colors.ink }}>
        {value}
      </Text>
      <Text className="mt-0.5 text-[11px]" style={{ color: colors.muted }}>
        {label}
      </Text>
    </View>
  )
}

function ActionButton({
  label,
  onPress,
  icon,
  active = false,
}: {
  label: string
  onPress: () => void
  icon: ReactNode
  active?: boolean
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center py-2.5"
      style={{
        backgroundColor: active ? colors.accent : colors.surface,
        borderRadius: radius.pill,
        borderWidth: active ? 0 : 1,
        borderColor: colors.line,
        gap: 6,
      }}
    >
      {icon}
      <Text className="text-[13px] font-medium" style={{ color: active ? colors.onAccent : colors.ink }}>
        {label}
      </Text>
    </Pressable>
  )
}
