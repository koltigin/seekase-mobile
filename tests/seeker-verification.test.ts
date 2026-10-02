import { describe, expect, it } from 'vitest'
import {
  SEEKER_VERIFICATION_AVAILABLE,
  seekerVerificationLabel,
  shouldShowPublicSeekerBadge,
  verifySeekerCollector,
} from '../src/services/seeker-verification'

describe('Seeker verification development guard', () => {
  it('does not claim genuine verification is available in this build', () => {
    expect(SEEKER_VERIFICATION_AVAILABLE).toBe(false)
    expect(seekerVerificationLabel('unknown')).toBe('Not checked')
    expect(seekerVerificationLabel('unavailable')).toBe('Not available in this build')
  })

  it('returns unavailable on Devnet instead of fabricating a result', async () => {
    const result = await verifySeekerCollector('private-wallet-address', { cluster: 'devnet' })
    expect(result.status).toBe('unavailable')
    expect(shouldShowPublicSeekerBadge(result.status)).toBe(false)
  })

  it('shows a public badge only for a genuine verified result', () => {
    expect(shouldShowPublicSeekerBadge('verified')).toBe(true)
    expect(shouldShowPublicSeekerBadge('unknown')).toBe(false)
    expect(shouldShowPublicSeekerBadge('not_verified')).toBe(false)
    expect(shouldShowPublicSeekerBadge('error')).toBe(false)
  })
})
