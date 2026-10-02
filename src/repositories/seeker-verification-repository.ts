import { getSupabase } from '../lib/supabase'
import { repoFail, repoOk, type RepoResult } from './errors'
import { functionErrorMessage } from './daily-checkin-repository'

export type StoredSeekerVerification = {
  status: 'unknown' | 'verified' | 'not_verified'
  checkedAt: string | null
  expiresAt: string | null
}

function validStatusPayload(value: unknown): value is StoredSeekerVerification {
  if (!value || typeof value !== 'object') return false
  const payload = value as Record<string, unknown>
  if (!['unknown', 'verified', 'not_verified'].includes(String(payload.status))) return false
  if (payload.checkedAt !== null && typeof payload.checkedAt !== 'string') return false
  if (payload.expiresAt !== null && typeof payload.expiresAt !== 'string') return false
  return true
}

async function invoke(body: Record<string, unknown>): Promise<RepoResult<StoredSeekerVerification>> {
  const supabase = getSupabase()
  if (!supabase) return repoFail('unavailable', 'Account service is unavailable in this build.')
  const { data, error } = await supabase.functions.invoke('seeker-verification', { body })
  if (error) {
    return repoFail('network', await functionErrorMessage(error, 'Could not check Seeker Genesis Token eligibility.'))
  }
  if (!validStatusPayload(data)) {
    return repoFail('validation', 'Seeker verification returned an invalid response. Please try again.')
  }
  return repoOk(data)
}

export function getStoredSeekerVerification() {
  return invoke({ action: 'status' })
}

export function verifyStoredSeekerEligibility(walletAddress: string) {
  return invoke({ action: 'verify', address: walletAddress })
}
