/**
 * Backend configuration helpers (pure — no network).
 * Missing env → local/demo mode; never invent credentials.
 */

export type BackendConfig = {
  url: string
  anonKey: string
}

export function readSupabaseEnv(): BackendConfig | null {
  const url = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim()
  const anonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

  if (!url || !anonKey) {
    return null
  }
  if (url.includes('your-project-ref') || anonKey.includes('your-anon')) {
    return null
  }
  return { url, anonKey }
}

export function isBackendConfigured(): boolean {
  return readSupabaseEnv() != null
}
