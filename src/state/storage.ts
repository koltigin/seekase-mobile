import AsyncStorage from '@react-native-async-storage/async-storage'

const PREFIX = 'seekase.v2a.'

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export async function writeJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export async function removeKey(key: string) {
  await AsyncStorage.removeItem(PREFIX + key)
}
