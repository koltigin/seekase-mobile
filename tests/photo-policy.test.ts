import { describe, expect, it } from 'vitest'
import { MAX_PHOTO_BYTES, ownedPhotoPath, stripPhotoMetadata } from '../src/data/photo-policy'

const soi = [255, 216]
const end = [255, 218, 0, 2, 13, 14, 255, 217]
describe('photo preparation', () => {
  it('removes EXIF, IPTC and comments while retaining decoding data', () => {
    const jpeg = new Uint8Array([
      ...soi,
      255,
      225,
      0,
      4,
      1,
      2,
      255,
      237,
      0,
      3,
      3,
      255,
      254,
      0,
      3,
      4,
      255,
      219,
      0,
      3,
      5,
      ...end,
    ])
    expect([...stripPhotoMetadata(jpeg)]).toEqual([...soi, 255, 219, 0, 3, 5, ...end])
  })
  it('rejects corrupt input and oversized prepared bytes', () => {
    expect(() => stripPhotoMetadata(new Uint8Array([1, 2, 3]))).toThrow()
    expect(() => stripPhotoMetadata(new Uint8Array([...soi, 255, 225, 0, 10]))).toThrow()
    const oversized = new Uint8Array(MAX_PHOTO_BYTES + 1)
    oversized.set([...soi, 255, 218])
    expect(() => stripPhotoMetadata(oversized)).toThrow('too large')
  })
  it('restricts upload paths to the owner and rejects traversal', () => {
    expect(ownedPhotoPath('account-a/photo-1.jpg', 'account-a')).toBe(true)
    expect(ownedPhotoPath('account-b/photo-1.jpg', 'account-a')).toBe(false)
    expect(ownedPhotoPath('account-a/../photo.jpg', 'account-a')).toBe(false)
  })
})
