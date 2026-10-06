import { createClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listDirectConversations,
  openDirectConversation,
  sendDirectMessage,
} from '../src/repositories/message-repository'
import type { Database } from '../src/types/database'

const mocks = vi.hoisted(() => ({ getSupabase: vi.fn() }))
vi.mock('../src/lib/supabase', () => ({ getSupabase: mocks.getSupabase }))
const transport = vi.fn<typeof fetch>()
function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
function request(index = 0) {
  const [url, options] = transport.mock.calls[index]
  return { url: new URL(String(url)), options, body: options?.body ? JSON.parse(String(options.body)) : null }
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.getSupabase.mockReturnValue(
    createClient<Database>('https://seekase.example.test', 'test-anon-key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: transport as unknown as typeof fetch },
    }),
  )
})

describe('direct message repository', () => {
  it('opens a conversation through the authenticated server function', async () => {
    transport.mockResolvedValue(response('conversation-1'))
    const result = await openDirectConversation('peer-1')
    expect(result).toEqual({ ok: true, data: 'conversation-1' })
    expect(request().url.pathname).toContain('/rpc/open_direct_conversation')
    expect(request().body).toEqual({ peer_user_id: 'peer-1' })
  })

  it('rejects an empty message before sending a request', async () => {
    const result = await sendDirectMessage('owner', 'conversation-1', '   ')
    expect(result).toMatchObject({ ok: false, error: { code: 'validation' } })
    expect(transport).not.toHaveBeenCalled()
  })

  it('trims a message and attaches one object context', async () => {
    transport.mockResolvedValue(
      response({
        id: 'message-1',
        conversation_id: 'conversation-1',
        sender_id: 'owner',
        body: 'Interested in this edition.',
        context_collection_id: null,
        context_item_id: 'item-1',
        created_at: '2026-10-01T08:00:00Z',
      }),
    )
    const result = await sendDirectMessage('owner', 'conversation-1', '  Interested in this edition.  ', {
      kind: 'item',
      id: 'item-1',
    })
    expect(result.ok).toBe(true)
    expect(request().body).toMatchObject({
      conversation_id: 'conversation-1',
      sender_id: 'owner',
      body: 'Interested in this edition.',
      context_collection_id: null,
      context_item_id: 'item-1',
    })
  })

  it('builds an inbox with peer identity and unread count', async () => {
    transport
      .mockResolvedValueOnce(
        response([
          {
            id: 'conversation-1',
            member_one_id: 'owner',
            member_two_id: 'peer-1',
            created_by: 'owner',
            created_at: '2026-10-01T07:00:00Z',
            updated_at: '2026-10-01T08:00:00Z',
            last_message_at: '2026-10-01T08:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(
        response([
          {
            id: 'message-1',
            conversation_id: 'conversation-1',
            sender_id: 'peer-1',
            body: 'Is this still in your collection?',
            context_collection_id: 'collection-1',
            context_item_id: null,
            created_at: '2026-10-01T08:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(
        response([{ id: 'peer-1', display_name: 'Lina Voss', handle: 'lina_cabinet', avatar_path: null }]),
      )
      .mockResolvedValueOnce(response([]))

    const result = await listDirectConversations('owner')
    expect(result).toMatchObject({
      ok: true,
      data: [
        {
          id: 'conversation-1',
          peer: { displayName: 'Lina Voss', handle: 'lina_cabinet' },
          lastMessage: { body: 'Is this still in your collection?' },
          unreadCount: 1,
        },
      ],
    })
  })
})
