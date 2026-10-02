-- Public publication requires a real object photo.
-- Existing photo-less rows remain owner-visible drafts and are hidden from other users.
begin;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'items_public_photo_required'
      and conrelid = 'public.items'::regclass
  ) then
    alter table public.items
      add constraint items_public_photo_required
      check (cover_path is not null) not valid;
  end if;
end
$$;

drop policy if exists "items_select_public" on public.items;
drop policy if exists "items_select_published_or_own" on public.items;
create policy "items_select_published_or_own"
  on public.items for select
  using (cover_path is not null or auth.uid() = owner_id);

drop policy if exists "collections_select_public" on public.collections;
drop policy if exists "collections_select_published_or_own" on public.collections;
create policy "collections_select_published_or_own"
  on public.collections for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1
      from public.items published_item
      where published_item.collection_id = collections.id
        and published_item.cover_path is not null
    )
  );

commit;
