import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import type { SignInPayload } from '@solana-mobile/mobile-wallet-adapter-protocol'
import { base64ToUint8Array } from '@solana-mobile/mobile-wallet-adapter-protocol/encoding'
import { derivePublicSeekerBadge } from '../data/seeker-badge'
import { walletVerifiedBadge, type CollectorBadge } from '../data/badges'
import { getWalletVerificationStatus } from '../repositories/wallet-auth-repository'
import { useNetwork } from '../features/network/use-network'
import {
  loadSeekerVerificationStatus,
  seekerVerificationLabel,
  verifySeekerCollector,
  type SeekerVerificationCluster,
  type SeekerVerificationStatus,
} from '../services/seeker-verification'
import { formatError } from '../utils/format-error'
import { useAuth } from './auth'

export type WalletConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
export type WalletVerificationStatus = 'loading' | 'verified' | 'unverified' | 'error'

function walletConnectionError(error: unknown) {
  const message = formatError(error)
  return message.toLowerCase().includes('cancellationexception') || message.toLowerCase().includes('cancelled')
    ? 'Wallet connection was cancelled.'
    : message
}

function decodeWalletSignInBytes(value: Uint8Array, signatureLength?: number) {
  if (signatureLength === 64) return value
  return base64ToUint8Array(new TextDecoder().decode(value))
}

type WalletIdentityValue = {
  connectionStatus: WalletConnectionStatus
  isConnected: boolean
  /** Private only — never pass into public collector models or social surfaces. */
  hasWalletSession: boolean
  walletVerification: WalletVerificationStatus
  walletVerifiedAt: string | null
  publicWalletBadge: CollectorBadge | null
  seekerVerification: SeekerVerificationStatus
  verificationReason?: string
  verificationCheckedAt?: string
  verificationLabel: string
  /** Derived public badge for current user — null unless genuinely verified. */
  publicSeekerBadge: CollectorBadge | null
  lastError: string | null
  connectWallet: () => Promise<string | null>
  signInWallet: (payload: SignInPayload) => Promise<{
    address: string
    signedMessage: Uint8Array
    signature: Uint8Array
  } | null>
  disconnectWallet: () => Promise<void>
  checkSeekerEligibility: () => Promise<void>
}

const WalletIdentityContext = createContext<WalletIdentityValue | null>(null)

function mapCluster(chain: string | undefined): SeekerVerificationCluster {
  if (chain === 'solana:devnet') {
    return 'devnet'
  }
  if (chain === 'solana:mainnet' || chain === 'solana:mainnet-beta') {
    return 'mainnet-beta'
  }
  if (chain === 'solana:localnet') {
    return 'localnet'
  }
  return 'unknown'
}

