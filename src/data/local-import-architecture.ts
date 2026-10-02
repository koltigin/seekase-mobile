/**
 * Local → cloud catalog import — deferred (Phase 2H).
 *
 * Existing AsyncStorage collections/items (`local-col-*` / `local-item-*`)
 * must NOT be silently uploaded or deleted when a user signs in.
 *
 * Future flow (not implemented):
 * 1. User opts in from Account / Settings: “Import local collection data to account”
 * 2. Map local records → cloud repository create operations
 * 3. Preserve local copies until user confirms success
 * 4. Never overwrite cloud cabinets without explicit consent
 */

export const LOCAL_CATALOG_IMPORT_STATUS = 'deferred' as const

export type LocalCatalogImportPlan = {
  status: typeof LOCAL_CATALOG_IMPORT_STATUS
  summary: string
}

export function describeLocalCatalogImport(): LocalCatalogImportPlan {
  return {
    status: LOCAL_CATALOG_IMPORT_STATUS,
    summary:
      'Importing device-local cabinets into a Seekase account is opt-in and not automatic. Cloud sync of existing local data remains deferred.',
  }
}
