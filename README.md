# Seekase

Seekase is a Seeker-first social showcase for collectors. People build personal collections, document the stories behind their objects, discover other collectors, and interact through follows, likes, saves, and comments.

The product supports broad collection categories rather than a single market. A cabinet can contain books, coins, stamps, art, retro technology, model vehicles, natural-history objects, or another collectible type. Seekase is a showcase and community product; it does not provide checkout, escrow, or a marketplace transaction flow.

## Product status

The current Android application includes:

- Solana wallet sign-in through Mobile Wallet Adapter and Sign In With Solana.
- A private wallet identity that stays separate from the public collector profile.
- Verified Seeker Genesis Token eligibility without publishing wallet addresses or token details.
- Mainnet daily check-ins using a signed Memo transaction, with streak tracking and explicit wallet approval.
- Supabase-backed profiles, collections, items, photos, discovery, social actions, comments, one-to-one private text conversations, activity, moderation, and account deletion.
- Device-only legacy collections kept separate from account collections; signing in never uploads or deletes them silently.
- A wide category catalog with category-specific labels and metadata.
- English onboarding, account recovery guidance, privacy information, and support at [seekase.app](https://seekase.app/).

Google/Apple sign-in, push notifications, iOS packaging, and optional achievement NFTs are later milestones and are not presented as working features in the current release.

## Architecture

- **Mobile:** Expo 57, React Native, TypeScript, Expo Router, Uniwind.
- **Solana:** Mobile Wallet Adapter, SIWS, `@solana/kit`, Mainnet Memo check-ins.
- **Backend:** Supabase Auth, Postgres, Row Level Security, Storage, and Edge Functions.
- **State:** account data is stored in Supabase; explicitly device-only data uses AsyncStorage.
- **Server functions:** `wallet-auth`, `daily-checkin`, `seeker-verification`, and `delete-account`.
- **Website:** maintained separately in the sibling `Seekase-Site` repository; the mobile repository remains private and contains no public-site deployment workflow.

Security boundaries:

- Wallet addresses and SGT lookup details are private backend data.
- Public profiles expose only derived verification badges.
- Server secrets, signing credentials, wallet peppers, private keys, and recovery phrases never belong in the mobile environment or repository.
- Every public catalog table is protected by Row Level Security; writes require ownership.

See [product direction](docs/product-direction.md), [backend setup](docs/backend-setup.md), [wallet authentication](docs/wallet-auth.md), [daily check-in](docs/daily-checkin.md), and [Seeker verification](docs/seeker-verification.md) for implementation details.

## Local setup

Requirements:

- Node.js 22
- Android SDK and a physical Android device for wallet testing
- A Supabase project
- A compatible Solana mobile wallet

Install the locked dependencies, then create a local environment file:

```bash
npm ci
cp .env.example .env
```

Fill only the public client values documented in `.env.example`. Apply the migrations in `supabase/migrations/` to your own Supabase project and deploy the Edge Functions in `supabase/functions/`. Configure server-only secrets in Supabase; never prefix them with `EXPO_PUBLIC_`.

Start the development client:

```bash
npm run dev
```

Mobile Wallet Adapter must be tested on a physical Android device. The current development host has known emulator memory instability, so the project workflow does not use the Android emulator.

## Validation

Run the release checks with Node.js 22:

```bash
npm run audit:public
npx tsc --noEmit
npm run lint:check
npx vitest run tests/*.test.ts
```

The public-release audit checks tracked files and Git history for common credentials, private signing files, and machine-specific paths without printing secret values.

## Android release

`eas.json` contains separate profiles for the hackathon APK and Solana dApp Store APK. Release signing credentials are managed outside Git. Follow [the release build guide](docs/release-build.md) and test the signed APK on a physical Seeker without Metro before distribution.

## Submission and website

- CLOCK IN submission plan: [docs/hackathon-submission.md](docs/hackathon-submission.md)
- Launch checklist: [docs/launch-readiness.md](docs/launch-readiness.md)
- GitHub Pages and custom-domain setup: [docs/github-pages.md](docs/github-pages.md)
- Current implementation log and remaining work: [PROJE_DURUMU.md](PROJE_DURUMU.md)

The static website can be public independently of the application repository. If the submission requires a public source repository, publish a fresh sanitized copy only after `npm run audit:public` passes and all production secrets and private test data have been excluded.

## License

No open-source license has been granted. Source availability for review does not by itself grant permission to copy, modify, or redistribute the project.
