import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getWalletVerificationStatus,
  requestWalletChallenge,
  verifyWalletLink,
} from '../src/repositories/wallet-auth-repository'

const mocks = vi.hoisted(() => ({ getSupabase: vi.fn(), invoke: vi.fn() }))
vi.mock('../src/lib/supabase', () => ({ getSupabase: mocks.getSupabase }))
vi.mock('react-native-quick-base64', () => ({ fromByteArray: vi.fn(() => 'encoded') }))

beforeEach(() => {
  vi.resetAllMocks()
  mocks.getSupabase.mockReturnValue({ functions: { invoke: mocks.invoke } })
})

describe('wallet verification status', () => {
  it('does not call the backend when account services are unavailable', async () => {
    mocks.getSupabase.mockReturnValue(null)
    expect(await getWalletVerificationStatus()).toMatchObject({ ok: false, error: { code: 'unavailable' } })
    expect(mocks.invoke).not.toHaveBeenCalled()
  })

  it('returns the private derived verification state without an address', async () => {
    mocks.invoke.mockResolvedValue({
      data: { verified: true, verifiedAt: '2026-09-22T10:00:00.000Z' },
      error: null,
    })
    expect(await getWalletVerificationStatus()).toEqual({
      ok: true,
      data: { verified: true, verifiedAt: '2026-09-22T10:00:00.000Z' },
    })
    expect(mocks.invoke).toHaveBeenCalledWith('wallet-auth', { body: { action: 'status' } })
  })

  it('rejects malformed status responses', async () => {
    mocks.invoke.mockResolvedValue({ data: { verified: 'yes' }, error: null })
    expect(await getWalletVerificationStatus()).toMatchObject({ ok: false, error: { code: 'validation' } })
  })
})

describe('wallet account linking', () => {
  it('binds a challenge to the explicit link intent', async () => {
    mocks.invoke.mockResolvedValue({
      data: {
        payload: {
          address: 'wallet-address',
          requestId: 'request-id',
          statement: 'Link wallet',
        },
      },
      error: null,
    })
    const result = await requestWalletChallenge('wallet-address', 'link')
    expect(result.ok).toBe(true)
    expect(mocks.invoke).toHaveBeenCalledWith('wallet-auth', {
      body: { action: 'challenge', address: 'wallet-address', intent: 'link' },
    })
  })

  it('keeps the current session and accepts only a link response', async () => {
    mocks.invoke.mockResolvedValue({
      data: { linked: true, verifiedAt: '2026-09-22T12:00:00.000Z' },
      error: null,
    })
    const result = await verifyWalletLink({
      payload: { address: 'wallet-address', requestId: 'request-id' } as never,
      signedAddress: 'wallet-address',
      signedMessage: new Uint8Array([1]),
      signature: new Uint8Array([2]),
    })
    expect(result).toEqual({
      ok: true,
      data: { verified: true, verifiedAt: '2026-09-22T12:00:00.000Z' },
    })
    expect(mocks.invoke).toHaveBeenCalledWith('wallet-auth', {
      body: expect.objectContaining({ action: 'verify', address: 'wallet-address', requestId: 'request-id' }),
    })
  })

  it('does not accept a wallet sign-in token as a successful link', async () => {
    mocks.invoke.mockResolvedValue({
      data: { tokenHash: 'must-not-switch-session', verificationType: 'magiclink' },
      error: null,
    })
    const result = await verifyWalletLink({
      payload: { address: 'wallet-address', requestId: 'request-id' } as never,
      signedAddress: 'wallet-address',
      signedMessage: new Uint8Array([1]),
      signature: new Uint8Array([2]),
    })
    expect(result).toMatchObject({ ok: false, error: { code: 'validation' } })
  })
})
