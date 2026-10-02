import type { SocialInteraction } from './types'

export type CollectorMilestoneId =
  | 'first-cabinet'
  | 'first-object'
  | 'objects-5'
  | 'objects-10'
  | 'first-follow'
  | 'first-save'
  | 'explorer'

export type CollectorMilestone = {
  id: CollectorMilestoneId
  label: string
  description: string
  /** Whether the milestone is currently unlocked from live state. */
  unlocked: boolean
}

export type CollectorProgressSnapshot = {
  cabinets: number
  objects: number
  following: number
  saved: number
  liked: number
  milestones: CollectorMilestone[]
  unlockedCount: number
  next?: {
    id: CollectorMilestoneId
    label: string
    detail: string
  }
}

function milestone(
  id: CollectorMilestoneId,
  label: string,
  description: string,
  unlocked: boolean,
): CollectorMilestone {
  return { id, label, description, unlocked }
}

export function deriveCollectorProgress(input: {
  cabinets: number
  objects: number
  social: SocialInteraction
}): CollectorProgressSnapshot {
  const following = input.social.followedCollectorIds.length
  const saved =
    (input.social.savedItemIds?.length ?? 0) + (input.social.savedCollectionIds?.length ?? 0)
  const liked =
    (input.social.likedItemIds?.length ?? 0) + (input.social.likedCollectionIds?.length ?? 0)

  const milestones: CollectorMilestone[] = [
    milestone('first-cabinet', 'First Cabinet', 'Created your first shelf in the cabinet.', input.cabinets >= 1),
    milestone('first-object', 'First Object', 'Catalogued your first object.', input.objects >= 1),
    milestone('objects-5', 'Five Objects', 'Five objects recorded with care.', input.objects >= 5),
    milestone('objects-10', 'Ten Objects', 'A growing cabinet of ten objects.', input.objects >= 10),
    milestone('first-follow', 'First Follow', 'Began following another collector.', following >= 1),
    milestone('first-save', 'First Save', 'Saved something to revisit later.', saved >= 1),
    milestone(
      'explorer',
      'Explorer',
      'Followed collectors and saved something worth returning to.',
      following >= 1 && saved >= 1,
    ),
  ]

  const unlockedCount = milestones.filter((entry) => entry.unlocked).length

  let next: CollectorProgressSnapshot['next']
  if (input.cabinets < 1) {
    next = { id: 'first-cabinet', label: 'First Cabinet', detail: 'Create your first collection to open the shelf.' }
  } else if (input.objects < 1) {
    next = { id: 'first-object', label: 'First Object', detail: 'Add your first object to a cabinet.' }
  } else if (input.objects < 5) {
    next = {
      id: 'objects-5',
      label: 'Five Objects',
      detail: `${5 - input.objects} more object${5 - input.objects === 1 ? '' : 's'} to reach Five Objects.`,
    }
  } else if (input.objects < 10) {
    next = {
      id: 'objects-10',
      label: 'Ten Objects',
      detail: `${10 - input.objects} more object${10 - input.objects === 1 ? '' : 's'} to reach Ten Objects.`,
    }
  } else if (following < 1) {
    next = { id: 'first-follow', label: 'First Follow', detail: 'Follow a collector from Discover or a profile.' }
  } else if (saved < 1) {
    next = { id: 'first-save', label: 'First Save', detail: 'Save an object or cabinet to revisit later.' }
  } else if (!(following >= 1 && saved >= 1)) {
    next = { id: 'explorer', label: 'Explorer', detail: 'Follow and save to complete Explorer.' }
  }

  return {
    cabinets: input.cabinets,
    objects: input.objects,
    following,
    saved,
    liked,
    milestones,
    unlockedCount,
    next,
  }
}