export function WalletIdentityProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const { account, connect, disconnect, signIn, chain } = useMobileWallet()
  const { chain: networkChain } = useNetwork()
  const [connectionStatusState, setConnectionStatus] = useState<WalletConnectionStatus>('disconnected')
  const [seekerVerification, setSeekerVerification] = useState<SeekerVerificationStatus>('unknown')
  const [seekerVerificationUserId, setSeekerVerificationUserId] = useState<string | null>(null)
  const [verificationReason, setVerificationReason] = useState<string | undefined>()
  const [verificationCheckedAt, setVerificationCheckedAt] = useState<string | undefined>()
  const [lastError, setLastError] = useState<string | null>(null)
  const [walletVerificationResult, setWalletVerificationResult] = useState<{
    userId: string
    status: WalletVerificationStatus
    verifiedAt: string | null
  } | null>(null)

  const isConnected = Boolean(account)
  // `account` is the source of truth. If MWA drops a session outside this screen,
  // do not leave a private connection or derived public verification visible.
  const connectionStatus: WalletConnectionStatus = isConnected
    ? 'connected'
    : connectionStatusState === 'connected'
      ? 'disconnected'
      : connectionStatusState
  const hasCurrentSeekerResult = Boolean(isAuthenticated && user && seekerVerificationUserId === user.id)
  const visibleVerification: SeekerVerificationStatus = !isAuthenticated
    ? 'unknown'
    : hasCurrentSeekerResult
      ? seekerVerification
      : 'checking'
  const visibleVerificationReason = hasCurrentSeekerResult ? verificationReason : undefined
  const visibleVerificationCheckedAt = hasCurrentSeekerResult ? verificationCheckedAt : undefined
  const walletVerification: WalletVerificationStatus =
    !isAuthenticated || !user
      ? 'unverified'
      : walletVerificationResult?.userId === user.id
        ? walletVerificationResult.status
        : 'loading'
  const walletVerifiedAt =
    walletVerificationResult && walletVerificationResult.userId === user?.id
      ? walletVerificationResult.verifiedAt
      : null

  useEffect(() => {
    if (!isAuthenticated || !user) return
    let cancelled = false
    void getWalletVerificationStatus().then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setWalletVerificationResult({ userId: user.id, status: 'error', verifiedAt: null })
        return
      }
      setWalletVerificationResult({
        userId: user.id,
        status: result.data.verified ? 'verified' : 'unverified',
        verifiedAt: result.data.verifiedAt,
      })
    })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    let cancelled = false
    void loadSeekerVerificationStatus().then((result) => {
      if (cancelled) return
      setSeekerVerificationUserId(user.id)
      setSeekerVerification(result.status)
      setVerificationReason(result.reason)
      setVerificationCheckedAt(result.status === 'unknown' ? undefined : result.checkedAt)
    })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user])

  const connectWallet = useCallback(async () => {
    if (account) {
      setConnectionStatus('connected')
      setLastError(null)
      return String(account.address)
    }
    setConnectionStatus('connecting')
    setLastError(null)
    try {
      const connected = await connect()
      setConnectionStatus('connected')
      return String(connected.address)
    } catch (error) {
      setConnectionStatus('error')
      setLastError(walletConnectionError(error))
      return null
    }
  }, [account, connect])

  const signInWallet = useCallback(
    async (payload: SignInPayload) => {
      setLastError(null)
      try {
        const result = await signIn(payload)
        const signature = decodeWalletSignInBytes(result.signature, result.signature.length)
        const signedMessage = decodeWalletSignInBytes(result.signedMessage, result.signature.length)
        setConnectionStatus('connected')
        return {
          address: String(result.account.address),
          signedMessage,
          signature,
        }
      } catch (error) {
        setConnectionStatus('error')
        setLastError(walletConnectionError(error))
        return null
      }
    },
    [signIn],
  )

  const disconnectWallet = useCallback(async () => {
    setLastError(null)
    try {
      await disconnect()
    } catch (error) {
      setLastError(formatError(error))
    } finally {
      setConnectionStatus('disconnected')
    }
  }, [disconnect])

  const checkSeekerEligibility = useCallback(async () => {
    setSeekerVerificationUserId(user?.id ?? null)
    if (!account) {
      setSeekerVerification('error')
      setVerificationReason('Connect a Solana wallet before checking Seeker eligibility.')
      setVerificationCheckedAt(new Date().toISOString())
      return
    }
    setSeekerVerification('checking')
    setLastError(null)
    try {
      const cluster = mapCluster(chain ?? networkChain)
      // Address is used only inside the private verification call — never returned to public UI.
      const result = await verifySeekerCollector(String(account.address), { cluster })
      setSeekerVerification(result.status)
      setVerificationReason(result.reason)
      setVerificationCheckedAt(result.checkedAt)
    } catch (error) {
      setSeekerVerification('error')
      setVerificationReason(formatError(error))
      setVerificationCheckedAt(new Date().toISOString())
      setLastError(formatError(error))
    }
  }, [account, chain, networkChain, user])

  const value = useMemo<WalletIdentityValue>(
    () => ({
      connectionStatus,
      isConnected,
      hasWalletSession: isConnected,
      walletVerification,
      walletVerifiedAt,
      publicWalletBadge: walletVerification === 'verified' ? walletVerifiedBadge : null,
      seekerVerification: visibleVerification,
      verificationReason: visibleVerificationReason,
      verificationCheckedAt: visibleVerificationCheckedAt,
      verificationLabel: seekerVerificationLabel(visibleVerification),
      publicSeekerBadge: derivePublicSeekerBadge(visibleVerification),
      lastError,
      connectWallet,
      signInWallet,
      disconnectWallet,
      checkSeekerEligibility,
    }),
    [
      connectionStatus,
      isConnected,
      walletVerification,
      walletVerifiedAt,
      visibleVerification,
      visibleVerificationReason,
      visibleVerificationCheckedAt,
      lastError,
      connectWallet,
      signInWallet,
      disconnectWallet,
      checkSeekerEligibility,
    ],
  )

  return <WalletIdentityContext.Provider value={value}>{children}</WalletIdentityContext.Provider>
}

export function useWalletIdentity() {
  const value = useContext(WalletIdentityContext)
  if (!value) {
    throw new Error('useWalletIdentity must be used within WalletIdentityProvider')
  }
  return value
}
