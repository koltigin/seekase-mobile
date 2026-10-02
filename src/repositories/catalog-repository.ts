import {
  collectibleMetadataForInsert,
  mapCollectionRowToCollection,
  mapItemRowToCollectible,
} from '../data/mappers/cloud-mappers'
import { getSupabase } from '../lib/supabase'
import type { CollectibleItem, Collection, ObjectCondition, ObjectStatus } from '../data/types'
import type { CollectionRow, Database, ItemRow } from '../types/database'
import { mapPostgrestError, repoFail, repoOk, unavailableResult, type RepoResult } from './errors'

type CollectionUpdate = Database['public']['Tables']['collections']['Update']
type ItemUpdate = Database['public']['Tables']['items']['Update']

function clientOrUnavailable() {
  const supabase = getSupabase()
  if (!supabase) {
    return { supabase: null as null, fail: unavailableResult() }
  }
  return { supabase, fail: null as null }
}

export type CloudCollectionInput = {
  title: string
  description?: string
  categoryId: string
  subcategoryId?: string
  tags?: string[]
  coverPath?: string | null
}

export type CloudItemInput = {
  collectionId: string
  title: string
  categoryId: string
  subcategoryId?: string
  tags?: string[]
  story?: string
  provenance?: string
  condition?: ObjectCondition
  status?: ObjectStatus
  coverPath?: string | null
  year?: string
  maker?: string
  author?: string
  publisher?: string
  issuer?: string
  manufacturer?: string
  country?: string
  model?: string
  acquisitionYear?: string
  acquisitionPlace?: string
  note?: string
}

const PAGE_SIZE = 200

export async function listOwnCollections(ownerId: string, signal?: AbortSignal): Promise<RepoResult<Collection[]>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const rows: CollectionRow[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const query = supabase
      .from('collections')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    const { data, error } = await (signal ? query.abortSignal(signal) : query)
    if (error) {
      const mapped = mapPostgrestError(error.message)
      return repoFail(mapped.code, mapped.message)
    }
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }
  return repoOk(rows.map((row) => mapCollectionRowToCollection(row)))
}

export async function listOwnItems(ownerId: string, signal?: AbortSignal): Promise<RepoResult<CollectibleItem[]>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const rows: ItemRow[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const query = supabase
      .from('items')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    const { data, error } = await (signal ? query.abortSignal(signal) : query)
    if (error) {
      const mapped = mapPostgrestError(error.message)
      return repoFail(mapped.code, mapped.message)
    }
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }
  return repoOk(rows.map(mapItemRowToCollectible))
}

export async function getCloudCollection(id: string): Promise<RepoResult<Collection | null>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const { data, error } = await supabase.from('collections').select('*').eq('id', id).maybeSingle()
  if (error) {
    const mapped = mapPostgrestError(error.message)
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(data ? mapCollectionRowToCollection(data as CollectionRow) : null)
}

export async function createCloudCollection(
  ownerId: string,
  input: CloudCollectionInput,
  signal?: AbortSignal,
): Promise<RepoResult<Collection>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const query = supabase
    .from('collections')
    .insert({
      owner_id: ownerId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      category_id: input.categoryId,
      subcategory_id: input.subcategoryId ?? null,
      tags: input.tags ?? [],
      cover_path: input.coverPath ?? null,
    })
    .select('*')
  const { data, error } = await (signal ? query.abortSignal(signal) : query).single()
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not create collection.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(mapCollectionRowToCollection(data as CollectionRow))
}

export async function updateCloudCollection(
  ownerId: string,
  collectionId: string,
  input: Partial<CloudCollectionInput>,
  signal?: AbortSignal,
): Promise<RepoResult<Collection>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const patch: CollectionUpdate = {}
  if (input.title != null) patch.title = input.title.trim()
  if (input.description != null) patch.description = input.description.trim() || null
  if (input.categoryId != null) patch.category_id = input.categoryId
  if (input.subcategoryId != null) patch.subcategory_id = input.subcategoryId
  if (input.tags != null) patch.tags = input.tags
  if (input.coverPath !== undefined) patch.cover_path = input.coverPath

  const query = supabase.from('collections').update(patch).eq('id', collectionId).eq('owner_id', ownerId).select('*')
  const { data, error } = await (signal ? query.abortSignal(signal) : query).single()
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not update collection.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(mapCollectionRowToCollection(data as CollectionRow))
}

