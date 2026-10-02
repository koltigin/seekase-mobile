import { describe, expect, it } from 'vitest'
import { earnedBadgesForIds, earnedProgressBadges, seekerGenesisBadge, walletVerifiedBadge } from '../src/data/badges'

describe('collector progress badges', () => {
  it('awards only badges whose transparent thresholds were reached', () => {
    expect(
      earnedProgressBadges({ collectionCount: 5, itemCount: 50, largestCategoryItemCount: 25 }).map(
        (badge) => badge.id,
      ),
    ).toEqual(['first-collection', 'objects-10', 'collections-5', 'objects-50', 'specialist'])
  })

  it('keeps wallet and SGT badges fixed to their explicit identities', () => {
    expect(walletVerifiedBadge.id).toBe('wallet-verified')
    expect(seekerGenesisBadge.id).toBe('seeker-genesis')
    const ids = earnedProgressBadges({ collectionCount: 100, itemCount: 1000, largestCategoryItemCount: 1000 }).map(
      (badge) => badge.id,
    )
    expect(ids).not.toContain('wallet-verified')
    expect(ids).not.toContain('seeker-genesis')
  })

  it('keeps streak achievements based on the longest verified run', () => {
    expect(
      earnedProgressBadges({ collectionCount: 0, itemCount: 0, longestStreak: 14 }).map((badge) => badge.id),
    ).toEqual(['streak-7', 'streak-14'])
    expect(
      earnedProgressBadges({ collectionCount: 0, itemCount: 0, longestStreak: 30 }).map((badge) => badge.id),
    ).toEqual(['streak-7', 'streak-14', 'streak-30'])
  })

  it('maps public server badge ids without treating achievements as identity verification', () => {
    const badges = earnedBadgesForIds(['wallet-verified', 'objects-10', 'streak-7'])
    expect(badges.map((badge) => [badge.id, badge.state])).toEqual([
      ['wallet-verified', 'verified'],
      ['objects-10', 'earned'],
      ['streak-7', 'earned'],
    ])
  })
})
