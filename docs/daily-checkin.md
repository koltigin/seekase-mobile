# Daily Solana Check-in

## Product decision

Seekase daily check-in is a signed Solana Memo transaction on Mainnet. It does not transfer SOL or create a rent-bearing account. Seekase does not charge an application fee; the wallet pays only the network transaction fee. Every challenge uses the readable, versioned form `seekase:check-in:v1:<single-use UUID>`, so explorers that display Memo data can identify it as a Seekase check-in without a custom program.

The existing Anchor counter template is not used. A custom program is not required to write or verify this event. A per-wallet PDA would require a rent-exempt account deposit on the first check-in, and a deployed program would add deployment authority, upgrade, audit and maintenance responsibilities. That conflicts with the current fee-only, minimal-risk product decision.

Reconsider a dedicated Seekase program only if the product later needs state that other applications must verify directly onchain, such as a composable onchain streak account. Branding alone is not a sufficient reason. The current Supabase verification remains authoritative for app streaks and earned badges.

## Verification flow

1. The signed-in account requests a short-lived, single-use check-in challenge from the `daily-checkin` Edge Function.
2. The function returns `seekase:check-in:v1:<single-use UUID>`. It contains no account ID, wallet address, email or profile data.
3. The linked wallet signs and submits one Memo transaction through Mobile Wallet Adapter.
4. The Edge Function fetches the confirmed transaction from its configured network, checks the exact memo and time window, and HMAC-hashes every required signer.
5. A signer must match one of the account's private `wallet_identities` hashes. Raw wallet addresses are never stored in the check-in tables or returned to public profile APIs.
6. A unique database constraint permits one verified check-in per account per UTC day.

## Streaks and badges

Current and longest streaks are derived from verified UTC dates. Planned thresholds are 7, 14, and 30 consecutive days. A later public badge projection may expose only earned badge IDs; check-in signatures, wallet lookup hashes, and account history remain private.

## Deployment order

1. Apply `supabase/migrations/20260923020000_daily_checkins.sql` in the Supabase SQL Editor.
2. Deploy the `daily-checkin` Edge Function.
3. Reuse the existing `WALLET_AUTH_PEPPER` function secret. Keep `CHECKIN_SOLANA_NETWORK=devnet` during development and optionally set `CHECKIN_SOLANA_RPC_URL` to a trusted Devnet RPC endpoint.
4. Apply `20260924000000_daily_checkin_networks.sql` before a Mainnet release.
5. For a reviewed Mainnet release, set the app to `EXPO_PUBLIC_SOLANA_NETWORK=mainnet`, configure a production `EXPO_PUBLIC_SOLANA_MAINNET_RPC_URL`, set both Edge Functions to Mainnet with `CHECKIN_SOLANA_NETWORK=mainnet` and `WALLET_AUTH_SOLANA_NETWORK=mainnet`, and set `CHECKIN_SOLANA_RPC_URL` to the corresponding server RPC.
6. Test Devnet and Mainnet as separate release configurations. Mainnet uses real SOL and must never be enabled by an accidental fallback.

The active physical-device environment completed steps 4–5 on 24 September 2026. Both stable Edge Function names were redeployed with explicit Mainnet secrets, and the app showed the Mainnet fee label. The existing Devnet history was preserved. On 2 October 2026, `KolTigin / @koltigin` completed an end-to-end Mainnet check-in on a physical Seeker. The transaction was verified and the profile updated to a one-day current streak and three total check-ins.

## Recovery behavior

If the wallet submits the transaction but confirmation is temporarily unavailable, the chain transaction remains valid. A retry/recovery screen that stores the pending request ID and signature on device is required before production release.