export async function deleteCloudCollection(
  ownerId: string,
  collectionId: string,
  signal?: AbortSignal,
): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const query = supabase.from('collections').delete().eq('id', collectionId).eq('owner_id', ownerId).select('id')
  const { data, error } = await (signal ? query.abortSignal(signal) : query)
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not delete collection.')
    return repoFail(mapped.code, mapped.message)
  }
  if (!data?.length)
    return repoFail('not_found', 'This record is no longer available in your account. Refresh to continue.')
  return repoOk(true)
}

export async function listCollectionItems(collectionId: string): Promise<RepoResult<CollectibleItem[]>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false })
  if (error) {
    const mapped = mapPostgrestError(error.message)
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk((data as ItemRow[]).map(mapItemRowToCollectible))
}

export async function getCloudItem(id: string): Promise<RepoResult<CollectibleItem | null>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const { data, error } = await supabase.from('items').select('*').eq('id', id).maybeSingle()
  if (error) {
    const mapped = mapPostgrestError(error.message)
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(data ? mapItemRowToCollectible(data as ItemRow) : null)
}

export async function createCloudItem(
  ownerId: string,
  input: CloudItemInput,
  signal?: AbortSignal,
): Promise<RepoResult<CollectibleItem>> {
  if (!input.coverPath) return repoFail('validation', 'Choose a photo before saving this item.')
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const query = supabase
    .from('items')
    .insert({
      owner_id: ownerId,
      collection_id: input.collectionId,
      title: input.title.trim(),
      category_id: input.categoryId,
      subcategory_id: input.subcategoryId ?? null,
      tags: input.tags ?? [],
      story: input.story ?? null,
      provenance: input.provenance ?? null,
      condition: input.condition ?? null,
      status: input.status ?? null,
      metadata: collectibleMetadataForInsert(input),
      cover_path: input.coverPath ?? null,
    })
    .select('*')
  const { data, error } = await (signal ? query.abortSignal(signal) : query).single()
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not create item.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(mapItemRowToCollectible(data as ItemRow))
}

export async function updateCloudItem(
  ownerId: string,
  itemId: string,
  input: Partial<CloudItemInput>,
  signal?: AbortSignal,
): Promise<RepoResult<CollectibleItem>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const patch: ItemUpdate = {}
  if (input.title != null) patch.title = input.title.trim()
  if (input.collectionId != null) patch.collection_id = input.collectionId
  if (input.categoryId != null) patch.category_id = input.categoryId
  if (input.subcategoryId != null) patch.subcategory_id = input.subcategoryId
  if (input.tags != null) patch.tags = input.tags
  if (input.story != null) patch.story = input.story
  if (input.provenance != null) patch.provenance = input.provenance
  if (input.condition != null) patch.condition = input.condition
  if (input.status != null) patch.status = input.status
  if (input.coverPath !== undefined) patch.cover_path = input.coverPath
  if (
    input.year != null ||
    input.maker != null ||
    input.author != null ||
    input.publisher != null ||
    input.issuer != null ||
    input.manufacturer != null ||
    input.country != null ||
    input.model != null ||
    input.acquisitionYear != null ||
    input.acquisitionPlace != null ||
    input.note != null
  ) {
    // The hardening migration merges this patch atomically with stored metadata.
    patch.metadata = collectibleMetadataForInsert(input)
  }

  const query = supabase.from('items').update(patch).eq('id', itemId).eq('owner_id', ownerId).select('*')
  const { data, error } = await (signal ? query.abortSignal(signal) : query).single()
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not update item.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(mapItemRowToCollectible(data as ItemRow))
}

export async function deleteCloudItem(
  ownerId: string,
  itemId: string,
  signal?: AbortSignal,
): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const query = supabase.from('items').delete().eq('id', itemId).eq('owner_id', ownerId).select('id')
  const { data, error } = await (signal ? query.abortSignal(signal) : query)
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not delete item.')
    return repoFail(mapped.code, mapped.message)
  }
  if (!data?.length)
    return repoFail('not_found', 'This record is no longer available in your account. Refresh to continue.')
  return repoOk(true)
}
