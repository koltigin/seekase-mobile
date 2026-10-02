-- Run only on a disposable Supabase development database, after all three migrations.
-- No extensions required. Fixtures and all mutations are rolled back.
begin;
insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');
insert into public.profiles (id, handle, display_name) values
  ('00000000-0000-4000-8000-000000000001', 'hardening_test_a', 'Test A'),
  ('00000000-0000-4000-8000-000000000002', 'hardening_test_b', 'Test B');
insert into public.collections (id, owner_id, title, category_id) values
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'A', 'books'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000002', 'B', 'books');
set local role authenticated;
do $$ begin
  if public.catalog_schema_version() <> 2 then
    raise exception 'FAIL: account catalog schema contract missing';
  end if;
end; $$;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

insert into public.items (id, owner_id, collection_id, title, category_id, metadata) values
  ('00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000011', 'Book', 'books', '{"year":"1984","author":"Author","custom":"keep"}');

do $$
begin
  begin
    insert into public.items (owner_id, collection_id, title, category_id) values
      ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 'Wrong cabinet', 'books');
    raise exception 'FAIL: cross-owner insert succeeded';
  exception when foreign_key_violation then null;
  end;
  begin
    update public.items set collection_id = '00000000-0000-4000-8000-000000000012'
      where id = '00000000-0000-4000-8000-000000000021';
    raise exception 'FAIL: cross-owner move succeeded';
  exception when foreign_key_violation then null;
  end;
end;
$$;

update public.items set metadata = '{"year":"1990"}' where id = '00000000-0000-4000-8000-000000000021';
update public.items set metadata = '{"author":""}' where id = '00000000-0000-4000-8000-000000000021';
do $$
declare actual jsonb;
begin
  select metadata into actual from public.items where id = '00000000-0000-4000-8000-000000000021';
  if actual is distinct from '{"year":"1990","author":"","custom":"keep"}'::jsonb then
    raise exception 'FAIL: omitted metadata lost or explicit clear ignored';
  end if;
end;
$$;
rollback;
