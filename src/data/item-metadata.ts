import type { CollectibleItem, ObjectCondition, ObjectStatus } from './types'

export const OBJECT_STATUS_LABELS: Record<ObjectStatus, string> = {
  'in-collection': 'In Collection',
  'looking-for': 'Looking For',
  'open-to-trade': 'Open to Trade',
  'open-to-offers': 'Open to Offers',
}

export const OBJECT_CONDITION_LABELS: Record<ObjectCondition, string> = {
  mint: 'Mint',
  'near-mint': 'Near Mint',
  excellent: 'Excellent',
  'very-good': 'Very Good',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  unknown: 'Unknown',
}

export const OBJECT_STATUSES = Object.keys(OBJECT_STATUS_LABELS) as ObjectStatus[]
export const OBJECT_CONDITIONS = Object.keys(OBJECT_CONDITION_LABELS) as ObjectCondition[]

export type MetadataRow = { label: string; value: string }

/**
 * Category-aware metadata rows. Only populated fields are returned —
 * empty/irrelevant keys never appear in the UI.
 */
export function itemMetadataRows(item: CollectibleItem): MetadataRow[] {
  const categoryId = item.categoryId
  const preferred: [string, string | undefined][] = []

  if (categoryId === 'books') {
    preferred.push(
      ['Author', item.author],
      ['Publisher', item.publisher],
      ['Edition', item.edition],
      ['Year', item.year],
      ['Origin', item.country],
    )
  } else if (categoryId === 'coins') {
    preferred.push(
      ['Issuer', item.issuer],
      ['Denomination', item.denomination],
      ['Material', item.material],
      ['Year', item.year],
      ['Country / empire', item.country],
      ['Era', item.era],
    )
  } else if (categoryId === 'stamps') {
    preferred.push(
      ['Country', item.country],
      ['Issue year', item.year],
      ['Series', item.series],
      ['Format', item.format],
    )
  } else if (categoryId === 'retro-tech') {
    preferred.push(
      ['Manufacturer', item.manufacturer],
      ['Model', item.model],
      ['Year', item.year],
      ['Origin', item.country],
    )
  } else if (categoryId === 'cameras') {
    preferred.push(
      ['Manufacturer', item.manufacturer],
      ['Model', item.model],
      ['Format', item.format],
      ['Year', item.year],
    )
  } else if (categoryId === 'music') {
    preferred.push(['Artist', item.artist], ['Label', item.label], ['Format', item.format], ['Release year', item.year])
  } else {
    preferred.push(
      ['Maker', item.maker],
      ['Author', item.author],
      ['Manufacturer', item.manufacturer],
      ['Issuer', item.issuer],
      ['Publisher', item.publisher],
      ['Model', item.model],
      ['Edition', item.edition],
      ['Material', item.material],
      ['Denomination', item.denomination],
      ['Country', item.country],
      ['Era', item.era],
      ['Year', item.year],
      ['Format', item.format],
      ['Series', item.series],
      ['Artist', item.artist],
      ['Label', item.label],
    )
  }

  preferred.push(
    ['Acquired', item.acquisitionYear],
    ['Acquired in', item.acquisitionPlace],
    ['Dimensions', item.dimensions],
    ['Serial', item.serialNumber],
  )

  // Category changes must not hide previously saved details. Keep category-specific
  // labels first, then include any other populated metadata under its usual label.
  const aliases: Record<string, string> = {
    Origin: 'Country',
    'Country / empire': 'Country',
    'Issue year': 'Year',
    'Release year': 'Year',
  }
  const included = new Set(preferred.map(([label]) => aliases[label] ?? label))
  const remaining: [string, string | undefined][] = [
    ['Maker', item.maker],
    ['Author', item.author],
    ['Publisher', item.publisher],
    ['Manufacturer', item.manufacturer],
    ['Model', item.model],
    ['Issuer', item.issuer],
    ['Country', item.country],
    ['Year', item.year],
    ['Edition', item.edition],
    ['Material', item.material],
    ['Denomination', item.denomination],
    ['Era', item.era],
    ['Format', item.format],
    ['Series', item.series],
    ['Artist', item.artist],
    ['Label', item.label],
  ]
  preferred.push(...remaining.filter(([label]) => !included.has(label)))

  const seen = new Set<string>()
  const rows: MetadataRow[] = []
  for (const [label, value] of preferred) {
    if (!value?.trim() || seen.has(label)) {
      continue
    }
    seen.add(label)
    rows.push({ label, value: value.trim() })
  }
  return rows
}

export function itemGallery(item: CollectibleItem) {
  if (item.images && item.images.length > 0) {
    return item.images
  }
  return [item.image]
}
