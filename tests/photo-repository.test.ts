import { beforeEach, expect, it, vi } from 'vitest'
import { uploadItemPhoto, signedItemPhoto } from '../src/repositories/photo-repository'
import { getSupabase } from '../src/lib/supabase'
vi.mock('../src/lib/supabase', () => ({ getSupabase: vi.fn() }))
const upload = vi.fn()
const download = vi.fn()
const createSignedUrl = vi.fn()
const getUser = vi.fn()
beforeEach(() => {
  vi.resetAllMocks()
  getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null })
  upload.mockResolvedValue({ error: null })
  vi.mocked(getSupabase).mockReturnValue({
    auth: { getUser },
    storage: { from: () => ({ upload, download, createSignedUrl }) },
  } as unknown as NonNullable<ReturnType<typeof getSupabase>>)
})
it('uploads binary JPEG without overwriting existing files', async () => {
  expect(await uploadItemPhoto('owner', 'photo', new Uint8Array([255, 216, 255, 217]))).toBe('owner/photo.jpg')
  expect(upload).toHaveBeenCalledWith('owner/photo.jpg', expect.any(ArrayBuffer), {
    contentType: 'image/jpeg',
    upsert: false,
  })
})
it('blocks account switches before upload', async () => {
  getUser.mockResolvedValue({ data: { user: { id: 'other' } }, error: null })
  await expect(uploadItemPhoto('owner', 'photo', new Uint8Array([1]))).rejects.toThrow('account changed')
  expect(upload).not.toHaveBeenCalled()
})
it('does not retry failed uploads', async () => {
  upload.mockResolvedValue({ error: { message: 'Offline' } })
  await expect(uploadItemPhoto('owner', 'photo', new Uint8Array([1]))).rejects.toThrow('could not be confirmed')
  expect(upload).toHaveBeenCalledTimes(1)
})
it('rejects completion after sign-out cancellation', async () => {
  const controller = new AbortController()
  upload.mockImplementation(async () => {
    controller.abort()
    return { error: null }
  })
  await expect(uploadItemPhoto('owner', 'photo', new Uint8Array([1]), controller.signal)).rejects.toThrow('cancelled')
})
it('resolves short-lived photo links', async () => {
  createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://example.test/signed' }, error: null })
  expect(await signedItemPhoto('owner/photo.jpg')).toBe('https://example.test/signed')
  expect(createSignedUrl).toHaveBeenCalledWith('owner/photo.jpg', 3600)
})

it('recovers a lost upload response only when stored bytes match', async () => {
  upload.mockResolvedValue({ error: { statusCode: '409' } })
  download.mockResolvedValue({ data: new Blob([new Uint8Array([1, 2, 3])]), error: null })
  expect(await uploadItemPhoto('owner', 'photo', new Uint8Array([1, 2, 3]))).toBe('owner/photo.jpg')
  expect(upload).toHaveBeenCalledTimes(1)
})
it('does not reuse or overwrite a conflicting file', async () => {
  upload.mockResolvedValue({ error: { statusCode: '409' } })
  download.mockResolvedValue({ data: new Blob([new Uint8Array([9, 9, 9])]), error: null })
  await expect(uploadItemPhoto('owner', 'photo', new Uint8Array([1, 2, 3]))).rejects.toThrow('could not be confirmed')
  expect(upload).toHaveBeenCalledTimes(1)
})

it('checks existing photos using FileReader on React Native', async () => {
  upload.mockResolvedValue({ error: { statusCode: '409' } })
  download.mockResolvedValue({ data: {}, error: null })
  class NativeReader {
    result = new Uint8Array([1, 2, 3]).buffer
    onload?: () => void
    readAsArrayBuffer() {
      this.onload?.()
    }
  }
  vi.stubGlobal('FileReader', NativeReader)
  try {
    expect(await uploadItemPhoto('owner', 'photo', new Uint8Array([1, 2, 3]))).toBe('owner/photo.jpg')
  } finally {
    vi.unstubAllGlobals()
  }
})
