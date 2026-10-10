# Seekase Brand Guidelines v1.1

Date: 2026-09-30  
Status: approved production system; launcher, lockup, badges, navigation, and category icons validated on a physical Seeker.

## Brand idea

**Seekase is a living network of personal museums.** The identity combines the human motion of an `S`, the structural/cataloguing character of a `K`, and a small clay marker that represents one selected object or archive record.

The brand should feel editorial, collected and contemporary. It should not look like a marketplace, a wallet, an NFT exchange or a generic crypto application.

## Core assets

| Asset                                                                   | Purpose                                         |
| ----------------------------------------------------------------------- | ----------------------------------------------- |
| `assets/brand/seekase-app-icon.svg`                                     | Master square store icon composition            |
| `assets/brand/seekase-app-foreground.svg`                               | Android adaptive color foreground, 108 × 108    |
| `assets/brand/seekase-app-monochrome.svg`                               | Android themed-icon foreground, 108 × 108       |
| `assets/brand/seekase-mark-dark.svg`                                    | Transparent mark for dark surfaces              |
| `assets/brand/seekase-mark-light.svg`                                   | Transparent mark for light surfaces             |
| `assets/brand/seekase-wordmark-inverse.svg`                             | Transparent ivory wordmark for dark surfaces    |
| `assets/brand/seekase-wordmark-positive.svg`                            | Transparent ink wordmark for light surfaces     |
| `assets/brand/seekase-wordmark-dark.svg` / `seekase-wordmark-light.svg` | Wordmark preview panels                         |
| `assets/brand/seekase-lockup-dark.svg` / `seekase-lockup-light.svg`     | Mark + wordmark horizontal lockups              |
| `assets/brand/icons/*.svg`                                              | Navigation and action icon source set           |
| `assets/brand/badge-icon-paths.json`                                    | Canonical identity-specific badge geometry      |
| `assets/brand/badges/achievements/*.svg`                                | Individual verification and achievement exports |
| `assets/brand/badges/*.svg`                                             | Legacy family-level badge sources               |
| `assets/brand/brand-tokens.json`                                        | Portable color and geometry tokens              |
| `assets/brand/icon-manifest.json`                                       | Icon inventory and semantic restrictions        |

## Color

| Token         | Hex       | Use                                           |
| ------------- | --------- | --------------------------------------------- |
| Archive Black | `#161310` | Primary app and brand background              |
| Warm Ivory    | `#F3EEE4` | Primary logo, text and icon color on dark     |
| Clay Marker   | `#C47B6A` | Small emphasis only; never a large background |
| Light Paper   | `#F4F0E8` | Optional light-mode background                |
| Light Ink     | `#1A1713` | Mark/text on Light Paper                      |

The core mark must remain intelligible without Clay Marker. Monochrome applications use a single solid color.

## Mark construction and spacing

- Master construction canvas: `108 × 108` units.
- Android guaranteed safe area: centered `66 × 66` units.
- The S–K mark stays inside that safe area; the background extends edge-to-edge.
- Center launcher and avatar artwork optically, not only by geometric bounds. The approved master offset is `+0.7 x / -3.2 y` on the `108 × 108` full-size canvas; the adaptive foreground uses `+0.6 x / -2.55 y` after safe-area scaling.
- Minimum digital mark size: `24 px`; prefer `32 px` or larger.
- Clear space around a standalone mark: at least the width of the clay square.
- Do not rotate, outline, stretch, add shadows/gradients, recolor individual white strokes or move the clay square.

## Android launcher icon

Android adaptive icons use three resources:

1. A flat `#161310` background layer.
2. `seekase-app-foreground.svg` as the color foreground.
3. `seekase-app-monochrome.svg` as the themeable monochrome layer.

All layers are `108 × 108`. Important content remains inside the centered `66 × 66` safe zone so circular, squircle and OEM masks do not clip it. No background shadow or pre-applied mask belongs in the foreground source.

Launcher, store, and social-avatar exports must come from the optically centered masters. Do not independently drag the mark inside a platform upload tool; use the supplied square asset at 100% scale.

## Solana dApp Store exports

The publishing set must include:

