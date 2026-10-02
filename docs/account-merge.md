# Seekase account merge and recovery

Account merging is a recovery operation for one person who controls two Seekase accounts. It is not inferred from matching names, handles, device data, wallet labels, or collection content.

## Required proof

The user must prove control of both accounts in one short-lived merge request:

1. Sign in to the **destination account** that will remain.
2. Start account recovery. The backend creates a single-use, short-lived merge request.
3. Sign in to the **source account** that owns the old profile and collections.
4. Review both public profiles and exact row counts.
5. Explicitly confirm that the source profile, collections and social history will move to the destination.

For a wallet account, the normal SIWS message signature is the account proof. It is off-chain, sends no transaction and spends no SOL. Email/Google/Apple accounts use their normal Supabase login. A display name, handle, public UUID, screenshot, wallet connection without SIWS, or possession of the phone alone is never sufficient proof.

## Merge result

- Destination Supabase user ID remains the canonical account.
- Source profile fields may be selected as the destination public profile during review.
- Source collections and items move to the destination account atomically.
- Likes, saves, follows and comments are moved with duplicate rows removed.
- Source photo paths remain readable and manageable through an explicit legacy-storage-owner mapping; local device files are not uploaded or deleted.
- Private wallet identities move only after both account proofs. Raw wallet addresses remain absent from public tables.
- Source authentication identity is retired only after the database transfer succeeds and a destination session can be issued.
- A durable server-side audit row records source, destination, approval times and completion. It contains account UUIDs, not raw wallet addresses.

## Failure and cancellation

- Requests expire quickly and can be used once.
- Starting or previewing a request changes no catalog data.
- Any database error rolls back the complete transfer.
- A failed photo-access migration blocks completion rather than leaving inaccessible media.
- The UI must show exact source/destination profile names and counts before the final destructive confirmation.
- The operation is never triggered silently during ordinary sign-in or wallet linking.

## Current KolTigin recovery

Destination candidate: the currently open Wallet Verified account, `New Collector / @collector_e134bd45`.

Source candidate: `KolTigin / @mehmetkoltigin`, which owns `My objects` and `Kitaplığım` in the live development database.

Before enabling the merge, identify how the source account can be authenticated. If it is an email account, use that login. If it is an earlier wallet account, its SIWS login must resolve that source user. Do not change live ownership until both proofs succeed.

Historical code review clarified that the accepted Phase 2H checkpoint did not use a wallet signature to authenticate Supabase. MWA only opened a private device wallet session while Supabase authentication used email and password. Real SIWS wallet authentication was added later. Consequently, opening Vault in the old UI did not cryptographically bind the wallet to the old KolTigin Supabase user, and the same wallet cannot by itself prove ownership of that old account today.

During early development, the project owner may instead choose a complete cloud-data reset. That reset must be explicit and must remove uploaded account photos as well as auth users and cascading public rows. Device-local collections remain untouched. Afterward, the next SIWS login creates the single new canonical account. This option discards the old public profile and cloud catalog rather than merging them.
