-- Optional public profile links. Never store wallet identity here.
alter table public.profiles
  add column social_links jsonb not null default '{}'::jsonb,
  add constraint profiles_social_links_object check (jsonb_typeof(social_links) = 'object');

comment on column public.profiles.social_links is
  'Optional public website and social profile URLs; must not contain wallet identity.';
