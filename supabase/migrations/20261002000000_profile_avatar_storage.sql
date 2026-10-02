-- Public profile photos stored in a private bucket and exposed only when referenced by a profile.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 6291456, array['image/jpeg'])
on conflict (id) do nothing;

create policy "seekase_avatars_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "seekase_avatars_read_published"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'avatars'
  and exists (
    select 1 from public.profiles p
    where p.avatar_path = storage.objects.name
      and p.id::text = (storage.foldername(storage.objects.name))[1]
  )
);

create policy "seekase_avatars_read_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "seekase_avatars_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;