- App icon: exactly `512 × 512`, PNG/JPEG/WebP.
- Banner: exactly `1200 × 600`, PNG/JPEG/WebP.
- Optional feature graphic: exactly `1200 × 1200`, PNG/JPEG/WebP.
- At least four screenshots/videos combined; screenshots are at least `1080 × 1080`.

The master SVG files are not submitted directly. Exported raster files should be generated from these masters and checked with the current publishing CLI before submission.

## Wordmark

The custom wordmark is a vector drawing, not live text. Use Warm Ivory on Archive Black. Prefer the horizontal lockup when width permits and the standalone mark for launcher icons, avatars and compact headers.

Minimum wordmark width: `120 px`. Minimum horizontal-lockup width: `180 px`.

## Typography

- The Seekase wordmark is custom artwork and must never be recreated by typing the name in a font.
- Product UI continues to use the platform-native sans-serif stack until a bundled font is explicitly selected and licensed.
- UI hierarchy: semibold display/title, regular body, medium metadata/action, uppercase tracked eyebrow only for short labels.
- Do not use ornamental museum serifs for controls, account screens or transactional information.
- Editorial serif typography may be explored later for campaign headlines, but it is not part of the production app system in v0.2.

## Verbal identity

Primary positioning sentence: **A living network of personal museums.**

Working short expression: **Collect. Curate. Discover.**

Voice principles:

- Curious, specific and respectful of the collector's knowledge.
- Editorial rather than promotional; show the object and its story before platform claims.
- Never imply that an item is for sale unless the collector explicitly states a future approved trade/offer status.
- Never use wallet language as a substitute for account or collector identity.
- Verification copy must state exactly what was verified.

## Interface icons

- Canvas: `24 × 24`.
- Standard stroke: `1.75` with round caps and joins.
- Optical padding: key geometry generally stays within `3–21`.
- Default color inherits from the interface; active state uses `ink`, inactive state uses `faint`.
- The Clay Marker is reserved for status/unread accents, not every icon.

The navigation family covers Discover, Collections, Add, Activity and Profile. The action family covers Search, Like, Save, Comment, Share, Camera, Wallet, Verified and Settings. New icons must reuse the same canvas, stroke and corner language.

The category family contains 68 catalog icons and the `All` browsing control. Canonical path data lives in `assets/brand/category-icon-paths.json`; individual SVG exports live in `assets/brand/icons/categories/`. Subcategories inherit their parent icon unless an evidence-based variant is approved under `docs/category-icon-system.md`.

## Badge semantics

- `wallet-verified.svg`: wallet-control proof only. It must never communicate Seeker/SGT ownership.
- `seeker-verified.svg`: reserved for genuine backend SGT verification. Do not display it for unavailable, pending or wallet-only states.
- `collector-milestone.svg`: account/catalog progress; it is not an NFT and does not imply on-chain ownership.
- `checkin-streak.svg`: earned verified check-in streak state.

Badge color and shape are deliberately distinct so private wallet state, public verification and product achievements do not collapse into one visual meaning.

Each published badge identity has its own `24 × 24` silhouette. The four older family-level badge images are retained as source history and fallback references; they are not reused for multiple visible achievements. In compact chips, draw the symbol directly on the dark surface at `24 px` using Warm Ivory with a small Clay Marker detail. Do not place it inside a dominant white tile. Badge text remains the accessible source of exact threshold meaning.

## Store and campaign assets

- `seekase-store-banner.svg`: editable `1200 × 600` dApp Store banner master.
- `seekase-feature-graphic.svg`: editable `1200 × 1200` feature graphic master.
- `exports/solana-dapp-store/banner-1200x600.png`: submission-ready banner raster.
- `exports/solana-dapp-store/feature-graphic-1200.png`: optional feature graphic raster.
- Store screenshots must use real app screens and real feature states. Do not compose screens that imply unavailable OAuth, SGT verification or marketplace functionality.

## Validation checklist

- Check launcher previews with circle, squircle and rounded-square masks.
- Check the monochrome layer under Android themed icons.
- Check the app icon at 48 px and the mark at 24 px.
- Check Warm Ivory contrast on Archive Black.
- Check tab icons on a physical Seeker in the actual navigation bar.
- Validate dApp Store raster dimensions with the current publishing CLI.
