# Seekase product and identity direction

> Current consolidated status: [PROJE_DURUMU.md](../PROJE_DURUMU.md). This document retains technical/historical detail; earlier status statements may be superseded.


Confirmed by the project owner on 2026-09-15. This is product direction, not a claim that all features are shipped.

## Product

Seekase is an open-ended collector showcase and social network. Categories must grow beyond the initial taxonomy: books, miniatures, antiques, household objects, electronics, electronic cigarettes, historic cigarette packs and other collectible objects. Keep shared top-level categories, optional subcategories, and tags; the starter list is not the boundary of the product.

Collectors display cabinets and objects. Other users can discover, like, save, follow, comment, and exchange private one-to-one text messages with report and block controls. Seekase is not a checkout or payment product.

## Account and wallet priorities

- Seekase Account remains separate from Wallet identity and public collector identity.
- Email account foundation exists. Google and Apple ID sign-in are planned entry options through Supabase Auth; the current buttons remain configuration-required placeholders.
- The first wallet/device priority is Seeker's built-in wallet on a physical Solana Seeker phone, retaining the existing Mobile Wallet Adapter integration.
- Other Solana users should connect through compatible Solana wallets. Compatibility must be tested per wallet/device; do not promise every Solana wallet works with MWA.
- A connected wallet is not automatically an authenticated Supabase account or proof of SGT ownership.
- EVM wallet support is a later phase. Do not add EVM dependencies or change MWA for it now.
- Account access, catalog use, and social identity remain available without a wallet.

## Badges

- SGT holders are the initial target audience. Award their distinct badge only after genuine Seeker Genesis Token verification.
- For Solana users without SGT, a separate NFT and/or collector-level badge path is planned. The qualifying NFT, thresholds, issuance, and exact rules are undecided; do not invent them.
- Collector achievements already derive from local state. They do not prove NFT ownership and do not mint tokens.
- Never publish wallet address, SGT mint, token accounts, Seeker username, `.skr`, or balances. Publish only an approved derived verification result.
- Daily check-in and genuine SGT verification use Mainnet. Achievement token issuance remains disabled.

### Genuine Seeker verification plan

Solana Mobile's official flow requires both steps below; device model detection alone is spoofable and is not sufficient for a badge:

1. Use SIWS to prove control of the connected wallet. Seekase's private wallet-auth flow already supplies this proof.
2. On the backend, query Mainnet and verify that the proven wallet contains a genuine Seeker Genesis Token (SGT). Store only a private verification attestation and expose an approved derived badge state; never copy the wallet address, token account, mint, `.skr` name, or balance into the public profile.

The current release performs step 2 through the server-side Mainnet verification adapter. `Wallet Verified` still means wallet-control proof only; the separate Seeker badge appears only after the SGT check succeeds.

Official reference: [Detecting Seeker Users — Seeker Genesis Token Verification](https://docs.solanamobile.com/recipes/general/detecting-seeker-users).

## Sequence

1. Harden the accepted Phase 2H foundation: profile synchronization, catalog ownership, metadata preservation, and reliable local Activity.
2. Define Phase 2I account-backed cloud catalog reads/writes, with explicit opt-in local import and preserved local copies.
3. Add media uploads, live social features, and bounded one-to-one direct messaging with participant-only access and moderation controls.
4. Implement and test Google/Apple account entry and physical-device wallet compatibility as explicit implementation tasks. Do not silently enable providers.
5. Implement genuine SGT and non-SGT badge paths once verification and eligibility rules are defined.

## OAuth prerequisites (not configured by this change)

Google requires a Google Cloud OAuth application and provider configuration in Supabase. Apple requires Apple developer identifiers and the corresponding Supabase provider setup. Mobile flows also need a callback/deep-link implementation, allowed redirect URLs, and device testing. Provider secrets belong in provider/backend configuration, never in `EXPO_PUBLIC_*` variables or source control.

References:

- [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Apple sign-in](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Mobile callbacks](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
