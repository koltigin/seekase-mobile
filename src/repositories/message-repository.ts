import { getSupabase } from '../lib/supabase'
import type { DirectConversationRow, DirectMessageRow, ProfileRow } from '../types/database'
import { mapPostgrestError, repoFail, repoOk, unavailableResult, type RepoResult } from './errors'

export type MessageContext =
  { kind: 'collection'; id: string; title?: string } | { kind: 'item'; id: string; title?: string }

export type DirectMessage = {
  id: string
  conversationId: string
  senderId: string
  body: string
  context?: MessageContext
  createdAt: string
}

export type ConversationPeer = {
  id: string
  displayName: string
  handle: string
  avatarPath?: string
}

export type DirectConversationPreview = {
  id: string
  peer: ConversationPeer
  lastMessage?: DirectMessage
  lastMessageAt?: string
  unreadCount: number
}

export type DirectConversationDetail = {
  id: string
  peer: ConversationPeer
  messages: DirectMessage[]
}

type ReadRow = { conversation_id: string; last_read_at: string }
type TitleRow = { id: string; title: string }

function clientOrUnavailable() {
  const supabase = getSupabase()
  if (!supabase) return { supabase: null as null, fail: unavailableResult() }
  return { supabase, fail: null as null }
}

function peerId(conversation: DirectConversationRow, userId: string) {
  return conversation.member_one_id === userId ? conversation.member_two_id : conversation.member_one_id
}

function peerFrom(profile: Pick<ProfileRow, 'id' | 'display_name' | 'handle' | 'avatar_path'>): ConversationPeer {
  return {
    id: profile.id,
    displayName: profile.display_name,
    handle: profile.handle,
    avatarPath: profile.avatar_path ?? undefined,
  }
}

function messageFrom(row: DirectMessageRow, titles?: { collections: Map<string, string>; items: Map<string, string> }) {
  let context: MessageContext | undefined
  if (row.context_collection_id)
    context = {
      kind: 'collection',
      id: row.context_collection_id,
      title: titles?.collections.get(row.context_collection_id),
    }
  else if (row.context_item_id)
    context = { kind: 'item', id: row.context_item_id, title: titles?.items.get(row.context_item_id) }
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    context,
    createdAt: row.created_at,
  }
}

export async function openDirectConversation(peerUserId: string): Promise<RepoResult<string>> {
  if (!peerUserId) return repoFail('validation', 'Choose a collector to message.')
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const { data, error } = await supabase.rpc('open_direct_conversation', { peer_user_id: peerUserId })
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not open this conversation.')
    return repoFail(mapped.code, mapped.message)
  }
  if (!data) return repoFail('not_found', 'Could not open this conversation.')
  return repoOk(data)
}

