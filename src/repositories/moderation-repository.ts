import { getSupabase } from '../lib/supabase'
import { mapPostgrestError, repoFail, repoOk, unavailableResult, type RepoResult } from './errors'

export type ReportTargetType = 'profile' | 'collection' | 'item' | 'comment' | 'conversation' | 'message'
export type ReportReason = 'spam' | 'harassment' | 'hate' | 'sexual' | 'violence' | 'illegal' | 'other'

function clientOrUnavailable() {
  const supabase = getSupabase()
  if (!supabase) return { supabase: null as null, fail: unavailableResult() }
  return { supabase, fail: null as null }
}

export async function reportContent(input: {
  reporterId: string
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  details?: string
}): Promise<RepoResult<true>> {
  const details = input.details?.trim()
  if (details && details.length > 1000) return repoFail('validation', 'Report details cannot exceed 1,000 characters.')
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const { error } = await supabase.from('content_reports').insert({
    reporter_id: input.reporterId,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    details: details || null,
    status: 'pending',
  })
  if (error) {
    if (error.message.toLowerCase().includes('duplicate'))
      return repoFail('conflict', 'You already reported this content.')
    const mapped = mapPostgrestError(error.message, 'Could not submit this report.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}

export async function blockCollector(blockerId: string, blockedId: string): Promise<RepoResult<true>> {
  if (blockerId === blockedId) return repoFail('validation', 'You cannot block your own account.')
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const { error } = await supabase.from('user_blocks').insert({ blocker_id: blockerId, blocked_id: blockedId })
  if (error) {
    if (error.message.toLowerCase().includes('duplicate')) return repoOk(true)
    const mapped = mapPostgrestError(error.message, 'Could not block this collector.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}

export async function unblockCollector(blockerId: string, blockedId: string): Promise<RepoResult<true>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const { error } = await supabase.from('user_blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId)
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not unblock this collector.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(true)
}

export async function listBlockedCollectorIds(blockerId: string): Promise<RepoResult<string[]>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) return fail
  const { data, error } = await supabase.from('user_blocks').select('blocked_id').eq('blocker_id', blockerId)
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not load blocked collectors.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk((data ?? []).map((row) => row.blocked_id))
}
