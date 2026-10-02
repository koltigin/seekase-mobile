import { getSupabase } from '../lib/supabase'
import type { ProfileRow } from '../types/database'
import { mapPostgrestError, repoFail, repoOk, unavailableResult, type RepoResult } from './errors'

export type AccountActivityKind = 'follow' | 'collection-like' | 'item-like' | 'collection-comment' | 'item-comment'

export type AccountActivityEvent = {
  id: string
  kind: AccountActivityKind
  actor: {
    id: string
    displayName: string
    handle: string
    avatarPath?: string
  }
  collectionId?: string
  itemId?: string
  targetTitle?: string
  commentBody?: string
  createdAt: string
}

type OwnCollection = { id: string; title: string }
type OwnItem = { id: string; collection_id: string; title: string }
type FollowActivity = { follower_id: string; created_at: string }
type CollectionLikeActivity = { user_id: string; collection_id: string; created_at: string }
type ItemLikeActivity = { user_id: string; item_id: string; created_at: string }
type CommentActivity = {
  id: string
  author_id: string
  collection_id: string | null
  item_id: string | null
  body: string
  created_at: string
}

function clientOrUnavailable() {
  const supabase = getSupabase()
  if (!supabase) return { supabase: null as null, fail: unavailableResult() }
  return { supabase, fail: null as null }
}

