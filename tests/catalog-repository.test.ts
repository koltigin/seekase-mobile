import { createClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listOwnCollections,
  listOwnItems,
  createCloudCollection,
  createCloudItem,
  updateCloudItem,
  deleteCloudItem,
  deleteCloudCollection,
} from '../src/repositories/catalog-repository'
import type { Database } from '../src/types/database'

const mocks = vi.hoisted(() => ({ getSupabase: vi.fn() }))
vi.mock('../src/lib/supabase', () => ({ getSupabase: mocks.getSupabase }))
vi.mock('../src/data/covers', () => ({ covers: { scifi: 1 } }))
const transport = vi.fn<typeof fetch>()
function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
function collection(id: string) {
  return { id, owner_id: 'owner', title: 'Books', category_id: 'books', tags: [], created_at: '2026-09-17T00:00:00Z' }
}
function request(index = 0) {
  const [url, options] = transport.mock.calls[index]
  return { url: new URL(String(url)), options, body: options?.body ? JSON.parse(String(options.body)) : null }
}

beforeEach(() => {
  vi.resetAllMocks()
  // Real PostgREST serialization with a fake transport: never reaches a live backend.
  mocks.getSupabase.mockReturnValue(
    createClient<Database>('https://seekase.example.test', 'test-anon-key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: transport },
    }),
  )
})

describe('cloud repository HTTP contract', () => {
  it('loads every page and scopes each page to its owner', async () => {
    transport
      .mockResolvedValueOnce(response(Array.from({ length: 200 }, (_, id) => collection(String(id)))))
      .mockResolvedValueOnce(response([collection('last')]))
    const result = await listOwnCollections('owner')
    expect(result.ok && result.data.length).toBe(201)
    expect(transport).toHaveBeenCalledTimes(2)
    expect(request().url.searchParams.get('owner_id')).toBe('eq.owner')
    expect(request(1).url.searchParams.get('owner_id')).toBe('eq.owner')
    expect(request(1).url.searchParams.get('offset')).toBe('200')
  })
  it('loads only account objects and maps their metadata', async () => {
    transport.mockResolvedValue(
      response([
        {
          id: 'object',
          collection_id: 'cabinet',
          title: 'Book',
          category_id: 'books',
          tags: [],
          metadata: { year: '1984' },
        },
      ]),
    )
    const result = await listOwnItems('owner')
    expect(request().url.searchParams.get('owner_id')).toBe('eq.owner')
    expect(result.ok && result.data[0].year).toBe('1984')
  })
  it('creates an explicitly requested cabinet with account ownership', async () => {
    transport.mockResolvedValue(response(collection('new')))
    const result = await createCloudCollection('owner', { title: ' Books ', categoryId: 'books' })
    expect(result.ok).toBe(true)
    expect(request().options?.method).toBe('POST')
    expect(request().body).toMatchObject({ owner_id: 'owner', title: 'Books' })
  })
  it('rejects a public object without a photo before sending a request', async () => {
    const result = await createCloudItem('owner', {
      collectionId: 'cabinet',
      title: 'Book',
      categoryId: 'books',
    })
    expect(result).toMatchObject({ ok: false, error: { code: 'validation' } })
    expect(transport).not.toHaveBeenCalled()
  })
  it('sends only changed metadata and preserves explicit clears', async () => {
    transport.mockResolvedValue(
      response({
        id: 'object',
        collection_id: 'cabinet',
        title: 'Book',
        metadata: { year: '1990', author: '', custom: 'keep' },
      }),
    )
    const result = await updateCloudItem('owner', 'object', { year: '1990', author: '' })
    expect(result.ok).toBe(true)
    expect(request().body.metadata).toEqual({ year: '1990', author: '' })
    expect(request().url.searchParams.get('owner_id')).toBe('eq.owner')
    expect(request().url.searchParams.get('id')).toBe('eq.object')
  })
  it.each([deleteCloudItem, deleteCloudCollection])(
    'does not report a successful delete if ownership/RLS matched no row',
    async (remove) => {
      transport.mockResolvedValue(response([]))
      const result = await remove('owner', 'missing')
      expect(result).toMatchObject({ ok: false, error: { code: 'not_found' } })
      expect(request().options?.method).toBe('DELETE')
      expect(request().url.searchParams.get('owner_id')).toBe('eq.owner')
      expect(new Headers(request().options?.headers).get('Prefer')).toContain('return=representation')
    },
  )
  it('forwards cancellation to the transport', async () => {
    const controller = new AbortController()
    transport.mockResolvedValue(response(collection('new')))
    await createCloudCollection('owner', { title: 'Books', categoryId: 'books' }, controller.signal)
    expect(request().options?.signal).toBe(controller.signal)
  })
  it('surfaces RLS rejection without pretending to save locally', async () => {
    transport.mockResolvedValue(response({ code: '42501', message: 'new row violates row-level security policy' }, 403))
    const result = await createCloudCollection('owner', { title: 'Books', categoryId: 'books' })
    expect(result).toMatchObject({ ok: false, error: { code: 'unauthenticated' } })
  })
})
