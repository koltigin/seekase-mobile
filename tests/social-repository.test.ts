import { createClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCloudSocialState, likeCollection, unfollowCollector } from '../src/repositories/social-repository'
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
      global: { fetch: transport as unknown as typeof fetch },
    }),
  )
})

describe('cloud social repository', () => {
  it('loads the signed-in account social state for visible records', async () => {
    transport
      .mockResolvedValueOnce(response([{ collection_id: 'cabinet-1' }]))
      .mockResolvedValueOnce(response([{ collection_id: 'cabinet-2' }]))
      .mockResolvedValueOnce(response([{ following_id: 'collector-2' }]))
    const result = await getCloudSocialState('viewer', ['cabinet-1', 'cabinet-2'], ['viewer', 'collector-2'])
    expect(result).toEqual({
      ok: true,
      data: {
        likedCollectionIds: ['cabinet-1'],
        savedCollectionIds: ['cabinet-2'],
        followedCollectorIds: ['collector-2'],
      },
    })
    const urls = transport.mock.calls.map(([url]) => new URL(String(url)))
    expect(urls[0].searchParams.get('user_id')).toBe('eq.viewer')
    expect(urls[1].searchParams.get('user_id')).toBe('eq.viewer')
    expect(urls[2].searchParams.get('follower_id')).toBe('eq.viewer')
    expect(urls[2].searchParams.get('following_id')).not.toContain('viewer')
  })

  it('writes collection likes and scopes unfollow to both account ids', async () => {
    transport.mockResolvedValue(response(null, 201)).mockResolvedValueOnce(response(null, 201))
    expect(await likeCollection('viewer', 'cabinet-1')).toEqual({ ok: true, data: true })
    const likeRequest = transport.mock.calls[0]
    expect(likeRequest[1]?.method).toBe('POST')
    expect(JSON.parse(String(likeRequest[1]?.body))).toEqual({ user_id: 'viewer', collection_id: 'cabinet-1' })

    expect(await unfollowCollector('viewer', 'collector-2')).toEqual({ ok: true, data: true })
    const unfollowUrl = new URL(String(transport.mock.calls[1][0]))
    expect(transport.mock.calls[1][1]?.method).toBe('DELETE')
    expect(unfollowUrl.searchParams.get('follower_id')).toBe('eq.viewer')
    expect(unfollowUrl.searchParams.get('following_id')).toBe('eq.collector-2')
  })
})
