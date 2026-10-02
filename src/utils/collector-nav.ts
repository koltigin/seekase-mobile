import { currentCollector } from '../data/mock-data'

type NavLike = {
  push: (href: string) => void
}

/** Open own Profile tab for self; otherwise public `/collector/[id]`. */
export function navigateToCollector(router: NavLike, collectorId: string) {
  if (collectorId === currentCollector.id) {
    router.push('/(tabs)/profile')
    return
  }
  router.push(`/collector/${collectorId}`)
}

export function collectorHandleDisplay(handle: string) {
  return handle.startsWith('@') ? handle : `@${handle}`
}

export function collectorFirstName(displayName: string) {
  return displayName.split(' ')[0] || displayName
}
