import type { ActivityEvent, SocialInteraction } from './types'
import { prependLocalActivity } from './local-activity'

export type SocialListKey = keyof SocialInteraction
export type LocalSocialState = { social: SocialInteraction; activity: ActivityEvent[] }
export type LocalSocialAction =
  | { type: 'hydrate'; social: SocialInteraction; activity: ActivityEvent[] }
  | { type: 'activity'; update: (current: ActivityEvent[]) => ActivityEvent[] }
  | { type: 'toggle'; key: SocialListKey; id: string; event: ActivityEvent }

/** Apply social changes and their activity together, including batched taps.
 * No storage writes or event generation inside the reducer: React may replay it.
 */
export function localSocialReducer(state: LocalSocialState, action: LocalSocialAction): LocalSocialState {
  if (action.type === 'hydrate') return { social: action.social, activity: action.activity }
  if (action.type === 'activity') return { ...state, activity: action.update(state.activity) }
  const ids = state.social[action.key] ?? []
  const removing = ids.includes(action.id)
  return {
    social: {
      ...state.social,
      [action.key]: removing ? ids.filter((id) => id !== action.id) : [...ids, action.id],
    },
    activity: removing ? state.activity : prependLocalActivity(state.activity, action.event),
  }
}
