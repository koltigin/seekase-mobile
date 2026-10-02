import { getSupabase } from '../lib/supabase'
import type { CommentRow, ProfileRow } from '../types/database'
import { mapPostgrestError, repoFail, repoOk, unavailableResult, type RepoResult } from './errors'

export type CommentTarget =
  | { kind: 'collection'; id: string }
  | { kind: 'item'; id: string }

export type CloudComment = {
  id: string
  authorId: string
  authorName: string
  authorHandle: string
  body: string
  createdAt: string
}

function clientOrUnavailable() {
  const supabase = getSupabase()
  if (!supabase) return { supabase: null as null, fail: unavailableResult() }
  return { supabase, fail: null as null }
}

function targetColumn(target: CommentTarget) {
  return target.kind === 'collection' ? 'collection_id' : 'item_id'
}

export async function listComments(target: CommentTarget): Promise<RepoResult<CloudComment[]>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq(targetColumn(target), target.id)
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not load comments.')
    return repoFail(mapped.code, mapped.message)
  }

  const rows = data as CommentRow[]
  const authorIds = [...new Set(rows.map((row) => row.author_id))]
  let profiles: Pick<ProfileRow, 'id' | 'display_name' | 'handle'>[] = []
  if (authorIds.length) {
    const profileResult = await supabase.from('profiles').select('id, display_name, handle').in('id', authorIds)
    if (profileResult.error) {
      const mapped = mapPostgrestError(profileResult.error.message, 'Could not load comment authors.')
      return repoFail(mapped.code, mapped.message)
    }
    profiles = profileResult.data
  }
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]))
  return repoOk(
    rows.map((row) => {
      const profile = profileById.get(row.author_id)
      return {
        id: row.id,
        authorId: row.author_id,
        authorName: profile?.display_name ?? 'Collector',
        authorHandle: profile?.handle ?? 'collector',
        body: row.body,
        createdAt: row.created_at,
      }
    }),
  )
}

export async function createComment(
  authorId: string,
  target: CommentTarget,
  body: string,
): Promise<RepoResult<CommentRow>> {
  const trimmed = body.trim()
  if (!trimmed || trimmed.length > 1000) return repoFail('validation', 'Comment must be between 1 and 1,000 characters.')
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const { data, error } = await supabase
    .from('comments')
    .insert({
      author_id: authorId,
      collection_id: target.kind === 'collection' ? target.id : null,
      item_id: target.kind === 'item' ? target.id : null,
      body: trimmed,
    })
    .select('*')
    .single()
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not post comment.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(data as CommentRow)
}

export async function deleteComment(authorId: string, commentId: string): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const { data, error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', authorId)
    .select('id')
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not delete comment.')
    return repoFail(mapped.code, mapped.message)
  }
  if (!data?.length) return repoFail('not_found', 'This comment is no longer available.')
  return repoOk(true)
}
