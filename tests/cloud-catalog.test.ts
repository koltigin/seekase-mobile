import { beforeEach, describe, expect, it, vi } from 'vitest'
import { changeCloudCatalog, loadCloudCatalog, type CloudCatalogAction } from '../src/services/cloud-catalog'
import { requireCloudAccount } from '../src/repositories/cloud-access'
import * as catalog from '../src/repositories/catalog-repository'
import type { Collection, CollectibleItem } from '../src/data/types'

vi.mock('../src/repositories/cloud-access', () => ({ requireCloudAccount: vi.fn() }))
vi.mock('../src/repositories/catalog-repository', () => ({
  listOwnCollections: vi.fn(),
  listOwnItems: vi.fn(),
  createCloudCollection: vi.fn(),
  updateCloudCollection: vi.fn(),
  deleteCloudCollection: vi.fn(),
  createCloudItem: vi.fn(),
  updateCloudItem: vi.fn(),
  deleteCloudItem: vi.fn(),
}))

const collection: Collection = {
  id: 'cabinet',
  ownerId: 'account-a',
  title: 'Books',
  categoryId: 'books',
  itemCount: 0,
  likeCount: 0,
  cover: 1,
}
const item: CollectibleItem = { id: 'object', collectionId: 'cabinet', title: 'A book', image: 1 }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(requireCloudAccount).mockResolvedValue({ ok: true, data: true })
  vi.mocked(catalog.listOwnCollections).mockResolvedValue({ ok: true, data: [collection] })
  vi.mocked(catalog.listOwnItems).mockResolvedValue({ ok: true, data: [item] })
})

describe('account catalog boundary', () => {
  it('loads only the requested account and derives actual object counts', async () => {
    const signal = new AbortController().signal
    const result = await loadCloudCatalog('account-a', signal)
    expect(catalog.listOwnCollections).toHaveBeenCalledWith('account-a', signal)
    expect(catalog.listOwnItems).toHaveBeenCalledWith('account-a', signal)
    expect(result.collections[0].itemCount).toBe(1)
    expect(result.items).toEqual([item])
  })

  it('blocks reads and writes when the account or schema is unavailable', async () => {
    vi.mocked(requireCloudAccount).mockResolvedValue({
      ok: false,
      error: { code: 'unavailable', message: 'Not ready' },
    })
    await expect(loadCloudCatalog('account-a')).rejects.toThrow('Not ready')
    await expect(changeCloudCatalog('account-a', { kind: 'delete-item', id: 'object' })).rejects.toThrow('Not ready')
    expect(catalog.listOwnItems).not.toHaveBeenCalled()
    expect(catalog.deleteCloudItem).not.toHaveBeenCalled()
  })

  it('does not dispatch a write cancelled while account checks are running', async () => {
    const controller = new AbortController()
    vi.mocked(requireCloudAccount).mockImplementation(async () => {
      controller.abort()
      return { ok: true, data: true }
    })
    await expect(
      changeCloudCatalog('account-a', { kind: 'delete-item', id: 'object' }, controller.signal),
    ).rejects.toThrow('cancelled')
    expect(catalog.deleteCloudItem).not.toHaveBeenCalled()
  })

  it('does not replace a failed cloud read with seed or local data', async () => {
    vi.mocked(catalog.listOwnItems).mockResolvedValue({ ok: false, error: { code: 'network', message: 'Offline' } })
    await expect(loadCloudCatalog('account-a')).rejects.toThrow('Offline')
  })

  it('propagates mutation failures without retrying', async () => {
    vi.mocked(catalog.deleteCloudItem).mockResolvedValue({
      ok: false,
      error: { code: 'not_found', message: 'Missing' },
    })
    await expect(changeCloudCatalog('account-a', { kind: 'delete-item', id: 'object' })).rejects.toThrow('Missing')
    expect(catalog.deleteCloudItem).toHaveBeenCalledTimes(1)
  })

  it('routes all six explicit CRUD actions with the account owner and abort signal', async () => {
    vi.mocked(catalog.createCloudCollection).mockResolvedValue({ ok: true, data: collection })
    vi.mocked(catalog.updateCloudCollection).mockResolvedValue({ ok: true, data: collection })
    vi.mocked(catalog.deleteCloudCollection).mockResolvedValue({ ok: true, data: true })
    vi.mocked(catalog.createCloudItem).mockResolvedValue({ ok: true, data: item })
    vi.mocked(catalog.updateCloudItem).mockResolvedValue({ ok: true, data: item })
    vi.mocked(catalog.deleteCloudItem).mockResolvedValue({ ok: true, data: true })
    const collectionInput = { title: 'Books', categoryId: 'books' }
    const itemInput = { title: 'A book', categoryId: 'books', collectionId: 'cabinet' }
    const actions: CloudCatalogAction[] = [
      { kind: 'create-collection', input: collectionInput },
      { kind: 'update-collection', id: 'cabinet', input: collectionInput },
      { kind: 'delete-collection', id: 'cabinet' },
      { kind: 'create-item', input: itemInput },
      { kind: 'update-item', id: 'object', input: { year: '1984' } },
      { kind: 'delete-item', id: 'object' },
    ]
    const signal = new AbortController().signal
    for (const action of actions) await changeCloudCatalog('account-a', action, signal)
    expect(catalog.createCloudCollection).toHaveBeenCalledWith('account-a', collectionInput, signal)
    expect(catalog.updateCloudCollection).toHaveBeenCalledWith('account-a', 'cabinet', collectionInput, signal)
    expect(catalog.deleteCloudCollection).toHaveBeenCalledWith('account-a', 'cabinet', signal)
    expect(catalog.createCloudItem).toHaveBeenCalledWith('account-a', itemInput, signal)
    expect(catalog.updateCloudItem).toHaveBeenCalledWith('account-a', 'object', { year: '1984' }, signal)
    expect(catalog.deleteCloudItem).toHaveBeenCalledWith('account-a', 'object', signal)
  })
})

