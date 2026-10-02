import { fromByteArray } from 'react-native-quick-base64'
import { getSupabase } from '../lib/supabase'
import { repoFail, repoOk, type RepoResult } from './errors'

export type WalletSignInPayload = {
  domain: string
  address: string
  statement: string
  uri: string
  version: string
  chainId: string
  nonce: string
  issuedAt: string
  expirationTime: string
  requestId: string
}

export type WalletVerificationStatus = {
  verified: boolean
  verifiedAt: string | null
}

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return fallback
}

export type WalletAuthIntent = 'signin' | 'link'

export async function requestWalletChallenge(
  address: string,
  intent: WalletAuthIntent = 'signin',
): Promise<RepoResult<WalletSignInPayload>> {
  const supabase = getSupabase()
  if (!supabase) return repoFail('unavailable', 'Account service is unavailable in this build.')
  const { data, error } = await supabase.functions.invoke('wallet-auth', {
    body: { action: 'challenge', address, intent },
  })
  if (error) return repoFail('network', errorMessage(error, 'Could not start wallet sign-in.'))
  const payload = data?.payload
  if (!payload || typeof payload.requestId !== 'string' || payload.address !== address) {
    return repoFail('validation', 'The wallet sign-in request was invalid. Please try again.')
  }
  return repoOk(payload as WalletSignInPayload)
}

export async function verifyWalletSignIn(args: {
  payload: WalletSignInPayload
  signedMessage: Uint8Array
  signature: Uint8Array
  signedAddress: string
}): Promise<RepoResult<true>> {
  const supabase = getSupabase()
  if (!supabase) return repoFail('unavailable', 'Account service is unavailable in this build.')
  if (args.signedAddress !== args.payload.address) {
    return repoFail('validation', 'The wallet signed with a different account. Please try again.')
  }
  const { data, error } = await supabase.functions.invoke('wallet-auth', {
    body: {
      action: 'verify',
      requestId: args.payload.requestId,
      address: args.signedAddress,
      signedMessage: fromByteArray(args.signedMessage),
      signature: fromByteArray(args.signature),
      signatureType: 'ed25519',
    },
  })
  if (error) return repoFail('unauthenticated', errorMessage(error, 'Wallet verification failed.'))
  if (typeof data?.tokenHash !== 'string' || data.verificationType !== 'magiclink') {
    return repoFail('validation', 'The wallet login response was invalid. Please try again.')
  }
  const result = await supabase.auth.verifyOtp({ token_hash: data.tokenHash, type: 'magiclink' })
  if (result.error || !result.data.session) {
    return repoFail('unauthenticated', 'Could not open your Seekase session. Please try again.')
  }
  return repoOk(true)
}

export async function verifyWalletLink(args: {
  payload: WalletSignInPayload
  signedMessage: Uint8Array
  signature: Uint8Array
  signedAddress: string
}): Promise<RepoResult<WalletVerificationStatus>> {
  const supabase = getSupabase()
  if (!supabase) return repoFail('unavailable', 'Account service is unavailable in this build.')
  if (args.signedAddress !== args.payload.address) {
    return repoFail('validation', 'The wallet signed with a different account. Please try again.')
  }
  const { data, error } = await supabase.functions.invoke('wallet-auth', {
    body: {
      action: 'verify',
      requestId: args.payload.requestId,
      address: args.signedAddress,
      signedMessage: fromByteArray(args.signedMessage),
      signature: fromByteArray(args.signature),
      signatureType: 'ed25519',
    },
  })
  if (error) return repoFail('conflict', errorMessage(error, 'Could not link this wallet.'))
  if (data?.linked !== true || typeof data.verifiedAt !== 'string') {
    return repoFail('validation', 'The wallet link response was invalid. Please try again.')
  }
  return repoOk({ verified: true, verifiedAt: data.verifiedAt })
}

export async function getWalletVerificationStatus(): Promise<RepoResult<WalletVerificationStatus>> {
  const supabase = getSupabase()
  if (!supabase) return repoFail('unavailable', 'Account service is unavailable in this build.')
  const { data, error } = await supabase.functions.invoke('wallet-auth', {
    body: { action: 'status' },
  })
  if (error) return repoFail('network', errorMessage(error, 'Could not check wallet verification.'))
  if (typeof data?.verified !== 'boolean') {
    return repoFail('validation', 'Wallet verification status was invalid. Please try again.')
  }
  return repoOk({
    verified: data.verified,
    verifiedAt: typeof data.verifiedAt === 'string' ? data.verifiedAt : null,
  })
}
