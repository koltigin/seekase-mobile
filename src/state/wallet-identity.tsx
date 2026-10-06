import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { convertSignInResult, type Account, type WalletAuthorization } from '@wallet-ui/react-native-kit'
import type { AuthorizationResult, SignInPayload } from '@solana-mobile/mobile-wallet-adapter-protocol'
import { base64ToUint8Array } from '@solana-mobile/mobile-wallet-adapter-protocol/encoding'
import { address, getBase58Decoder } from '@solana/kit'
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
  if (message.toLowerCase().includes('authorization request failed')) {
    return 'Wallet authorization expired. Tap Continue with Solana wallet again to reconnect.'
  }
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
  connectAndSignInWallet: (getPayload: (address: string) => Promise<SignInPayload | null>) => Promise<{
    address: string
    signedMessage: Uint8Array
    signature: Uint8Array
  } | null>
  signInWallet: (payload: SignInPayload) => Promise<{
    address: string
    signedMessage: Uint8Array
    signature: Uint8Array
  } | null>
  disconnectWallet: () => Promise<void>
  checkSeekerEligibility: () => Promise<void>
}

function walletAuthorization(result: AuthorizationResult): WalletAuthorization {
  const accounts: Account[] = result.accounts.map((item) => {
    const base58Address = getBase58Decoder().decode(base64ToUint8Array(item.address))
    return {
      address: address(base58Address),
      addressBase64: item.address,
      icon: item.icon,
      label: item.label ?? `${base58Address.slice(0, 8)}..${base58Address.slice(-8)}`,
    }
  })
  const selectedAccount = accounts[0]
  if (!selectedAccount) throw new Error('The wallet did not return an account.')
  return { accounts, authToken: result.auth_token, selectedAccount }
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
  const { account, connect, connectAnd, disconnect, signIn, chain, identity, store } = useMobileWallet()
  const { chain: networkChain } = useNetwork()
  const [connectionStatusState, setConnectionStatus] = useState<WalletConnectionStatus>('disconnected')
  const [seekerVerification, setSeekerVerification] = useState<SeekerVerificationStatus>('unknown')
  const [seekerVerificationUserId, setSeekerVerificationUserId] = useState<string | null>(null)
  const [verificationReason, setVerificationReason] = useState<string | undefined>()
  const [verificationCheckedAt, setVerificationCheckedAt] = useState<string | undefined>()
  const [lastError, setLastError] = useState<string | null>(null)
  const automaticSeekerCheckUserId = useRef<string | null>(null)
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
    if (!isAuthenticated || !user) {
      automaticSeekerCheckUserId.current = null
      return
    }
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
      // A cancelled or failed hand-off can leave an unusable authorization in
      // storage. Always make the next explicit attempt start cleanly.
      await disconnect()
      setConnectionStatus('error')
      setLastError(walletConnectionError(error))
      return null
    }
  }, [account, connect, disconnect])

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
        // A failed signing sheet must not keep a cached authorization that can
        // reopen as an empty Solana Wallet sheet on the next attempt.
        await disconnect()
        setConnectionStatus('error')
        setLastError(walletConnectionError(error))
        return null
      }
    },
    [disconnect, signIn],
  )

  const connectAndSignInWallet = useCallback(
    async (getPayload: (address: string) => Promise<SignInPayload | null>) => {
      setConnectionStatus('connecting')
      setLastError(null)
      let proof: {
        address: string
        signedMessage: Uint8Array
        signature: Uint8Array
      } | null = null
      try {
        await connectAnd(async (wallet) => {
          const connectedResult = await wallet.authorize({ chain, identity })
          const connected = walletAuthorization(connectedResult)
          await store.persist(connected)

          const payload = await getPayload(String(connected.selectedAccount.address))
          if (!payload) return connected.selectedAccount

          const signedResult = await wallet.authorize({
            auth_token: connected.authToken,
            chain,
            identity,
            sign_in_payload: payload,
          })
          const signedAuthorization = walletAuthorization(signedResult)
          await store.persist(signedAuthorization)
          if (!signedResult.sign_in_result) throw new Error('The wallet did not return a sign-in signature.')
          const signed = convertSignInResult({
            account: signedAuthorization.selectedAccount,
            signInResult: signedResult.sign_in_result,
          })
          proof = {
            address: String(signed.account.address),
            signature: decodeWalletSignInBytes(signed.signature, signed.signature.length),
            signedMessage: decodeWalletSignInBytes(signed.signedMessage, signed.signature.length),
          }
          return signedAuthorization.selectedAccount
        })
        setConnectionStatus(proof ? 'connected' : 'disconnected')
        return proof
      } catch (error) {
        await disconnect()
        setConnectionStatus('error')
        setLastError(walletConnectionError(error))
        return null
      }
    },
    [chain, connectAnd, disconnect, identity, store],
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

  useEffect(() => {
    if (
      !isAuthenticated ||
      !user ||
      !account ||
      walletVerification !== 'verified' ||
      seekerVerificationUserId !== user.id ||
      (seekerVerification !== 'unknown' && seekerVerification !== 'not_verified') ||
      automaticSeekerCheckUserId.current === user.id
    ) {
      return
    }

    // A wallet-first sign-in has already proved control of the privately linked
    // wallet. Refresh the genuine Mainnet SGT result once per app session so a
    // previously cached negative result cannot hide a newly detected token.
    automaticSeekerCheckUserId.current = user.id
    void checkSeekerEligibility()
  }, [
    account,
    checkSeekerEligibility,
    isAuthenticated,
    seekerVerification,
    seekerVerificationUserId,
    user,
    walletVerification,
  ])

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
      connectAndSignInWallet,
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
      connectAndSignInWallet,
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