export async function listAccountActivity(ownerId: string, limit = 100): Promise<RepoResult<AccountActivityEvent[]>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail

  const [collectionsResult, itemsResult] = await Promise.all([
    supabase.from('collections').select('id,title').eq('owner_id', ownerId),
    supabase.from('items').select('id,collection_id,title').eq('owner_id', ownerId),
  ])
  const ownershipError = collectionsResult.error ?? itemsResult.error
  if (ownershipError) {
    const mapped = mapPostgrestError(ownershipError.message, 'Could not load your activity targets.')
    return repoFail(mapped.code, mapped.message)
  }

  const collections = collectionsResult.data as OwnCollection[]
  const items = itemsResult.data as OwnItem[]
  const collectionIds = collections.map((entry) => entry.id)
  const itemIds = items.map((entry) => entry.id)
  const empty = Promise.resolve({ data: [], error: null })
  const [followsResult, collectionLikesResult, itemLikesResult, collectionCommentsResult, itemCommentsResult] =
    await Promise.all([
      supabase
        .from('follows')
        .select('follower_id,created_at')
        .eq('following_id', ownerId)
        .neq('follower_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(limit),
      collectionIds.length
        ? supabase
            .from('collection_likes')
            .select('user_id,collection_id,created_at')
            .in('collection_id', collectionIds)
            .neq('user_id', ownerId)
            .order('created_at', { ascending: false })
            .limit(limit)
        : empty,
      itemIds.length
        ? supabase
            .from('item_likes')
            .select('user_id,item_id,created_at')
            .in('item_id', itemIds)
            .neq('user_id', ownerId)
            .order('created_at', { ascending: false })
            .limit(limit)
        : empty,
      collectionIds.length
        ? supabase
            .from('comments')
            .select('id,author_id,collection_id,item_id,body,created_at')
            .in('collection_id', collectionIds)
            .neq('author_id', ownerId)
            .order('created_at', { ascending: false })
            .limit(limit)
        : empty,
      itemIds.length
        ? supabase
            .from('comments')
            .select('id,author_id,collection_id,item_id,body,created_at')
            .in('item_id', itemIds)
            .neq('author_id', ownerId)
            .order('created_at', { ascending: false })
            .limit(limit)
        : empty,
    ])

  const activityError =
    followsResult.error ??
    collectionLikesResult.error ??
    itemLikesResult.error ??
    collectionCommentsResult.error ??
    itemCommentsResult.error
  if (activityError) {
    const mapped = mapPostgrestError(activityError.message, 'Could not load account activity.')
    return repoFail(mapped.code, mapped.message)
  }

  const follows = followsResult.data as FollowActivity[]
  const collectionLikes = collectionLikesResult.data as CollectionLikeActivity[]
  const itemLikes = itemLikesResult.data as ItemLikeActivity[]
  const collectionComments = collectionCommentsResult.data as CommentActivity[]
  const itemComments = itemCommentsResult.data as CommentActivity[]
  const actorIds = [
    ...new Set([
      ...follows.map((entry) => entry.follower_id),
      ...collectionLikes.map((entry) => entry.user_id),
      ...itemLikes.map((entry) => entry.user_id),
      ...collectionComments.map((entry) => entry.author_id),
      ...itemComments.map((entry) => entry.author_id),
    ]),
  ]

  let profiles: Pick<ProfileRow, 'id' | 'display_name' | 'handle' | 'avatar_path'>[] = []
  if (actorIds.length) {
    const profilesResult = await supabase
      .from('profiles')
      .select('id,display_name,handle,avatar_path')
      .in('id', actorIds)
    if (profilesResult.error) {
      const mapped = mapPostgrestError(profilesResult.error.message, 'Could not load activity profiles.')
      return repoFail(mapped.code, mapped.message)
    }
    profiles = profilesResult.data
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]))
  const collectionById = new Map(collections.map((collection) => [collection.id, collection]))
  const itemById = new Map(items.map((item) => [item.id, item]))
  const actor = (id: string) => {
    const profile = profileById.get(id)
    return {
      id,
      displayName: profile?.display_name ?? 'Collector',
      handle: profile?.handle ?? 'collector',
      avatarPath: profile?.avatar_path ?? undefined,
    }
  }

  const events: AccountActivityEvent[] = [
    ...follows.map((entry) => ({
      id: `follow:${entry.follower_id}:${entry.created_at}`,
      kind: 'follow' as const,
      actor: actor(entry.follower_id),
      createdAt: entry.created_at,
    })),
    ...collectionLikes.map((entry) => ({
      id: `collection-like:${entry.user_id}:${entry.collection_id}`,
      kind: 'collection-like' as const,
      actor: actor(entry.user_id),
      collectionId: entry.collection_id,
      targetTitle: collectionById.get(entry.collection_id)?.title ?? 'your collection',
      createdAt: entry.created_at,
    })),
    ...itemLikes.map((entry) => {
      const item = itemById.get(entry.item_id)
      return {
        id: `item-like:${entry.user_id}:${entry.item_id}`,
        kind: 'item-like' as const,
        actor: actor(entry.user_id),
        itemId: entry.item_id,
        collectionId: item?.collection_id,
        targetTitle: item?.title ?? 'your collectible',
        createdAt: entry.created_at,
      }
    }),
    ...collectionComments.map((entry) => ({
      id: `collection-comment:${entry.id}`,
      kind: 'collection-comment' as const,
      actor: actor(entry.author_id),
      collectionId: entry.collection_id ?? undefined,
      targetTitle: entry.collection_id ? collectionById.get(entry.collection_id)?.title : undefined,
      commentBody: entry.body,
      createdAt: entry.created_at,
    })),
    ...itemComments.map((entry) => {
      const item = entry.item_id ? itemById.get(entry.item_id) : undefined
      return {
        id: `item-comment:${entry.id}`,
        kind: 'item-comment' as const,
        actor: actor(entry.author_id),
        itemId: entry.item_id ?? undefined,
        collectionId: item?.collection_id,
        targetTitle: item?.title,
        commentBody: entry.body,
        createdAt: entry.created_at,
      }
    }),
  ]

  return repoOk(events.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit))
}

export async function getActivityLastReadAt(userId: string): Promise<RepoResult<string | null>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const { data, error } = await supabase
    .from('activity_read_state')
    .select('last_read_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not load activity status.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(data?.last_read_at ?? null)
}

export async function markActivityRead(userId: string, lastReadAt: string): Promise<RepoResult<true>> {
  if (!Number.isFinite(Date.parse(lastReadAt))) return repoFail('validation', 'Invalid activity timestamp.')
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const { error } = await supabase
    .from('activity_read_state')
    .upsert({ user_id: userId, last_read_at: lastReadAt }, { onConflict: 'user_id' })
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not update activity status.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}
