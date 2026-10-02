import { expect, it } from 'vitest'
import badgeIconPaths from '../assets/brand/badge-icon-paths.json'
import { badgeCatalog } from '../src/data/badges'

it('provides a distinct vector icon for every badge identity', () => {
  expect(Object.keys(badgeIconPaths).sort()).toEqual(badgeCatalog.map((badge) => badge.id).sort())
  expect(new Set(Object.values(badgeIconPaths).map((paths) => paths.primary)).size).toBeGreaterThanOrEqual(11)
})

it('keeps badge paths compact and text-free', () => {
  for (const [id, paths] of Object.entries(badgeIconPaths)) {
    expect(paths.primary.length, id).toBeGreaterThan(20)
    expect(paths.primary, id).toMatch(/^[0-9A-Za-z .,-]+$/)
    if ('accent' in paths && paths.accent) expect(paths.accent, id).toMatch(/^[0-9A-Za-z .,-]+$/)
  }
})
