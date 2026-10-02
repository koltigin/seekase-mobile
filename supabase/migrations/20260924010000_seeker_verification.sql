-- Private Seeker Genesis Token verification and a minimal public badge projection.
-- Raw wallet addresses, token accounts, and SGT mint addresses are never stored.
begin;

create table public.seeker_verifications (
  user_id uuid primary key references auth.users (id) on delete cascade,
  wallet_lookup_hash text not null references public.wallet_identities (wallet_lookup_hash) on delete cascade,
  sgt_mint_lookup_hash text unique,
  status text not null,
  checked_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seeker_verifications_wallet_hash_format
    check (wallet_lookup_hash ~ '^[0-9a-f]{64}$'),
  constraint seeker_verifications_mint_hash_format
    check (sgt_mint_lookup_hash is null or sgt_mint_lookup_hash ~ '^[0-9a-f]{64}$'),
  constraint seeker_verifications_status_check
    check (status in ('verified', 'not_verified')),
  constraint seeker_verifications_verified_mint_check
    check ((status = 'verified') = (sgt_mint_lookup_hash is not null)),
  constraint seeker_verifications_expiry_check
    check (expires_at > checked_at)
);

create index seeker_verifications_expiry_idx on public.seeker_verifications (expires_at);

create table public.collector_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null,
  awarded_at timestamptz not null,
  expires_at timestamptz not null,
  primary key (user_id, badge_id),
  constraint collector_badges_supported_badge_check
    check (badge_id = 'seeker-genesis'),
  constraint collector_badges_expiry_check
    check (expires_at > awarded_at)
);

create index collector_badges_public_idx on public.collector_badges (badge_id, expires_at desc);

alter table public.seeker_verifications enable row level security;
alter table public.collector_badges enable row level security;

-- Verification evidence remains service-role only.
revoke all on table public.seeker_verifications from public, anon, authenticated;
grant select, insert, update, delete on table public.seeker_verifications to service_role;

-- Public surfaces may read only the derived badge row. No wallet or mint data exists here.
revoke all on table public.collector_badges from public, anon, authenticated;
grant select on table public.collector_badges to anon, authenticated;

create policy collector_badges_read_active
  on public.collector_badges
  for select
  to anon, authenticated
  using (expires_at > now());

-- Applies one server-verified result atomically. A transferred SGT revokes the old
-- account's derived badge before assigning it to the current verified owner.
create function public.apply_seeker_verification(
  expected_user_id uuid,
  expected_wallet_lookup_hash text,
  verified_mint_lookup_hash text,
  verification_checked_at timestamptz,
  verification_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_user_id uuid;
begin
  if verification_expires_at <= verification_checked_at then
    raise exception 'Invalid verification expiry';
  end if;

  if not exists (
    select 1
    from public.wallet_identities
    where wallet_lookup_hash = expected_wallet_lookup_hash
      and user_id = expected_user_id
  ) then
    raise exception 'Wallet identity does not belong to this user';
  end if;

  if verified_mint_lookup_hash is not null then
    perform pg_advisory_xact_lock(hashtextextended(verified_mint_lookup_hash, 0));

    select user_id into previous_user_id
    from public.seeker_verifications
    where sgt_mint_lookup_hash = verified_mint_lookup_hash
      and user_id <> expected_user_id
    for update;

    if previous_user_id is not null then
      delete from public.collector_badges
      where user_id = previous_user_id and badge_id = 'seeker-genesis';

      update public.seeker_verifications
      set status = 'not_verified',
          sgt_mint_lookup_hash = null,
          checked_at = verification_checked_at,
          expires_at = verification_expires_at,
          updated_at = now()
      where user_id = previous_user_id;
    end if;

    insert into public.seeker_verifications (
      user_id,
      wallet_lookup_hash,
      sgt_mint_lookup_hash,
      status,
      checked_at,
      expires_at
    ) values (
      expected_user_id,
      expected_wallet_lookup_hash,
      verified_mint_lookup_hash,
      'verified',
      verification_checked_at,
      verification_expires_at
    )
    on conflict (user_id) do update
      set wallet_lookup_hash = excluded.wallet_lookup_hash,
          sgt_mint_lookup_hash = excluded.sgt_mint_lookup_hash,
          status = excluded.status,
          checked_at = excluded.checked_at,
          expires_at = excluded.expires_at,
          updated_at = now();

    insert into public.collector_badges (user_id, badge_id, awarded_at, expires_at)
    values (expected_user_id, 'seeker-genesis', verification_checked_at, verification_expires_at)
    on conflict (user_id, badge_id) do update
      set awarded_at = excluded.awarded_at,
          expires_at = excluded.expires_at;
  else
    insert into public.seeker_verifications (
      user_id,
      wallet_lookup_hash,
      sgt_mint_lookup_hash,
      status,
      checked_at,
      expires_at
    ) values (
      expected_user_id,
      expected_wallet_lookup_hash,
      null,
      'not_verified',
      verification_checked_at,
      verification_expires_at
    )
    on conflict (user_id) do update
      set wallet_lookup_hash = excluded.wallet_lookup_hash,
          sgt_mint_lookup_hash = null,
          status = 'not_verified',
          checked_at = excluded.checked_at,
          expires_at = excluded.expires_at,
          updated_at = now();

    delete from public.collector_badges
    where user_id = expected_user_id and badge_id = 'seeker-genesis';
  end if;
end;
$$;

revoke all on function public.apply_seeker_verification(uuid, text, text, timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.apply_seeker_verification(uuid, text, text, timestamptz, timestamptz)
  to service_role;

commit;
