import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { formatActivityTime } from '../../data/activity-time'
import { useTheme } from '../../state/app-state'
import { useMessageInbox } from '../../state/use-message-inbox'
import { radius, type } from '../../theme/tokens'
import { CloudButton } from '../catalog/cloud-controls'

function initials(name: string) {
  const parts = name.trim().split(/\s+/u).filter(Boolean)
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.slice(0, 2) || 'SK').toUpperCase()
}

export function MessageInbox({ userId }: { userId: string }) {
  const { colors } = useTheme()
  const router = useRouter()
  const { inboxQuery } = useMessageInbox(userId)

  if (inboxQuery.isPending) return <Text style={{ ...type.body, color: colors.muted }}>Loading messages…</Text>
  if (inboxQuery.isError)
    return (
      <View style={{ gap: 14, padding: 18, borderRadius: radius.lg, backgroundColor: colors.surface }}>
        <Text accessibilityRole="alert" style={{ ...type.body, color: colors.danger }}>
          {inboxQuery.error.message}
        </Text>
        <CloudButton label="Try again" secondary onPress={() => void inboxQuery.refetch()} />
      </View>
    )
  if (!inboxQuery.data?.length)
    return (
      <View style={{ padding: 18, borderRadius: radius.lg, backgroundColor: colors.surface }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>No messages yet</Text>
        <Text style={{ ...type.meta, color: colors.muted, marginTop: 7 }}>
          Open a collector profile, collection, or object and choose Message collector.
        </Text>
      </View>
    )

  return (
    <View style={{ paddingHorizontal: 16, borderRadius: radius.xl, backgroundColor: colors.surface }}>
      {inboxQuery.data.map((conversation, index) => (
        <Pressable
          key={conversation.id}
          accessibilityRole="button"
          accessibilityLabel={`Open conversation with ${conversation.peer.displayName}`}
          onPress={() => router.push(`/messages/${conversation.id}`)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 16,
            borderBottomWidth: index === inboxQuery.data.length - 1 ? 0 : 1,
            borderBottomColor: colors.line,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.line,
            }}
          >
            <Text style={{ color: colors.ink, fontSize: 12, fontWeight: '700' }}>
              {initials(conversation.peer.displayName)}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink }} numberOfLines={1}>
                {conversation.peer.displayName}
              </Text>
              {conversation.lastMessageAt ? (
                <Text style={{ fontSize: 12, color: colors.faint }}>
                  {formatActivityTime(conversation.lastMessageAt)}
                </Text>
              ) : null}
            </View>
            <Text style={{ ...type.meta, color: colors.muted }} numberOfLines={1}>
              @{conversation.peer.handle}
            </Text>
            <Text
              style={{
                ...type.meta,
                color: conversation.unreadCount ? colors.ink : colors.muted,
                fontWeight: conversation.unreadCount ? '600' : '400',
                marginTop: 5,
              }}
              numberOfLines={2}
            >
              {conversation.lastMessage?.body ?? 'Start the conversation.'}
            </Text>
          </View>
          {conversation.unreadCount ? (
            <View
              accessibilityLabel={`${conversation.unreadCount} unread messages`}
              style={{
                minWidth: 24,
                height: 24,
                marginLeft: 10,
                paddingHorizontal: 7,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                backgroundColor: colors.like,
              }}
            >
              <Text style={{ color: colors.onAccent, fontSize: 11, fontWeight: '700' }}>
                {conversation.unreadCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  )
}
