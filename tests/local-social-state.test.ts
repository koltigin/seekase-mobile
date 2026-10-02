import { describe, expect, it, vi } from 'vitest'
import { localSocialReducer, type LocalSocialState, type SocialListKey } from '../src/data/local-social-state'
import type { ActivityEvent } from '../src/data/types'
vi.mock('../src/data/mock-data', () => ({ currentCollector: { id: 'self' } }))

function initial(): LocalSocialState {
  return {
    social: {
      likedCollectionIds: [],
      savedCollectionIds: [],
      followedCollectorIds: [],
      likedItemIds: [],
      savedItemIds: [],
    },
    activity: [],
  }
}
function event(id: string, itemId = id): ActivityEvent {
  return {
    id,
    actorId: 'self',
    kind: 'like',
    action: 'liked',
    itemId,
    collectionId: 'cabinet',
    source: 'local',
    timeLabel: 'Just now',
  }
}

describe('local social interactions and Activity', () => {
  it.each<SocialListKey>([
    'likedCollectionIds',
    'savedCollectionIds',
    'followedCollectorIds',
    'likedItemIds',
    'savedItemIds',
  ])('records %s with the interaction, and preserves history when toggled off', (key) => {
    const before = initial()
    const action = { type: 'toggle' as const, key, id: 'target', event: event('first') }
    const added = localSocialReducer(before, action)
    expect(added.social[key]).toEqual(['target'])
    expect(added.activity).toHaveLength(1)
    const removed = localSocialReducer(added, action)
    expect(removed.social[key]).toEqual([])
    expect(removed.activity).toEqual(added.activity)
    expect(before).toEqual(initial())
    expect(localSocialReducer(before, action)).toEqual(added) // React replay is pure.
  })

  it('keeps successive likes for different objects in the same cabinet', () => {
    let state = initial()
    for (const id of ['one', 'two']) {
      state = localSocialReducer(state, { type: 'toggle', key: 'likedItemIds', id, event: event(id) })
    }
    expect(state.social.likedItemIds).toEqual(['one', 'two'])
    expect(state.activity.map((entry) => entry.itemId)).toEqual(['two', 'one'])
  })

  it('restores disk data without creating an extra event', () => {
    const restored = localSocialReducer(initial(), {
      type: 'hydrate',
      social: { ...initial().social, savedItemIds: ['saved'] },
      activity: [event('history')],
    })
    expect(restored.social.savedItemIds).toEqual(['saved'])
    expect(restored.activity).toHaveLength(1)
    const cleared = localSocialReducer(restored, { type: 'activity', update: () => [] })
    expect(cleared.social).toEqual(restored.social)
    expect(cleared.activity).toEqual([])
  })
})
