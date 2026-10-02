import { getSupabase } from '../lib/supabase'
import { repoFail, repoOk, type RepoResult } from './errors'

/** Report failures before the UI clears its account session. */
export async function signOutAccount(): Promise<RepoResult<true>> {
  const client = getSupabase()
  if (!client) return repoOk(true)
  try {
    const { error } = await client.auth.signOut()
    if (error) return repoFail('network', 'Could not sign out. Check your connection and try again.')
    return repoOk(true)
  } catch {
    return repoFail('network', 'Could not sign out. Check your connection and try again.')
  }
}

/** Deletes cloud account data only after the user completes explicit in-app confirmation. */
export async function deleteAccountPermanently(): Promise<RepoResult<true>> {
  const client = getSupabase()
  if (!client) return repoFail('unavailable', 'Account deletion is unavailable in this build.')
  try {
    const { data, error } = await client.functions.invoke('delete-account', {
      body: { confirmation: 'DELETE' },
    })
    if (error || data?.deleted !== true) {
      return repoFail('network', 'Your account could not be deleted. Check your connection and try again.')
    }
    await client.auth.signOut({ scope: 'local' })
    return repoOk(true)
  } catch {
    return repoFail('network', 'Your account could not be deleted. Check your connection and try again.')
  }
}
