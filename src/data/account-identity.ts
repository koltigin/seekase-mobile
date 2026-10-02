type AccountUser = {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

const INTERNAL_WALLET_EMAIL_DOMAIN = '@auth.seekase.invalid'

/** A safe private-account label. Internal wallet-auth identifiers never belong in the UI. */
export function accountIdentityLabel(user: AccountUser | null | undefined): string | null {
  if (!user) return null
  if (user.user_metadata?.auth_provider === 'solana' || user.email?.endsWith(INTERNAL_WALLET_EMAIL_DOMAIN)) {
    return 'Solana wallet account'
  }
  return user.email ?? null
}
