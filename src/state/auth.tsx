import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getBackendAvailability, getSupabase } from '../lib/supabase'
import { deleteAccountPermanently, signOutAccount } from '../repositories/auth-repository'
import {
  ensureProfile,
  isInternalWalletProfile,
  profileRowToCloudFields,
  updateCloudProfile,
} from '../repositories/profile-repository'
import { normalizeAuthError, type RepoError } from '../repositories/errors'
import { useAppState } from './app-state'

export type AuthStatus = 'loading' | 'guest' | 'authenticated' | 'backend_unavailable' | 'auth_error'

export type OAuthProviderStatus = 'configuration_required'

type AuthValue = {
  status: AuthStatus
  ready: boolean
  backendAvailability: 'configured' | 'unavailable'
  isAuthenticated: boolean
  isGuest: boolean
  session: Session | null
  user: User | null
  email: string | null
  lastError: string | null
  googleStatus: OAuthProviderStatus
  appleStatus: OAuthProviderStatus
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ ok: true; needsConfirmation?: false } | { ok: false; error: RepoError }>
  signUpWithEmail: (
    email: string,
    password: string,
    opts?: { displayName?: string; handle?: string },
  ) => Promise<{ ok: true; needsConfirmation?: boolean } | { ok: false; error: RepoError }>
  signOut: () => Promise<boolean>
  deleteAccount: () => Promise<boolean>
  clearAuthError: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

function mapStatus(args: {
  backend: 'configured' | 'unavailable'
  loading: boolean
  session: Session | null
  error: string | null
}): AuthStatus {
  if (args.backend === 'unavailable') {
    return 'backend_unavailable'
  }
  if (args.loading) {
    return 'loading'
  }
  if (args.error && !args.session) {
    return 'auth_error'
  }
  if (args.session?.user) {
    return 'authenticated'
  }
  return 'guest'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { updateProfile, ready: localReady } = useAppState()
  const syncedUserId = useRef<string | null>(null)
  const backendAvailability = getBackendAvailability()
  const [loading, setLoading] = useState(backendAvailability === 'configured')
  const [session, setSession] = useState<Session | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return

    let cancelled = false
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) {
        return
      }
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [])

  const user = session?.user
  useEffect(() => {
    if (!user) {
      syncedUserId.current = null
      return
    }
    // Wait for disk hydration; do not overwrite edits on token refresh.
    if (!localReady || syncedUserId.current === user.id) return
    let cancelled = false
    void (async () => {
      try {
        const result = await ensureProfile({
          userId: user.id,
          email: user.email,
          displayName:
            typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : undefined,
          handle: typeof user.user_metadata?.handle === 'string' ? user.user_metadata.handle : undefined,
        })
        if (cancelled) return
        if (!result.ok) {
          setLastError(result.error.message)
          return
        }
        let profile = result.data
        if (user.user_metadata?.auth_provider === 'solana' && isInternalWalletProfile(profile)) {
          const repaired = await updateCloudProfile(user.id, {
            displayName: 'New Collector',
            handle: `collector_${user.id.replaceAll('-', '').slice(0, 8)}`,
          })
          if (!repaired.ok) {
            setLastError('Could not protect the default wallet profile name. Please try signing in again.')
            return
          }
          profile = repaired.data
        }
        if (cancelled) return
        syncedUserId.current = user.id
        updateProfile(profileRowToCloudFields(profile))
      } catch {
        if (!cancelled) setLastError('Could not load your account profile. Please try signing in again.')
      }
    })()
    // Ignore a late result after sign-out, account switching, or unmount.
    return () => {
      cancelled = true
    }
  }, [user, localReady, updateProfile])

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const supabase = getSupabase()
      if (!supabase) {
        const error = { code: 'unavailable' as const, message: 'Backend is not configured. Use local mode.' }
        setLastError(error.message)
        return { ok: false as const, error }
      }
      setLastError(null)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        const mapped = normalizeAuthError(error.message)
        setLastError(mapped.message)
        return { ok: false as const, error: mapped }
      }
      setSession(data.session)
      return { ok: true as const }
    },
    [setLastError, setSession],
  )

  const signUpWithEmail = useCallback(
    async (email: string, password: string, opts?: { displayName?: string; handle?: string }) => {
      const supabase = getSupabase()
      if (!supabase) {
        const error = { code: 'unavailable' as const, message: 'Backend is not configured. Use local mode.' }
        setLastError(error.message)
        return { ok: false as const, error }
      }
      setLastError(null)
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: opts?.displayName,
            handle: opts?.handle,
          },
        },
      })
      if (error) {
        const mapped = normalizeAuthError(error.message)
        setLastError(mapped.message)
        return { ok: false as const, error: mapped }
      }
      if (data.session?.user) {
        setSession(data.session)
        return { ok: true as const, needsConfirmation: false }
      }
      return { ok: true as const, needsConfirmation: true }
    },
    [setLastError, setSession],
  )

  const signOut = useCallback(async () => {
    setLastError(null)
    const result = await signOutAccount()
    if (!result.ok) {
      setLastError(result.error.message)
      return false
    }
    setSession(null)
    return true
  }, [setLastError, setSession])

  const deleteAccount = useCallback(async () => {
    setLastError(null)
    const result = await deleteAccountPermanently()
    if (!result.ok) {
      setLastError(result.error.message)
      return false
    }
    setSession(null)
    return true
  }, [setLastError, setSession])

  const status = mapStatus({
    backend: backendAvailability,
    loading,
    session,
    error: lastError,
  })

  const value = useMemo<AuthValue>(
    () => ({
      status,
      ready: !loading,
      backendAvailability,
      isAuthenticated: Boolean(session?.user),
      isGuest: !session?.user,
      session,
      user: session?.user ?? null,
      email: session?.user?.email ?? null,
      lastError,
      googleStatus: 'configuration_required',
      appleStatus: 'configuration_required',
      signInWithEmail,
      signUpWithEmail,
      signOut,
      deleteAccount,
      clearAuthError: () => setLastError(null),
    }),
    [
      status,
      loading,
      backendAvailability,
      session,
      lastError,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      deleteAccount,
      setLastError,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return value
}

/** Pure helper for Settings / Account copy. */
export function accountModeLabel(args: {
  backendAvailability: 'configured' | 'unavailable'
  isAuthenticated: boolean
  demoSignedIn: boolean
}): string {
  if (args.isAuthenticated) {
    return 'Signed in'
  }
  if (args.backendAvailability === 'unavailable') {
    return 'Account service unavailable'
  }
  return 'Not signed in'
}
