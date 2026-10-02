import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { Appearance, type ColorSchemeName } from 'react-native'
import { darkColors, lightColors, type ThemeColors } from '../theme/colors'
import { currentCollector, getCollector, getCollection, getItem } from '../data/mock-data'
import {
  coverForCategory,
  isCoverKey,
  newLocalId,
  sanitizeUserCollections,
  sanitizeUserItems,
  type CoverKey,
  type LocalCollectionRecord,
  type LocalItemRecord,
  type UserCollectionsMap,
  type UserItemsMap,
} from '../data/local-catalog'
import {
  createLocalActivityEvent,
  prependLocalActivity,
  pruneLocalActivityForCollection,
  pruneLocalActivityForItem,
  sanitizeLocalActivity,
  type LocalActivityInput,
} from '../data/local-activity'
import type {
  ActivityEvent,
  CollectionEdit,
  Comment,
  ItemEdit,
  ObjectCondition,
  ObjectStatus,
  SocialInteraction,
} from '../data/types'
import type { SocialLinks } from '../data/social'
import { readJson, writeJson } from './storage'
import { localSocialReducer, type SocialListKey } from '../data/local-social-state'

export type ThemePreference = 'system' | 'light' | 'dark'
export type AuthMethod = 'google' | 'apple' | 'email' | 'solana' | 'demo'

export type EditableProfile = {
  displayName: string
  handle: string
  bio: string
  location: string
  website: string
  socials: SocialLinks
  interestIds: string[]
  avatarInitials: string
  avatarColor: string
  avatarPath?: string
}

export type CreateCollectionInput = {
  title: string
  description?: string
  categoryId: string
  subcategory?: string
  tags?: string[]
  coverKey?: CoverKey
  story?: string
}

export type CreateItemInput = {
  title: string
  collectionId: string
  categoryId?: string
  subcategory?: string
  tags?: string[]
  year?: string
  story?: string
  provenance?: string
  condition?: ObjectCondition
  status?: ObjectStatus
  coverKey?: CoverKey
  maker?: string
  author?: string
  publisher?: string
  issuer?: string
  manufacturer?: string
  country?: string
  model?: string
  acquisitionYear?: string
  acquisitionPlace?: string
}

const defaultProfile: EditableProfile = {
  displayName: currentCollector.displayName,
  handle: currentCollector.handle.replace(/^@/, ''),
  bio: currentCollector.bio,
  location: '',
  website: '',
  socials: {},
  interestIds: ['books', 'coins', 'stamps', 'retro-tech'],
  avatarInitials: currentCollector.avatarInitials,
  avatarColor: currentCollector.avatarColor,
  avatarPath: undefined,
}

const defaultSocial: SocialInteraction = {
  likedCollectionIds: [],
  savedCollectionIds: [],
  followedCollectorIds: [],
  likedItemIds: [],
  savedItemIds: [],
}

