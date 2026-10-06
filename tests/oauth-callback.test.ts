import { describe, expect, it } from 'vitest'
import { readOAuthCallback } from '../src/lib/oauth-callback'

describe('readOAuthCallback', () => {
  it('returns the PKCE authorization code', () => {
    expect(readOAuthCallback('seekase://auth/callback?code=code-123')).toEqual({ ok: true, code: 'code-123' })
  })

  it('returns the provider error without accepting a missing code', () => {
    expect(readOAuthCallback('seekase://auth/callback?error=access_denied&error_description=User%20cancelled')).toEqual({
      ok: false,
      error: 'User cancelled',
    })
  })

  it('rejects malformed and incomplete callbacks', () => {
    expect(readOAuthCallback('not a url')).toEqual({ ok: false, error: 'Google returned an invalid sign-in response.' })
    expect(readOAuthCallback('seekase://auth/callback')).toEqual({
      ok: false,
      error: 'Google did not return an authorization code.',
    })
  })
})
