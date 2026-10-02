# Seeker Genesis Token verification

Seekase awards the public `Seeker Genesis` badge only after the backend verifies a real Seeker Genesis Token (SGT) on Solana Mainnet. Wallet control must already have been proven through the existing SIWS wallet-auth flow.

Official reference: <https://docs.solanamobile.com/solana-mobile-stack/seeker-genesis-token>

## Verification rules

- Query the connected, privately linked wallet on Mainnet through Helius `getTokenAccountsByOwnerV2`.
- Inspect only nonzero Token-2022 token accounts.
- Decode every candidate mint.
- Require both the Metadata Pointer address and Token Group Member group to equal the official SGT address: `GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te`.
- Never infer SGT ownership from device model, wallet name, `.skr` name, collection count, or a client-provided boolean.
- Recheck the result every 24 hours. A transferred SGT revokes the previous account's derived public badge when the new owner verifies it.

## Privacy model

- The mobile app sends the connected address only to the authenticated verification Edge Function.
- The function first proves that the address belongs to the current Seekase account through the existing private wallet HMAC.
- Raw wallet addresses, token accounts, balances, and SGT mint addresses are never stored in Seekase tables and never returned to public clients.
- `seeker_verifications` stores only HMAC lookup values and is service-role only.
- `collector_badges` exposes only the derived badge id, owner account id, and expiry time.

## Live setup

Keep the mobile feature flag off until every step is complete.

1. In Supabase SQL Editor, run `supabase/migrations/20260924010000_seeker_verification.sql` with the query name **Seekase SGT verification**.
2. Create a Helius project and API key at <https://dashboard.helius.dev>. The key is a backend secret; never paste it into the app, an `EXPO_PUBLIC_*` variable, screenshots, chat, or Git.
3. In **Supabase → Edge Functions → Secrets**, add:
   - Name: `HELIUS_API_KEY`
   - Value: the Helius API key
4. Deploy `supabase/functions/seeker-verification` with the stable function name `seeker-verification`.
5. Confirm the existing server-only `WALLET_AUTH_PEPPER` is still present. The verification function intentionally uses the same pepper as `wallet-auth` so it can match the private wallet identity.
6. Set `EXPO_PUBLIC_SEEKER_VERIFICATION_ENABLED=true` in the reviewed Mainnet app environment, restart the app bundle, and test on a physical Seeker.

The hosted Edge Function provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Do not add either value to the mobile app.

## Physical acceptance test

1. Sign in with the already verified Seed Vault wallet.
2. Open **Profile → Collector Identity**.
3. Tap **Check Seeker eligibility**.
4. An eligible wallet must show `Seeker Genesis verified`; an ineligible wallet must show a clear negative result without receiving a badge.
5. Open the same collector's public profile and confirm that only the `Seeker Genesis` badge appears. No address, mint, balance, or transaction signature may appear.
6. Restart the app and confirm that the server-derived result is restored.

No transaction is created for SGT verification and no SOL is spent.

## Live acceptance — 24 September 2026

- The migration was applied and the Helius secret was stored directly in Supabase.
- The stable `seeker-verification` function was deployed through the Supabase API.
- The first bundle attempt with the full Solana client packages exceeded the hosted bundle timeout. The function now uses a small, read-only decoder for the official Token-2022 TLV layout and still requires Metadata Pointer type 18 and Token Group Member type 23.
- The feature flag was enabled in the Mainnet development environment.
- A physical Seeker with the privately linked Seed Vault wallet returned `Seeker Verified Collector` and the badge appeared on the account profile.
- No address, mint, token account, balance, or signature appeared in the UI. Verification created no transaction and spent no SOL.
