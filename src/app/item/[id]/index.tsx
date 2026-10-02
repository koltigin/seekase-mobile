import { useRef, useState, type ReactNode } from 'react'
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CommentRow } from '../../../components/collection/comment-row'
import { FollowButton } from '../../../components/collector/follow-button'
import { RelatedItemCard } from '../../../components/item/related-item-card'
import { Avatar } from '../../../components/ui/avatar'
import { HeaderIcon } from '../../../components/ui/header-icon'
import { IconBack, IconBookmark, IconComment, IconHeart, IconShare } from '../../../components/ui/icons'
import {
  OBJECT_CONDITION_LABELS,
  OBJECT_STATUS_LABELS,
  itemGallery,
  itemMetadataRows,
} from '../../../data/item-metadata'
import { itemCategoryLine } from '../../../data/item-resolve'
import { commentsForItem, currentCollector, getCollector } from '../../../data/mock-data'
import { useAppState, useTheme } from '../../../state/app-state'
import { useCatalog } from '../../../state/use-catalog'
import { navigateToCollector } from '../../../utils/collector-nav'
import { radius, space, type } from '../../../theme/tokens'

const screenWidth = Dimensions.get('window').width
const relatedGap = 12
const relatedWidth = (screenWidth - space.screen * 2 - relatedGap * 2) / 3

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { social, localComments, toggleLikeItem, toggleSaveItem, addLocalItemComment } = useAppState()
  const catalog = useCatalog()

  const item = catalog.getItem(String(id ?? ''))
  const collection = item ? catalog.getCollection(item.collectionId) : undefined
  const owner = collection ? getCollector(collection.ownerId) : undefined
  const isOwn = owner?.id === currentCollector.id
  const liked = item ? (social.likedItemIds ?? []).includes(item.id) : false
  const saved = item ? (social.savedItemIds ?? []).includes(item.id) : false

  const [imageIndex, setImageIndex] = useState(0)
  const [storyOpen, setStoryOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const galleryRef = useRef<ScrollView>(null)

  const gallery = item ? itemGallery(item) : []
  const metadata = item ? itemMetadataRows(item) : []
  const status = item?.status ?? 'in-collection'
  const condition = item?.condition

  const comments = item
    ? [...localComments.filter((entry) => entry.itemId === item.id), ...commentsForItem(item.id)]
    : []
  const related = item
    ? catalog
        .itemsForCollection(item.collectionId)
        .filter((entry) => entry.id !== item.id)
        .slice(0, 6)
    : []

  if (!item || !collection || !owner) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.background }}>
        <Text style={{ ...type.title, fontSize: 24, color: colors.ink }}>Object not found</Text>
        <Pressable className="mt-5" onPress={() => router.back()}>
          <Text className="text-sm font-medium" style={{ color: colors.muted }}>
            Go back
          </Text>
        </Pressable>
      </View>
    )
  }

  const likeCount = (item.likeCount ?? 0) + (liked ? 1 : 0)
  const itemId = item.id
  const collectionId = collection.id
  const shareTitle = item.title
  const shareYear = item.year
  const shareCollectionTitle = collection.title
  const shareOwnerName = owner.displayName

  function onGalleryScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
    setImageIndex(next)
  }

  async function shareItem() {
    try {
      await Share.share({
        message: `${shareTitle}${shareYear ? ` (${shareYear})` : ''} from ${shareCollectionTitle} by ${shareOwnerName} on Seekase`,
        title: shareTitle,
      })
    } catch {
      // dismissed
    }
  }

  function submitComment() {
    addLocalItemComment(itemId, collectionId, draft)
    setDraft('')
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space.tabPad }}>
        <View style={{ height: 360 }}>
          <ScrollView
            ref={galleryRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onGalleryScroll}
            scrollEventThrottle={16}
          >
            {gallery.map((source, index) => (
              <Image
                key={`${item.id}-img-${index}`}
                source={source}
                resizeMode="cover"
                style={{ width: screenWidth, height: 360 }}
              />
            ))}
          </ScrollView>
          <View className="absolute inset-0" style={{ backgroundColor: 'rgba(12,10,8,0.18)' }} pointerEvents="none" />
          <View className="absolute left-4 right-4 flex-row justify-between" style={{ top: insets.top + 8 }}>
            <HeaderIcon onPress={() => router.back()}>
              <IconBack color="#FBF8F2" size={18} />
            </HeaderIcon>
            {isOwn ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit item"
                onPress={() => router.push(`/item/${item.id}/edit`)}
                className="px-3.5 py-2"
                style={{ backgroundColor: colors.overlay, borderRadius: radius.pill }}
              >
                <Text className="text-[12px] font-medium text-white">Edit</Text>
              </Pressable>
            ) : null}
          </View>
          {gallery.length > 1 ? (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center" style={{ gap: 6 }}>
              {gallery.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  style={{
                    width: index === imageIndex ? 16 : 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: index === imageIndex ? '#FBF8F2' : 'rgba(251,248,242,0.45)',
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View className="px-5 pt-5">
          <Text style={{ ...type.eyebrow, color: colors.faint }}>{itemCategoryLine(item, collection)}</Text>
          <Text className="mt-1" style={{ ...type.title, fontSize: 28, color: colors.ink }}>
            {item.title}
          </Text>
          {item.year ? (
            <Text className="mt-1 text-[16px]" style={{ color: colors.muted }}>
              {item.year}
            </Text>
          ) : null}

          <View className="mt-4 flex-row flex-wrap" style={{ gap: 8 }}>
            <StatusChip label={OBJECT_STATUS_LABELS[status]} emphasis={status !== 'in-collection'} />
            {condition ? <StatusChip label={OBJECT_CONDITION_LABELS[condition]} /> : null}
            <Text className="self-center text-[12px]" style={{ color: colors.faint }}>
              {likeCount} likes
            </Text>
          </View>

          {status === 'looking-for' ? (
            <View className="mt-4 px-4 py-3.5" style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
              <Text style={{ ...type.body, color: colors.ink }}>{owner.displayName} is looking for this object.</Text>
              <Text className="mt-1 text-[13px]" style={{ color: colors.muted }}>
                A collector signal for future matching — not a purchase request.
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open collection ${collection.title}`}
            className="mt-5"
            onPress={() => router.push(`/collection/${collection.id}`)}
          >
            <Text className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: colors.faint }}>
              From
            </Text>
            <Text className="mt-1 text-[16px] font-semibold" style={{ color: colors.ink }}>
              {collection.title}
            </Text>
          </Pressable>

          <View className="mt-5 flex-row items-center">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open collector ${owner.displayName}`}
              className="min-w-0 flex-1 flex-row items-center"
              onPress={() => navigateToCollector(router, owner.id)}
            >
              <Avatar collector={owner} size={44} />
              <View className="ml-3 min-w-0 flex-1">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: colors.faint }}>
                  Collected by
                </Text>
                <Text className="mt-0.5 text-[15px] font-semibold" style={{ color: colors.ink }} numberOfLines={1}>
                  {owner.displayName}
                </Text>
                <Text className="text-[13px]" style={{ color: colors.muted }}>
                  {owner.handle}
                </Text>
              </View>
            </Pressable>
            {!isOwn ? <FollowButton collectorId={owner.id} compact /> : null}
          </View>

          {item.story ? (
            <View className="mt-6">
              <Text style={{ ...type.eyebrow, color: colors.faint }}>Story</Text>
              <Text className="mt-2" style={{ ...type.body, color: colors.ink }}>
                {storyOpen || item.story.length < 160 ? item.story : `${item.story.slice(0, 150).trim()}…`}
              </Text>
              {item.story.length >= 160 ? (
                <Pressable className="mt-2 self-start" onPress={() => setStoryOpen((value) => !value)}>
                  <Text className="text-sm font-medium" style={{ color: colors.ink }}>
                    {storyOpen ? 'Show less' : 'Read more'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {item.provenance ? (
            <View className="mt-5">
              <Text style={{ ...type.eyebrow, color: colors.faint }}>Provenance</Text>
              <Text className="mt-2" style={{ ...type.body, color: colors.muted }}>
                {item.provenance}
              </Text>
            </View>
          ) : null}

          {metadata.length > 0 ? (
            <View className="mt-6">
              <Text style={{ ...type.eyebrow, color: colors.faint }}>Object record</Text>
              <View className="mt-3 px-4" style={{ backgroundColor: colors.surface, borderRadius: radius.lg }}>
                {metadata.map((row, index) => (
                  <View
                    key={row.label}
                    className="flex-row justify-between py-3"
                    style={{
                      borderBottomWidth: index === metadata.length - 1 ? 0 : 1,
                      borderBottomColor: colors.line,
                    }}
                  >
                    <Text className="text-[13px]" style={{ color: colors.muted }}>
                      {row.label}
                    </Text>
                    <Text className="ml-4 flex-1 text-right text-[13px] font-medium" style={{ color: colors.ink }}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {(item.tags?.length ?? 0) > 0 ? (
            <View className="mt-5 flex-row flex-wrap" style={{ gap: 6 }}>
              {item.tags?.map((tag) => (
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
              onPress={() => toggleLikeItem(item.id)}
              icon={<IconHeart color={liked ? colors.onAccent : colors.ink} size={15} filled={liked} />}
            />
            <ActionButton
              label={saved ? 'Remove from saved' : 'Save'}
              active={saved}
              onPress={() => toggleSaveItem(item.id)}
              icon={<IconBookmark color={saved ? colors.onAccent : colors.ink} size={15} filled={saved} />}
            />
            <ActionButton
              label="Share"
              onPress={() => void shareItem()}
              icon={<IconShare color={colors.ink} size={15} />}
            />
          </View>

          {isOwn && status !== 'in-collection' ? (
            <Text className="mt-4 text-[13px]" style={{ color: colors.muted }}>
              Your status is visible to other collectors as a social signal — not a listing.
            </Text>
          ) : null}
        </View>

        {related.length > 0 ? (
          <View className="mt-8 px-5">
            <Text style={{ ...type.eyebrow, color: colors.faint }}>More from this cabinet</Text>
            <View className="mt-3 flex-row flex-wrap" style={{ gap: relatedGap }}>
              {related.map((entry) => (
                <RelatedItemCard key={entry.id} item={entry} width={relatedWidth} />
              ))}
            </View>
          </View>
        ) : null}

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

function StatusChip({ label, emphasis = false }: { label: string; emphasis?: boolean }) {
  const { colors } = useTheme()
  return (
    <View
      className="px-2.5 py-1"
      style={{
        backgroundColor: emphasis ? colors.chipActive : colors.chip,
        borderRadius: 999,
      }}
    >
      <Text className="text-[11px] font-medium" style={{ color: emphasis ? colors.onAccent : colors.muted }}>
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
