import { Image, Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { getCollector } from '../../data/mock-data'
import type { ActivityEvent } from '../../data/types'
import { useTheme } from '../../state/app-state'
import { useCatalog } from '../../state/use-catalog'
import { navigateToCollector } from '../../utils/collector-nav'
import { Avatar } from '../ui/avatar'

export function ActivityRow({ event, last = false }: { event: ActivityEvent; last?: boolean }) {
  const { colors } = useTheme()
  const router = useRouter()
  const catalog = useCatalog()
  const actor = getCollector(event.actorId)
  const collection = event.collectionId ? catalog.getCollection(event.collectionId) : undefined
  const item = event.itemId ? catalog.getItem(event.itemId) : undefined
  const thumb = item?.image ?? collection?.cover
  const followTargetId = event.collectorTargetId

  function openPrimaryTarget() {
    if (event.itemId && item) {
      router.push(`/item/${event.itemId}`)
      return
    }
    if (event.collectionId && collection) {
      router.push(`/collection/${event.collectionId}`)
      return
    }
    if (followTargetId) {
      navigateToCollector(router, followTargetId)
    }
  }

  const canOpenThumb = Boolean((event.itemId && item) || (event.collectionId && collection))

  return (
    <View
      className="flex-row items-start py-4"
      style={last ? undefined : { borderBottomWidth: 1, borderBottomColor: colors.line }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open collector ${actor?.displayName ?? 'Collector'}`}
        onPress={() => {
          if (actor) {
            navigateToCollector(router, actor.id)
          }
        }}
        className="flex-row items-start"
        style={{ flex: 1 }}
      >
        <Avatar collector={actor} size={40} />
        <View className="ml-3 min-w-0 flex-1">
          <Text className="text-[15px] font-semibold" style={{ color: colors.ink }} numberOfLines={1}>
            {actor?.displayName ?? 'Collector'}
          </Text>
          <Pressable accessibilityRole="button" onPress={openPrimaryTarget} disabled={!canOpenThumb && !followTargetId}>
            <Text className="mt-0.5 text-[14px] leading-5" style={{ color: colors.muted }} numberOfLines={2}>
              {event.target ? `${event.action} ${event.target}` : event.action}
            </Text>
          </Pressable>
          <Text className="mt-1.5 text-[12px]" style={{ color: colors.faint }}>
            {event.timeLabel}
            {event.source === 'local' ? ' · You' : ''}
          </Text>
        </View>
      </Pressable>
      {thumb && canOpenThumb ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item ? `Open object ${item.title}` : `Open collection ${collection?.title ?? ''}`}
          onPress={openPrimaryTarget}
        >
          <Image source={thumb} resizeMode="cover" style={{ width: 48, height: 48, borderRadius: 8, marginLeft: 10 }} />
        </Pressable>
      ) : null}
    </View>
  )
}