describe('adding without a collection', () => {
  const input = { title: 'My book', categoryId: 'books', publisher: 'A publisher' }
  it('creates a default group only when needed and saves the object there', async () => {
    vi.mocked(catalog.createCloudCollection).mockResolvedValue({ ok: true, data: { ...collection, id: 'default' } })
    vi.mocked(catalog.createCloudItem).mockResolvedValue({ ok: true, data: item })
    await changeCloudCatalog('account-a', { kind: 'create-ungrouped-item', input })
    expect(catalog.createCloudCollection).toHaveBeenCalledTimes(1)
    expect(catalog.createCloudItem).toHaveBeenCalledWith('account-a', { ...input, collectionId: 'default' }, undefined)
  })
  it('reuses the default group on the next add', async () => {
    vi.mocked(catalog.listOwnCollections).mockResolvedValue({
      ok: true,
      data: [{ ...collection, title: 'My objects', categoryId: 'other' }],
    })
    vi.mocked(catalog.createCloudItem).mockResolvedValue({ ok: true, data: item })
    await changeCloudCatalog('account-a', { kind: 'create-ungrouped-item', input })
    expect(catalog.createCloudCollection).not.toHaveBeenCalled()
    expect(catalog.createCloudItem).toHaveBeenCalledWith('account-a', { ...input, collectionId: 'cabinet' }, undefined)
  })
  it('stops before creating an item if group creation fails', async () => {
    vi.mocked(catalog.createCloudCollection).mockResolvedValue({
      ok: false,
      error: { code: 'network', message: 'Offline' },
    })
    await expect(changeCloudCatalog('account-a', { kind: 'create-ungrouped-item', input })).rejects.toThrow('Offline')
    expect(catalog.createCloudItem).not.toHaveBeenCalled()
  })
  it('retains the group on item failure and never retries or deletes data', async () => {
    vi.mocked(catalog.createCloudCollection).mockResolvedValue({ ok: true, data: collection })
    vi.mocked(catalog.createCloudItem).mockResolvedValue({
      ok: false,
      error: { code: 'network', message: 'Refresh before retrying' },
    })
    await expect(changeCloudCatalog('account-a', { kind: 'create-ungrouped-item', input })).rejects.toThrow('Refresh')
    expect(catalog.createCloudItem).toHaveBeenCalledTimes(1)
    expect(catalog.deleteCloudCollection).not.toHaveBeenCalled()
  })
  it('does not create an item after cancellation during group creation', async () => {
    const controller = new AbortController()
    vi.mocked(catalog.createCloudCollection).mockImplementation(async () => {
      controller.abort()
      return { ok: true, data: collection }
    })
    await expect(
      changeCloudCatalog('account-a', { kind: 'create-ungrouped-item', input }, controller.signal),
    ).rejects.toThrow('cancelled')
    expect(catalog.createCloudItem).not.toHaveBeenCalled()
  })
})
