-- Seekase Phase 2H — core schema + RLS
-- Wallet / Seeker identity is intentionally NOT stored on profiles.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (Seekase social / public collector identity)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null,
  display_name text not null,
  bio text not null default '',
  location_text text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_handle_format check (handle ~ '^[a-z0-9_]{3,30}$'),
  constraint profiles_handle_unique unique (handle)
);

create index profiles_display_name_idx on public.profiles (display_name);

-- ---------------------------------------------------------------------------
-- Collections (cabinets)
-- ---------------------------------------------------------------------------
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  category_id text not null,
  subcategory_id text,
  tags text[] not null default '{}',
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_title_len check (char_length(title) between 1 and 120)
);

create index collections_owner_id_idx on public.collections (owner_id);
create index collections_category_id_idx on public.collections (category_id);

-- ---------------------------------------------------------------------------
-- Items (objects)
-- ---------------------------------------------------------------------------
create table public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  title text not null,
  category_id text not null,
  subcategory_id text,
  tags text[] not null default '{}',
  story text,
  provenance text,
  condition text,
  status text,
  metadata jsonb not null default '{}'::jsonb,
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint items_title_len check (char_length(title) between 1 and 160)
);

create index items_owner_id_idx on public.items (owner_id);
create index items_collection_id_idx on public.items (collection_id);
create index items_category_id_idx on public.items (category_id);

-- ---------------------------------------------------------------------------
-- Social
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index follows_following_id_idx on public.follows (following_id);

create table public.item_likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index item_likes_item_id_idx on public.item_likes (item_id);

create table public.item_saves (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index item_saves_item_id_idx on public.item_saves (item_id);

create table public.collection_likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, collection_id)
);

create index collection_likes_collection_id_idx on public.collection_likes (collection_id);

create table public.collection_saves (
  user_id uuid not null references public.profiles (id) on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, collection_id)
);

create index collection_saves_collection_id_idx on public.collection_saves (collection_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.items enable row level security;
alter table public.follows enable row level security;
alter table public.item_likes enable row level security;
alter table public.item_saves enable row level security;
alter table public.collection_likes enable row level security;
alter table public.collection_saves enable row level security;

-- Profiles: public read for collector discovery (deliberate — no wallet fields here).
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Collections: public cabinets are readable; owners mutate.
create policy "collections_select_public"
  on public.collections for select
  using (true);

create policy "collections_insert_own"
  on public.collections for insert
  with check (auth.uid() = owner_id);

create policy "collections_update_own"
  on public.collections for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "collections_delete_own"
  on public.collections for delete
  using (auth.uid() = owner_id);

-- Items: public read; owners mutate.
create policy "items_select_public"
  on public.items for select
  using (true);

create policy "items_insert_own"
  on public.items for insert
  with check (auth.uid() = owner_id);

create policy "items_update_own"
  on public.items for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "items_delete_own"
  on public.items for delete
  using (auth.uid() = owner_id);

-- Follows: readable for social counts; mutate only as follower.
create policy "follows_select_public"
  on public.follows for select
  using (true);

create policy "follows_insert_own"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "follows_delete_own"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- Likes: readable for counts; mutate own rows only.
create policy "item_likes_select_public"
  on public.item_likes for select
  using (true);

create policy "item_likes_insert_own"
  on public.item_likes for insert
  with check (auth.uid() = user_id);

create policy "item_likes_delete_own"
  on public.item_likes for delete
  using (auth.uid() = user_id);

create policy "collection_likes_select_public"
  on public.collection_likes for select
  using (true);

create policy "collection_likes_insert_own"
  on public.collection_likes for insert
  with check (auth.uid() = user_id);

create policy "collection_likes_delete_own"
  on public.collection_likes for delete
  using (auth.uid() = user_id);

-- Saves: private to the saving user (no public USING true).
create policy "item_saves_select_own"
  on public.item_saves for select
  using (auth.uid() = user_id);

create policy "item_saves_insert_own"
  on public.item_saves for insert
  with check (auth.uid() = user_id);

create policy "item_saves_delete_own"
  on public.item_saves for delete
  using (auth.uid() = user_id);

create policy "collection_saves_select_own"
  on public.collection_saves for select
  using (auth.uid() = user_id);

create policy "collection_saves_insert_own"
  on public.collection_saves for insert
  with check (auth.uid() = user_id);

create policy "collection_saves_delete_own"
  on public.collection_saves for delete
  using (auth.uid() = user_id);
