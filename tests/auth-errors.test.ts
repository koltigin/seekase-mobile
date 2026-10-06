import { describe, expect, it } from 'vitest'
import { normalizeAuthError } from '../src/repositories/errors'

describe('authentication errors', () => {
  it('explains when manual identity linking is disabled', () => {
    expect(normalizeAuthError('Manual linking is disabled')).toEqual({
      code: 'unavailable',
      message: 'Account linking is disabled in the authentication settings. Enable manual linking and try again.',
    })
  })

  it('does not suggest retrying an identity owned by another account', () => {
    expect(normalizeAuthError('Identity is already linked to another user')).toEqual({
      code: 'conflict',
      message:
        'That Google account already belongs to another Seekase account. Use a different Google account or delete the empty test account first.',
    })
  })
})
