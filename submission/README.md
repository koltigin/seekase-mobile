# Seekase submission package

Prepared for the first Android / Solana Mobile submission path.

## Deliverables in this folder

- `Seekase-Android-1.0.0.apk` — release-signed standalone Android build installed and tested on a physical Solana Seeker. This local binary is intentionally ignored by Git and must be distributed through the submission portal or release storage.
- `Seekase-CLOCK-IN-Pitch-Deck.pdf` — final eight-slide, 16:9 English pitch deck.
- `pitch-deck.html` — editable source for the pitch deck.
- `Seekase-Core-Demo-Raw.mp4` — clean physical-device footage covering the public object, collection, Discover, category catalog, and collector profile. This local raw video is intentionally ignored by Git; wallet entry, Mainnet check-in, narration, and final edit still need to be recorded.
- `checksums.txt` — SHA-256 values for the APK and pitch deck.

## Related assets

- Store screenshots: `assets/brand/exports/solana-dapp-store/screenshots/en-US/`
- Store icon, banner, and feature graphic: `assets/brand/exports/solana-dapp-store/`
- Demo script: `docs/demo-script.md`
- Public website source: `site/`

## Verified build

- Build: local EAS production build using the existing remote release keystore
- APK SHA-256: `d15a21a13541bffad7db29757df717df027f53626206c00a5f92118df8590983`
- Android package: `com.seekase.app`
- Version: `1.0.0` (`versionCode` 1)
- Minimum Android SDK: 24
- Target Android SDK: 36
- APK Signature Scheme: v2
- Physical acceptance: the final 2 October build uses the accepted production signing certificate, installed over the existing release on Seeker `SM02E4060329747`, cold-started without Metro, restored the live Discover session, and loaded remote collection photographs successfully.

## Still required before submission

1. Record wallet entry and Mainnet check-in, then edit them together with `Seekase-Core-Demo-Raw.mp4`, narration, and the final title card.
2. Publish `seekase.app` after DNS and the monitored support contact are configured.
3. Publish the prepared sanitized source repository or grant the judges access.
4. Complete the final submission form with the exact APK, source, video, deck, and website URLs.
