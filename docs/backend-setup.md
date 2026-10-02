# Seekase backend setup (Supabase)

Phase 2H foundation plus the initial Phase 2I account catalog milestone. No real credentials belong in this repository.

## 1. Create a Supabase project

1. Open the Supabase dashboard and create a project.
2. Note the project region; keep development on a non-production project.

## 2. Obtain client credentials

From **Project Settings → API**:

- Project URL → `EXPO_PUBLIC_SUPABASE_URL`
- `anon` / publishable key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Never put the **service-role** key or database password in the mobile app.

## 3. Configure local environment

```bash
cp .env.example .env
```

Fill in URL and anon key. `.env` is gitignored.

Placeholder values in `.env.example` are treated as “not configured”; the app stays in local mode.

## 4. Apply migrations

From the Supabase SQL editor (or CLI):

```bash
# If using Supabase CLI linked to the project:
supabase db push
```

Or paste/run:

1. `supabase/migrations/20260914000000_init_seekase.sql`
2. `supabase/migrations/20260915000000_harden_catalog.sql`
3. `supabase/migrations/20260917000000_catalog_api_grants.sql`
4. `supabase/migrations/20260920000000_item_photo_storage.sql`
5. `supabase/migrations/20260921000000_wallet_auth_foundation.sql`
6. `supabase/migrations/20260922000000_comments.sql`
7. `supabase/migrations/20260922010000_profile_links.sql`
8. `supabase/migrations/20260923000000_moderation.sql`
9. `supabase/migrations/20260923010000_activity_read_state.sql`
10. `supabase/migrations/20260923020000_daily_checkins.sql`
11. `supabase/migrations/20260924000000_daily_checkin_networks.sql`
12. `supabase/migrations/20260924010000_seeker_verification.sql`

Run migrations in timestamp order. The third migration explicitly grants the Data API permissions required by the app, while retaining RLS and private saves; it does not depend on project default privileges. The second migration enforces item/collection owner equality and makes metadata updates atomic shallow patches: omitted fields are preserved; an empty string clears a displayed field. The client metadata update contract requires this migration. It also exposes `catalog_schema_version() = 2` to authenticated users. The account catalog screen checks this before allowing cloud operations.

The owner applied the initial three-migration bundle to the development project on 2026-09-17 and reported schema version 2. Anonymous API reads were verified; authenticated CRUD and SQL regression checks remain pending. If existing items have a different owner than their parent collection, it fails transactionally without deleting or reassigning records. Inspect inconsistencies before retrying:

```sql
select i.id, i.owner_id, i.collection_id, c.owner_id as collection_owner
from public.items i
join public.collections c on c.id = i.collection_id
where i.owner_id <> c.owner_id;
```

Regression SQL is in `supabase/tests/catalog_hardening.sql`. Run only against a disposable development database after all three migrations; its fixtures are rolled back.

This creates profiles, collections, items, social tables, indexes, RLS policies, photo storage rules, public account
comments, and the private wallet-auth foundation. Comments require an authenticated author to write and can only be
changed or deleted by that author. They contain no wallet fields. The wallet-auth migration does not enable wallet login by itself; its tables have no
anon/authenticated policies and are reserved for the server-side Edge Function.

## 5. Configure email auth

In **Authentication → Providers → Email**:

- Enable Email provider
- For development you may disable “Confirm email” to get an immediate session after sign-up
- Do not log passwords; Auth stores credentials in Supabase Auth only

## 6. Run the app

```bash
npx expo start
```

Without valid env, Seekase continues in **local mode** (device AsyncStorage catalog/social).

With valid env:

- Welcome → **Email account** → `/account`
- Sign up / sign in restores session via AsyncStorage
- Profile row is ensured on first authenticated session
- Account → **Open account collections**, or Collections → **Account collections**
- Create/edit/delete account collections and objects; refresh or re-open after sign-in to load the saved rows
- Rows are publicly readable under current RLS; the screen states this before saving
- Missing hardening migration or failed requests show an error; no local fallback writes occur

## 7. Verify RLS

In the SQL editor, confirm RLS is enabled on:

- `profiles`, `collections`, `items`
- `follows`, `item_likes`, `item_saves`, `collection_likes`, `collection_saves`

Checks:

- Public/authenticated can read profiles, collections, items, follows, likes
- Saves are **owner-only** select
- Insert/update/delete require `auth.uid()` ownership

## 8. What is deferred

- Google / Apple OAuth provider setup and mobile callback implementation
- Automatic local catalog import to cloud
- Bidirectional offline sync
- Realtime
- Push notifications
- Push notifications for private direct messages
- Google / Apple account linking

## 9. Identity rules

- Seekase Account ≠ Wallet ≠ public collector profile
- `profiles` has **no** wallet address, SGT mint, `.skr`, or balances
- Wallet remains under `/collector-identity` (Phase 2G)

## 10. Product and account roadmap

See [product direction](product-direction.md) for Google/Apple account entry, Seeker-first wallet priorities, future EVM support, and separate SGT/non-SGT badges. Those plans do not enable OAuth providers or wallet-based Supabase authentication in the current build.

## 11. Wallet-auth Edge Function

After applying `20260921000000_wallet_auth_foundation.sql`, configure server-only secrets and deploy
`supabase/functions/wallet-auth`. Never use these values in an `EXPO_PUBLIC_*` variable:

- `WALLET_AUTH_PEPPER`: at least 32 random characters, retained for the lifetime of wallet mappings.
- `WALLET_AUTH_DOMAIN`: the exact SIWS domain accepted by the backend.
- `WALLET_AUTH_URI`: the HTTPS application/auth URI belonging to that domain.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are supplied by the hosted Edge Function environment. The service-role
key and pepper must never enter the APK, Git history, screenshots, logs, or public submission repository.

The function defaults SIWS `chainId` to `solana:devnet`. The active physical-device environment was moved to
Mainnet on 24 September 2026 with `WALLET_AUTH_SOLANA_NETWORK=mainnet`, together with the matching app and
daily-check-in configuration. The stable `wallet-auth` function name was redeployed; no duplicate endpoint was
created. Other environments must still set their network explicitly and consistently.

## 12. Seeker Genesis Token verification

The private Mainnet SGT verifier, derived public badge, required Helius secret, deployment order, and physical acceptance test are documented in [seeker-verification.md](seeker-verification.md). Keep `EXPO_PUBLIC_SEEKER_VERIFICATION_ENABLED=false` until its migration, secret, and Edge Function are all live.

## 13. Account deletion

Deploy `supabase/functions/delete-account` under the stable `delete-account` name. The function requires the current authenticated session and the exact `DELETE` confirmation. It removes every file under the account's private `item-images/<user-id>/` folder before deleting the Supabase Auth user; database cascades then remove the online profile, catalog, social data, private wallet link, verification state, and badges. If Storage cleanup fails, account deletion stops instead of leaving owned photos behind.

Collections stored only on the phone remain on that phone. The app requires typed confirmation and a second destructive confirmation dialog. Test the complete destructive flow only with a disposable account.
