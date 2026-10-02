-- Item photo foundation. Apply once, after catalog migrations.
-- Private bucket: only photos referenced by public catalog rows are publicly readable.
-- No existing bucket configuration, files or local data are overwritten.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-images', 'item-images', false, 6291456,
  array['image/jpeg', 'image/png', 'image/webp']);

create policy "seekase_item_photos_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'item-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "seekase_item_photos_read_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'item-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "seekase_item_photos_read_published"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'item-images'
  and exists (
    select 1 from public.items i
    where i.cover_path = storage.objects.name
      and i.owner_id::text = (storage.foldername(storage.objects.name))[1]
  )
);

create policy "seekase_item_photos_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'item-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- No UPDATE policy: uploads use unique paths and upsert=false.
commit;
