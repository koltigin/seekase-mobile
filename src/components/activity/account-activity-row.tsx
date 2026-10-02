import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { formatActivityTime } from '../../data/activity-time'
import type { AccountActivityEvent } from '../../repositories/activity-repository'
import { useTheme } from '../../state/app-state'
import { type } from '../../theme/tokens'

function initials(name: string) {
  const parts = name.trim().split(/\s+/u).filter(Boolean)
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.slice(0, 2) || 'SK').toUpperCase()
}

function actionText(event: AccountActivityEvent) {
  switch (event.kind) {
    case 'follow':
      return 'started following you'
    case 'collection-like':
      return `liked ${event.targetTitle ?? 'your collection'}`
    case 'item-like':
      return `liked ${event.targetTitle ?? 'your collectible'}`
    case 'collection-comment':
    case 'item-comment':
      return `commented on ${event.targetTitle ?? 'your collection'}`
  }
}

export function AccountActivityRow({ event, last = false }: { event: AccountActivityEvent; last?: boolean }) {
  const { colors } = useTheme()
  const router = useRouter()

  function openEvent() {
    if (event.collectionId) router.push(`/showcase/${event.collectionId}`)
    else router.push(`/public-collector/${event.actor.id}`)
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.actor.displayName} ${actionText(event)}`}
      onPress={openEvent}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open collector ${event.actor.displayName}`}
        onPress={(pressEvent) => {
          pressEvent.stopPropagation?.()
          router.push(`/public-collector/${event.actor.id}`)
        }}
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.line,
        }}
      >
        <Text style={{ color: colors.ink, fontSize: 12, fontWeight: '700' }}>{initials(event.actor.displayName)}</Text>
      </Pressable>
      <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }} numberOfLines={1}>
          {event.actor.displayName}
        </Text>
        <Text style={{ ...type.meta, color: colors.muted, marginTop: 2 }}>{actionText(event)}</Text>
        {event.commentBody ? (
          <Text style={{ ...type.meta, color: colors.ink, marginTop: 7 }} numberOfLines={2}>
            “{event.commentBody}”
          </Text>
        ) : null}
        <Text style={{ fontSize: 12, color: colors.faint, marginTop: 7 }}>{formatActivityTime(event.createdAt)}</Text>
      </View>
    </Pressable>
  )
}
