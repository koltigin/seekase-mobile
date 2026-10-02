/**
 * Local-first vs cloud catalog strategy (Phase 2H).
 *
 * LOCAL MODE (default without backend, or guest/demo):
 * - `src/data/local-catalog.ts` + `useCatalog` + AppState AsyncStorage
 * - local IDs: `local-col-*`, `local-item-*`
 * - social / activity / progress remain device-local
 *
 * AUTHENTICATED CLOUD MODE (initial Phase 2I milestone):
 * - repositories under `src/repositories/*` talk to Supabase when configured
 * - `/cloud-collections` explicitly reads/writes account-owned records
 * - existing local screens/social state stay separate; no implicit migration
 * - account-scoped queries/drafts are discarded on sign-out/account change
 *
 * NOT in Phase 2H:
 * - bidirectional offline sync
 * - Realtime subscriptions
 * - automatic local→cloud migration
 * - server-side Activity / achievements
 */

export const CATALOG_DATA_MODE = {
  local: 'local',
  cloudFoundation: 'cloud_foundation',
} as const

export type CatalogDataMode = (typeof CATALOG_DATA_MODE)[keyof typeof CATALOG_DATA_MODE]
