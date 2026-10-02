# Production data and safe updates

This document defines where Seekase production data lives and how releases must preserve it.

## Storage boundary

- The static `seekase.app` website contains only public product, support, and policy pages. GitHub Pages stores no account, wallet, collection, message, or authentication data.
- Supabase Auth stores account sessions and identity-provider links.
- Supabase Postgres stores profiles, collections, object metadata, social relationships, moderation records, participant-only messages, wallet verification attestations, and check-in records.
- Supabase Storage stores user-uploaded profile and collection images. Public catalog media is readable as public content; private media must use a private bucket, RLS, and short-lived signed URLs.
- Solana Mainnet stores only public transactions such as daily check-in Memo transactions. Recovery phrases and private keys never leave the wallet.
- Server-only values such as the Supabase service role, wallet hash pepper, private RPC credentials, and provider secrets belong in Supabase Edge Function secrets. They must never enter the mobile bundle, website, Git repository, screenshots, logs, or support messages.

## Access rules

- Enable RLS on every user-data table and test owner, participant, public, and third-party access separately.
- Public collection photos are intentionally public. Private messages are readable only by their two participants.
- The mobile app receives only publishable client configuration. Service-role access remains inside Edge Functions.
- Account deletion removes owned database rows and Storage objects through the documented server path.

## Release procedure without data loss

1. Keep the Android package id, production Supabase project, storage bucket names, and account identifiers stable.
2. Test every schema change on a staging project with representative, non-personal fixtures.
3. Prefer additive migrations: create nullable columns/tables and backfill before enforcing stricter constraints. Never reset or recreate the production database for an app update.
4. Take and verify a logical backup before production migrations. Use paid daily backups or PITR once real users depend on the service.
5. Apply versioned migrations once, deploy backward-compatible Edge Functions, then release the APK with a higher `versionCode`.
6. Verify old and new app versions during the rollout window. Remove compatibility paths only after the previous client is no longer supported.
7. Keep uploads at stable object paths and perform Storage changes through the Storage API, not direct writes to the storage schema.
8. Test upgrade installation over the previous signed APK. Do not uninstall the app during upgrade acceptance because uninstalling removes device-only data.
9. For each Solana dApp Store update, create a new Release NFT for the same application identity and submit the new signed release.
10. Monitor errors, database/storage usage, failed uploads, Edge Function failures, and backup status after every release. Document a rollback decision before deployment.

## Initial operating plan

- The free Supabase tier is suitable for development and submission fixtures, subject to its current quotas and inactivity behavior.
- Start the first public release on the free tier while usage is small. Do not commit to the paid plan before real demand justifies it.
- Compress uploads on-device, enforce image size/type limits, and review database, Storage, egress, function, and active-user usage weekly.
- Create regular encrypted logical database exports and a separate copy of Storage objects. A database backup alone does not contain the uploaded image bytes.
- Reassess the managed Pro plan before the app has dependable daily users, approaches 70% of a free quota, or needs guaranteed non-pausing and managed downloadable backups. Configure spending alerts before upgrading.
- Cloudflare R2 is a future option for an off-site backup or high-volume public media because it is S3-compatible and has a larger free storage allowance. Do not split the live upload path until backup/restore, access control, deletion, and migration behavior are tested.
- Do not self-host the production stack for the first release. Self-hosting transfers patching, TLS, firewalling, SMTP, monitoring, uptime, Postgres maintenance, object storage, backups, restores, and incident response to the project owner and is unlikely to be cheaper at this scale.
- Separate staging and production projects. Test migrations, RLS, Edge Functions, OAuth callbacks, and Storage policies in staging first.
- Review Supabase Security Advisor and Performance Advisor before launch and after material schema changes.
