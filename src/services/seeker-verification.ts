/**
 * Seeker Genesis Token / Seeker Collector verification.
 *
 * Mainnet verification is performed by a private Edge Function. It checks the
 * official SGT Token-2022 metadata and group extensions, stores only HMAC
 * lookup hashes, and returns a derived status without exposing wallet or mint
 * identity to public Seekase surfaces.
 */

import { SEEKASE_SOLANA_NETWORK } from '../data/solana-network'
import {
  getStoredSeekerVerification,
  verifyStoredSeekerEligibility,
  type StoredSeekerVerification,
} from '../repositories/seeker-verification-repository'

export type SeekerVerificationStatus = 'unknown' | 'checking' | 'verified' | 'not_verified' | 'unavailable' | 'error'

export type SeekerVerificationCluster = 'devnet' | 'mainnet-beta' | 'localnet' | 'unknown'

export type SeekerVerificationResult = {
  status: Exclude<SeekerVerificationStatus, 'checking'>
  checkedAt: string
  reason?: string
  cluster: SeekerVerificationCluster
}

export type VerifySeekerOptions = {
  cluster?: SeekerVerificationCluster
}

/** Devnet must never claim SGT ownership; Mainnet calls the genuine backend adapter. */
export const SEEKER_VERIFICATION_AVAILABLE =
  SEEKASE_SOLANA_NETWORK === 'mainnet' &&
  process.env.EXPO_PUBLIC_SEEKER_VERIFICATION_ENABLED?.trim().toLowerCase() === 'true'

const DEVNET_UNAVAILABLE_REASON = 'Seeker Genesis Token verification is available only on Mainnet.'

function resultFromStored(
  stored: StoredSeekerVerification,
  cluster: SeekerVerificationCluster,
): SeekerVerificationResult {
  return {
    status: stored.status,
    checkedAt: stored.checkedAt ?? new Date().toISOString(),
    cluster,
    reason:
      stored.status === 'verified'
        ? 'This account currently holds a genuine Seeker Genesis Token through its privately linked wallet.'
        : stored.status === 'not_verified'
          ? 'No current Seeker Genesis Token was found in the privately linked wallet.'
          : undefined,
  }
}

export async function loadSeekerVerificationStatus(): Promise<SeekerVerificationResult> {
  const cluster: SeekerVerificationCluster = SEEKASE_SOLANA_NETWORK === 'mainnet' ? 'mainnet-beta' : 'devnet'
  if (cluster !== 'mainnet-beta') {
    return { status: 'unavailable', checkedAt: new Date().toISOString(), cluster, reason: DEVNET_UNAVAILABLE_REASON }
  }
  const stored = await getStoredSeekerVerification()
  if (!stored.ok) {
    return { status: 'error', checkedAt: new Date().toISOString(), cluster, reason: stored.error.message }
  }
  return resultFromStored(stored.data, cluster)
}

/**
 * Verify whether a wallet qualifies as a Seeker Collector.
 * Never mutates Seekase social/profile state. Never returns fake `verified`.
 */
export async function verifySeekerCollector(
  walletAddress: string,
  options: VerifySeekerOptions = {},
): Promise<SeekerVerificationResult> {
  const checkedAt = new Date().toISOString()
  const cluster = options.cluster ?? 'devnet'
  const address = walletAddress.trim()

  if (!address) {
    return {
      status: 'error',
      checkedAt,
      cluster,
      reason: 'No wallet is connected.',
    }
  }

  // Honest Devnet / local development path — do not pretend SGT exists here.
  if (cluster === 'devnet' || cluster === 'localnet' || cluster === 'unknown') {
    return {
      status: 'unavailable',
      checkedAt,
      cluster,
      reason: DEVNET_UNAVAILABLE_REASON,
    }
  }

  const verified = await verifyStoredSeekerEligibility(address)
  if (!verified.ok) return { status: 'error', checkedAt, cluster, reason: verified.error.message }
  return resultFromStored(verified.data, cluster)
}

/** Pure helper — public badge visibility. */
export function shouldShowPublicSeekerBadge(status: SeekerVerificationStatus): boolean {
  return status === 'verified'
}

/** Pure helper — private UI status label. */
export function seekerVerificationLabel(status: SeekerVerificationStatus): string {
  switch (status) {
    case 'verified':
      return 'Seeker Verified Collector'
    case 'not_verified':
      return 'Not verified'
    case 'checking':
      return 'Checking…'
    case 'unavailable':
      return 'Not available in this build'
    case 'error':
      return 'Couldn’t complete verification'
    case 'unknown':
    default:
      return 'Not checked'
  }
}
