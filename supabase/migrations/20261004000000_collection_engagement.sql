-- Privacy-preserving collection engagement totals and unique signed-in views.
-- Viewer identities are never exposed to the mobile client or public profiles.
begin;

create table public.collection_views (
  collection_id uuid not null references public.collections(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  primary key (collection_id, viewer_id)
);

create index collection_views_viewer_idx on public.collection_views (viewer_id, last_viewed_at desc);

alter table public.collection_views enable row level security;
revoke all on table public.collection_views from public, anon, authenticated;

create function public.record_collection_view(target_collection_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  -- Owners do not increase their own public audience count.
  if exists (
    select 1 from public.collections
    where id = target_collection_id and owner_id <> current_user_id
  ) then
    insert into public.collection_views (collection_id, viewer_id)
    values (target_collection_id, current_user_id)
    on conflict (collection_id, viewer_id)
    do update set last_viewed_at = now();
  end if;
end;
$$;

revoke all on function public.record_collection_view(uuid) from public, anon, authenticated;
grant execute on function public.record_collection_view(uuid) to authenticated;

create function public.collection_engagement_counts(target_collection_ids uuid[])
returns table (
  collection_id uuid,
  like_count bigint,
  comment_count bigint,
  view_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    (select count(*) from public.collection_likes l where l.collection_id = c.id),
    (select count(*) from public.comments m where m.collection_id = c.id),
    (select count(*) from public.collection_views v where v.collection_id = c.id)
  from public.collections c
  where c.id = any(coalesce(target_collection_ids, '{}'::uuid[]));
$$;

revoke all on function public.collection_engagement_counts(uuid[]) from public, anon, authenticated;
grant execute on function public.collection_engagement_counts(uuid[]) to anon, authenticated;

commit;
