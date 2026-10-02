-- Verified, fee-only Solana daily check-ins.
-- The wallet address remains in the private wallet identity table as an HMAC lookup hash.
begin;

create table public.daily_checkin_challenges (
  request_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expected_memo text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint daily_checkin_challenges_memo_format
    check (expected_memo ~ '^seekase:check-in:v1:[0-9a-f-]{36}$'),
  constraint daily_checkin_challenges_expiry_after_creation
    check (expires_at > created_at),
  constraint daily_checkin_challenges_consumed_after_creation
    check (consumed_at is null or consumed_at >= created_at)
);

create index daily_checkin_challenges_user_created_idx
  on public.daily_checkin_challenges (user_id, created_at desc);

create index daily_checkin_challenges_expiry_idx
  on public.daily_checkin_challenges (expires_at)
  where consumed_at is null;

create table public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  checkin_day date not null,
  transaction_signature text not null unique,
  network text not null default 'devnet',
  block_time timestamptz not null,
  created_at timestamptz not null default now(),
  constraint daily_check_ins_one_per_day unique (user_id, checkin_day),
  constraint daily_check_ins_network_check check (network = 'devnet'),
  constraint daily_check_ins_signature_format
    check (transaction_signature ~ '^[1-9A-HJ-NP-Za-km-z]{80,90}$')
);

create index daily_check_ins_user_day_idx
  on public.daily_check_ins (user_id, checkin_day desc);

alter table public.daily_checkin_challenges enable row level security;
alter table public.daily_check_ins enable row level security;

-- Challenges are server-only. They contain no raw wallet address, but clients do not need direct access.
revoke all on table public.daily_checkin_challenges from public, anon, authenticated;
grant select, insert, update, delete on table public.daily_checkin_challenges to service_role;

-- A signed-in user may read only their own verified history. Inserts remain server-only.
revoke all on table public.daily_check_ins from public, anon, authenticated;
grant select on table public.daily_check_ins to authenticated;
grant select, insert, update, delete on table public.daily_check_ins to service_role;

create policy daily_check_ins_select_own
  on public.daily_check_ins
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create function public.consume_daily_checkin_challenge(
  challenge_request_id uuid,
  expected_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  consumed_count integer;
begin
  update public.daily_checkin_challenges
  set consumed_at = clock_timestamp()
  where request_id = challenge_request_id
    and user_id = expected_user_id
    and consumed_at is null
    and expires_at > clock_timestamp();

  get diagnostics consumed_count = row_count;
  return consumed_count = 1;
end;
$$;

revoke all on function public.consume_daily_checkin_challenge(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.consume_daily_checkin_challenge(uuid, uuid)
  to service_role;

commit;
