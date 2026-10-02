# Seekase — CLOCK IN pitch deck

Final English content plan for the submission deck. Use the approved physical-device screenshots in `assets/brand/exports/solana-dapp-store/screenshots/en-US/` when exporting the presentation.

## 1. Cover

**Seekase**  
Your collection has a story. Give it a place.

Seeker-first social showcase for collectors.

Visual: final Seekase mark plus a real Discover screen on Seeker.

## 2. The problem

Collectors document meaningful objects across camera rolls, spreadsheets, marketplace listings, and disconnected specialist groups.

- The story and provenance of an object get lost.
- Marketplace-first products reduce collections to prices and transactions.
- General social networks do not understand cabinets, categories, metadata, or collector progress.
- New collectors struggle to find people who share a specific interest.

## 3. The product

Seekase turns a collection into a personal digital museum.

- Build named collections across books, coins, art, technology, model vehicles, and many more categories.
- Add photos, category-specific details, stories, dates, makers, publishers, and provenance.
- Discover public collections and the people behind them.
- Follow, like, save, comment, and track collecting progress.
- Keep ownership identity separate from public wallet identity.

Visual: collection creation, item detail, and public profile.

## 4. Why Seeker

Seekase gives Seeker owners a recurring, identity-aware social experience.

- Mobile Wallet Adapter and Sign In With Solana provide wallet-first entry.
- Genuine Seeker Genesis Token eligibility creates a verified collector badge.
- A daily Mainnet check-in creates a visible collecting streak through an explicit signed Memo transaction.
- Wallet addresses and token details remain private; public profiles receive only derived badges.

Visual: wallet entry, Seeker badge, daily check-in card.

## 5. Retention loop

1. Add a new object and its story.
2. Share the collection publicly.
3. Receive follows, likes, saves, and comments.
4. Return for the daily Seeker check-in and streak.
5. Earn progress badges as the collection grows.

Future opt-in achievement NFTs can make earned milestones portable after the core social loop is validated.

## 6. Trust and architecture

- Expo + React Native Android application.
- Supabase Auth, Postgres, Storage, Row Level Security, and Edge Functions.
- SIWS proves wallet control without using a wallet address as a public profile name.
- SGT checks run on the backend against Mainnet and publish only the verified result.
- Account deletion removes online profile, catalog, social data, and owned photos.
- Device-only legacy data is never uploaded or deleted silently.

Visual: simple phone → Supabase → Solana diagram.

## 7. What works today

- Wallet and email account entry.
- Public profiles, collections, items, and image upload.
- Discover, category browsing, search, follows, likes, saves, comments, activity, reporting, and blocking.
- Genuine Seeker Genesis verification.
- Mainnet daily check-in and streak tracking.
- English onboarding, support, privacy, terms, community rules, and data-deletion paths.

Show only flows verified in the final standalone APK.

## 8. Roadmap and vision

**Next:** publish on the Solana dApp Store, expand collector onboarding, and grow category communities.

**Later:** Google/Apple account linking, private-message push notifications, iOS, moderated category suggestions, and optional achievement NFTs.

**Vision:** the trusted global home for the objects people choose to keep.

Closing URL: `seekase.app`
