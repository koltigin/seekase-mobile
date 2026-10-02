-- Seekase user safety: private blocks and private content reports.
-- Reports are not public content. Wallet identity remains separate.

create table public.user_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_no_self check (blocker_id <> blocked_id)
);

create index user_blocks_blocked_id_idx on public.user_blocks (blocked_id);

create table public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_reports_target_type check (target_type in ('profile', 'collection', 'item', 'comment')),
  constraint content_reports_reason check (reason in ('spam', 'harassment', 'hate', 'sexual', 'violence', 'illegal', 'other')),
  constraint content_reports_details_len check (details is null or char_length(details) <= 1000),
  constraint content_reports_status check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  constraint content_reports_one_per_target unique (reporter_id, target_type, target_id)
);

create index content_reports_status_created_idx on public.content_reports (status, created_at);

create trigger content_reports_set_updated_at
  before update on public.content_reports
  for each row execute function public.set_updated_at();

alter table public.user_blocks enable row level security;
alter table public.content_reports enable row level security;

create policy "user_blocks_select_own"
  on public.user_blocks for select
  using (auth.uid() = blocker_id);

create policy "user_blocks_insert_own"
  on public.user_blocks for insert
  with check (auth.uid() = blocker_id);

create policy "user_blocks_delete_own"
  on public.user_blocks for delete
  using (auth.uid() = blocker_id);

create policy "content_reports_select_own"
  on public.content_reports for select
  using (auth.uid() = reporter_id);

create policy "content_reports_insert_own"
  on public.content_reports for insert
  with check (auth.uid() = reporter_id and status = 'pending');

grant select, insert, delete on table public.user_blocks to authenticated;
grant select, insert on table public.content_reports to authenticated;
