export type CategoryPickTarget = 'add' | 'edit-profile' | 'interests'

type Listener = (ids: string[], target?: CategoryPickTarget) => void

const listeners = new Set<Listener>()

export function subscribeCategoryPick(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitCategoryPick(ids: string[], target?: CategoryPickTarget) {
  listeners.forEach((listener) => listener(ids, target))
}
