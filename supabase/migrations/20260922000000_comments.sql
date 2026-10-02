-- Seekase account comments.
-- Comments are public social content. Wallet identity remains private and separate.

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  collection_id uuid references public.collections (id) on delete cascade,
  item_id uuid references public.items (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_one_target check (num_nonnulls(collection_id, item_id) = 1),
  constraint comments_body_len check (char_length(btrim(body)) between 1 and 1000)
);

create index comments_collection_created_idx
  on public.comments (collection_id, created_at desc)
  where collection_id is not null;

create index comments_item_created_idx
  on public.comments (item_id, created_at desc)
  where item_id is not null;

create index comments_author_id_idx on public.comments (author_id);

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

alter table public.comments enable row level security;

create policy "comments_select_public"
  on public.comments for select
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "comments_update_own"
  on public.comments for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "comments_delete_own"
  on public.comments for delete
  using (auth.uid() = author_id);

grant select on table public.comments to anon, authenticated;
grant insert, update, delete on table public.comments to authenticated;
