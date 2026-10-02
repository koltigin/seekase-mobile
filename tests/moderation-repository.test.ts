import { createClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { blockCollector, listBlockedCollectorIds, reportContent } from '../src/repositories/moderation-repository'
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

describe('moderation repository', () => {
  it('submits a private pending report for the signed-in reporter', async () => {
    transport.mockResolvedValueOnce(response(null, 201))
    await expect(
      reportContent({ reporterId: 'viewer', targetType: 'collection', targetId: 'collection-1', reason: 'spam' }),
    ).resolves.toEqual({ ok: true, data: true })
    expect(JSON.parse(String(transport.mock.calls[0][1]?.body))).toEqual({
      reporter_id: 'viewer',
      target_type: 'collection',
      target_id: 'collection-1',
      reason: 'spam',
      details: null,
      status: 'pending',
    })
  })

  it('rejects self-blocking without a network request', async () => {
    await expect(blockCollector('viewer', 'viewer')).resolves.toMatchObject({ ok: false })
    expect(transport).not.toHaveBeenCalled()
  })

  it('loads only collector ids blocked by the current account', async () => {
    transport.mockResolvedValueOnce(response([{ blocked_id: 'collector-2' }]))
    await expect(listBlockedCollectorIds('viewer')).resolves.toEqual({ ok: true, data: ['collector-2'] })
    const url = new URL(String(transport.mock.calls[0][0]))
    expect(url.searchParams.get('blocker_id')).toBe('eq.viewer')
  })
})
