# Phase 2H hardening follow-up

> Current consolidated status: [PROJE_DURUMU.md](../PROJE_DURUMU.md). This document retains technical/historical detail; earlier status statements may be superseded.


Working-tree changes following accepted checkpoint `a272c34a32da42e7fe1907b3f7d99ff2af9a9659`. No new checkpoint has been committed.

## Changes

- Stabilize `updateProfile`; wait for local hydration and synchronize once per signed-in user, ignoring cancelled profile requests. Token refresh does not reapply the cloud profile over local edits.
- Derive social toggles and local Activity in one pure reducer, then persist after React commits. Separate objects in the same cabinet keep separate Activity events.
- Add a composite foreign key tying each item's owner to its collection's owner.
- Treat SQL metadata UPDATE payloads as atomic shallow patches; omitted keys survive and explicit empty strings clear fields.
- Record the owner's product, account-provider, wallet, and badge priorities in `product-direction.md`.

## Validation

- TypeScript `--noEmit --incremental false`: passed.
- ESLint on changed TypeScript and tests: passed.
- Nine Vitest tests covering social/activity transitions, restore, replay, and metadata payloads: passed using the already installed Node 22 runtime.
- The default shell Node runtime cannot start the installed Vitest version; use a compatible Node 22 runtime. No packages were installed or upgraded.
- Use explicit test filenames from README. The broad `tests` filter also discovers inherited Anchor tests; its trial failed at missing `ANCHOR_PROVIDER_URL` before tests ran. No validator, deployment, or funding operation was started.
- SQL regression scenarios are provided in `supabase/tests/catalog_hardening.sql` but not executed: no local PostgreSQL runtime is available. No hosted migrations were applied.
- Expo Doctor is not installed locally and was not downloaded. Android emulator and device QA were not run.

## Remaining boundaries

Google/Apple buttons remain configuration-required placeholders; provider configuration and mobile callback implementation are still required. MWA and verification behavior are unchanged. Device catalog/social screens remain local. Cloud metadata updates require the new migration before use. Subsequent Phase 2I work is documented separately in `phase-2i-account-catalog.md`; this note describes the original hardening milestone.
