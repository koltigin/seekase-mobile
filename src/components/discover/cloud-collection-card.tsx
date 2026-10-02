import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { PublicCollectionSummary } from '../../repositories/discover-repository'
import { categoryLabel } from '../../data/categories'
import { useTheme } from '../../state/app-state'
import { radius } from '../../theme/tokens'
import { AccountPhoto } from '../catalog/account-photo'
import { IconBookmark, IconHeart } from '../ui/icons'

function initials(name: string) {
  const parts = name.trim().split(/\s+/u).filter(Boolean)
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.slice(0, 2) || 'SK').toUpperCase()
}

export function CloudCollectionCard({
  collection,
  liked,
  saved,
  busy,
  onToggleLike,
  onToggleSave,
}: {
  collection: PublicCollectionSummary
  liked: boolean
  saved: boolean
  busy: boolean
  onToggleLike: () => void
  onToggleSave: () => void
}) {
  const { colors } = useTheme()
  const router = useRouter()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open collection ${collection.title}`}
      onPress={() => router.push(`/showcase/${collection.id}`)}
      style={{ overflow: 'hidden', borderRadius: radius.lg, backgroundColor: colors.surface }}
    >
      <View style={{ height: 190, backgroundColor: colors.line, justifyContent: 'center' }}>
        {collection.coverPath ? (
          <AccountPhoto path={collection.coverPath} compact fill />
        ) : (
          <Text style={{ color: colors.muted, textAlign: 'center', paddingHorizontal: 20 }}>
            {categoryLabel(collection.categoryId)}
          </Text>
        )}
        <View
          style={{
            position: 'absolute',
            left: 12,
            top: 12,
            maxWidth: '85%',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: radius.pill,
            backgroundColor: colors.overlay,
          }}
        >
          <Text className="text-[11px] font-semibold uppercase tracking-[1.1px] text-white" numberOfLines={1}>
            {categoryLabel(collection.categoryId)}
          </Text>
        </View>
      </View>
      <View style={{ padding: 16, gap: 10 }}>
        <Text className="text-[18px] font-semibold" style={{ color: colors.ink }} numberOfLines={2}>
          {collection.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.line,
            }}
          >
            <Text style={{ color: colors.ink, fontSize: 11, fontWeight: '700' }}>
              {initials(collection.owner.displayName)}
            </Text>
          </View>
          <View style={{ minWidth: 0, flex: 1 }}>
            <Text className="text-[13px] font-medium" style={{ color: colors.ink }} numberOfLines={1}>
              {collection.owner.displayName}
            </Text>
            <Text className="text-[12px]" style={{ color: colors.muted }} numberOfLines={1}>
              @{collection.owner.handle} · {collection.itemCount} {collection.itemCount === 1 ? 'object' : 'objects'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={liked ? 'Unlike collection' : 'Like collection'}
              accessibilityState={{ selected: liked, disabled: busy }}
              disabled={busy}
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation?.()
                onToggleLike()
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}
            >
              <IconHeart color={colors.like} size={16} filled={liked} />
              <Text className="text-[12px]" style={{ color: colors.like }}>
                {collection.likeCount}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Remove collection from saved' : 'Save collection'}
              accessibilityState={{ selected: saved, disabled: busy }}
              disabled={busy}
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation?.()
                onToggleSave()
              }}
              style={{ padding: 4 }}
            >
              <IconBookmark color={saved ? colors.ink : colors.faint} size={16} filled={saved} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  )
}
