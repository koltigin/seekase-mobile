export type BadgeState = 'verified' | 'earned' | 'unavailable' | 'hidden'
export type BadgeFamily = 'wallet' | 'seeker' | 'milestone' | 'streak'

export type CollectorBadge = {
  id: string
  label: string
  description: string
  state: BadgeState
  family: BadgeFamily
}

export const badgeCatalog: CollectorBadge[] = [
  {
    id: 'wallet-verified',
    label: 'Wallet Verified',
    description: 'This collector proved control of a Solana wallet with a private message signature.',
    state: 'verified',
    family: 'wallet',
  },
  {
    id: 'seeker-genesis',
    label: 'Seeker Genesis',
    description: 'Reserved for verified Seeker Genesis Token holders. Not awarded until ownership is confirmed.',
    state: 'unavailable',
    family: 'seeker',
  },
  {
    id: 'founding',
    label: 'Founding Collector',
    description: 'Early Seekase collectors who helped open the cabinet.',
    state: 'hidden',
    family: 'milestone',
  },
  {
    id: 'early-adopter',
    label: 'Early Adopter',
    description: 'Joined during the first public season.',
    state: 'hidden',
    family: 'milestone',
  },
  {
    id: 'first-collection',
    label: 'First Collection',
    description: 'Created a first public collection on Seekase.',
    state: 'hidden',
    family: 'milestone',
  },
  {
    id: 'objects-10',
    label: 'Catalog Starter',
    description: 'Catalogued ten collectibles.',
    state: 'hidden',
    family: 'milestone',
  },
  {
    id: 'collections-5',
    label: 'Curator',
    description: 'Created five distinct collections.',
    state: 'hidden',
    family: 'milestone',
  },
  {
    id: 'objects-50',
    label: 'Dedicated Collector',
    description: 'Catalogued fifty collectibles.',
    state: 'hidden',
    family: 'milestone',
  },
  {
    id: 'objects-100',
    label: '100 Objects Catalogued',
    description: 'A cabinet that has grown to a hundred recorded objects.',
    state: 'hidden',
    family: 'milestone',
  },
  {
    id: 'collections-10',
    label: '10 Collections',
    description: 'Ten distinct shelves in one collector identity.',
    state: 'hidden',
    family: 'milestone',
  },
  {
    id: 'specialist',
    label: 'Specialist Collector',
    description: 'Deep focus in a single category.',
    state: 'hidden',
    family: 'milestone',
  },
  {
    id: 'community',
    label: 'Community Contributor',
    description: 'Conversations, comments, and care for other cabinets.',
    state: 'hidden',
    family: 'milestone',
  },
  {
    id: 'streak-7',
    label: '7 Day Streak',
    description: 'Completed a verified Solana check-in for seven consecutive UTC days.',
    state: 'hidden',
    family: 'streak',
  },
  {
    id: 'streak-14',
    label: '14 Day Streak',
    description: 'Completed a verified Solana check-in for fourteen consecutive UTC days.',
    state: 'hidden',
    family: 'streak',
  },
  {
    id: 'streak-30',
    label: '30 Day Streak',
    description: 'Completed a verified Solana check-in for thirty consecutive UTC days.',
    state: 'hidden',
    family: 'streak',
  },
]

export const walletVerifiedBadge = badgeCatalog.find((badge) => badge.id === 'wallet-verified')!
export const seekerGenesisBadge = badgeCatalog.find((badge) => badge.id === 'seeker-genesis')!
export const publishedBadgeCatalog = badgeCatalog.filter(
  (badge) => !['founding', 'early-adopter', 'community'].includes(badge.id),
)

export function badgeForId(id: string) {
  return badgeCatalog.find((badge) => badge.id === id)
}

export function earnedBadgesForIds(ids: string[]) {
  const earnedIds = new Set(ids)
  return badgeCatalog
    .filter((badge) => earnedIds.has(badge.id))
    .map((badge) => ({
      ...badge,
      state: badge.family === 'wallet' || badge.family === 'seeker' ? ('verified' as const) : ('earned' as const),
    }))
}

export function earnedProgressBadges(input: {
  collectionCount: number
  itemCount: number
  largestCategoryItemCount?: number
  longestStreak?: number
}) {
  const earnedIds = new Set<string>()
  if (input.collectionCount >= 1) earnedIds.add('first-collection')
  if (input.itemCount >= 10) earnedIds.add('objects-10')
  if (input.collectionCount >= 5) earnedIds.add('collections-5')
  if (input.itemCount >= 50) earnedIds.add('objects-50')
  if (input.itemCount >= 100) earnedIds.add('objects-100')
  if (input.collectionCount >= 10) earnedIds.add('collections-10')
  if ((input.largestCategoryItemCount ?? 0) >= 25) earnedIds.add('specialist')
  if ((input.longestStreak ?? 0) >= 7) earnedIds.add('streak-7')
  if ((input.longestStreak ?? 0) >= 14) earnedIds.add('streak-14')
  if ((input.longestStreak ?? 0) >= 30) earnedIds.add('streak-30')
  return badgeCatalog
    .filter((badge) => earnedIds.has(badge.id))
    .map((badge) => ({ ...badge, state: 'earned' as const }))
}
