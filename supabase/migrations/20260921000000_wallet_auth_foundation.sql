-- Private Solana wallet authentication foundation.
-- No raw wallet address is stored and no table is readable through the public API.
begin;

create table public.wallet_auth_challenges (
  request_id uuid primary key default gen_random_uuid(),
  wallet_lookup_hash text not null,
  nonce_hash text not null,
  signed_message_hash text not null,
  expected_fields jsonb not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint wallet_auth_challenges_wallet_hash_format
    check (wallet_lookup_hash ~ '^[0-9a-f]{64}$'),
  constraint wallet_auth_challenges_nonce_hash_format
    check (nonce_hash ~ '^[0-9a-f]{64}$'),
  constraint wallet_auth_challenges_message_hash_format
    check (signed_message_hash ~ '^[0-9a-f]{64}$'),
  constraint wallet_auth_challenges_expected_fields_object
    check (jsonb_typeof(expected_fields) = 'object'),
  constraint wallet_auth_challenges_expiry_after_creation
    check (expires_at > created_at),
  constraint wallet_auth_challenges_consumed_after_creation
    check (consumed_at is null or consumed_at >= created_at)
);

create index wallet_auth_challenges_expiry_idx
  on public.wallet_auth_challenges (expires_at)
  where consumed_at is null;

create index wallet_auth_challenges_wallet_idx
  on public.wallet_auth_challenges (wallet_lookup_hash, created_at desc);

create table public.wallet_identities (
  wallet_lookup_hash text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'solana',
  first_verified_at timestamptz not null default now(),
  last_verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint wallet_identities_wallet_hash_format
    check (wallet_lookup_hash ~ '^[0-9a-f]{64}$'),
  constraint wallet_identities_provider_check
    check (provider = 'solana'),
  constraint wallet_identities_user_wallet_unique
    unique (user_id, wallet_lookup_hash)
);

create index wallet_identities_user_idx on public.wallet_identities (user_id);

alter table public.wallet_auth_challenges enable row level security;
alter table public.wallet_identities enable row level security;

-- Intentionally no anon/authenticated policies. Only the Edge Function service role may access these rows.
revoke all on table public.wallet_auth_challenges from public, anon, authenticated;
revoke all on table public.wallet_identities from public, anon, authenticated;
grant select, insert, update, delete on table public.wallet_auth_challenges to service_role;
grant select, insert, update, delete on table public.wallet_identities to service_role;

-- Atomically consumes a challenge after the Edge Function has verified the Ed25519 signature.
create function public.consume_wallet_auth_challenge(
  challenge_request_id uuid,
  expected_wallet_lookup_hash text,
  expected_signed_message_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  consumed_count integer;
begin
  update public.wallet_auth_challenges
  set consumed_at = clock_timestamp()
  where request_id = challenge_request_id
    and wallet_lookup_hash = expected_wallet_lookup_hash
    and signed_message_hash = expected_signed_message_hash
    and consumed_at is null
    and expires_at > clock_timestamp();

  get diagnostics consumed_count = row_count;
  return consumed_count = 1;
end;
$$;

revoke all on function public.consume_wallet_auth_challenge(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.consume_wallet_auth_challenge(uuid, text, text)
  to service_role;

commit;
