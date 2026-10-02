import { describe, expect, it } from 'vitest'
import { entryRedirect, type EntryState } from '../src/data/entry-navigation'

const returningUser: EntryState = {
  ready: true,
  onboardingComplete: true,
  interestsComplete: true,
  isAuthenticated: true,
  demoSignedIn: false,
  authMethod: null,
}

// Follow screens/states seen by users, including the regression where account was unreachable.
describe('entry and account navigation', () => {
  it('waits for both disk and account hydration before redirecting', () => {
    expect(entryRedirect({ ...returningUser, ready: false, onboardingComplete: false }, '(tabs)')).toBeNull()
  })

  it('takes a fresh install through introduction, account, interests, and the app', () => {
    let state = {
      ...returningUser,
      onboardingComplete: false,
      interestsComplete: false,
      isAuthenticated: false,
    }
    expect(entryRedirect(state, '(tabs)')).toBe('/onboarding')
    expect(entryRedirect(state, 'onboarding')).toBeNull()
    state = { ...state, onboardingComplete: true }
    expect(entryRedirect(state, 'onboarding')).toBe('/welcome')
    expect(entryRedirect(state, 'welcome')).toBeNull()
    expect(entryRedirect(state, 'account')).toBeNull()
    state = { ...state, isAuthenticated: true }
    expect(entryRedirect(state, '(tabs)')).toBe('/interests')
    expect(entryRedirect(state, 'interests')).toBeNull()
    state = { ...state, interestsComplete: true }
    expect(entryRedirect(state, 'interests')).toBe('/(tabs)')
    expect(entryRedirect(state, '(tabs)')).toBeNull()
  })

  it('keeps account settings open for returning users and after sign-out', () => {
    expect(entryRedirect(returningUser, 'account')).toBeNull()
    const signedOut = { ...returningUser, isAuthenticated: false }
    expect(entryRedirect(signedOut, 'account')).toBeNull()
    expect(entryRedirect(signedOut, '(tabs)')).toBe('/welcome')
  })

  it('requires an account even when a historical local-mode flag exists', () => {
    const local = { ...returningUser, isAuthenticated: false, demoSignedIn: true, authMethod: 'demo' }
    expect(entryRedirect(local, '(tabs)')).toBe('/welcome')
    expect(entryRedirect(local, 'account')).toBeNull()
    expect(entryRedirect(local, 'welcome')).toBeNull()
  })

  it.each(['email', 'solana', 'google', 'apple', null])(
    'does not treat a stale %s flag as a real account session',
    (authMethod) => {
      const expired = { ...returningUser, isAuthenticated: false, demoSignedIn: true, authMethod }
      expect(entryRedirect(expired, '(tabs)')).toBe('/welcome')
      expect(entryRedirect(expired, 'account')).toBeNull()
    },
  )

  it('keeps sign-in options accessible after sign-out even if local mode was used earlier', () => {
    const signedOut = { ...returningUser, isAuthenticated: false, demoSignedIn: true, authMethod: 'demo' }
    expect(entryRedirect(signedOut, 'welcome')).toBeNull()
    expect(entryRedirect(signedOut, 'onboarding', true)).toBeNull()
    expect(entryRedirect(signedOut, '(tabs)')).toBe('/welcome')
    expect(entryRedirect({ ...signedOut, isAuthenticated: true }, 'welcome')).toBe('/(tabs)')
  })

  it('still requires the first introduction when opening a direct account link', () => {
    expect(entryRedirect({ ...returningUser, onboardingComplete: false }, 'account')).toBe('/onboarding')
  })

  it('allows replay without resetting the saved introduction, interests, or account', () => {
    const before = { ...returningUser }
    expect(entryRedirect(returningUser, 'onboarding', true)).toBeNull()
    expect(entryRedirect(returningUser, 'onboarding')).toBe('/(tabs)')
    expect(returningUser).toEqual(before)
  })

  it('does not allow a preview parameter to bypass entry on other screens', () => {
    expect(entryRedirect({ ...returningUser, isAuthenticated: false }, '(tabs)', true)).toBe('/welcome')
  })
})
