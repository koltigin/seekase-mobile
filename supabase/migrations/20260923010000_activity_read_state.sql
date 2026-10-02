-- Per-account Activity inbox read cursor. Private to the signed-in account.

create table public.activity_read_state (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default '1970-01-01T00:00:00Z',
  updated_at timestamptz not null default now()
);

create trigger activity_read_state_set_updated_at
  before update on public.activity_read_state
  for each row execute function public.set_updated_at();

alter table public.activity_read_state enable row level security;

create policy "activity_read_state_select_own"
  on public.activity_read_state for select
  using (auth.uid() = user_id);

create policy "activity_read_state_insert_own"
  on public.activity_read_state for insert
  with check (auth.uid() = user_id);

create policy "activity_read_state_update_own"
  on public.activity_read_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on table public.activity_read_state to authenticated;
