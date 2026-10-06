/** Screen routing only; cloud data access still requires a real authenticated account. */
export type EntryState = {
  ready: boolean
  onboardingComplete: boolean
  interestsComplete: boolean
  isAuthenticated: boolean
  demoSignedIn: boolean
  authMethod: string | null
}

type EntryDestination = '/onboarding' | '/welcome' | '/interests' | '/(tabs)'

export function entryRedirect(
  state: EntryState,
  root: string | undefined,
  previewIntro = false,
): EntryDestination | null {
  if (!state.ready) return null
  if (!state.onboardingComplete) return root === 'onboarding' ? null : '/onboarding'

  // OAuth returns through a real Expo Router route. Keep it mounted long enough
  // for WebBrowser.openAuthSessionAsync to receive and exchange the PKCE code.
  if (root === 'auth') return null

  // Account is also the settings/sign-out screen.
  if (root === 'account') return null
  // A guest may explicitly revisit sign-in options, including after account sign-out.
  if (root === 'welcome' && !state.isAuthenticated) return null
  if (root === 'onboarding' && previewIntro) return null

  // Historical local/demo flags never stand in for a real account session.
  if (!state.isAuthenticated) return root === 'welcome' ? null : '/welcome'
  if (!state.interestsComplete) return root === 'interests' ? null : '/interests'
  if (root === 'onboarding' || root === 'welcome' || root === 'interests') return '/(tabs)'
  return null
}
