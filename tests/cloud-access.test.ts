import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireCloudAccount } from '../src/repositories/cloud-access'

const mocks = vi.hoisted(() => ({ getSupabase: vi.fn(), ensureProfile: vi.fn() }))
vi.mock('../src/lib/supabase', () => ({ getSupabase: mocks.getSupabase }))
vi.mock('../src/repositories/profile-repository', () => ({ ensureProfile: mocks.ensureProfile }))

const user = {
  id: 'account-a',
  email: 'collector@example.test',
  user_metadata: { display_name: 'Collector', handle: 'collector' },
}
const getUser = vi.fn()
const rpc = vi.fn()
function version(data: number | null, error: object | null = null) {
  const result = Promise.resolve({ data, error })
  return Object.assign(result, { abortSignal: vi.fn(() => result) })
}

beforeEach(() => {
  vi.resetAllMocks()
  getUser.mockResolvedValue({ data: { user }, error: null })
  rpc.mockReturnValue(version(2))
  mocks.getSupabase.mockReturnValue({ auth: { getUser }, rpc })
  mocks.ensureProfile.mockResolvedValue({ ok: true, data: { id: user.id } })
})

describe('cloud account readiness', () => {
  it('works without backend configuration and does not attempt a network call', async () => {
    mocks.getSupabase.mockReturnValue(null)
    expect(await requireCloudAccount('account-a')).toMatchObject({ ok: false, error: { code: 'unavailable' } })
    expect(getUser).not.toHaveBeenCalled()
  })
  it('rejects another account before schema or profile access', async () => {
    expect(await requireCloudAccount('account-b')).toMatchObject({ ok: false, error: { code: 'unauthenticated' } })
    expect(rpc).not.toHaveBeenCalled()
    expect(mocks.ensureProfile).not.toHaveBeenCalled()
  })
  it('rejects an expired session', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Expired' } })
    expect(await requireCloudAccount('account-a')).toMatchObject({ ok: false, error: { code: 'unauthenticated' } })
  })
  it('requires the installed schema version rather than assuming migrations ran', async () => {
    rpc.mockReturnValue(version(null, { message: 'Function missing' }))
    expect(await requireCloudAccount('account-a')).toMatchObject({ ok: false, error: { code: 'unavailable' } })
    expect(mocks.ensureProfile).not.toHaveBeenCalled()
  })
  it('ensures only the authenticated profile, never device or wallet data', async () => {
    expect(await requireCloudAccount('account-a')).toEqual({ ok: true, data: true })
    expect(rpc).toHaveBeenCalledWith('catalog_schema_version')
    expect(mocks.ensureProfile).toHaveBeenCalledWith({
      userId: user.id,
      email: user.email,
      displayName: 'Collector',
      handle: 'collector',
    })
  })
  it('stops if cancelled during authentication', async () => {
    const controller = new AbortController()
    getUser.mockImplementation(async () => {
      controller.abort()
      return { data: { user }, error: null }
    })
    expect(await requireCloudAccount('account-a', controller.signal)).toMatchObject({ ok: false })
    expect(rpc).not.toHaveBeenCalled()
  })
  it('surfaces profile creation failures before allowing catalog use', async () => {
    mocks.ensureProfile.mockResolvedValue({ ok: false, error: { code: 'validation', message: 'Profile incomplete' } })
    expect(await requireCloudAccount('account-a')).toMatchObject({
      ok: false,
      error: { message: 'Profile incomplete' },
    })
  })
})