type AppStateValue = {
  ready: boolean
  onboardingComplete: boolean
  interestsComplete: boolean
  demoSignedIn: boolean
  authMethod: AuthMethod | null
  themePreference: ThemePreference
  resolvedScheme: 'light' | 'dark'
  colors: ThemeColors
  profile: EditableProfile
  previewGenesisBadge: boolean
  social: SocialInteraction
  collectionEdits: Record<string, CollectionEdit>
  itemEdits: Record<string, ItemEdit>
  localComments: Comment[]
  userCollections: UserCollectionsMap
  userItems: UserItemsMap
  localActivity: ActivityEvent[]
  completeOnboarding: () => void
  completeInterests: () => void
  resetOnboarding: () => Promise<void>
  clearLocalCatalog: () => Promise<void>
  clearLocalActivity: () => Promise<void>
  clearLocalSocialData: () => Promise<void>
  enterDemo: (method: AuthMethod) => void
  setThemePreference: (preference: ThemePreference) => void
  updateProfile: (patch: Partial<EditableProfile>) => void
  setPreviewGenesisBadge: (value: boolean) => void
  toggleLikeCollection: (collectionId: string) => void
  toggleSaveCollection: (collectionId: string) => void
  toggleFollowCollector: (collectorId: string) => void
  toggleLikeItem: (itemId: string) => void
  toggleSaveItem: (itemId: string) => void
  updateCollectionEdit: (collectionId: string, patch: CollectionEdit) => void
  updateItemEdit: (itemId: string, patch: ItemEdit) => void
  createCollection: (input: CreateCollectionInput) => string | null
  updateUserCollection: (collectionId: string, patch: Partial<LocalCollectionRecord>) => void
  deleteUserCollection: (collectionId: string) => void
  createItem: (input: CreateItemInput) => string | null
  updateUserItem: (itemId: string, patch: Partial<LocalItemRecord>) => void
  deleteUserItem: (itemId: string) => void
  addLocalComment: (collectionId: string, text: string) => void
  addLocalItemComment: (itemId: string, collectionId: string, text: string) => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

function resolveScheme(preference: ThemePreference, system: ColorSchemeName): 'light' | 'dark' {
  if (preference === 'light') {
    return 'light'
  }
  if (preference === 'dark') {
    return 'dark'
  }
  return system === 'dark' ? 'dark' : 'light'
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [interestsComplete, setInterestsComplete] = useState(false)
  const [demoSignedIn, setDemoSignedIn] = useState(false)
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null)
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system')
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme() ?? 'light')
  const [profile, setProfile] = useState<EditableProfile>(defaultProfile)
  const [previewGenesisBadge, setPreviewGenesisBadgeState] = useState(false)
  const [{ social, activity: localActivity }, dispatchSocial] = useReducer(localSocialReducer, {
    social: defaultSocial,
    activity: [],
  })
  const [collectionEdits, setCollectionEdits] = useState<Record<string, CollectionEdit>>({})
  const [itemEdits, setItemEdits] = useState<Record<string, ItemEdit>>({})
  const [localComments, setLocalComments] = useState<Comment[]>([])
  const [userCollections, setUserCollections] = useState<UserCollectionsMap>({})
  const [userItems, setUserItems] = useState<UserItemsMap>({})
  const setLocalActivity = useCallback((update: (current: ActivityEvent[]) => ActivityEvent[]) => {
    dispatchSocial({ type: 'activity', update })
  }, [])

  const updateProfile = useCallback((patch: Partial<EditableProfile>) => {
    setProfile((current) => ({ ...current, ...patch, socials: { ...current.socials, ...patch.socials } }))
  }, [])

  useEffect(() => {
    if (ready) void writeJson('profile', profile)
  }, [ready, profile])

  useEffect(() => {
    if (ready) void writeJson('social', social)
  }, [ready, social])

  useEffect(() => {
    if (ready) void writeJson('localActivity', localActivity)
  }, [ready, localActivity])

  const recordLocalActivity = useCallback(
    (input: LocalActivityInput) => {
      const event = createLocalActivityEvent(input)
      setLocalActivity((current) => prependLocalActivity(current, event))
    },
    [setLocalActivity],
  )

  const toggleSocial = useCallback((key: SocialListKey, id: string, input: LocalActivityInput) => {
    dispatchSocial({ type: 'toggle', key, id, event: createLocalActivityEvent(input) })
  }, [])

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme ?? 'light'))
    return () => sub.remove()
  }, [])

  useEffect(() => {
    void (async () => {
      const [
        onboarded,
        interestsDone,
        signedIn,
        method,
        theme,
        savedProfile,
        previewBadge,
        savedSocial,
        edits,
        itemEditsSaved,
        comments,
        savedCollections,
        savedItems,
        savedActivity,
      ] = await Promise.all([
        readJson('onboardingComplete', false),
        readJson('interestsComplete', false),
        readJson('demoSignedIn', false),
        readJson<AuthMethod | null>('authMethod', null),
        readJson<ThemePreference>('themePreference', 'system'),
        readJson<EditableProfile>('profile', defaultProfile),
        readJson('previewGenesisBadge', false),
        readJson<SocialInteraction>('social', defaultSocial),
        readJson<Record<string, CollectionEdit>>('collectionEdits', {}),
        readJson<Record<string, ItemEdit>>('itemEdits', {}),
        readJson<Comment[]>('localComments', []),
        readJson<unknown>('userCollections', {}),
        readJson<unknown>('userItems', {}),
        readJson<unknown>('localActivity', []),
      ])
      setOnboardingComplete(onboarded)
      setInterestsComplete(interestsDone)
      setDemoSignedIn(signedIn)
      setAuthMethod(method)
      setThemePreferenceState(theme)
      setProfile({ ...defaultProfile, ...savedProfile })
      setPreviewGenesisBadgeState(previewBadge)
      dispatchSocial({
        type: 'hydrate',
        social: {
          ...defaultSocial,
          ...savedSocial,
          likedItemIds: savedSocial?.likedItemIds ?? [],
          savedItemIds: savedSocial?.savedItemIds ?? [],
        },
        activity: sanitizeLocalActivity(savedActivity),
      })
      setCollectionEdits(edits && typeof edits === 'object' ? edits : {})
      setItemEdits(itemEditsSaved && typeof itemEditsSaved === 'object' ? itemEditsSaved : {})
      setLocalComments(Array.isArray(comments) ? comments : [])
      setUserCollections(sanitizeUserCollections(savedCollections))
      setUserItems(sanitizeUserItems(savedItems))
      setReady(true)
    })()
  }, [])

  const resolvedScheme = resolveScheme(themePreference, systemScheme)
  const colors = resolvedScheme === 'dark' ? darkColors : lightColors

  const value = useMemo<AppStateValue>(
    () => ({
      ready,
      onboardingComplete,
      interestsComplete,
      demoSignedIn,
      authMethod,
      themePreference,
      resolvedScheme,
      colors,
      profile,
      previewGenesisBadge,
      social,
      collectionEdits,
      itemEdits,
      localComments,
      userCollections,
      userItems,
      localActivity,
      completeOnboarding() {
        setOnboardingComplete(true)
        void writeJson('onboardingComplete', true)
      },
      completeInterests() {
        setInterestsComplete(true)
        void writeJson('interestsComplete', true)
      },
      async resetOnboarding() {
        setOnboardingComplete(false)
        setInterestsComplete(false)
        setDemoSignedIn(false)
        setAuthMethod(null)
        await writeJson('onboardingComplete', false)
        await writeJson('interestsComplete', false)
        await writeJson('demoSignedIn', false)
        await writeJson('authMethod', null)
      },
      async clearLocalCatalog() {
        setUserCollections({})
        setUserItems({})
        await writeJson('userCollections', {})
        await writeJson('userItems', {})
        setLocalActivity((current) => {
          const next = current.filter((event) => event.kind !== 'add' || event.source !== 'local')
          return next
        })
      },
      async clearLocalActivity() {
        setLocalActivity(() => [])
      },
      async clearLocalSocialData() {
        dispatchSocial({ type: 'hydrate', social: defaultSocial, activity: [] })
      },
      enterDemo(method) {
        setAuthMethod(method)
        setDemoSignedIn(true)
        void writeJson('authMethod', method)
        void writeJson('demoSignedIn', true)
      },
      setThemePreference(preference) {
        setThemePreferenceState(preference)
        void writeJson('themePreference', preference)
      },
      updateProfile,
      setPreviewGenesisBadge(next) {
        setPreviewGenesisBadgeState(next)
        void writeJson('previewGenesisBadge', next)
      },
      toggleLikeCollection(collectionId) {
        const collection = getCollection(collectionId) ?? userCollections[collectionId]
        toggleSocial('likedCollectionIds', collectionId, {
          kind: 'like',
          action: 'liked',
          target: collection?.title ?? 'a cabinet',
          collectionId,
        })
      },
      toggleSaveCollection(collectionId) {
        const collection = getCollection(collectionId) ?? userCollections[collectionId]
        toggleSocial('savedCollectionIds', collectionId, {
          kind: 'save',
          action: 'saved',
          target: collection?.title ?? 'a cabinet',
          collectionId,
        })
      },
      toggleFollowCollector(collectorId) {
        if (collectorId === currentCollector.id) return
        const collector = getCollector(collectorId)
        toggleSocial('followedCollectorIds', collectorId, {
          kind: 'follow',
          action: 'started following',
          target: collector?.displayName ?? 'a collector',
          collectorTargetId: collectorId,
        })
      },
      toggleLikeItem(itemId) {
        const item = getItem(itemId) ?? userItems[itemId]
        toggleSocial('likedItemIds', itemId, {
          kind: 'like',
          action: 'liked',
          target: item?.title ?? 'an object',
          itemId,
          collectionId: item?.collectionId,
        })
      },
      toggleSaveItem(itemId) {
        const item = getItem(itemId) ?? userItems[itemId]
        toggleSocial('savedItemIds', itemId, {
          kind: 'save',
          action: 'saved',
          target: item?.title ?? 'an object',
          itemId,
          collectionId: item?.collectionId,
        })
      },
      updateCollectionEdit(collectionId, patch) {
        setCollectionEdits((current) => {
          const next = { ...current, [collectionId]: { ...current[collectionId], ...patch } }
          void writeJson('collectionEdits', next)
          return next
        })
      },
      updateItemEdit(itemId, patch) {
        setItemEdits((current) => {
          const next = { ...current, [itemId]: { ...current[itemId], ...patch } }
          void writeJson('itemEdits', next)
          return next
        })
      },
      createCollection(input) {
        const title = input.title.trim()
        if (!title || !input.categoryId) {
          return null
        }
        const id = newLocalId('col')
        const now = new Date().toISOString()
        const record: LocalCollectionRecord = {
          id,
          title,
          ownerId: currentCollector.id,
          categoryId: input.categoryId,
          subcategory: input.subcategory?.trim() || undefined,
          tags: input.tags?.map((tag) => tag.trim()).filter(Boolean),
          description: input.description?.trim() || undefined,
          story: input.story?.trim() || undefined,
          coverKey: isCoverKey(input.coverKey) ? input.coverKey : coverForCategory(input.categoryId),
          createdAt: now,
          updatedAt: now,
        }
        setUserCollections((current) => {
          const next = { ...current, [id]: record }
          void writeJson('userCollections', next)
          return next
        })
        recordLocalActivity({
          kind: 'add',
          action: 'created a cabinet',
          target: title,
          collectionId: id,
        })
        return id
      },
      updateUserCollection(collectionId, patch) {
        setUserCollections((current) => {
          const existing = current[collectionId]
          if (!existing) {
            return current
          }
          const nextRecord: LocalCollectionRecord = {
            ...existing,
            ...patch,
            id: existing.id,
            ownerId: existing.ownerId,
            title: (patch.title ?? existing.title).trim() || existing.title,
            categoryId: patch.categoryId ?? existing.categoryId,
            coverKey: isCoverKey(patch.coverKey) ? patch.coverKey : existing.coverKey,
            updatedAt: new Date().toISOString(),
          }
          const next = { ...current, [collectionId]: nextRecord }
          void writeJson('userCollections', next)
          return next
        })
      },
      deleteUserCollection(collectionId) {
        setUserCollections((current) => {
          if (!current[collectionId]) {
            return current
          }
          const next = { ...current }
          delete next[collectionId]
          void writeJson('userCollections', next)
          return next
        })
        setUserItems((current) => {
          const next: UserItemsMap = {}
          for (const [id, item] of Object.entries(current)) {
            if (item.collectionId !== collectionId) {
              next[id] = item
            }
          }
          void writeJson('userItems', next)
          return next
        })
        setCollectionEdits((current) => {
          if (!current[collectionId]) {
            return current
          }
          const next = { ...current }
          delete next[collectionId]
          void writeJson('collectionEdits', next)
          return next
        })
        setLocalActivity((current) => {
          const next = pruneLocalActivityForCollection(current, collectionId)
          return next
        })
      },
      createItem(input) {
        const title = input.title.trim()
        if (!title || !input.collectionId) {
          return null
        }
        const id = newLocalId('item')
        const now = new Date().toISOString()
        const categoryId = input.categoryId ?? 'books'
        const record: LocalItemRecord = {
          id,
          collectionId: input.collectionId,
          title,
          year: input.year?.trim() || undefined,
          coverKey: isCoverKey(input.coverKey) ? input.coverKey : coverForCategory(categoryId),
          categoryId,
          subcategory: input.subcategory?.trim() || undefined,
          tags: input.tags?.map((tag) => tag.trim()).filter(Boolean),
          status: input.status ?? 'in-collection',
          condition: input.condition,
          story: input.story?.trim() || undefined,
          provenance: input.provenance?.trim() || undefined,
          maker: input.maker?.trim() || undefined,
          author: input.author?.trim() || undefined,
          publisher: input.publisher?.trim() || undefined,
          issuer: input.issuer?.trim() || undefined,
          manufacturer: input.manufacturer?.trim() || undefined,
          country: input.country?.trim() || undefined,
          model: input.model?.trim() || undefined,
          acquisitionYear: input.acquisitionYear?.trim() || undefined,
          acquisitionPlace: input.acquisitionPlace?.trim() || undefined,
          createdAt: now,
          updatedAt: now,
        }
        setUserItems((current) => {
          const next = { ...current, [id]: record }
          void writeJson('userItems', next)
          return next
        })
        const parent = getCollection(input.collectionId) ?? userCollections[input.collectionId]
        recordLocalActivity({
          kind: 'add',
          action: 'added an object to',
          target: parent?.title ?? 'a cabinet',
          itemId: id,
          collectionId: input.collectionId,
        })
        return id
      },
      updateUserItem(itemId, patch) {
        setUserItems((current) => {
          const existing = current[itemId]
          if (!existing) {
            return current
          }
          const nextRecord: LocalItemRecord = {
            ...existing,
            ...patch,
            id: existing.id,
            title: (patch.title ?? existing.title).trim() || existing.title,
            collectionId: patch.collectionId ?? existing.collectionId,
            coverKey: isCoverKey(patch.coverKey) ? patch.coverKey : existing.coverKey,
            updatedAt: new Date().toISOString(),
          }
          const next = { ...current, [itemId]: nextRecord }
          void writeJson('userItems', next)
          return next
        })
      },
      deleteUserItem(itemId) {
        setUserItems((current) => {
          if (!current[itemId]) {
            return current
          }
          const next = { ...current }
          delete next[itemId]
          void writeJson('userItems', next)
          return next
        })
        setItemEdits((current) => {
          if (!current[itemId]) {
            return current
          }
          const next = { ...current }
          delete next[itemId]
          void writeJson('itemEdits', next)
          return next
        })
        setLocalActivity((current) => {
          const next = pruneLocalActivityForItem(current, itemId)
          return next
        })
      },
      addLocalComment(collectionId, text) {
        const trimmed = text.trim()
        if (!trimmed) {
          return
        }
        setLocalComments((current) => {
          const next: Comment[] = [
            {
              id: `local-${Date.now()}`,
              collectionId,
              actorId: currentCollector.id,
              text: trimmed,
              timeLabel: 'Just now',
            },
            ...current,
          ]
          void writeJson('localComments', next)
          return next
        })
      },
      addLocalItemComment(itemId, collectionId, text) {
        const trimmed = text.trim()
        if (!trimmed) {
          return
        }
        setLocalComments((current) => {
          const next: Comment[] = [
            {
              id: `local-item-${Date.now()}`,
              itemId,
              collectionId,
              actorId: currentCollector.id,
              text: trimmed,
              timeLabel: 'Just now',
            },
            ...current,
          ]
          void writeJson('localComments', next)
          return next
        })
      },
    }),
    [
      ready,
      onboardingComplete,
      interestsComplete,
      demoSignedIn,
      authMethod,
      themePreference,
      resolvedScheme,
      colors,
      profile,
      previewGenesisBadge,
      social,
      collectionEdits,
      itemEdits,
      localComments,
      userCollections,
      userItems,
      localActivity,
      updateProfile,
      setLocalActivity,
      recordLocalActivity,
      toggleSocial,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const value = useContext(AppStateContext)
  if (!value) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return value
}

export function useTheme() {
  const { colors, resolvedScheme, themePreference, setThemePreference } = useAppState()
  return { colors, resolvedScheme, themePreference, setThemePreference }
}
