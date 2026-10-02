-- Phase 2H follow-up. Apply after the accepted initial migration.
-- Transaction fails without deleting/reassigning any existing inconsistent rows.
begin;

alter table public.collections
  add constraint collections_id_owner_unique unique (id, owner_id);

alter table public.items
  add constraint items_collection_owner_fkey
  foreign key (collection_id, owner_id)
  references public.collections (id, owner_id) on delete cascade;

-- Metadata UPDATE payloads are shallow patches. Merge under the row lock,
-- preserving omitted keys even when separate clients update different fields.
-- An empty string explicitly clears a displayed field; omission preserves it.
create function public.merge_item_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if jsonb_typeof(old.metadata) <> 'object' or jsonb_typeof(new.metadata) <> 'object' then
    raise exception 'Item metadata must be a JSON object' using errcode = '22023';
  end if;
  new.metadata := old.metadata || new.metadata;
  return new;
end;
$$;

create trigger items_merge_metadata
  before update of metadata on public.items
  for each row execute function public.merge_item_metadata();

-- The app blocks cloud catalog operations until this contract is installed.
create function public.catalog_schema_version()
returns integer
language sql
immutable
set search_path = ''
as $$ select 2; $$;
revoke all on function public.catalog_schema_version() from public;
grant execute on function public.catalog_schema_version() to authenticated;

commit;
