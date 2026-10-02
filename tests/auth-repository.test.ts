import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteAccountPermanently, signOutAccount } from '../src/repositories/auth-repository'

const mocks = vi.hoisted(() => ({ getSupabase: vi.fn(), signOut: vi.fn(), invoke: vi.fn() }))
vi.mock('../src/lib/supabase', () => ({ getSupabase: mocks.getSupabase }))
beforeEach(() => {
  vi.resetAllMocks()
  mocks.getSupabase.mockReturnValue({ auth: { signOut: mocks.signOut }, functions: { invoke: mocks.invoke } })
})

describe('permanent account deletion', () => {
  it('requires a successful server deletion before clearing the local session', async () => {
    mocks.invoke.mockResolvedValue({ data: { deleted: true }, error: null })
    mocks.signOut.mockResolvedValue({ error: null })

    expect(await deleteAccountPermanently()).toEqual({ ok: true, data: true })
    expect(mocks.invoke).toHaveBeenCalledWith('delete-account', { body: { confirmation: 'DELETE' } })
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('keeps the local session when server deletion is not confirmed', async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: { message: 'Failed' } })

    expect(await deleteAccountPermanently()).toMatchObject({ ok: false })
    expect(mocks.signOut).not.toHaveBeenCalled()
  })
})

describe('account sign-out', () => {
  it('reports success only after the auth client completes', async () => {
    mocks.signOut.mockResolvedValue({ error: null })
    expect(await signOutAccount()).toEqual({ ok: true, data: true })
    expect(mocks.signOut).toHaveBeenCalledOnce()
  })
  it('does not report success when Supabase returns an error', async () => {
    mocks.signOut.mockResolvedValue({ error: { message: 'Network request failed' } })
    expect(await signOutAccount()).toMatchObject({ ok: false })
  })
  it('turns a rejected request into a retryable UI error', async () => {
    mocks.signOut.mockRejectedValue(new Error('Offline'))
    expect(await signOutAccount()).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining('try again') },
    })
  })
  it('does not attempt a network request in an unconfigured local build', async () => {
    mocks.getSupabase.mockReturnValue(null)
    expect(await signOutAccount()).toEqual({ ok: true, data: true })
    expect(mocks.signOut).not.toHaveBeenCalled()
  })
})
