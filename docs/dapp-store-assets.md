# Solana dApp Store asset plan

## Canonical source

All store artwork must come from `assets/brand/`. Do not create another logo, badge, or icon family for the listing.

Current exports:

- App icon: `assets/brand/exports/solana-dapp-store/icon-512.png` (512 × 512)
- Feature graphic: `assets/brand/exports/solana-dapp-store/feature-graphic-1200.png` (1200 × 1200)
- Portal banner: `assets/brand/exports/solana-dapp-store/banner-1024x500.png` (1024 × 500)
- Existing banner master: `assets/brand/exports/solana-dapp-store/banner-1200x600.png`
- Approved onboarding art: the three files in `assets/onboarding/`

The current Publisher Portal validation must be checked immediately before upload. The current Solana Mobile publishing tooling requires at least four screenshots or videos. Prepare portrait screenshots at 1080 × 1920, with one orientation and aspect ratio across the complete set. The current CLI release notes describe a 1024 × 500 banner; that portal-ready derivative has been exported from the canonical banner master.

## Fictional demo community

Use **Ada Moreau** (`@ada_moreau`) as the primary store-demo account. The live demo community also includes **Elise Chen** (`@elise_studio`), **Kenji Sato** (`@kenji_press`) and **Lina Voss** (`@lina_cabinet`). Their collections, follows, likes and comments were created through normal authenticated application paths. They are fictional demo identities and do not claim Seeker Genesis ownership.

Recommended public cabinets:

1. First Edition Science Fiction
2. 80s & 90s Portable Tech
3. Ottoman & Early Republic Coins
4. Quiet European Marks

Use only original Seekase artwork or images whose usage rights are documented. Do not show private wallet addresses, email addresses, real notifications, seed phrases, API keys or test controls.

## Screenshot sequence

All screenshots are captured from the real Android app on the physical Seeker after the final release build is installed.

1. **Your collections, your story** — approved onboarding cabinet illustration.
2. **Meet fellow collectors** — approved two-collector illustration.
3. **Build your collector identity** — approved adult collector and Seeker illustration.
4. **Discover living cabinets** — populated Discover feed, category chips, collector and collection cards.
5. **A collector profile** — Ada Moreau profile with avatar, real catalog totals, compact verified badges and cabinet grid.
6. **Inside a cabinet** — one collection detail with cover, story, objects and social actions.
7. **Every object has context** — one object detail with image, author/maker metadata, date, story and provenance.
8. **Browse every kind of collection** — Collections catalog with the canonical category icon family.
9. **Connect through objects** — a real object detail showing a fictional collector comment, comment composer, reporting and blocking controls.

Keep Daily Check-in / Collector Identity as a supporting capture only, unless the final screen clearly explains the Solana action and contains no transient error or network warning.

## Capture rules

- Use the final signed production APK and the same English locale for every shot.
- Capture at native portrait resolution; crop/resize only after preserving the full UI safe area.
- Hide Android developer overlays, screenshot tool controls, debug labels, status errors and temporary loading states.
- Keep displayed times, counts and object names internally consistent across Discover, profile and detail screens.
- Store raw captures separately from final 1080 × 1920 exports.
- Do not place marketing claims over screenshots that the app cannot demonstrate.

## Output layout

```text
assets/brand/exports/solana-dapp-store/
  icon-512.png
  banner-1024x500.png
  feature-graphic-1200.png
  screenshots/
    raw/
    en-US/
      01-onboarding-collections.png
      02-onboarding-community.png
      03-onboarding-identity.png
      04-discover.png
      05-profile.png
      06-collection.png
      07-object.png
      08-categories.png
      09-comments.png
      10-messages.png
```

## Acceptance

- At least four valid screenshots or videos are present; the prepared target set contains ten screenshots.
- Every final screenshot is 1080 × 1920 and shares the same portrait ratio.
- Icon, banner and feature graphic pass the current Publisher Portal checks.
- Screenshots show working release behavior and fictional demo content only.
- Final APK, screenshots, privacy policy, support URL and website use the same Seekase identity.
