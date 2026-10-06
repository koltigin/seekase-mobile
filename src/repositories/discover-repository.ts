import { getSupabase } from '../lib/supabase'
import type { CollectionRow, ProfileRow } from '../types/database'
import { mapPostgrestError, repoFail, repoOk, unavailableResult, type RepoResult } from './errors'

export type PublicCollectorSummary = {
  id: string
  displayName: string
  handle: string
  avatarPath?: string
}

export type PublicCollectionSummary = {
  id: string
  title: string
  description?: string
  categoryId: string
  subcategoryId?: string
  tags: string[]
  owner: PublicCollectorSummary
  itemCount: number
  likeCount: number
  commentCount: number
  viewCount: number
  coverPath?: string
  createdAt: string
}

export type PublicCollectorDetail = PublicCollectorSummary & {
  bio: string
  location?: string
  badgeIds: string[]
  collections: PublicCollectionSummary[]
}

type PublicProfileRow = Pick<ProfileRow, 'id' | 'display_name' | 'handle' | 'avatar_path'>
type PublicItemCardRow = { collection_id: string; cover_path: string | null }
type CollectionEngagementRow = {
  collection_id: string
  like_count: number
  comment_count: number
  view_count: number
}

function clientOrUnavailable() {
  const supabase = getSupabase()
  if (!supabase) return { supabase: null as null, fail: unavailableResult() }
  return { supabase, fail: null as null }
}

/** Records at most one audience member per collection; the database excludes the owner. */
export async function recordPublicCollectionView(collectionId: string): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const result = await supabase.rpc('record_collection_view', { target_collection_id: collectionId })
  if (result.error) {
    const mapped = mapPostgrestError(result.error.message, 'Could not record this collection view.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}

/** Public derived badge ids only. Evidence and wallet identifiers never enter this DTO. */
export async function listPublicCollectorBadgeIds(userId: string): Promise<RepoResult<string[]>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const result = await supabase.from('collector_badges').select('badge_id').eq('user_id', userId)
  if (result.error) {
    const mapped = mapPostgrestError(result.error.message, 'Could not load collector achievements.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk((result.data as { badge_id: string }[]).map((badge) => badge.badge_id))
}

/** Public Discover feed. Wallet identity is deliberately absent from this DTO. */
export async function listPublicCollections(limit = 50): Promise<RepoResult<PublicCollectionSummary[]>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail

  const safeLimit = Math.max(1, Math.min(limit, 100))
  const collectionsResult = await supabase
    .from('collections')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(safeLimit)
  if (collectionsResult.error) {
    const mapped = mapPostgrestError(collectionsResult.error.message, 'Could not load public collections.')
    return repoFail(mapped.code, mapped.message)
  }

  const collections = collectionsResult.data as CollectionRow[]
  if (collections.length === 0) return repoOk([])

  const collectionIds = collections.map((row) => row.id)
  const ownerIds = [...new Set(collections.map((row) => row.owner_id))]
  const [profilesResult, itemsResult, engagementResult] = await Promise.all([
    supabase.from('profiles').select('id,display_name,handle,avatar_path').in('id', ownerIds),
    supabase
      .from('items')
      .select('collection_id,cover_path')
      .in('collection_id', collectionIds)
      .order('created_at', { ascending: false }),
    supabase.rpc('collection_engagement_counts', { target_collection_ids: collectionIds }),
  ])

  const firstError = profilesResult.error ?? itemsResult.error ?? engagementResult.error
  if (firstError) {
    const mapped = mapPostgrestError(firstError.message, 'Could not load public collection details.')
    return repoFail(mapped.code, mapped.message)
  }

  const profiles = profilesResult.data as PublicProfileRow[]
  const items = itemsResult.data as PublicItemCardRow[]
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]))
  const itemCounts = new Map<string, number>()
  const firstPhoto = new Map<string, string>()
  for (const item of items) {
    if (!item.cover_path) continue
    itemCounts.set(item.collection_id, (itemCounts.get(item.collection_id) ?? 0) + 1)
    if (item.cover_path && !firstPhoto.has(item.collection_id)) firstPhoto.set(item.collection_id, item.cover_path)
  }
  const engagementById = new Map(
    (engagementResult.data as CollectionEngagementRow[]).map((row) => [row.collection_id, row]),
  )

  return repoOk(
    collections.flatMap((collection) => {
      const profile = profileById.get(collection.owner_id)
      const coverPath = collection.cover_path ?? firstPhoto.get(collection.id)
      if (!profile || !coverPath || (itemCounts.get(collection.id) ?? 0) === 0) return []
      return [
        {
          id: collection.id,
          title: collection.title,
          description: collection.description ?? undefined,
          categoryId: collection.category_id,
          subcategoryId: collection.subcategory_id ?? undefined,
          tags: collection.tags ?? [],
          owner: {
            id: profile.id,
            displayName: profile.display_name,
            handle: profile.handle,
            avatarPath: profile.avatar_path ?? undefined,
          },
          itemCount: itemCounts.get(collection.id) ?? 0,
          likeCount: engagementById.get(collection.id)?.like_count ?? 0,
          commentCount: engagementById.get(collection.id)?.comment_count ?? 0,
          viewCount: engagementById.get(collection.id)?.view_count ?? 0,
          coverPath,
          createdAt: collection.created_at,
        },
      ]
    }),
  )
}

