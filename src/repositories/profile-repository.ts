import { getSupabase } from '../lib/supabase'
import {
  mapProfileRowToEditable,
  normalizeHandle,
  suggestHandleFromEmail,
  type CloudProfileFields,
} from '../data/mappers/cloud-mappers'
import type { Database, ProfileRow } from '../types/database'
import { mapPostgrestError, repoFail, repoOk, unavailableResult, type RepoResult } from './errors'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type EnsureProfileInput = {
  userId: string
  email?: string | null
  displayName?: string
  handle?: string
}

export function isInternalWalletProfile(profile: Pick<ProfileRow, 'handle' | 'display_name'>): boolean {
  return /^wallet[0-9a-f]{20,}$/u.test(profile.handle) || /^wallet[0-9a-f]{20,}$/u.test(profile.display_name)
}

function clientOrUnavailable() {
  const supabase = getSupabase()
  if (!supabase) {
    return { supabase: null as null, fail: unavailableResult() }
  }
  return { supabase, fail: null as null }
}

export async function getProfileById(userId: string): Promise<RepoResult<ProfileRow | null>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) {
    return repoFail(mapPostgrestError(error.message).code, mapPostgrestError(error.message).message)
  }
  return repoOk(data)
}

export async function ensureProfile(input: EnsureProfileInput): Promise<RepoResult<ProfileRow>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }

  const existing = await getProfileById(input.userId)
  if (!existing.ok) {
    return existing
  }
  if (existing.data) {
    return repoOk(existing.data)
  }

  const baseHandle =
    normalizeHandle(input.handle ?? '') ||
    suggestHandleFromEmail(input.email ?? 'collector@seekase.local')
  const displayName = input.displayName?.trim() || baseHandle

  const tryInsert = async (handle: string) =>
    supabase
      .from('profiles')
      .insert({
        id: input.userId,
        handle,
        display_name: displayName,
        bio: '',
        location_text: null,
        avatar_path: null,
      })
      .select('*')
      .single()

  let { data, error } = await tryInsert(baseHandle)

  if (!error && data) {
    return repoOk(data)
  }

  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not create profile.')
    // Race: profile created for this user elsewhere — re-fetch.
    if (mapped.code === 'conflict') {
      const again = await getProfileById(input.userId)
      if (again.ok && again.data) {
        return repoOk(again.data)
      }
      // Handle taken by another user — one graceful retry with a short suffix.
      const suffix = Math.random().toString(36).slice(2, 6)
      const fallback = normalizeHandle(`${baseHandle.slice(0, 25)}_${suffix}`) || `collector_${suffix}`
      const retry = await tryInsert(fallback)
      if (!retry.error && retry.data) {
        return repoOk(retry.data)
      }
      const retryExisting = await getProfileById(input.userId)
      if (retryExisting.ok && retryExisting.data) {
        return repoOk(retryExisting.data)
      }
      if (retry.error) {
        const againMapped = mapPostgrestError(retry.error.message, 'Could not create profile.')
        return repoFail(againMapped.code, againMapped.message)
      }
    }
    return repoFail(mapped.code, mapped.message)
  }

  return repoFail('unknown', 'Could not create profile.')
}

export async function updateCloudProfile(
  userId: string,
  patch: {
    displayName?: string
    handle?: string
    bio?: string
    location?: string
    avatarPath?: string | null
    socials?: Partial<Record<'instagram' | 'youtube' | 'tiktok' | 'x' | 'website', string>>
  },
): Promise<RepoResult<ProfileRow>> {
  const { supabase, fail } = clientOrUnavailable()
  if (!supabase) {
    return fail
  }

  const update: ProfileUpdate = {}
  if (patch.displayName != null) {
    update.display_name = patch.displayName.trim()
  }
  if (patch.handle != null) {
    update.handle = normalizeHandle(patch.handle)
  }
  if (patch.bio != null) {
    update.bio = patch.bio
  }
  if (patch.location != null) {
    update.location_text = patch.location.trim() || null
  }
  if (patch.avatarPath !== undefined) {
    update.avatar_path = patch.avatarPath
  }
  if (patch.socials != null) {
    update.social_links = Object.fromEntries(
      Object.entries(patch.socials).filter((entry): entry is [string, string] => Boolean(entry[1])),
    )
  }

  const { data, error } = await supabase.from('profiles').update(update).eq('id', userId).select('*').single()
  if (error) {
    const mapped = mapPostgrestError(error.message, 'Could not update profile.')
    return repoFail(mapped.code, mapped.message)
  }
  return repoOk(data)
}

export function profileRowToCloudFields(row: ProfileRow): CloudProfileFields {
  return mapProfileRowToEditable(row)
}
