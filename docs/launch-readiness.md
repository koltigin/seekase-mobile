# Seekase launch readiness

This checklist is the working order for the first Solana Seeker / Android submission. A checked item needs both implementation and physical-device evidence.

CLOCK IN deadline: **8 October 2026**. Required package: functional Android APK, source-code GitHub repository, demo video, and pitch deck/brief. See `docs/hackathon-submission.md`.

## P0 — working product

- [x] Solana wallet sign-in through Mobile Wallet Adapter and SIWS.
- [x] Private wallet identity separated from the public collector profile.
- [x] Account collections, items, photos, public discovery, likes, saves, follows, comments, activity, reporting, and blocking.
- [x] Add safe one-to-one text messaging: start from a collector, collection or object; inbox/unread state; report and block controls; account-deletion cleanup. Do not add payments, escrow or marketplace claims.
- [x] Apply `20261001000000_publication_photo_requirement.sql`: public objects require a photo, empty collections remain owner-visible drafts, and photo-less drafts stay out of Discover and public profiles.
- [x] Mainnet daily check-in implementation with server verification and streaks.
- [x] Complete a physical Mainnet check-in with Vault return, server verification and streak refresh.
- [x] Genuine SGT verification code and private/public data model.
- [x] Apply the SGT migration, add the Helius backend secret, deploy the function, enable the feature flag, and complete physical-device acceptance.
- [ ] Complete a clean end-to-end physical test: new sign-in → profile → collection → item/photo → Discover → social actions → check-in → restart.
- [x] Add account deletion and data deletion from the app, including owned Storage objects.
- [ ] Complete the destructive account-deletion acceptance test with a disposable test account.
- [x] Add an in-app support and recovery route.
- [x] Configure the official in-app support URL as `https://seekase.app/support/`.
- [ ] Point the purchased domain's DNS to the published GitHub Pages repository, wait for the certificate, then verify the support route over HTTPS.

## P1 — submission build

- [x] Freeze the English UI copy and remove development-only wording.
- [ ] Confirm app name, package id, production SIWS domain/URI, Mainnet RPC, and privacy URLs. Support URL is fixed as `https://seekase.app/support/`.
- [x] Produce a release-signed Android build and install it on a physical Seeker without Metro.
- [x] Rebuild the final 2 October source state with the production release certificate, verify its v2 signature, and install it on the physical Seeker.
- [x] Add EAS profiles for the standalone hackathon APK and Solana dApp Store APK without committing signing credentials.
- [x] Test release-APK cold start on a physical Seeker.
- [x] Test the offline/error state and recovery after connectivity returns.
- [x] Test small-screen keyboard resizing in the add-item form.
- [x] Test the Android system photo picker from the final add-item form without requesting broad media access.
- [x] Re-test wallet return from Seed Vault in the final acceptance pass.
- [x] Scan the publishable repository and APK configuration for secrets and private identifiers.
- [ ] Prepare a clean judge-accessible or sanitized public GitHub source repository and pass `npm run audit:public`.
- [ ] Record the demo video and prepare the short product deck, screenshots, feature list, and test instructions.

## P1 — brand and store assets

- [x] Choose one final Seekase mark and wordmark direction from `docs/brand-discovery.md`.
- [x] Test the mark at launcher-icon and badge sizes before polishing variants.
- [x] Export Android adaptive icon foreground/background, splash mark, monochrome icon, and high-resolution store icon.
- [x] Create one consistent badge family: Wallet Verified, Seeker Genesis, collection milestones, and 7/14/30-day streaks.
- [x] Create store screenshots and a feature graphic from the final physical-device UI.
- [x] Add a real-device social screenshot showing fictional collectors commenting, with reporting and blocking controls visible.

## P1 — public website and legal pages

- [ ] Complete DNS/HTTPS activation for the prepared landing page, now published from `koltigin/seekase-site`; add the monitored support contact and final submission links.
- [ ] Complete legal review and publish the prepared English Privacy Policy covering Supabase Auth/Postgres/Storage, Helius verification requests, Solana public transactions, retention, deletion, and user rights.
- [ ] Complete legal review and publish the prepared English Terms of Use covering eligibility, user content, prohibited content, account action, external wallets, network fees, and liability boundaries.
- [ ] Publish the prepared Community Guidelines and reporting/moderation rules.
- [ ] Publish the prepared account/data deletion instructions; the same action is already reachable inside the app.
- [ ] Add policy/support URLs to the app, repository, store listing, and submission form.

Legal text must describe the actual shipped behavior and providers. Draft it after the P0 data flows are frozen, then obtain appropriate legal review before public launch.

## P2 — after the first submission path is secure

- [ ] Configure Google Cloud and Supabase provider credentials, then enable Google sign-in and explicit account linking.
- [ ] Apple sign-in and iOS packaging.
- [ ] Test Apple web OAuth on Android; keep native Apple authentication with the later iOS package.
- [ ] Push notification delivery for private messages after the in-app inbox is accepted.
- [ ] Optional NFT minting for earned achievements, with explicit fees and separate approval.
- [ ] Remote category catalog administration and moderated category suggestions.

These items must not delay a complete, honest Seeker-first Android submission unless the target program explicitly requires them.
