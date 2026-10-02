export const PHOTO_BUCKET = 'item-images'
export const MAX_PHOTO_BYTES = 6 * 1024 * 1024
export const PHOTO_EDGE = 1600

/** Drop EXIF/XMP/IPTC/comments from re-encoded JPEGs before any upload. */
export function stripPhotoMetadata(bytes: Uint8Array): Uint8Array {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Please select a valid photo.')
  const chunks = [bytes.slice(0, 2)]
  let offset = 2
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error('Could not prepare this photo.')
    const marker = bytes[offset + 1]
    if (marker === 0xda || marker === 0xd9) {
      chunks.push(bytes.slice(offset))
      const result = new Uint8Array(chunks.reduce((sum, part) => sum + part.length, 0))
      let position = 0
      for (const chunk of chunks) {
        result.set(chunk, position)
        position += chunk.length
      }
      if (result.length > MAX_PHOTO_BYTES) throw new Error('Photo is too large. Please choose a smaller image.')
      return result
    }
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
    if (length < 2 || offset + 2 + length > bytes.length) throw new Error('Could not prepare this photo.')
    if (marker !== 0xe1 && marker !== 0xed && marker !== 0xfe) chunks.push(bytes.slice(offset, offset + 2 + length))
    offset += 2 + length
  }
  throw new Error('Could not prepare this photo.')
}

export function ownedPhotoPath(path: string, ownerId: string) {
  return path.startsWith(`${ownerId}/`) && /^[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\.jpg$/.test(path)
}
