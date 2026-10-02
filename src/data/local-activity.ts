import { currentCollector } from './mock-data'
import type { ActivityEvent, ActivityKind } from './types'

export const LOCAL_ACTIVITY_CAP = 80

export type LocalActivityInput = {
  kind: ActivityKind
  action: string
  target?: string
  collectionId?: string
  itemId?: string
  collectorTargetId?: string
}

export function sanitizeLocalActivity(raw: unknown): ActivityEvent[] {
  if (!Array.isArray(raw)) {
    return []
  }
  const next: ActivityEvent[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      continue
    }
    const event = entry as Partial<ActivityEvent>
    if (typeof event.id !== 'string' || typeof event.action !== 'string' || typeof event.kind !== 'string') {
      continue
    }
    next.push({
      id: event.id,
      kind: event.kind as ActivityKind,
      actorId: typeof event.actorId === 'string' ? event.actorId : currentCollector.id,
      action: event.action,
      target: event.target,
      collectionId: event.collectionId,
      itemId: event.itemId,
      collectorTargetId: event.collectorTargetId,
      createdAt: typeof event.createdAt === 'string' ? event.createdAt : new Date().toISOString(),
      source: 'local',
      timeLabel: typeof event.timeLabel === 'string' ? event.timeLabel : 'Just now',
    })
  }
  return next.slice(0, LOCAL_ACTIVITY_CAP)
}

export function createLocalActivityEvent(input: LocalActivityInput): ActivityEvent {
  const createdAt = new Date().toISOString()
  return {
    id: `lact-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    kind: input.kind,
    actorId: currentCollector.id,
    action: input.action,
    target: input.target,
    collectionId: input.collectionId,
    itemId: input.itemId,
    collectorTargetId: input.collectorTargetId,
    createdAt,
    source: 'local',
    timeLabel: 'Just now',
  }
}

export function prependLocalActivity(current: ActivityEvent[], event: ActivityEvent): ActivityEvent[] {
  // Dedupe noisy repeats: same kind + same primary target already at head.
  const head = current[0]
  if (head && head.source === 'local' && head.kind === event.kind) {
    const sameTarget = event.itemId
      ? head.itemId === event.itemId
      : event.collectorTargetId
        ? head.collectorTargetId === event.collectorTargetId
        : !head.itemId && Boolean(event.collectionId) && head.collectionId === event.collectionId
    if (sameTarget) {
      return current
    }
  }
  return [event, ...current].slice(0, LOCAL_ACTIVITY_CAP)
}

export function pruneLocalActivityForCollection(current: ActivityEvent[], collectionId: string): ActivityEvent[] {
  return current.filter((event) => event.collectionId !== collectionId)
}

export function pruneLocalActivityForItem(current: ActivityEvent[], itemId: string): ActivityEvent[] {
  return current.filter((event) => event.itemId !== itemId)
}

export function formatActivityAge(createdAt?: string): string {
  if (!createdAt) {
    return ''
  }
  const ms = Date.now() - new Date(createdAt).getTime()
  if (Number.isNaN(ms) || ms < 0) {
    return 'Just now'
  }
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) {
    return 'Just now'
  }
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h`
  }
  const days = Math.floor(hours / 24)
  if (days === 1) {
    return 'Yesterday'
  }
  if (days < 7) {
    return `${days}d`
  }
  return `${Math.floor(days / 7)}w`
}

/** Local events (newest first) then seed mock baseline. */
export function mergeActivityFeed(local: ActivityEvent[], seed: ActivityEvent[]): ActivityEvent[] {
  const localized = [...local]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .map((event) => ({
      ...event,
      timeLabel: formatActivityAge(event.createdAt) || event.timeLabel,
      source: 'local' as const,
    }))
  const seeded = seed.map((event) => ({ ...event, source: event.source ?? ('seed' as const) }))
  return [...localized, ...seeded]
}
