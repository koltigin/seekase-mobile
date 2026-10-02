import { createClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getActivityLastReadAt, listAccountActivity, markActivityRead } from '../src/repositories/activity-repository'
import type { Database } from '../src/types/database'

const mocks = vi.hoisted(() => ({ getSupabase: vi.fn() }))
vi.mock('../src/lib/supabase', () => ({ getSupabase: mocks.getSupabase }))
const transport = vi.fn<typeof fetch>()
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  vi.resetAllMocks()
  mocks.getSupabase.mockReturnValue(
    createClient<Database>('https://seekase.example.test', 'test-anon-key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: transport },
    }),
  )
})

describe('account activity repository', () => {
  it('returns an empty inbox without querying empty target tables', async () => {
    transport
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([]))
    await expect(listAccountActivity('owner')).resolves.toEqual({ ok: true, data: [] })
    expect(transport).toHaveBeenCalledTimes(3)
  })

  it('combines incoming follows, likes and comments without wallet identity', async () => {
    transport
      .mockResolvedValueOnce(response([{ id: 'collection-1', title: 'My Library' }]))
      .mockResolvedValueOnce(response([{ id: 'item-1', collection_id: 'collection-1', title: 'Etnogenez' }]))
      .mockResolvedValueOnce(response([{ follower_id: 'actor-1', created_at: '2026-09-23T09:00:00Z' }]))
      .mockResolvedValueOnce(
        response([{ user_id: 'actor-1', collection_id: 'collection-1', created_at: '2026-09-23T10:00:00Z' }]),
      )
      .mockResolvedValueOnce(response([{ user_id: 'actor-1', item_id: 'item-1', created_at: '2026-09-23T10:30:00Z' }]))
      .mockResolvedValueOnce(
        response([
          {
            id: 'comment-1',
            author_id: 'actor-1',
            collection_id: 'collection-1',
            item_id: null,
            body: 'Wonderful library.',
            created_at: '2026-09-23T11:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([{ id: 'actor-1', display_name: 'Reader', handle: 'reader', avatar_path: null }]))

    const result = await listAccountActivity('owner')
    expect(result).toMatchObject({
      ok: true,
      data: [
        {
          kind: 'collection-comment',
          targetTitle: 'My Library',
          commentBody: 'Wonderful library.',
          actor: { displayName: 'Reader', handle: 'reader' },
        },
        { kind: 'item-like', targetTitle: 'Etnogenez', collectionId: 'collection-1' },
        { kind: 'collection-like', targetTitle: 'My Library' },
        { kind: 'follow' },
      ],
    })
    expect(JSON.stringify(result)).not.toContain('wallet')
  })

  it('reads and advances only the current account activity cursor', async () => {
    transport
      .mockResolvedValueOnce(response({ last_read_at: '2026-09-23T10:00:00Z' }))
      .mockResolvedValueOnce(response(null, 201))
    await expect(getActivityLastReadAt('owner')).resolves.toEqual({
      ok: true,
      data: '2026-09-23T10:00:00Z',
    })
    await expect(markActivityRead('owner', '2026-09-23T11:00:00Z')).resolves.toEqual({ ok: true, data: true })
    expect(JSON.parse(String(transport.mock.calls[1][1]?.body))).toEqual({
      user_id: 'owner',
      last_read_at: '2026-09-23T11:00:00Z',
    })
  })
})
