# OAuth and linked account identities

## Intended account model

One person has one Seekase account (`auth.users.id`) and may attach several ways to enter it:

- Solana wallet through SIWS and Mobile Wallet Adapter;
- email and password;
- Google;
- Apple.

These are authentication methods for the same account. They do not create separate public profiles after they are explicitly linked. Wallet address, provider subject IDs and provider tokens remain private; the public profile exposes only approved profile fields and derived verification badges.

## Current production state

- Email/password registration, confirmation, sign-in and session restore are implemented.
- Wallet-first sign-in is implemented. On Seeker it opens the installed Vault-compatible wallet. On other Android devices it asks an installed Mobile Wallet Adapter compatible Solana wallet to authorize.
- A signed-in email or wallet account can already link a Solana wallet through the existing SIWS `link` intent.
- Google and Apple providers are not configured and are therefore not shown as available actions.

## Required Google setup

1. Create the Seekase OAuth application in Google Auth Platform.
2. Configure the Supabase callback shown on the Google provider page as an authorized redirect URI.
3. Enable Google in Supabase Auth using the client ID and secret. Provider secrets never enter the app, `.env`, GitHub or `EXPO_PUBLIC_*` values.
4. Add `seekase://auth/callback` to the Supabase redirect allow list. Keep `https://seekase.app` as the production website origin.
5. Implement and test the Expo native callback/PKCE exchange on a release build.

## Required Apple setup

1. Use an Apple Developer account to configure the App ID/Services ID for Seekase.
2. Configure the Supabase Apple callback and `seekase.app` domain in Apple Developer.
3. Store the Apple signing key only in the provider/backend configuration and establish the required secret-rotation procedure.
4. Enable Apple in Supabase Auth, add the same app callback allow-list entry, and test the web OAuth flow on Android. Native iOS Sign in with Apple belongs to the later iOS milestone.

## Linking behavior

- When signed out, a provider signs into the Seekase user already linked to that provider or creates a new user.
- When signed in, Account Settings offers **Link Google**, **Link Apple**, **Add email**, and **Link Solana wallet**. Linking always requires fresh proof from that provider.
- Supabase can automatically link OAuth identities that return the same verified email, but Seekase must still show the linked methods and use explicit manual linking for a different email.
- If the selected Google, Apple or wallet identity already belongs to another Seekase user, do not silently move data or overwrite either profile. Use the separately documented two-proof account merge flow.
- At least one working sign-in method must remain attached. Unlinking the final method is blocked.

## Acceptance tests

For each provider, verify: new sign-in, returning sign-in, sign-out/session restore, cancellation, provider denial, expired callback, same-email linking, different-email manual linking, already-linked-to-another-account rejection, wallet linking, and account deletion cleanup. Run these tests on the release-signed Android build, not only Expo development mode.
