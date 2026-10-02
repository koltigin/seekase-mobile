-- Explicit Data API privileges: do not depend on project default grants.
-- RLS continues to enforce ownership for every authenticated operation.
begin;

grant usage on schema public to anon, authenticated;
revoke all on table public.profiles, public.collections, public.items,
  public.follows, public.item_likes, public.collection_likes,
  public.item_saves, public.collection_saves from public, anon, authenticated;

grant select on table public.profiles, public.collections, public.items,
  public.follows, public.item_likes, public.collection_likes to anon, authenticated;
grant insert, update on table public.profiles to authenticated;
grant insert, update, delete on table public.collections, public.items to authenticated;
grant insert, delete on table public.follows, public.item_likes,
  public.collection_likes to authenticated;
grant select, insert, delete on table public.item_saves,
  public.collection_saves to authenticated;

commit;
