import { describe, expect, it } from 'vitest'
import { accountIdentityLabel } from '../src/data/account-identity'

describe('account identity label', () => {
  it('never displays the internal wallet-auth email', () => {
    expect(
      accountIdentityLabel({
        email: 'wallet-private-hash@auth.seekase.invalid',
        user_metadata: { auth_provider: 'solana' },
      }),
    ).toBe('Solana wallet account')
  })

  it('also protects legacy wallet users without provider metadata', () => {
    expect(accountIdentityLabel({ email: 'wallet-private-hash@auth.seekase.invalid' })).toBe('Solana wallet account')
  })

  it('shows a normal account email', () => {
    expect(accountIdentityLabel({ email: 'collector@example.com' })).toBe('collector@example.com')
  })
})
