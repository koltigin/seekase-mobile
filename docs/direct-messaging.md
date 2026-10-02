# Direct messaging

Status: application code and database migration are live. Participant-only RLS, read state, block enforcement and three Ada inbox conversations passed live backend acceptance. The production-signed release APK passed physical Seeker acceptance for inbox, unread state, context link, received and sent messages, safety copy, report controls, and block control.

## Launch scope

- Private one-to-one text conversations between authenticated collectors.
- Start from a collector profile, public collection, or public object.
- A first message may carry one collection or object context link.
- Activity contains separate Updates and Messages views.
- Inbox and bottom navigation expose unread message counts.
- Messages and conversations can be reported. Either participant can block the other collector; a block in either direction prevents new messages.
- Conversation rows and messages are removed through foreign-key cascades when either participant deletes the account.

This release does not include attachments, group conversations, push notifications, payments, offers, escrow, on-chain trades, or transaction guarantees. Seekase is not acting as a marketplace.

## Data model and privacy

Migration: `supabase/migrations/20261001010000_direct_messages.sql`.

- `direct_conversations` contains one normalized row per collector pair.
- `direct_messages` stores text plus an optional collection or object reference.
- `direct_conversation_reads` stores one private read timestamp per participant.
- Row Level Security allows conversation and message reads only for the two participants.
- New messages require the signed-in sender to be a participant and fail when either collector has blocked the other.
- `open_direct_conversation` validates authentication, peer identity and blocks on the server.
- Wallet addresses, wallet lookup hashes and verification internals are not copied into messages.

## Acceptance order

1. `20261001000000_publication_photo_requirement.sql` was applied on 1 October 2026.
2. `20261001010000_direct_messages.sql` was applied on 1 October 2026.
3. Build and install the signed release APK.
4. From collector A, open collector B's public object and choose **Message collector**.
5. Send a context-linked message; confirm it appears only for A and B.
6. Confirm B sees an unread indicator, opens the conversation, and the indicator clears.
7. Confirm a third collector cannot read either table through the Data API.
8. Block B from A and confirm neither account can send a new message in that conversation.
9. Report one received message and the conversation; confirm the reports remain private to the reporter/moderation system.
10. Delete a disposable participant account and confirm associated conversations and messages are removed.
