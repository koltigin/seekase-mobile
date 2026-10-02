import { MAX_PHOTO_BYTES } from '../data/photo-policy'
import { getSupabase } from '../lib/supabase'

export const AVATAR_BUCKET = 'avatars'

export async function uploadAvatarPhoto(ownerId: string, photoId: string, bytes: Uint8Array) {
  if (!bytes.length || bytes.length > MAX_PHOTO_BYTES) throw new Error('Invalid photo. Please select it again.')
  const client = getSupabase()
  if (!client) throw new Error('Account storage is unavailable.')
  const { data, error } = await client.auth.getUser()
  if (error || data.user?.id !== ownerId) throw new Error('Your account changed. Please sign in again.')
  const safeId = photoId.replace(/[^a-zA-Z0-9-]/gu, '')
  const path = `${ownerId}/${safeId}.jpg`
  const uploaded = await client.storage
    .from(AVATAR_BUCKET)
    .upload(path, new Uint8Array(bytes).buffer, { contentType: 'image/jpeg', upsert: false })
  if (uploaded.error) throw new Error('Profile photo could not be uploaded. Please try again.')
  return path
}

export async function deleteAvatarPhoto(path: string) {
  const client = getSupabase()
  if (!client) return
  await client.storage.from(AVATAR_BUCKET).remove([path])
}

export async function signedAvatarPhoto(path: string) {
  const client = getSupabase()
  if (!client) throw new Error('Profile photo unavailable.')
  const { data, error } = await client.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) throw new Error('Profile photo unavailable.')
  return data.signedUrl
}
