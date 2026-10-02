import { getSupabase } from '../lib/supabase'
import type { DailyCheckInStatus } from '../data/daily-checkin'
import { repoFail, repoOk, type RepoResult } from './errors'
import { SEEKASE_SOLANA_NETWORK, type SeekaseSolanaNetwork } from '../data/solana-network'

export async function functionErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'context' in error && error.context && typeof error.context === 'object') {
    try {
      const context = error.context as { clone?: () => unknown; json?: () => Promise<unknown> }
      const readable = typeof context.clone === 'function' ? context.clone() : context
      if (!readable || typeof readable !== 'object' || !('json' in readable) || typeof readable.json !== 'function') {
        throw new Error('Function response body is unavailable.')
      }
      const body = (await readable.json()) as { error?: unknown }
      if (typeof body.error === 'string' && body.error.trim()) return body.error
    } catch {
      // Fall through to the SDK message when the response is not JSON.
    }
  }
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return fallback
}

export async function getDailyCheckInStatus(): Promise<RepoResult<DailyCheckInStatus>> {
  const supabase = getSupabase()
  if (!supabase) return repoFail('unavailable', 'Account service is unavailable in this build.')
  const { data, error } = await supabase.functions.invoke('daily-checkin', { body: { action: 'status' } })
  if (error) return repoFail('network', await functionErrorMessage(error, 'Could not load daily check-in status.'))
  if (
    typeof data?.checkedInToday !== 'boolean' ||
    typeof data?.currentStreak !== 'number' ||
    typeof data?.longestStreak !== 'number' ||
    typeof data?.totalCheckIns !== 'number'
  ) {
    return repoFail('validation', 'Daily check-in status was invalid. Please try again.')
  }
  return repoOk(data as DailyCheckInStatus)
}

export async function requestDailyCheckIn(walletAddress: string): Promise<
  RepoResult<{ requestId: string; memo: string; network: SeekaseSolanaNetwork }>
> {
  const supabase = getSupabase()
  if (!supabase) return repoFail('unavailable', 'Account service is unavailable in this build.')
  const { data, error } = await supabase.functions.invoke('daily-checkin', {
    body: { action: 'request', walletAddress },
  })
  if (error) return repoFail('network', await functionErrorMessage(error, 'Could not prepare daily check-in.'))
  if (
    typeof data?.requestId !== 'string' ||
    typeof data?.memo !== 'string' ||
    data?.network !== SEEKASE_SOLANA_NETWORK
  ) {
    return repoFail('validation', 'Daily check-in request was invalid. Please try again.')
  }
  return repoOk({ requestId: data.requestId, memo: data.memo, network: SEEKASE_SOLANA_NETWORK })
}

export async function confirmDailyCheckIn(args: {
  requestId: string
  transactionSignature: string
}): Promise<RepoResult<DailyCheckInStatus>> {
  const supabase = getSupabase()
  if (!supabase) return repoFail('unavailable', 'Account service is unavailable in this build.')
  const { data, error } = await supabase.functions.invoke('daily-checkin', {
    body: { action: 'confirm', requestId: args.requestId, transactionSignature: args.transactionSignature },
  })
  if (error) return repoFail('network', await functionErrorMessage(error, 'Could not verify daily check-in.'))
  if (data?.verified !== true || typeof data?.status !== 'object') {
    return repoFail('validation', 'Daily check-in confirmation was invalid. Please try again.')
  }
  return repoOk(data.status as DailyCheckInStatus)
}
