# Seekase submission package

Prepared for the first Android / Solana Mobile submission path.

## Deliverables in this folder

- `Seekase-Android-1.0.0.apk` — release-signed standalone Android build installed and tested on a physical Solana Seeker. This local binary is intentionally ignored by Git and must be distributed through the submission portal or release storage.
- `Seekase-CLOCK-IN-Pitch-Deck.pdf` — final eight-slide, 16:9 English pitch deck.
- `pitch-deck.html` — editable source for the pitch deck.
- `Seekase-Core-Demo-Raw.mp4` — clean physical-device footage covering the public object, collection, Discover, category catalog, and collector profile. This local raw video is intentionally ignored by Git; wallet entry, Mainnet check-in, narration, and final edit still need to be recorded.
- `checksums.txt` — SHA-256 values for the APK, pitch deck, and raw demo footage.

## Related assets

- Public submission source candidate: `https://github.com/koltigin/seekase-mobile` (the prepared sanitized update still needs publication)
- Store screenshots: `assets/brand/exports/solana-dapp-store/screenshots/en-US/`
- Store icon, banner, and feature graphic: `assets/brand/exports/solana-dapp-store/`
- Demo script: `docs/demo-script.md`
- Public website source: separate repository `https://github.com/koltigin/seekase-site`

## Verified build

- Build: local EAS production build on 5 October 2026 using the existing production release keystore
- APK SHA-256: `71f8a9570c58627ded255e1a409e4539e219595c5a9d08f36fd97dcbb08af61f`
- Android package: `com.seekase.app`
- Version: `1.0.0` (`versionCode` 1)
- Minimum Android SDK: 24
- Target Android SDK: 36
- APK Signature Scheme: v2
- Signing certificate SHA-256: `5b3d819699fd42c3131dda187faf32b695dda8c378995e00bc979de784fc2d1c`
- Automated acceptance: TypeScript, Expo lint, `git diff --check`, and all 140 tests in 31 files passed on 5 October 2026. Expo Doctor passed 20/21 checks and reported only three Expo SDK patch-version mismatches.
- Physical installation: installed as a data-preserving update on Seeker `SM02E4060329747` and started without Metro. The final Brand Kit lockup, policy links, support email, Instagram, X, version and maker signature were visually accepted.

## Still required before submission

1. Record wallet entry and Mainnet check-in, then edit them together with `Seekase-Core-Demo-Raw.mp4`, narration, and the final title card.
2. Complete the disposable-account deletion acceptance test when a safe test account is available.
3. Publish the prepared sanitized source and website candidates, then complete the final submission form with the exact APK, source, video, deck, and `https://seekase.app` URLs.
