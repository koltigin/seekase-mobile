# Seekase brand integration map

Status date: 10 October 2026
Status: Seekase Brand System v1.1.2; launcher and social-avatar optical centering updated, physical-device recheck pending.

The canonical brand source lives in `assets/brand/`. Do not redraw or export a second logo family in another folder. New website, Android, store, deck, and badge outputs must be derived from these masters.

## Canonical assets

| Use                          | Canonical source                                                | Current integration                                                              |
| ---------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| App/store master mark        | `seekase-app-icon.svg`                                          | Approved v1 source; exported for Android and store use                           |
| Android legacy icon          | `exports/android/icon-1024.png`                                 | Connected through `app.json`                                                     |
| Android adaptive foreground  | `exports/android/adaptive-foreground.png`                       | Connected through `app.json`                                                     |
| Android themed icon          | `exports/android/adaptive-monochrome.png`                       | Connected through `app.json`                                                     |
| Dark/light standalone mark   | `seekase-mark-dark.svg`, `seekase-mark-light.svg`               | Website/favicon and presentation source                                          |
| Wordmark                     | `seekase-wordmark-inverse.svg`, `seekase-wordmark-positive.svg` | Website, deck, and campaign source                                               |
| Horizontal lockup            | `seekase-lockup-dark.svg`, `seekase-lockup-light.svg`           | Website plus onboarding and account-entry screens                                |
| dApp Store icon              | `exports/solana-dapp-store/icon-512.png`                        | Final 512 × 512 export; launcher mark approved on physical Seeker                |
| Social profile avatar        | `exports/social/avatar-1024.png`                                | Optically centered square source for X and other circular profile crops          |
| dApp Store banner            | `exports/solana-dapp-store/banner-1024x500.png`                 | Final portal derivative from the canonical banner master                         |
| Feature graphic              | `exports/solana-dapp-store/feature-graphic-1200.png`            | Final 1200 × 1200 export                                                         |
| Navigation/action icons      | `icons/*.svg`                                                   | Source family represented by code-native equivalents in the signed Android build |
| Category icons               | `category-icon-paths.json`, `icons/categories/*.svg`            | All 68 catalog categories plus `All` integrated and device-validated             |
| Verification/progress badges | `badge-icon-paths.json`, `badges/achievements/*.svg`            | 15 distinct identities integrated; replaces four repeated family thumbnails      |
| Color/geometry rules         | `brand-tokens.json`, `icon-manifest.json`                       | Reference for all future exports and UI implementation                           |

## Rules

- Preserve Archive Black `#161310`, Warm Ivory `#F3EEE4`, and Clay Marker `#C47B6A` as the core palette.
- Keep the launcher mark inside the Android adaptive safe area and test circle, squircle, rounded-square, and monochrome masks on a physical Seeker.
- `Wallet Verified` artwork means wallet-control proof only.
- `Seeker Verified` artwork is shown only after the backend confirms genuine SGT eligibility.
- Milestone and streak graphics are product achievements; they do not imply an NFT or an on-chain asset.
- Do not use Solana Mobile or Seeker trademarks in a way that implies official endorsement.
- Do not replace real app screenshots with mock screens that show unavailable features.

## v1 acceptance record

- The release-signed standalone APK was installed and reviewed on a physical Seeker without Metro.
- Launcher, onboarding/account lockup, navigation, verification/progress badges, and category icons were accepted in the dark production theme.
- Ten real-device portrait store captures were exported at 1080 × 1920, including public comments and the private collector inbox. The object-detail title and photograph were recaptured and verified as a matching pair.
- Core v1 source hashes are frozen in `assets/brand/brand-release.json`.
- Later changes must increment the brand version and regenerate affected hashes and exports.

The signed Android build includes the complete v1 brand integration. Store-listing content QA, publishing, demo video, and legal/site publication are release operations rather than missing brand-system components.
