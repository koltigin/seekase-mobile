import { createClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getPublicCollector, listPublicCollections } from '../src/repositories/discover-repository'
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

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('public Discover repository', () => {
  it('builds public cards from profiles, objects, photos and likes without wallet fields', async () => {
    transport
      .mockResolvedValueOnce(
        response([
          {
            id: 'collection-1',
            owner_id: 'owner-1',
            title: 'Library',
            category_id: 'books',
            tags: [],
            cover_path: null,
            description: null,
            subcategory_id: null,
            created_at: '2026-09-22T00:00:00Z',
            updated_at: '2026-09-22T00:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(
        response([
          {
            id: 'owner-1',
            handle: 'reader',
            display_name: 'Reader',
            bio: '',
            location_text: null,
            avatar_path: null,
            social_links: {},
            created_at: '2026-09-22T00:00:00Z',
            updated_at: '2026-09-22T00:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(
        response([
          { id: 'item-1', collection_id: 'collection-1', owner_id: 'owner-1', cover_path: 'owner/photo.jpg' },
          { id: 'item-2', collection_id: 'collection-1', owner_id: 'owner-1', cover_path: null },
        ]),
      )
      .mockResolvedValueOnce(response([{ collection_id: 'collection-1' }, { collection_id: 'collection-1' }]))

    const result = await listPublicCollections()
    expect(result).toMatchObject({
      ok: true,
      data: [
        { title: 'Library', itemCount: 1, likeCount: 2, coverPath: 'owner/photo.jpg', owner: { handle: 'reader' } },
      ],
    })
    expect(JSON.stringify(result)).not.toContain('wallet')
    expect(transport).toHaveBeenCalledTimes(4)
  })

  it('returns an empty feed without issuing detail queries', async () => {
    transport.mockResolvedValueOnce(response([]))
    await expect(listPublicCollections()).resolves.toEqual({ ok: true, data: [] })
    expect(transport).toHaveBeenCalledTimes(1)
  })

  it('hides a collection when none of its objects has a publishable photo', async () => {
    transport
      .mockResolvedValueOnce(
        response([
          {
            id: 'collection-1',
            owner_id: 'owner-1',
            title: 'Unfinished cabinet',
            category_id: 'books',
            tags: [],
            cover_path: null,
            description: null,
            subcategory_id: null,
            created_at: '2026-09-22T00:00:00Z',
            updated_at: '2026-09-22T00:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(response([{ id: 'owner-1', handle: 'reader', display_name: 'Reader', avatar_path: null }]))
      .mockResolvedValueOnce(response([{ collection_id: 'collection-1', cover_path: null }]))
      .mockResolvedValueOnce(response([]))

    await expect(listPublicCollections()).resolves.toEqual({ ok: true, data: [] })
  })

  it('does not present a partial feed when a public detail query fails', async () => {
    transport
      .mockResolvedValueOnce(
        response([
          {
            id: 'collection-1',
            owner_id: 'owner-1',
            title: 'Library',
            category_id: 'books',
            tags: [],
            created_at: '2026-09-22T00:00:00Z',
            updated_at: '2026-09-22T00:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(response({ message: 'network fetch failed' }, 503))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([]))
    const result = await listPublicCollections()
    expect(result).toMatchObject({ ok: false })
  })

  it('loads a real public collector profile and their collections', async () => {
    vi.stubEnv('EXPO_PUBLIC_SEEKER_VERIFICATION_ENABLED', 'true')
    transport
      .mockResolvedValueOnce(
        response({
          id: 'owner-1',
          handle: 'reader',
          display_name: 'Reader',
          bio: 'Books and maps',
          location_text: 'Istanbul',
          avatar_path: null,
        }),
      )
      .mockResolvedValueOnce(
        response([
          {
            id: 'collection-1',
            owner_id: 'owner-1',
            title: 'Library',
            category_id: 'books',
            tags: [],
            cover_path: null,
            description: null,
            subcategory_id: null,
            created_at: '2026-09-22T00:00:00Z',
            updated_at: '2026-09-22T00:00:00Z',
          },
        ]),
      )
      .mockResolvedValueOnce(response([{ badge_id: 'seeker-genesis' }]))
      .mockResolvedValueOnce(response([{ collection_id: 'collection-1', cover_path: 'owner/photo.jpg' }]))
      .mockResolvedValueOnce(response([{ collection_id: 'collection-1' }]))
    const result = await getPublicCollector('owner-1')
    expect(result).toMatchObject({
      ok: true,
      data: {
        displayName: 'Reader',
        handle: 'reader',
        bio: 'Books and maps',
        location: 'Istanbul',
        badgeIds: ['seeker-genesis'],
        collections: [{ title: 'Library', itemCount: 1, likeCount: 1, coverPath: 'owner/photo.jpg' }],
      },
    })
  })
})
