-- Run only on a disposable Supabase development database after all migrations.
-- Fixtures and mutations are rolled back.
begin;

insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000201'),
  ('00000000-0000-4000-8000-000000000202');
insert into public.profiles (id, handle, display_name) values
  ('00000000-0000-4000-8000-000000000201', 'engagement_owner', 'Owner'),
  ('00000000-0000-4000-8000-000000000202', 'engagement_viewer', 'Viewer');
insert into public.collections (id, owner_id, title, category_id)
values (
  '00000000-0000-4000-8000-000000000211',
  '00000000-0000-4000-8000-000000000201',
  'Engagement Test',
  'books'
);

set local role authenticated;

-- The owner must never increase the audience count.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000201', true);
select public.record_collection_view('00000000-0000-4000-8000-000000000211');

-- A viewer may revisit, but still counts once.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000202', true);
select public.record_collection_view('00000000-0000-4000-8000-000000000211');
select public.record_collection_view('00000000-0000-4000-8000-000000000211');

do $$
declare
  totals record;
begin
  select * into totals
  from public.collection_engagement_counts(
    array['00000000-0000-4000-8000-000000000211'::uuid]
  );
  if totals.view_count <> 1 or totals.like_count <> 0 or totals.comment_count <> 0 then
    raise exception 'FAIL: engagement totals are incorrect';
  end if;

  begin
    perform viewer_id from public.collection_views;
    raise exception 'FAIL: raw viewer identity was readable';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
