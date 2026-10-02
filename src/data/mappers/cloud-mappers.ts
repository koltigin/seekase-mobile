import { covers } from '../covers'
import type { CollectibleItem, Collection, ObjectCondition, ObjectStatus } from '../types'
import type { CollectionRow, ItemRow, Json, ProfileRow } from '../../types/database'

const DEFAULT_COVER = covers.scifi

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return 'SK'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export type CloudProfileFields = {
  displayName: string
  handle: string
  bio: string
  location: string
  avatarInitials: string
  avatarPath?: string
  website: string
  socials: Partial<Record<'instagram' | 'youtube' | 'tiktok' | 'x' | 'website', string>>
}

/** Map DB profile → Seekase profile fields (no wallet data). */
export function mapProfileRowToEditable(row: ProfileRow): CloudProfileFields {
  const links = asRecord(row.social_links)
  const social = (key: string) => (typeof links[key] === 'string' ? links[key] : '')
  return {
    displayName: row.display_name,
    handle: row.handle,
    bio: row.bio,
    location: row.location_text ?? '',
    avatarInitials: initialsFromName(row.display_name),
    avatarPath: row.avatar_path ?? undefined,
    website: social('website'),
    socials: {
      instagram: social('instagram') || undefined,
      youtube: social('youtube') || undefined,
      tiktok: social('tiktok') || undefined,
      x: social('x') || undefined,
      website: social('website') || undefined,
    },
  }
}

export function mapCollectionRowToCollection(row: CollectionRow, itemCount = 0): Collection {
  return {
    id: row.id,
    title: row.title,
    ownerId: row.owner_id,
    categoryId: row.category_id,
    subcategory: row.subcategory_id ?? undefined,
    tags: row.tags ?? [],
    description: row.description ?? undefined,
    itemCount,
    likeCount: 0,
    cover: DEFAULT_COVER,
  }
}

function asRecord(metadata: Json): Record<string, unknown> {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>
  }
  return {}
}

function str(meta: Record<string, unknown>, key: string): string | undefined {
  const value = meta[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function mapItemRowToCollectible(row: ItemRow): CollectibleItem {
  const meta = asRecord(row.metadata)
  return {
    id: row.id,
    collectionId: row.collection_id,
    title: row.title,
    categoryId: row.category_id,
    subcategory: row.subcategory_id ?? undefined,
    tags: row.tags ?? [],
    story: row.story ?? undefined,
    provenance: row.provenance ?? undefined,
    condition: (row.condition as ObjectCondition | null) ?? undefined,
    status: (row.status as ObjectStatus | null) ?? undefined,
    year: str(meta, 'year'),
    maker: str(meta, 'maker'),
    author: str(meta, 'author'),
    publisher: str(meta, 'publisher'),
    issuer: str(meta, 'issuer'),
    manufacturer: str(meta, 'manufacturer'),
    country: str(meta, 'country'),
    model: str(meta, 'model'),
    acquisitionYear: str(meta, 'acquisitionYear'),
    acquisitionPlace: str(meta, 'acquisitionPlace'),
    note: str(meta, 'note'),
    image: DEFAULT_COVER,
    coverPath: row.cover_path ?? undefined,
  }
}

export function collectibleMetadataForInsert(input: {
  year?: string
  maker?: string
  author?: string
  publisher?: string
  issuer?: string
  manufacturer?: string
  country?: string
  model?: string
  acquisitionYear?: string
  acquisitionPlace?: string
  note?: string
}): Json {
  const metadata: Record<string, string> = {}
  const keys = [
    'year',
    'maker',
    'author',
    'publisher',
    'issuer',
    'manufacturer',
    'country',
    'model',
    'acquisitionYear',
    'acquisitionPlace',
    'note',
  ] as const
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'string') {
      metadata[key] = value
    }
  }
  return metadata
}

export function normalizeHandle(raw: string) {
  return raw
    .trim()
    .replace(/^@/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30)
}

export function suggestHandleFromEmail(email: string) {
  const local = email.split('@')[0] ?? 'collector'
  const base = normalizeHandle(local) || 'collector'
  return base.length >= 3 ? base : `${base}seek`
}