export async function getPublicCollection(id: string): Promise<RepoResult<PublicCollectionSummary | null>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const collectionResult = await supabase.from('collections').select('*').eq('id', id).maybeSingle()
  if (collectionResult.error) {
    const mapped = mapPostgrestError(collectionResult.error.message, 'Could not load this collection.')
    return repoFail(mapped.code, mapped.message)
  }
  if (!collectionResult.data) return repoOk(null)
  const collection = collectionResult.data as CollectionRow
  const [profileResult, itemsResult, engagementResult] = await Promise.all([
    supabase.from('profiles').select('id,display_name,handle,avatar_path').eq('id', collection.owner_id).maybeSingle(),
    supabase
      .from('items')
      .select('collection_id,cover_path')
      .eq('collection_id', id)
      .order('created_at', { ascending: false }),
    supabase.rpc('collection_engagement_counts', { target_collection_ids: [id] }),
  ])
  const firstError = profileResult.error ?? itemsResult.error ?? engagementResult.error
  if (firstError) {
    const mapped = mapPostgrestError(firstError.message, 'Could not load this collection.')
    return repoFail(mapped.code, mapped.message)
  }
  if (!profileResult.data) return repoOk(null)
  const profile = profileResult.data as PublicProfileRow
  const items = (itemsResult.data as PublicItemCardRow[]).filter((item) => Boolean(item.cover_path))
  const engagement = (engagementResult.data as CollectionEngagementRow[])[0]
  if (!items.length) return repoOk(null)
  return repoOk({
    id: collection.id,
    title: collection.title,
    description: collection.description ?? undefined,
    categoryId: collection.category_id,
    subcategoryId: collection.subcategory_id ?? undefined,
    tags: collection.tags ?? [],
    owner: {
      id: profile.id,
      displayName: profile.display_name,
      handle: profile.handle,
      avatarPath: profile.avatar_path ?? undefined,
    },
    itemCount: items.length,
    likeCount: engagement?.like_count ?? 0,
    commentCount: engagement?.comment_count ?? 0,
    viewCount: engagement?.view_count ?? 0,
    coverPath: collection.cover_path ?? items.find((item) => item.cover_path)?.cover_path ?? undefined,
    createdAt: collection.created_at,
  })
}

export async function getPublicCollector(id: string): Promise<RepoResult<PublicCollectorDetail | null>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const profileResult = await supabase
    .from('profiles')
    .select('id,display_name,handle,avatar_path,bio,location_text')
    .eq('id', id)
    .maybeSingle()
  if (profileResult.error) {
    const mapped = mapPostgrestError(profileResult.error.message, 'Could not load this collector.')
    return repoFail(mapped.code, mapped.message)
  }
  if (!profileResult.data) return repoOk(null)

  const collectionsResult = await supabase
    .from('collections')
    .select('*')
    .eq('owner_id', id)
    .order('created_at', { ascending: false })
  if (collectionsResult.error) {
    const mapped = mapPostgrestError(collectionsResult.error.message, 'Could not load this collector.')
    return repoFail(mapped.code, mapped.message)
  }
  const badgesResult = await listPublicCollectorBadgeIds(id)
  if (!badgesResult.ok) return badgesResult
  const collections = collectionsResult.data as CollectionRow[]
  const collectionIds = collections.map((collection) => collection.id)
  const [itemsResult, engagementResult] = collectionIds.length
    ? await Promise.all([
        supabase
          .from('items')
          .select('collection_id,cover_path')
          .in('collection_id', collectionIds)
          .order('created_at', { ascending: false }),
        supabase.rpc('collection_engagement_counts', { target_collection_ids: collectionIds }),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ]
  const firstError = itemsResult.error ?? engagementResult.error
  if (firstError) {
    const mapped = mapPostgrestError(firstError.message, 'Could not load this collector.')
    return repoFail(mapped.code, mapped.message)
  }
  const items = itemsResult.data as PublicItemCardRow[]
  const itemCounts = new Map<string, number>()
  const firstPhoto = new Map<string, string>()
  for (const item of items) {
    if (!item.cover_path) continue
    itemCounts.set(item.collection_id, (itemCounts.get(item.collection_id) ?? 0) + 1)
    if (item.cover_path && !firstPhoto.has(item.collection_id)) firstPhoto.set(item.collection_id, item.cover_path)
  }
  const engagementById = new Map(
    (engagementResult.data as CollectionEngagementRow[]).map((row) => [row.collection_id, row]),
  )
  const profile = profileResult.data
  const owner: PublicCollectorSummary = {
    id: profile.id,
    displayName: profile.display_name,
    handle: profile.handle,
    avatarPath: profile.avatar_path ?? undefined,
  }
  return repoOk({
    ...owner,
    bio: profile.bio,
    location: profile.location_text ?? undefined,
    badgeIds: badgesResult.data,
    collections: collections.flatMap((collection) => {
      const coverPath = collection.cover_path ?? firstPhoto.get(collection.id)
      const itemCount = itemCounts.get(collection.id) ?? 0
      if (!coverPath || itemCount === 0) return []
      return [{
        id: collection.id,
        title: collection.title,
        description: collection.description ?? undefined,
        categoryId: collection.category_id,
        subcategoryId: collection.subcategory_id ?? undefined,
        tags: collection.tags ?? [],
        owner,
        itemCount,
        likeCount: engagementById.get(collection.id)?.like_count ?? 0,
        commentCount: engagementById.get(collection.id)?.comment_count ?? 0,
        viewCount: engagementById.get(collection.id)?.view_count ?? 0,
        coverPath,
        createdAt: collection.created_at,
      }]
    }),
  })
}
