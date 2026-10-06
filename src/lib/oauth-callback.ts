export type OAuthCallbackResult =
  | { ok: true; code: string }
  | { ok: false; error: string }

export function readOAuthCallback(url: string): OAuthCallbackResult {
  try {
    const callback = new URL(url)
    const providerError = callback.searchParams.get('error_description') ?? callback.searchParams.get('error')
    if (providerError) {
      return { ok: false, error: providerError }
    }
    const code = callback.searchParams.get('code')
    if (!code) {
      return { ok: false, error: 'Google did not return an authorization code.' }
    }
    return { ok: true, code }
  } catch {
    return { ok: false, error: 'Google returned an invalid sign-in response.' }
  }
}
