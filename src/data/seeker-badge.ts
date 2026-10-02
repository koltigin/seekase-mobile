import type { CollectorBadge } from './badges'
import { shouldShowPublicSeekerBadge, type SeekerVerificationStatus } from '../services/seeker-verification'

/** Public-facing Seeker badge — shown only when verification is genuinely verified. */
export const seekerVerifiedCollectorBadge: CollectorBadge = {
  id: 'seeker-genesis',
  label: 'Seeker Genesis',
  description: 'Verified Seeker Genesis Token eligibility without exposing wallet identity.',
  state: 'verified',
  family: 'seeker',
}

/**
 * Derive the public Seeker badge from private verification state.
 * Never stores wallet address on collector models.
 */
export function derivePublicSeekerBadge(status: SeekerVerificationStatus): CollectorBadge | null {
  if (!shouldShowPublicSeekerBadge(status)) {
    return null
  }
  return seekerVerifiedCollectorBadge
}
