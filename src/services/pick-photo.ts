import * as ImagePicker from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { toByteArray } from 'react-native-quick-base64'
import { PHOTO_EDGE, stripPhotoMetadata } from '../data/photo-policy'

export type PhotoDraft = { uri: string; bytes: Uint8Array; id: string }

/** Local preparation only. No network, photo-library-wide permission, or upload. */
export async function pickPhoto(): Promise<PhotoDraft | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    exif: false,
    quality: 1,
  })
  if (result.canceled || !result.assets[0]) return null
  const asset = result.assets[0]
  const context = ImageManipulator.manipulate(asset.uri)
  if (Math.max(asset.width, asset.height) > PHOTO_EDGE) {
    context.resize(asset.width >= asset.height ? { width: PHOTO_EDGE } : { height: PHOTO_EDGE })
  }
  const rendered = await context.renderAsync()
  try {
    const prepared = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.72, base64: true })
    if (!prepared.base64) throw new Error('Could not prepare this photo. Please choose another one.')
    return {
      uri: prepared.uri,
      bytes: stripPhotoMetadata(toByteArray(prepared.base64)),
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`,
    }
  } finally {
    rendered.release()
    context.release()
  }
}
