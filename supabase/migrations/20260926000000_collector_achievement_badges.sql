-- Permanent collector achievements derived from qualified public catalog rows
-- and server-verified daily check-ins. Wallet and SGT evidence remains private.
begin;

alter table public.collector_badges
  alter column expires_at drop not null;

alter table public.collector_badges
  drop constraint collector_badges_supported_badge_check;

alter table public.collector_badges
  add constraint collector_badges_supported_badge_check
  check (badge_id in (
    'wallet-verified',
    'seeker-genesis',
    'first-collection',
    'objects-10',
    'collections-5',
    'objects-50',
    'objects-100',
    'collections-10',
    'specialist',
    'streak-7',
    'streak-14',
    'streak-30'
  ));

alter table public.collector_badges
  drop constraint collector_badges_expiry_check;

alter table public.collector_badges
  add constraint collector_badges_expiry_check
  check (expires_at is null or expires_at > awarded_at);

drop policy collector_badges_read_active on public.collector_badges;
create policy collector_badges_read_active
  on public.collector_badges
  for select
  to anon, authenticated
  using (expires_at is null or expires_at > now());

create or replace function public.refresh_collector_achievement_badges(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  qualified_items integer := 0;
  qualified_collections integer := 0;
  largest_category integer := 0;
  longest_streak integer := 0;
  has_verified_wallet boolean := false;
begin
  -- Cascading account deletion can fire child-table triggers after the profile
  -- row is gone. In that case every badge is already being removed by FK cascade.
  if not exists (select 1 from public.profiles where id = target_user_id) then
    return;
  end if;

  -- A progress item needs meaningful catalog detail in addition to its required
  -- title/category. This prevents empty placeholder rows from farming badges.
  select coalesce(max(category_count), 0)::integer
  into largest_category
  from (
    select i.category_id, count(*)::integer as category_count
    from public.items i
    where i.owner_id = target_user_id
      and char_length(btrim(i.title)) >= 3
      and char_length(btrim(i.category_id)) >= 2
      and (
        i.cover_path is not null
        or char_length(btrim(coalesce(i.story, ''))) >= 10
        or char_length(btrim(coalesce(i.provenance, ''))) >= 3
        or cardinality(i.tags) > 0
        or i.metadata <> '{}'::jsonb
      )
    group by i.category_id
  ) category_totals;

  qualified_items := coalesce((
    select count(*)::integer
    from public.items i
    where i.owner_id = target_user_id
      and char_length(btrim(i.title)) >= 3
      and char_length(btrim(i.category_id)) >= 2
      and (
        i.cover_path is not null
        or char_length(btrim(coalesce(i.story, ''))) >= 10
        or char_length(btrim(coalesce(i.provenance, ''))) >= 3
        or cardinality(i.tags) > 0
        or i.metadata <> '{}'::jsonb
      )
  ), 0);

  select count(*)::integer
  into qualified_collections
  from public.collections c
  where c.owner_id = target_user_id
    and char_length(btrim(c.title)) >= 3
    and exists (
      select 1
      from public.items i
      where i.collection_id = c.id
        and i.owner_id = target_user_id
        and char_length(btrim(i.title)) >= 3
        and char_length(btrim(i.category_id)) >= 2
        and (
          i.cover_path is not null
          or char_length(btrim(coalesce(i.story, ''))) >= 10
          or char_length(btrim(coalesce(i.provenance, ''))) >= 3
          or cardinality(i.tags) > 0
          or i.metadata <> '{}'::jsonb
        )
    );

  select coalesce(max(run_length), 0)::integer
  into longest_streak
  from (
    select count(*)::integer as run_length
    from (
      select checkin_day,
             checkin_day - row_number() over (order by checkin_day)::integer as run_group
      from public.daily_check_ins
      where user_id = target_user_id
      group by checkin_day
    ) dated
    group by run_group
  ) runs;

  select exists (
    select 1 from public.wallet_identities where user_id = target_user_id
  ) into has_verified_wallet;

  if has_verified_wallet then
    insert into public.collector_badges (user_id, badge_id, awarded_at, expires_at)
    select target_user_id, 'wallet-verified', now(), null
    where exists (select 1 from public.profiles where id = target_user_id)
    on conflict (user_id, badge_id) do nothing;
  else
    delete from public.collector_badges
    where user_id = target_user_id and badge_id = 'wallet-verified';
  end if;

  insert into public.collector_badges (user_id, badge_id, awarded_at, expires_at)
  select target_user_id, earned.badge_id, now(), null
  from (
    values
      ('first-collection', qualified_collections >= 1),
      ('objects-10', qualified_items >= 10),
      ('collections-5', qualified_collections >= 5),
      ('objects-50', qualified_items >= 50),
      ('objects-100', qualified_items >= 100),
      ('collections-10', qualified_collections >= 10),
      ('specialist', largest_category >= 25),
      ('streak-7', longest_streak >= 7),
      ('streak-14', longest_streak >= 14),
      ('streak-30', longest_streak >= 30)
  ) as earned(badge_id, is_earned)
  where earned.is_earned
  on conflict (user_id, badge_id) do nothing;
end;
$$;

revoke all on function public.refresh_collector_achievement_badges(uuid)
  from public, anon, authenticated;
grant execute on function public.refresh_collector_achievement_badges(uuid)
  to service_role;

create function public.refresh_badges_after_catalog_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_collector_achievement_badges(old.owner_id);
    return old;
  end if;
  perform public.refresh_collector_achievement_badges(new.owner_id);
  return new;
end;
$$;

create trigger collections_refresh_achievement_badges
  after insert or update or delete on public.collections
  for each row execute function public.refresh_badges_after_catalog_change();

create trigger items_refresh_achievement_badges
  after insert or update or delete on public.items
  for each row execute function public.refresh_badges_after_catalog_change();

create function public.refresh_badges_after_checkin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_collector_achievement_badges(new.user_id);
  return new;
end;
$$;

create trigger daily_checkins_refresh_achievement_badges
  after insert on public.daily_check_ins
  for each row execute function public.refresh_badges_after_checkin();

create function public.refresh_badges_after_wallet_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_collector_achievement_badges(old.user_id);
    return old;
  end if;
  perform public.refresh_collector_achievement_badges(new.user_id);
  return new;
end;
$$;

create trigger wallets_refresh_achievement_badges
  after insert or update or delete on public.wallet_identities
  for each row execute function public.refresh_badges_after_wallet_change();

create function public.refresh_badges_after_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_collector_achievement_badges(new.id);
  return new;
end;
$$;

create trigger profiles_refresh_achievement_badges
  after insert on public.profiles
  for each row execute function public.refresh_badges_after_profile_insert();

do $$
declare
  profile_id uuid;
begin
  for profile_id in select id from public.profiles loop
    perform public.refresh_collector_achievement_badges(profile_id);
  end loop;
end;
$$;

commit;
