# Seekase Soulbound Achievements — Collection 01

Production artwork for Seekase's first achievement collection. The system treats each achievement as a small museum object: dark archival framing, warm ivory display surfaces, aged bronze structure, restrained clay accents and focused gallery lighting.

This is the mint-integration source. Every 2048 and 1024 NFT artwork carries the approved Seekase S/K mark as a small, consistent aged-bronze curator seal in the top-center frame medallion. The transparent 512 application symbols intentionally remain unbranded for small-size clarity.

The artwork contains no badge name, number, price language, Solana mark or Seeker mark. Titles and eligibility language belong in application UI and NFT metadata. These files provide artwork only; transfer restrictions, one-per-wallet enforcement and eligibility checks must be implemented and verified in the Metaplex Core minting flow.

## Deliverables

- `preview/collection-preview.png` — 2048 × 1024 collection overview
- `masters/<slug>.png` — 2048 × 2048 primary NFT artwork
- `1024/<slug>.png` — 1024 × 1024 delivery copy
- `icons/<slug>.png` — 512 × 512 transparent application symbol
- `manifest.json` — badge-to-file mapping, descriptions and core colors
- `generation-prompts.md` — final art-direction prompt set

## Usage

Use `masters/` for permanent NFT media and archival delivery. Use `1024/` only where a smaller square rendition is required. Use `icons/` inside compact application badge components; place them on a theme-aware neutral surface and do not add a white tile behind them.

Do not recolor individual pieces, add financial or trading language, place third-party chain or device marks inside the artwork, or mix these symbols with the earlier tiny UI badge pictograms.
