import { getSupabase } from '../lib/supabase'
import { ensureProfile } from './profile-repository'
import { repoFail, repoOk, unavailableResult, type RepoResult } from './errors'

/** This guard does not upload any device-local profile, catalog or wallet data. */
export async function requireCloudAccount(ownerId: string, signal?: AbortSignal): Promise<RepoResult<true>> {
  const supabase = getSupabase()
  if (!supabase) return unavailableResult()
  if (signal?.aborted) return repoFail('network', 'Request cancelled.')
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user || data.user.id !== ownerId) {
    return repoFail('unauthenticated', 'Your account changed or your session expired. Sign in again to continue.')
  }
  if (signal?.aborted) return repoFail('network', 'Request cancelled.')
  const versionQuery = supabase.rpc('catalog_schema_version')
  const version = await (signal ? versionQuery.abortSignal(signal) : versionQuery)
  if (version.error || version.data !== 2) {
    return repoFail(
      'unavailable',
      'Account collections are not ready yet. Your device collections are still available.',
    )
  }
  if (signal?.aborted) return repoFail('network', 'Request cancelled.')
  const profile = await ensureProfile({
    userId: data.user.id,
    email: data.user.email,
    displayName:
      typeof data.user.user_metadata?.display_name === 'string' ? data.user.user_metadata.display_name : undefined,
    handle: typeof data.user.user_metadata?.handle === 'string' ? data.user.user_metadata.handle : undefined,
  })
  if (!profile.ok) return profile
  if (signal?.aborted) return repoFail('network', 'Request cancelled.')
  return repoOk(true)
}
