import { describe, expect, it } from 'vitest'
import { formatActivityTime } from '../src/data/activity-time'

const now = Date.parse('2026-09-23T12:00:00.000Z')

describe('activity time labels', () => {
  it('formats recent account activity compactly', () => {
    expect(formatActivityTime('2026-09-23T11:59:45.000Z', now)).toBe('Just now')
    expect(formatActivityTime('2026-09-23T11:42:00.000Z', now)).toBe('18m')
    expect(formatActivityTime('2026-09-23T09:00:00.000Z', now)).toBe('3h')
    expect(formatActivityTime('2026-09-20T12:00:00.000Z', now)).toBe('3d')
  })

  it('does not invent a time for an invalid timestamp', () => {
    expect(formatActivityTime('invalid', now)).toBe('')
  })
})
