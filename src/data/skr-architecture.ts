/**
 * Future SKR utility — architectural note only (Phase 2G).
 *
 * Seekase will not implement speculative SKR rewards, pay-to-like, farming,
 * or fake balances. If SKR is integrated later, prefer meaningful collector
 * utility such as:
 * - SKR-backed community exhibition curation
 * - collector challenge sponsorship
 * - curator-access signals for special cabinets
 *
 * Any future adapter must keep wallet identity private and never gate core
 * collecting UX behind token holdings.
 */

export const SKR_INTEGRATION_STATUS = 'deferred' as const

export const SKR_FUTURE_CONCEPTS = [
  'SKR-backed collector curation',
  'community exhibition voting',
  'curator access for special cabinets',
  'collector challenge sponsorship',
] as const
