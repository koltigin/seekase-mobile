import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isBackendConfigured, readSupabaseEnv } from './backend-config'
import type { Database } from '../types/database'

export type SeekaseSupabase = SupabaseClient<Database>

let client: SeekaseSupabase | null | undefined

/**
 * Single shared Supabase client.
 * Returns null when env is missing/placeholder — app stays in local/demo mode.
 */
export function getSupabase(): SeekaseSupabase | null {
  if (client !== undefined) {
    return client
  }

  const config = readSupabaseEnv()
  if (!config) {
    client = null
    return null
  }

  client = createClient<Database>(config.url, config.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
  return client
}

export function isSupabaseAvailable(): boolean {
  return isBackendConfigured() && getSupabase() != null
}

export type BackendAvailability = 'configured' | 'unavailable'

export function getBackendAvailability(): BackendAvailability {
  return isSupabaseAvailable() ? 'configured' : 'unavailable'
}
