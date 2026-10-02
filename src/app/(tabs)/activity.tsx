import { useCallback, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, Text, View } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useFocusEffect } from 'expo-router'
import { AccountActivityRow } from '../../components/activity/account-activity-row'
import { CloudButton } from '../../components/catalog/cloud-controls'
import { MessageInbox } from '../../components/messages/message-inbox'
import { Screen } from '../../components/ui/screen'
import { ScreenHeader } from '../../components/ui/screen-header'
import { markActivityRead } from '../../repositories/activity-repository'
import { useTheme } from '../../state/app-state'
import { useAuth } from '../../state/auth'
import { useActivityUnread } from '../../state/use-activity-unread'
import { useBlockedCollectors } from '../../state/use-blocked-collectors'
import { radius, space, type } from '../../theme/tokens'

export default function ActivityScreen() {
  const { colors } = useTheme()
  const { user } = useAuth()
  const { blockedIds } = useBlockedCollectors(user?.id)
  const queryClient = useQueryClient()
  const { activityQuery: query } = useActivityUnread(user?.id)
  const [section, setSection] = useState<'updates' | 'messages'>('updates')
  const events = useMemo(
    () => (query.data ?? []).filter((event) => !blockedIds.includes(event.actor.id)),
    [blockedIds, query.data],
  )

  useFocusEffect(
    useCallback(() => {
      const newest = section === 'updates' ? events[0]?.createdAt : undefined
      if (!user || !newest) return
      void markActivityRead(user.id, newest).then((result) => {
        if (result.ok) queryClient.setQueryData(['account-activity-read', user.id], newest)
      })
    }, [events, queryClient, section, user]),
  )

  return (
    <Screen padded={false}>
      <ScreenHeader eyebrow="Your updates" title="Activity" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.ink}
          />
        }
        contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: space.tabPad }}
      >
        <Text style={{ ...type.body, color: colors.muted, marginBottom: 16 }}>
          Keep up with public activity and private collector conversations.
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <CloudButton label="Updates" secondary={section !== 'updates'} onPress={() => setSection('updates')} />
          </View>
          <View style={{ flex: 1 }}>
            <CloudButton label="Messages" secondary={section !== 'messages'} onPress={() => setSection('messages')} />
          </View>
        </View>

        {!user ? (
          <View style={{ gap: 14, padding: 18, borderRadius: radius.lg, backgroundColor: colors.surface }}>
            <Text style={{ ...type.body, color: colors.muted }}>Sign in to see activity for your account.</Text>
          </View>
        ) : null}
        {section === 'messages' && user ? <MessageInbox userId={user.id} /> : null}
        {section === 'updates' && query.isPending ? (
          <Text style={{ ...type.body, color: colors.muted }}>Loading your activity…</Text>
        ) : null}
        {section === 'updates' && query.isError ? (
          <View style={{ gap: 14, padding: 18, borderRadius: radius.lg, backgroundColor: colors.surface }}>
            <Text accessibilityRole="alert" style={{ ...type.body, color: colors.danger }}>
              {query.error.message}
            </Text>
            <CloudButton label="Try again" secondary onPress={() => void query.refetch()} />
          </View>
        ) : null}
        {section === 'updates' && !query.isPending && !query.isError && user && events.length === 0 ? (
          <View style={{ padding: 18, borderRadius: radius.lg, backgroundColor: colors.surface }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>No account activity yet</Text>
            <Text style={{ ...type.meta, color: colors.muted, marginTop: 7 }}>
              When another collector follows you, likes one of your entries, or leaves a comment, it will appear here.
            </Text>
          </View>
        ) : null}
        {section === 'updates' && events.length > 0 ? (
          <View style={{ paddingHorizontal: 16, borderRadius: radius.xl, backgroundColor: colors.surface }}>
            {events.map((event, index) => (
              <AccountActivityRow key={event.id} event={event} last={index === events.length - 1} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