export async function listDirectConversations(
  userId: string,
  limit = 100,
): Promise<RepoResult<DirectConversationPreview[]>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const conversationResult = await supabase
    .from('direct_conversations')
    .select('*')
    .or(`member_one_id.eq.${userId},member_two_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(limit)
  if (conversationResult.error) {
    const mapped = mapPostgrestError(conversationResult.error.message, 'Could not load messages.')
    return repoFail(mapped.code, mapped.message)
  }
  const conversations = conversationResult.data as DirectConversationRow[]
  if (!conversations.length) return repoOk([])

  const conversationIds = conversations.map((conversation) => conversation.id)
  const peerIds = [...new Set(conversations.map((conversation) => peerId(conversation, userId)))]
  const [messagesResult, profilesResult, readsResult] = await Promise.all([
    supabase
      .from('direct_messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .limit(Math.max(limit * 20, 200)),
    supabase.from('profiles').select('id,display_name,handle,avatar_path').in('id', peerIds),
    supabase
      .from('direct_conversation_reads')
      .select('conversation_id,last_read_at')
      .eq('user_id', userId)
      .in('conversation_id', conversationIds),
  ])
  const error = messagesResult.error ?? profilesResult.error ?? readsResult.error
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not load messages.')
    return repoFail(mapped.code, mapped.message)
  }

  const messages = messagesResult.data as DirectMessageRow[]
  const profiles = profilesResult.data as Pick<ProfileRow, 'id' | 'display_name' | 'handle' | 'avatar_path'>[]
  const reads = readsResult.data as ReadRow[]
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]))
  const readByConversation = new Map(reads.map((read) => [read.conversation_id, read.last_read_at]))

  return repoOk(
    conversations.flatMap((conversation) => {
      const profile = profileById.get(peerId(conversation, userId))
      if (!profile) return []
      const conversationMessages = messages.filter((message) => message.conversation_id === conversation.id)
      const lastReadAt = readByConversation.get(conversation.id)
      const unreadCount = conversationMessages.filter(
        (message) => message.sender_id !== userId && (!lastReadAt || message.created_at > lastReadAt),
      ).length
      return [
        {
          id: conversation.id,
          peer: peerFrom(profile),
          lastMessage: conversationMessages[0] ? messageFrom(conversationMessages[0]) : undefined,
          lastMessageAt: conversation.last_message_at ?? undefined,
          unreadCount,
        },
      ]
    }),
  )
}

export async function getDirectConversation(
  conversationId: string,
  userId: string,
): Promise<RepoResult<DirectConversationDetail | null>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const [conversationResult, messagesResult] = await Promise.all([
    supabase.from('direct_conversations').select('*').eq('id', conversationId).maybeSingle(),
    supabase.from('direct_messages').select('*').eq('conversation_id', conversationId).order('created_at'),
  ])
  const error = conversationResult.error ?? messagesResult.error
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not load this conversation.')
    return repoFail(mapped.code, mapped.message)
  }
  if (!conversationResult.data) return repoOk(null)
  const conversation = conversationResult.data as DirectConversationRow
  const profileResult = await supabase
    .from('profiles')
    .select('id,display_name,handle,avatar_path')
    .eq('id', peerId(conversation, userId))
    .maybeSingle()
  if (profileResult.error) {
    const mapped = mapPostgrestError(profileResult.error.message, 'Could not load this collector.')
    return repoFail(mapped.code, mapped.message)
  }
  if (!profileResult.data) return repoOk(null)

  const messageRows = messagesResult.data as DirectMessageRow[]
  const collectionIds = [...new Set(messageRows.flatMap((message) => message.context_collection_id ?? []))]
  const itemIds = [...new Set(messageRows.flatMap((message) => message.context_item_id ?? []))]
  const empty = Promise.resolve({ data: [], error: null })
  const [collectionsResult, itemsResult] = await Promise.all([
    collectionIds.length ? supabase.from('collections').select('id,title').in('id', collectionIds) : empty,
    itemIds.length ? supabase.from('items').select('id,title').in('id', itemIds) : empty,
  ])
  const titleError = collectionsResult.error ?? itemsResult.error
  if (titleError) {
    const mapped = mapPostgrestError(titleError.message, 'Could not load message context.')
    return repoFail(mapped.code, mapped.message)
  }
  const titles = {
    collections: new Map((collectionsResult.data as TitleRow[]).map((row) => [row.id, row.title])),
    items: new Map((itemsResult.data as TitleRow[]).map((row) => [row.id, row.title])),
  }
  return repoOk({
    id: conversation.id,
    peer: peerFrom(profileResult.data),
    messages: messageRows.map((message) => messageFrom(message, titles)),
  })
}

export async function sendDirectMessage(
  userId: string,
  conversationId: string,
  body: string,
  context?: MessageContext,
): Promise<RepoResult<DirectMessage>> {
  const trimmed = body.trim()
  if (!trimmed) return repoFail('validation', 'Write a message first.')
  if (trimmed.length > 1000) return repoFail('validation', 'Messages cannot exceed 1,000 characters.')
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const { data, error } = await supabase
    .from('direct_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: trimmed,
      context_collection_id: context?.kind === 'collection' ? context.id : null,
      context_item_id: context?.kind === 'item' ? context.id : null,
    })
    .select('*')
    .single()
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not send this message.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(messageFrom(data as DirectMessageRow))
}

export async function markDirectConversationRead(
  userId: string,
  conversationId: string,
  lastReadAt = new Date().toISOString(),
): Promise<RepoResult<true>> {
  if (!Number.isFinite(Date.parse(lastReadAt))) return repoFail('validation', 'Invalid message timestamp.')
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const { error } = await supabase
    .from('direct_conversation_reads')
    .upsert(
      { conversation_id: conversationId, user_id: userId, last_read_at: lastReadAt },
      { onConflict: 'conversation_id,user_id' },
    )
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not update message status.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}
