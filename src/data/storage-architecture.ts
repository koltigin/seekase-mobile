/** Account item-photo support is coded; hosted Storage setup/live verification is pending.
 * Avatars, collection-cover uploads and durable local-photo support remain deferred.
 */
export const STORAGE_INTEGRATION_STATUS = 'item-photos-pending-hosted-setup' as const
export const PLANNED_STORAGE_BUCKETS = ['avatars', 'collection-covers', 'item-images'] as const
