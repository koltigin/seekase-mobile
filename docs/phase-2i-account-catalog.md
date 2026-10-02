# Phase 2I — initial account catalog milestone

> Current consolidated status: [PROJE_DURUMU.md](../PROJE_DURUMU.md). This document retains technical/historical detail; earlier status statements may be superseded.


Implemented in the working tree on 2026-09-17, following owner authorization to continue. Accepted Git HEAD remains `a272c34a32da42e7fe1907b3f7d99ff2af9a9659`; no commit or push was made.

## User flow

1. Continue using device collections without backend credentials or a wallet.
2. With Supabase configured, sign in using the existing email account flow.
3. Open **Account collections** from Collections, or **Open account collections** from Account.
4. Create a collection with category, optional collecting focus, tags, and description.
5. Open it to add objects with title, category, tags, story, year, maker, author, and provenance.
6. Read/edit those records or delete them with explicit confirmation. Deleting a cloud collection also deletes its cloud objects.
7. Refresh or sign in again to load saved account records.

The current schema makes cloud catalog rows publicly readable. The screen and editor explain this before saving. Existing local data is neither uploaded nor deleted. Photos, local-to-cloud import, public cloud discovery, social sync, messaging, and Google/Apple OAuth are not part of this milestone. The existing photo/template cover values are not presented as uploaded cloud photos.

## Boundaries

- `src/app/cloud-collections.tsx`: isolated account workspace, details, empty/error/loading states, editing and delete confirmation.
- `src/components/catalog/`: reusable form controls and catalog editor using shared category/theme helpers.
- `src/state/use-cloud-catalog.ts`: account-scoped React Query reads; explicit mutations with no automatic retries or offline queue. Concurrent button taps are guarded immediately.
- `src/services/cloud-catalog.ts`: catalog orchestration with no AsyncStorage, mock catalog, or wallet access.
- `src/repositories/cloud-access.ts`: checks the live authenticated user, requested account ID, schema version and profile before catalog operations.
- Repositories paginate owned rows, forward cancellation, keep ownership predicates on writes, and verify that deletes actually matched a row.
- Query cache, editor drafts and errors are isolated in a provider keyed by account ID; they are discarded on sign-out/account switch. Cancellation is best-effort: a write already committed on the server cannot be undone by aborting a request.
- On an uncertain network write result, refresh before retrying; writes are never silently repeated or redirected into the local catalog.

## Backend prerequisite

Apply all three migrations in timestamp order to a development Supabase project. The hardening migration provides the ownership constraint, atomic metadata patch behavior, and authenticated `catalog_schema_version()` function. The screen blocks catalog operations if the version check is missing or unexpected.

The owner created a Supabase project. Local `.env` is configured with the owner-provided public client credentials and remains gitignored. Read-only checks confirmed Auth connectivity, email enabled, and Google/Apple disabled. The owner applied the generated three-migration setup in SQL Editor and reported schema version 2 without errors. Subsequent anonymous read-only API checks returned HTTP 200 for profiles, collections, items, follows, and both like tables; both private save tables correctly denied anonymous access (HTTP 401 / PostgreSQL 42501). Authenticated CRUD and cross-account RLS still require verification. The third migration supplies explicit Data API table grants with RLS retained.

## Validation

- TypeScript no-emit check: passed.
- ESLint on changed/new code: passed.
- 30 tests across 5 files: passed using the already installed Node 22 runtime.
- Tests cover social/activity regression, metadata patch payloads, account/schema guards, cancellation, all six CRUD action paths, failure propagation, pagination, owner filters, and delete confirmation at the HTTP contract level.
- Repository tests use the real Supabase client with a fake fetch transport; they do not prove hosted RLS or SQL execution.
- `supabase/tests/catalog_hardening.sql` provides transactional SQL scenarios. They remain unexecuted: no PostgreSQL runtime/image is installed locally, and the regression SQL has not yet been executed on the hosted development project.
- Android emulator was not started. Physical-device visual QA and live account/session CRUD tests remain pending. No dependencies, wallet flows, Mainnet behavior, or repository visibility were changed.

## Next verification once the project is connected

Create two development accounts using the enabled email provider. Verify collection/item persistence across sessions, rejection of cross-owner writes, empty/missing-row behavior, explicit deletes, metadata preservation, and unchanged local data. Exercise the screen in Light/Dark on a physical device before treating this as an accepted checkpoint.


## Simplified object entry (2026-09-18, uncommitted)

- Add explicitly offers account or device storage. Both use the same short object editor: searchable category and object name, with optional details collapsed for new objects.
- The catalog now includes vaping devices, tobacco memorabilia, household objects, kitchenware, tools, pens, stationery, perfume packaging, textiles, instruments, dolls, decorations, tickets, awards and ceremonial objects. Custom category names are stored as `other` plus free-form subcategory; categories remain open-ended.
- Books expose author/publisher/year; electronics and models expose manufacturer/model/year; coins and stamps expose issuer/country/year. Existing populated metadata stays editable when categories change.
- Collection selection is optional. Unassigned objects go into a visible `My objects` collection. The cloud path reuses a matching owned group or creates one before adding the item. These are two requests: failure can leave an empty group, which is retained and reused. Concurrent first adds from different devices can create two default groups; consolidation is deferred. No retries, automatic deletion or local fallback writes are introduced.
- Account objects can be moved using collection selection in Edit object. Existing local edit supports collection changes.
- Photo upload remains unimplemented; the short form does not offer a nonfunctional photo control. No SQL migration is needed for this milestone.
- Validation: TypeScript, scoped ESLint and diff whitespace checks passed. 35 tests across 5 files passed, including direct-add default-group creation/reuse, failure retention and cancellation. Physical Seeker is connected, but its screenshot is black (screen off/locked); new-flow visual and live save verification is pending. No emulator or dependency installation was used.


## Object-entry follow-up

- Other/custom category names are optional, so existing default groups can be edited without inventing a category name.
- Detail views retain populated metadata after category changes and show the stamp issuer supplied by the short form; equivalent year/country labels are deduplicated.
- Profile now links directly to account settings and account collections.
- Discover category badges have explicit inset positioning, and collector interest text reserves two scaled lines to align Follow controls. These layout changes still require visual confirmation on device.
- Validation: 39 tests across 6 files passed, TypeScript and scoped ESLint passed, diff whitespace check passed. Seeker reconnected and the current Android JavaScript bundle compiled successfully through Metro over USB. Screen captures were black, so visual and live CRUD checks remain pending.
