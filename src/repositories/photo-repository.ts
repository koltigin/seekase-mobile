import { getSupabase } from '../lib/supabase'
import { MAX_PHOTO_BYTES, ownedPhotoPath, PHOTO_BUCKET } from '../data/photo-policy'

/** Called only inside an authenticated, explicit Save action. */
export async function uploadItemPhoto(ownerId: string, id: string, bytes: Uint8Array, signal?: AbortSignal) {
  const path = `${ownerId}/${id}.jpg`
  if (!ownedPhotoPath(path, ownerId) || bytes.length === 0 || bytes.length > MAX_PHOTO_BYTES)
    throw new Error('Invalid photo. Please select it again.')
  if (signal?.aborted) throw new Error('Request cancelled.')
  const client = getSupabase()
  if (!client) throw new Error('Account storage is unavailable.')
  const { data, error } = await client.auth.getUser()
  if (error || data.user?.id !== ownerId) throw new Error('Your account changed. Please sign in again.')
  if (signal?.aborted) throw new Error('Request cancelled.')
  // The SDK upload is not abortable; check again before saving the catalog row.
  const response = await client.storage
    .from(PHOTO_BUCKET)
    .upload(path, new Uint8Array(bytes).buffer, { contentType: 'image/jpeg', upsert: false })
  if (response.error && 'statusCode' in response.error && String(response.error.statusCode) === '409') {
    // A previous upload may have succeeded while its response was lost.
    // Reuse only an exact byte match; never overwrite a conflicting photo.
    if (signal?.aborted) throw new Error('Request cancelled.')
    const existing = await client.storage.from(PHOTO_BUCKET).download(path)
    if (!existing.error && existing.data) {
      const stored = new Uint8Array(await readPhotoBytes(existing.data))
      if (signal?.aborted) throw new Error('Request cancelled.')
      if (stored.length === bytes.length && stored.every((value, index) => value === bytes[index])) return path
    }
  }
  if (response.error)
    throw new Error(
      'Photo upload could not be confirmed. Your details are still here. Storage may not be ready; refresh before retrying.',
    )
  if (signal?.aborted) throw new Error('Request cancelled.')
  return path
}

export async function signedItemPhoto(path: string) {
  const client = getSupabase()
  if (!client) throw new Error('Photo unavailable.')
  const { data, error } = await client.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) throw new Error('Photo unavailable. Tap to retry.')
  return data.signedUrl
}

// React Native Blob does not expose arrayBuffer(); FileReader does.
function readPhotoBytes(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      reader.result instanceof ArrayBuffer ? resolve(reader.result) : reject(new Error('Photo could not be checked.'))
    reader.onerror = () => reject(new Error('Photo could not be checked.'))
    reader.readAsArrayBuffer(blob)
  })
}
