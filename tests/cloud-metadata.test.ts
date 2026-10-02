import { describe, expect, it, vi } from 'vitest'
import { collectibleMetadataForInsert } from '../src/data/mappers/cloud-mappers'
vi.mock('../src/data/covers', () => ({ covers: { scifi: 1 } }))

describe('cloud metadata patch payload', () => {
  it('only sends supplied fields so the database can preserve the others', () => {
    expect(collectibleMetadataForInsert({ year: '1984' })).toEqual({ year: '1984' })
    expect(collectibleMetadataForInsert({ year: undefined })).toEqual({})
  })
  it('preserves an explicit empty string so an existing value can be cleared', () => {
    expect(collectibleMetadataForInsert({ author: '', note: 'New note' })).toEqual({ author: '', note: 'New note' })
  })
})
