import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getStoredSeekerVerification,
  verifyStoredSeekerEligibility,
} from '../src/repositories/seeker-verification-repository'

const mocks = vi.hoisted(() => ({ getSupabase: vi.fn(), invoke: vi.fn() }))
vi.mock('../src/lib/supabase', () => ({ getSupabase: mocks.getSupabase }))

beforeEach(() => {
  vi.resetAllMocks()
  mocks.getSupabase.mockReturnValue({ functions: { invoke: mocks.invoke } })
})

describe('Seeker verification repository', () => {
  it('loads only the derived private status', async () => {
    mocks.invoke.mockResolvedValue({
      data: {
        status: 'verified',
        checkedAt: '2026-09-24T10:00:00.000Z',
        expiresAt: '2026-09-25T10:00:00.000Z',
      },
      error: null,
    })
    await expect(getStoredSeekerVerification()).resolves.toEqual({
      ok: true,
      data: {
        status: 'verified',
        checkedAt: '2026-09-24T10:00:00.000Z',
        expiresAt: '2026-09-25T10:00:00.000Z',
      },
    })
    expect(JSON.stringify(mocks.invoke.mock.calls)).not.toContain('mint')
    expect(JSON.stringify(mocks.invoke.mock.calls)).not.toContain('wallet')
  })

  it('sends the connected address only to the private verification function', async () => {
    mocks.invoke.mockResolvedValue({ data: { status: 'not_verified', checkedAt: null, expiresAt: null }, error: null })
    await verifyStoredSeekerEligibility('private-wallet-address')
    expect(mocks.invoke).toHaveBeenCalledWith('seeker-verification', {
      body: { action: 'verify', address: 'private-wallet-address' },
    })
  })

  it('rejects a malformed status response', async () => {
    mocks.invoke.mockResolvedValue({ data: { status: 'verified', checkedAt: 1 }, error: null })
    expect(await getStoredSeekerVerification()).toMatchObject({ ok: false, error: { code: 'validation' } })
  })
})
