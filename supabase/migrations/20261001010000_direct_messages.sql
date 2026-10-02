-- Seekase private one-to-one text messaging.
-- Conversations and messages are visible only to their two participants.

begin;

create table public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  member_one_id uuid not null references public.profiles (id) on delete cascade,
  member_two_id uuid not null references public.profiles (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz,
  constraint direct_conversations_distinct_members check (member_one_id <> member_two_id),
  constraint direct_conversations_ordered_members check (member_one_id::text < member_two_id::text),
  constraint direct_conversations_creator_is_member check (created_by in (member_one_id, member_two_id)),
  constraint direct_conversations_unique_pair unique (member_one_id, member_two_id)
);

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  context_collection_id uuid references public.collections (id) on delete set null,
  context_item_id uuid references public.items (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint direct_messages_body_len check (char_length(btrim(body)) between 1 and 1000),
  constraint direct_messages_one_context check (num_nonnulls(context_collection_id, context_item_id) <= 1)
);

create table public.direct_conversation_reads (
  conversation_id uuid not null references public.direct_conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index direct_conversations_member_one_idx on public.direct_conversations (member_one_id, last_message_at desc);
create index direct_conversations_member_two_idx on public.direct_conversations (member_two_id, last_message_at desc);
create index direct_messages_conversation_created_idx on public.direct_messages (conversation_id, created_at desc);
create index direct_messages_sender_idx on public.direct_messages (sender_id);

create trigger direct_conversations_set_updated_at
  before update on public.direct_conversations
  for each row execute function public.set_updated_at();

create trigger direct_conversation_reads_set_updated_at
  before update on public.direct_conversation_reads
  for each row execute function public.set_updated_at();

create or replace function public.is_direct_conversation_member(
  expected_conversation_id uuid,
  expected_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.direct_conversations conversation
    where conversation.id = expected_conversation_id
      and expected_user_id in (conversation.member_one_id, conversation.member_two_id)
  );
$$;

create or replace function public.can_send_direct_message(
  expected_conversation_id uuid,
  expected_sender_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.direct_conversations conversation
    where conversation.id = expected_conversation_id
      and expected_sender_id in (conversation.member_one_id, conversation.member_two_id)
      and not exists (
        select 1
        from public.user_blocks block
        where (block.blocker_id = conversation.member_one_id and block.blocked_id = conversation.member_two_id)
           or (block.blocker_id = conversation.member_two_id and block.blocked_id = conversation.member_one_id)
      )
  );
$$;

create or replace function public.open_direct_conversation(peer_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  first_member uuid;
  second_member uuid;
  conversation_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if peer_user_id is null or peer_user_id = current_user_id then
    raise exception 'Choose another collector.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = peer_user_id) then
    raise exception 'Collector not found.' using errcode = 'P0002';
  end if;
  if exists (
    select 1 from public.user_blocks block
    where (block.blocker_id = current_user_id and block.blocked_id = peer_user_id)
       or (block.blocker_id = peer_user_id and block.blocked_id = current_user_id)
  ) then
    raise exception 'Messaging is unavailable for this collector.' using errcode = '42501';
  end if;

  if current_user_id::text < peer_user_id::text then
    first_member := current_user_id;
    second_member := peer_user_id;
  else
    first_member := peer_user_id;
    second_member := current_user_id;
  end if;

  insert into public.direct_conversations (member_one_id, member_two_id, created_by)
  values (first_member, second_member, current_user_id)
  on conflict (member_one_id, member_two_id)
  do update set updated_at = public.direct_conversations.updated_at
  returning id into conversation_id;

  return conversation_id;
end;
$$;

create or replace function public.touch_direct_conversation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.direct_conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger direct_messages_touch_conversation
  after insert on public.direct_messages
  for each row execute function public.touch_direct_conversation();

alter table public.direct_conversations enable row level security;
alter table public.direct_messages enable row level security;
alter table public.direct_conversation_reads enable row level security;

create policy "direct_conversations_select_member"
  on public.direct_conversations for select
  using (auth.uid() in (member_one_id, member_two_id));

create policy "direct_messages_select_member"
  on public.direct_messages for select
  using (public.is_direct_conversation_member(conversation_id, auth.uid()));

create policy "direct_messages_insert_sender"
  on public.direct_messages for insert
  with check (
    auth.uid() = sender_id
    and public.can_send_direct_message(conversation_id, auth.uid())
  );

create policy "direct_conversation_reads_select_own"
  on public.direct_conversation_reads for select
  using (auth.uid() = user_id and public.is_direct_conversation_member(conversation_id, auth.uid()));

create policy "direct_conversation_reads_insert_own"
  on public.direct_conversation_reads for insert
  with check (auth.uid() = user_id and public.is_direct_conversation_member(conversation_id, auth.uid()));

create policy "direct_conversation_reads_update_own"
  on public.direct_conversation_reads for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and public.is_direct_conversation_member(conversation_id, auth.uid()));

grant select on table public.direct_conversations to authenticated;
grant select, insert on table public.direct_messages to authenticated;
grant select, insert, update on table public.direct_conversation_reads to authenticated;
revoke all on function public.is_direct_conversation_member(uuid, uuid) from public;
revoke all on function public.can_send_direct_message(uuid, uuid) from public;
revoke all on function public.open_direct_conversation(uuid) from public;
revoke all on function public.touch_direct_conversation() from public;
grant execute on function public.is_direct_conversation_member(uuid, uuid) to authenticated;
grant execute on function public.can_send_direct_message(uuid, uuid) to authenticated;
grant execute on function public.open_direct_conversation(uuid) to authenticated;

alter table public.content_reports
  drop constraint if exists content_reports_target_type;
alter table public.content_reports
  add constraint content_reports_target_type
  check (target_type in ('profile', 'collection', 'item', 'comment', 'conversation', 'message'));

commit;
