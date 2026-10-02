import { useEffect, type ReactNode } from 'react'
import { View } from 'react-native'
import { useGlobalSearchParams, useRouter, useSegments } from 'expo-router'
import { entryRedirect } from '../../data/entry-navigation'
import { useAppState } from '../../state/app-state'
import { useAuth } from '../../state/auth'

export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, onboardingComplete, interestsComplete, demoSignedIn, authMethod, colors } = useAppState()
  const { isAuthenticated, ready: authReady } = useAuth()
  const segments = useSegments()
  const { preview } = useGlobalSearchParams<{ preview?: string }>()
  const router = useRouter()
  const destination = entryRedirect(
    {
      ready: ready && authReady,
      onboardingComplete,
      interestsComplete,
      demoSignedIn,
      authMethod,
      isAuthenticated,
    },
    segments[0],
    preview === '1',
  )

  useEffect(() => {
    if (destination) router.replace(destination)
  }, [destination, router])

  if (!ready || !authReady) {
    return <View className="flex-1" style={{ backgroundColor: colors.background }} />
  }
  return children
}
