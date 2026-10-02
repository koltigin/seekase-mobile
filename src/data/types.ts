import type { ImageSourcePropType } from 'react-native'

export type CategorySubcategory = {
  id: string
  label: string
  tags?: string[]
}

export type Category = {
  id: string
  slug: string
  label: string
  shortLabel: string
  inDiscoverRail?: boolean
  inInterestCurated?: boolean
  subcategories: CategorySubcategory[]
}

export type Collector = {
  /** Stable id used in routes — never display name. */
  id: string
  displayName: string
  /** Handle with or without leading @; normalize for display. */
  handle: string
  bio: string
  avatarColor: string
  avatarInitials: string
  locationText?: string
  /** Category ids from the shared taxonomy. */
  interestIds?: string[]
  /** Short editorial specialty labels (not necessarily taxonomy ids). */
  specialties?: string[]
  featuredCollectionIds?: string[]
  joinedAt?: string
  /** Optional public social links — same shape as editable profile. */
  socials?: Partial<Record<'instagram' | 'youtube' | 'tiktok' | 'x' | 'website', string>>
  /** Badge catalog ids for future display; never invent verified SGT. */
  badgeIds?: string[]
  stats: {
    collections: number
    items: number
    followers: number
    following: number
  }
}

export type Collection = {
  id: string
  title: string
  ownerId: string
  categoryId: string
  subcategory?: string
  tags?: string[]
  description?: string
  story?: string
  itemCount: number
  likeCount: number
  followerCount?: number
  featured?: boolean
  cover: ImageSourcePropType
}

/** Collector-oriented object signal — not a marketplace listing. */
export type ObjectStatus = 'in-collection' | 'looking-for' | 'open-to-trade' | 'open-to-offers'

export type ObjectCondition = 'mint' | 'near-mint' | 'excellent' | 'very-good' | 'good' | 'fair' | 'poor' | 'unknown'

export type CollectibleItem = {
  id: string
  collectionId: string
  title: string
  year?: string
  /** Private storage path; signed URLs are resolved only when displayed. */
  coverPath?: string
  /** Primary photograph. */
  image: ImageSourcePropType
  /** Optional gallery; when present, first entry often mirrors `image`. */
  images?: ImageSourcePropType[]
  categoryId?: string
  subcategory?: string
  tags?: string[]
  status?: ObjectStatus
  condition?: ObjectCondition
  story?: string
  provenance?: string
  likeCount?: number
  maker?: string
  author?: string
  publisher?: string
  issuer?: string
  manufacturer?: string
  country?: string
  era?: string
  material?: string
  denomination?: string
  edition?: string
  model?: string
  serialNumber?: string
  dimensions?: string
  format?: string
  artist?: string
  label?: string
  series?: string
  acquisitionYear?: string
  acquisitionPlace?: string
  note?: string
}

export type Comment = {
  id: string
  collectionId?: string
  itemId?: string
  actorId: string
  text: string
  timeLabel: string
}

export type SocialInteraction = {
  likedCollectionIds: string[]
  savedCollectionIds: string[]
  followedCollectorIds: string[]
  likedItemIds: string[]
  savedItemIds: string[]
}

export type ActivityKind = 'like' | 'follow' | 'add' | 'comment' | 'save'

export type ActivityEvent = {
  id: string
  kind: ActivityKind
  actorId: string
  action: string
  target?: string
  collectionId?: string
  /** Local object target when the event is about an item. */
  itemId?: string
  /** Collector who was followed (local follow events). */
  collectorTargetId?: string
  /** ISO timestamp for local events — used for sort + relative labels. */
  createdAt?: string
  source?: 'seed' | 'local'
  timeLabel: string
}

export type CollectionEdit = {
  title?: string
  description?: string
  story?: string
  categoryId?: string
  subcategory?: string
  tags?: string[]
}

export type ItemEdit = {
  title?: string
  collectionId?: string
  categoryId?: string
  subcategory?: string
  tags?: string[]
  year?: string
  story?: string
  provenance?: string
  condition?: ObjectCondition
  status?: ObjectStatus
  maker?: string
  author?: string
  publisher?: string
  issuer?: string
  manufacturer?: string
  country?: string
  era?: string
  material?: string
  denomination?: string
  edition?: string
  model?: string
  acquisitionYear?: string
  acquisitionPlace?: string
}
