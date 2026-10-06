import { createClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createComment, deleteComment, listComments } from '../src/repositories/comment-repository'
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

describe('comment repository', () => {
  it('loads comments for only the requested item and maps public author fields', async () => {
    transport
      .mockResolvedValueOnce(
        response([
          {
            id: 'comment-1',
            author_id: 'author-1',
            collection_id: null,
            item_id: 'item-1',
            body: 'A thoughtful note.',
            created_at: '2026-09-22T09:00:00Z',
            updated_at: '2026-09-22T09:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(response([{ id: 'author-1', display_name: 'Ada', handle: 'ada' }]))
    const result = await listComments({ kind: 'item', id: 'item-1' })
    expect(result).toMatchObject({
      ok: true,
      data: [{ authorName: 'Ada', authorHandle: 'ada', body: 'A thoughtful note.' }],
    })
    expect(request().url.searchParams.get('item_id')).toBe('eq.item-1')
    expect(request().url.searchParams.has('collection_id')).toBe(false)
    expect(request(1).url.searchParams.get('id')).toBe('in.(author-1)')
  })

  it('trims a comment and assigns exactly one target', async () => {
    transport.mockResolvedValue(
      response({
        id: 'comment-1',
        author_id: 'author-1',
        collection_id: 'collection-1',
        item_id: null,
        body: 'Lovely shelf.',
        created_at: '2026-09-22T09:00:00Z',
        updated_at: '2026-09-22T09:00:00Z',
      }),
    )
    const result = await createComment('author-1', { kind: 'collection', id: 'collection-1' }, '  Lovely shelf.  ')
    expect(result.ok).toBe(true)
    expect(request().body).toMatchObject({
      author_id: 'author-1',
      collection_id: 'collection-1',
      item_id: null,
      body: 'Lovely shelf.',
    })
  })

  it('rejects empty comments before making a request', async () => {
    const result = await createComment('author-1', { kind: 'item', id: 'item-1' }, '   ')
    expect(result).toMatchObject({ ok: false, error: { code: 'validation' } })
    expect(transport).not.toHaveBeenCalled()
  })

  it('scopes deletion to the comment author and detects a missing row', async () => {
    transport.mockResolvedValue(response([]))
    const result = await deleteComment('author-1', 'missing')
    expect(result).toMatchObject({ ok: false, error: { code: 'not_found' } })
    expect(request().url.searchParams.get('id')).toBe('eq.missing')
    expect(request().url.searchParams.get('author_id')).toBe('eq.author-1')
  })
})
