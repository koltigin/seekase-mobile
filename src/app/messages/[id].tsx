import { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CloudButton } from '../../components/catalog/cloud-controls'
import { SafetyActions } from '../../components/safety/safety-actions'
import { BackButton } from '../../components/ui/back-button'
import { Screen } from '../../components/ui/screen'
import { formatActivityTime } from '../../data/activity-time'
import {
  getDirectConversation,
  markDirectConversationRead,
  sendDirectMessage,
  type MessageContext,
} from '../../repositories/message-repository'
import { useTheme } from '../../state/app-state'
import { useAuth } from '../../state/auth'
import { radius, type } from '../../theme/tokens'

export default function DirectMessageScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[]
    collectionId?: string | string[]
    itemId?: string | string[]
    contextTitle?: string | string[]
  }>()
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id
  const collectionId = Array.isArray(params.collectionId) ? params.collectionId[0] : params.collectionId
  const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId
  const contextTitle = Array.isArray(params.contextTitle) ? params.contextTitle[0] : params.contextTitle
  const initialContext: MessageContext | undefined = itemId
    ? { kind: 'item', id: itemId, title: contextTitle }
    : collectionId
      ? { kind: 'collection', id: collectionId, title: contextTitle }
      : undefined
  const router = useRouter()
  const { colors } = useTheme()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const scrollRef = useRef<ScrollView>(null)
  const [body, setBody] = useState('')
  const [context, setContext] = useState<MessageContext | undefined>(initialContext)
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['direct-conversation', conversationId, user?.id],
    enabled: Boolean(conversationId && user),
    retry: false,
    queryFn: async () => {
      const result = await getDirectConversation(conversationId!, user!.id)
      if (!result.ok) throw new Error(result.error.message)
      if (!result.data) throw new Error('This conversation is unavailable.')
      return result.data
    },
  })

  const sendMutation = useMutation({
    mutationFn: async () => {
      const result = await sendDirectMessage(user!.id, conversationId!, body, context)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: async () => {
      setBody('')
      setContext(undefined)
      setError(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['direct-conversation', conversationId] }),
        queryClient.invalidateQueries({ queryKey: ['direct-conversations', user?.id] }),
      ])
    },
    onError: (sendError) => setError(sendError.message),
  })

  const newestMessageAt = query.data?.messages.at(-1)?.createdAt
  useEffect(() => {
    if (!user || !conversationId || !newestMessageAt) return
    void markDirectConversationRead(user.id, conversationId, newestMessageAt).then((result) => {
      if (result.ok) void queryClient.invalidateQueries({ queryKey: ['direct-conversations', user.id] })
    })
  }, [conversationId, newestMessageAt, queryClient, user])

  useEffect(() => {
    if (query.data?.messages.length) requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }))
  }, [query.data?.messages.length])

  function openContext(messageContext: MessageContext) {
    if (messageContext.kind === 'item') router.push(`/showcase/item/${messageContext.id}`)
    else router.push(`/showcase/${messageContext.id}`)
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={12}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            paddingBottom: 12,
          }}
        >
          <BackButton onPress={() => router.back()} />
          <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
            <Text style={{ ...type.body, fontWeight: '600', color: colors.ink }} numberOfLines={1}>
              {query.data?.peer.displayName ?? 'Conversation'}
            </Text>
            {query.data?.peer.handle ? (
              <Text style={{ ...type.meta, color: colors.muted }} numberOfLines={1}>
                @{query.data.peer.handle}
              </Text>
            ) : null}
          </View>
          <View style={{ width: 96 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 18, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface }}>
            <Text style={{ ...type.meta, color: colors.muted }}>
              Keep personal details and wallet recovery information private. Seekase does not process payments or
              guarantee trades.
            </Text>
          </View>
          {query.isPending ? <Text style={{ ...type.body, color: colors.muted }}>Loading conversation…</Text> : null}
          {query.isError ? (
            <View style={{ gap: 12 }}>
              <Text accessibilityRole="alert" style={{ ...type.body, color: colors.danger }}>
                {query.error.message}
              </Text>
              <CloudButton label="Try again" secondary onPress={() => void query.refetch()} />
            </View>
          ) : null}
          {query.data?.messages.length === 0 ? (
            <Text style={{ ...type.body, color: colors.muted, textAlign: 'center', paddingVertical: 28 }}>
              Start a private conversation about the collection.
            </Text>
          ) : null}
          {query.data?.messages.map((message) => {
            const own = message.senderId === user?.id
            return (
              <View key={message.id} style={{ alignItems: own ? 'flex-end' : 'flex-start' }}>
                <View
                  style={{
                    maxWidth: '86%',
                    gap: 7,
                    padding: 13,
                    borderRadius: radius.lg,
                    backgroundColor: own ? colors.accent : colors.surface,
                  }}
                >
                  {message.context ? (
                    <Pressable
                      accessibilityRole="link"
                      onPress={() => openContext(message.context!)}
                      style={{
                        paddingBottom: 7,
                        borderBottomWidth: 1,
                        borderBottomColor: own ? colors.onAccent : colors.line,
                      }}
                    >
                      <Text style={{ ...type.meta, color: own ? colors.onAccent : colors.muted }} numberOfLines={1}>
                        {message.context.kind === 'item' ? 'Object' : 'Collection'} ·{' '}
                        {message.context.title ?? 'Open context'}
                      </Text>
                    </Pressable>
                  ) : null}
                  <Text style={{ ...type.body, color: own ? colors.onAccent : colors.ink }}>{message.body}</Text>
                  <Text style={{ fontSize: 11, color: own ? colors.onAccent : colors.faint }}>
                    {formatActivityTime(message.createdAt)}
                  </Text>
                </View>
                {!own ? (
                  <View style={{ width: '60%', marginTop: 4 }}>
                    <SafetyActions
                      userId={user!.id}
                      targetType="message"
                      targetId={message.id}
                      showBlock={false}
                      compact
                      compactLabel="Report message"
                    />
                  </View>
                ) : null}
              </View>
            )
          })}
          {query.data && user ? (
            <SafetyActions
              userId={user.id}
              targetType="conversation"
              targetId={query.data.id}
              collectorId={query.data.peer.id}
            />
          ) : null}
        </ScrollView>

        {query.data ? (
          <View style={{ gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: colors.line }}>
            {context ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 10,
                  borderRadius: radius.md,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{ ...type.meta, color: colors.muted, flex: 1 }} numberOfLines={1}>
                  About {context.kind === 'item' ? 'object' : 'collection'}: {context.title ?? 'selected context'}
                </Text>
                <Pressable accessibilityRole="button" onPress={() => setContext(undefined)}>
                  <Text style={{ ...type.meta, color: colors.ink }}>Remove</Text>
                </Pressable>
              </View>
            ) : null}
            <TextInput
              accessibilityLabel="Private message"
              value={body}
              onChangeText={setBody}
              editable={!sendMutation.isPending}
              multiline
              maxLength={1000}
              placeholder="Write a private message"
              placeholderTextColor={colors.faint}
              style={{
                minHeight: 54,
                maxHeight: 130,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: radius.lg,
                backgroundColor: colors.surface,
                color: colors.ink,
                textAlignVertical: 'top',
              }}
            />
            {error ? (
              <Text accessibilityRole="alert" style={{ ...type.meta, color: colors.danger }}>
                {error}
              </Text>
            ) : null}
            <CloudButton
              label={sendMutation.isPending ? 'Sending…' : 'Send message'}
              disabled={sendMutation.isPending || !body.trim()}
              onPress={() => sendMutation.mutate()}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  )
}
