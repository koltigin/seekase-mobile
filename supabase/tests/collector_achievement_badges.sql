-- Run only on a disposable Supabase development database after all migrations.
-- Fixtures and mutations are rolled back.
begin;

insert into auth.users (id) values ('00000000-0000-4000-8000-000000000101');
insert into public.profiles (id, handle, display_name)
values ('00000000-0000-4000-8000-000000000101', 'badge_test', 'Badge Test');
insert into public.collections (id, owner_id, title, category_id)
values (
  '00000000-0000-4000-8000-000000000111',
  '00000000-0000-4000-8000-000000000101',
  'Meaningful Books',
  'books'
);

-- A title/category-only placeholder must not earn a progress badge.
insert into public.items (owner_id, collection_id, title, category_id)
values (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000111',
  'Placeholder',
  'books'
);

do $$
begin
  if exists (
    select 1 from public.collector_badges
    where user_id = '00000000-0000-4000-8000-000000000101'
      and badge_id = 'first-collection'
  ) then
    raise exception 'FAIL: placeholder-only collection earned a badge';
  end if;
end;
$$;

-- Adding meaningful metadata makes the item and its populated collection count.
update public.items
set metadata = '{"author":"Test Author"}'::jsonb
where owner_id = '00000000-0000-4000-8000-000000000101';

do $$
begin
  if not exists (
    select 1 from public.collector_badges
    where user_id = '00000000-0000-4000-8000-000000000101'
      and badge_id = 'first-collection'
      and expires_at is null
  ) then
    raise exception 'FAIL: qualified collection badge missing';
  end if;
end;
$$;

-- A historic seven-day run earns a permanent badge even when it is not current.
insert into public.daily_check_ins (
  user_id,
  checkin_day,
  transaction_signature,
  network,
  block_time
)
select
  '00000000-0000-4000-8000-000000000101',
  date '2026-01-01' + offset_day,
  repeat(chr(49 + offset_day), 80),
  'mainnet-beta',
  timestamptz '2026-01-01 12:00:00+00' + make_interval(days => offset_day)
from generate_series(0, 6) as offset_day;

do $$
begin
  if not exists (
    select 1 from public.collector_badges
    where user_id = '00000000-0000-4000-8000-000000000101'
      and badge_id = 'streak-7'
      and expires_at is null
  ) then
    raise exception 'FAIL: longest verified streak badge missing';
  end if;
end;
$$;

rollback;
