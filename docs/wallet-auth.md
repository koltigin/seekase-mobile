# Android Solana wallet authentication

Status: approved architecture; implementation pending. Android / Seeker first. iOS is deferred.

## Product behavior

1. `Continue with Solana wallet` invokes the existing Mobile Wallet Adapter integration.
2. Seeker opens its installed wallet. Other Android devices use an installed MWA-compatible wallet.
3. The app requests a short-lived challenge from the Seekase backend.
4. The wallet signs a Sign In With Solana (SIWS) message containing that challenge.
5. The backend verifies the message and Ed25519 signature, consumes the challenge once, then creates or restores the matching Seekase account session.
6. The raw wallet address stays private and is never copied into `profiles`, catalog rows, social rows, activity, or public APIs.

No transaction is sent, no network fee is charged, and the flow does not depend on Devnet or Mainnet RPC state.

## Trust boundaries

- The mobile client must never decide that a signature is sufficient for authentication.
- The backend supplies the nonce and verifies the signed message.
- Challenges expire quickly, are single-use, and are bound to the requested wallet address, domain, and request ID.
- The signed message must match every server-issued field. A valid signature over a modified or expired message is rejected.
- Wallet-to-account mappings are private server data. Public profile code must expose only derived states such as `Wallet Verified` or genuinely verified `Seeker Verified`.
- A wallet already linked to one account cannot be silently moved to another account.
- Linking a wallet to an existing email/Google/Apple account requires an active account session plus a fresh wallet proof.

## Backend endpoints

The initial Supabase Edge Function may use one route with an action field or two routes.

### Challenge

Request:

```json
{ "action": "challenge", "address": "base58 public key" }
```

Response fields:

- `domain`
- `address`
- `statement`
- `uri`
- `version`
- `chainId`
- `nonce`
- `issuedAt`
- `expirationTime`
- `requestId`

The mobile app passes this payload unchanged to the installed wallet through the existing `signIn()` method.

### Verify

Request:

```json
{
  "action": "verify",
  "requestId": "server request ID",
  "address": "base58 public key",
  "signedMessage": "base64",
  "signature": "base64",
  "signatureType": "ed25519"
}
```

The backend validates the request, consumes the nonce transactionally, verifies the signature, resolves the private wallet identity, and returns a one-time Supabase login result. The app exchanges that result through Supabase Auth; it never receives a service-role key or JWT signing key.

## Private data model

Planned tables must not be publicly selectable:

- `wallet_auth_challenges`: request ID, hashed nonce, wallet lookup hash, expected SIWS fields, expiry, consumed timestamp.
- `wallet_identities`: auth user ID, keyed wallet lookup hash, encrypted/protected address material only if later verification requires it, verification timestamps.

Use a server-only pepper for wallet lookup hashing. Do not store the pepper, service-role key, or signing material in the mobile application or Git repository.

## Account behavior

- First verified wallet sign-in creates a Seekase auth user and profile.
- Later sign-ins restore the same user.
- A signed-in email/Google/Apple user may explicitly link a wallet after a fresh proof.
- Wallet sign-in and wallet linking are separate server-bound intents. Linking keeps the current session and never
  switches to the wallet's existing account.
- Account merging is deferred; collisions return `wallet_already_linked` and require an explicit recovery flow.
- Disconnecting MWA removes the local wallet session but does not delete the Seekase account or cloud collections.

## Network and release policy

- SIWS authentication itself does not spend SOL and is not an on-chain transaction.
- The checked-in source still defaults chain-dependent features to Devnet unless an explicit environment value selects Mainnet.
- The active physical-device environment and daily check-in backend moved to Mainnet on 24 September 2026 after explicit approval. This does not enable SGT verification, minting, transfers, or any other paid action.
- Production requires an owned HTTPS domain for `domain` / `uri`; development values must never be accepted by the production verifier.

## Implementation order

1. Private migration and transactional challenge-consume function.
2. Edge Function challenge/verify handlers with rate limits and strict validation.
3. Mobile repository for challenge and verification calls.
4. Existing MWA `signIn()` integration in the welcome flow.
5. Session restore, linking, cancellation, expiry, replay, wrong-wallet, and account-collision tests.
6. Physical Seeker QA, then a sanitized Android APK for CLOCK IN.
