import { getSupabase } from '../lib/supabase'
import { mapPostgrestError, repoFail, repoOk, unavailableResult, type RepoResult } from './errors'

function clientOrUnavailable() {
  const supabase = getSupabase()
  if (!supabase) {
    return { supabase: null as null, fail: unavailableResult() }
  }
  return { supabase, fail: null as null }
}

export type CloudSocialState = {
  likedCollectionIds: string[]
  savedCollectionIds: string[]
  followedCollectorIds: string[]
}

export type CollectorSocialCounts = {
  followers: number
  following: number
}

export async function getCollectorSocialCounts(userId: string): Promise<RepoResult<CollectorSocialCounts>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const [followersResult, followingResult] = await Promise.all([
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
  ])
  const firstError = followersResult.error ?? followingResult.error
  if (firstError) {
    const mapped = mapPostgrestError(firstError.message, 'Could not load collector connections.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk({
    followers: followersResult.count ?? 0,
    following: followingResult.count ?? 0,
  })
}

export async function getCloudSocialState(
  userId: string,
  collectionIds: string[],
  collectorIds: string[],
): Promise<RepoResult<CloudSocialState>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const uniqueCollections = [...new Set(collectionIds)]
  const uniqueCollectors = [...new Set(collectorIds)].filter((id) => id !== userId)
  const [likesResult, savesResult, followsResult] = await Promise.all([
    uniqueCollections.length
      ? supabase
          .from('collection_likes')
          .select('collection_id')
          .eq('user_id', userId)
          .in('collection_id', uniqueCollections)
      : Promise.resolve({ data: [], error: null }),
    uniqueCollections.length
      ? supabase
          .from('collection_saves')
          .select('collection_id')
          .eq('user_id', userId)
          .in('collection_id', uniqueCollections)
      : Promise.resolve({ data: [], error: null }),
    uniqueCollectors.length
      ? supabase.from('follows').select('following_id').eq('follower_id', userId).in('following_id', uniqueCollectors)
      : Promise.resolve({ data: [], error: null }),
  ])
  const firstError = likesResult.error ?? savesResult.error ?? followsResult.error
  if (firstError) {
    const mapped = mapPostgrestError(firstError.message, 'Could not load your social activity.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk({
    likedCollectionIds: (likesResult.data ?? []).map((row) => row.collection_id),
    savedCollectionIds: (savesResult.data ?? []).map((row) => row.collection_id),
    followedCollectorIds: (followsResult.data ?? []).map((row) => row.following_id),
  })
}

/** Cloud social foundation — UI may keep using local social until sync is deliberate. */
export async function followCollector(followerId: string, followingId: string): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  if (followerId === followingId) {
    return repoFail('validation', 'You cannot follow yourself.')
  }
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not follow.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}

export async function unfollowCollector(followerId: string, followingId: string): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not unfollow.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}

export async function likeItem(userId: string, itemId: string): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const { error } = await supabase.from('item_likes').insert({ user_id: userId, item_id: itemId })
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not like item.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}

export async function unlikeItem(userId: string, itemId: string): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const { error } = await supabase.from('item_likes').delete().eq('user_id', userId).eq('item_id', itemId)
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not unlike item.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}

export async function saveItem(userId: string, itemId: string): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const { error } = await supabase.from('item_saves').insert({ user_id: userId, item_id: itemId })
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not save item.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}

export async function unsaveItem(userId: string, itemId: string): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const { error } = await supabase.from('item_saves').delete().eq('user_id', userId).eq('item_id', itemId)
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not unsave item.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}

export async function likeCollection(userId: string, collectionId: string): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const { error } = await supabase.from('collection_likes').insert({ user_id: userId, collection_id: collectionId })
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not like collection.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}

export async function unlikeCollection(userId: string, collectionId: string): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const { error } = await supabase
    .from('collection_likes')
    .delete()
    .eq('user_id', userId)
    .eq('collection_id', collectionId)
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not unlike collection.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}

export async function saveCollection(userId: string, collectionId: string): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const { error } = await supabase.from('collection_saves').insert({ user_id: userId, collection_id: collectionId })
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not save collection.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}

export async function unsaveCollection(userId: string, collectionId: string): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const { error } = await supabase
    .from('collection_saves')
    .delete()
    .eq('user_id', userId)
    .eq('collection_id', collectionId)
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not unsave collection.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}
