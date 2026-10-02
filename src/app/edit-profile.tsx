import { useEffect, useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../components/ui/screen'
import { FormActionBar } from '../components/ui/form-action-bar'
import { curatedInterestCategories, getCategory } from '../data/categories'
import { normalizeSocial, socialProviders } from '../data/social'
import { updateCloudProfile } from '../repositories/profile-repository'
import { deleteAvatarPhoto, uploadAvatarPhoto } from '../repositories/avatar-repository'
import { ProfileAvatar } from '../components/profile/profile-avatar'
import { pickPhoto, type PhotoDraft } from '../services/pick-photo'
import { useAuth } from '../state/auth'
import { useAppState, useTheme } from '../state/app-state'
import { subscribeCategoryPick } from '../state/category-pick'
import { radius, space, type } from '../theme/tokens'

export default function EditProfileScreen() {
  const { colors } = useTheme()
  const { profile, updateProfile } = useAppState()
  const { user } = useAuth()
  const router = useRouter()
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [handle, setHandle] = useState(profile.handle.replace(/^@/, ''))
  const [bio, setBio] = useState(profile.bio)
  const [location, setLocation] = useState(profile.location)
  const [website, setWebsite] = useState(profile.website)
  const [instagram, setInstagram] = useState(profile.socials.instagram ?? '')
  const [youtube, setYoutube] = useState(profile.socials.youtube ?? '')
  const [tiktok, setTiktok] = useState(profile.socials.tiktok ?? '')
  const [x, setX] = useState(profile.socials.x ?? '')
  const [interestIds, setInterestIds] = useState(profile.interestIds)
  const [avatarDraft, setAvatarDraft] = useState<PhotoDraft | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return subscribeCategoryPick((ids, target) => {
      if (target === 'edit-profile') {
        setInterestIds(ids)
      }
    })
  }, [])

  async function save() {
    if (busy) return
    setBusy(true)
    setError(null)
    const socials = {
      instagram: normalizeSocial('instagram', instagram) || undefined,
      youtube: normalizeSocial('youtube', youtube) || undefined,
      tiktok: normalizeSocial('tiktok', tiktok) || undefined,
      x: normalizeSocial('x', x) || undefined,
      website: normalizeSocial('website', website) || undefined,
    }
    let avatarPath = removeAvatar ? null : profile.avatarPath
    let uploadedAvatarPath: string | null = null
    if (user && avatarDraft) {
      try {
        uploadedAvatarPath = await uploadAvatarPhoto(user.id, avatarDraft.id, avatarDraft.bytes)
        avatarPath = uploadedAvatarPath
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Profile photo could not be uploaded.')
        setBusy(false)
        return
      }
    }
    if (user) {
      const cloud = await updateCloudProfile(user.id, {
        displayName: displayName.trim() || profile.displayName,
        handle: handle.replace(/^@/, '').trim() || profile.handle,
        bio: bio.trim(),
        location: location.trim(),
        socials,
        avatarPath,
      })
      if (!cloud.ok) {
        if (uploadedAvatarPath) void deleteAvatarPhoto(uploadedAvatarPath)
        setError(cloud.error.message)
        setBusy(false)
        return
      }
    }
    updateProfile({
      displayName: displayName.trim() || profile.displayName,
      handle: handle.replace(/^@/, '').trim() || profile.handle,
      bio: bio.trim(),
      location: location.trim(),
      website: normalizeSocial('website', website),
      socials,
      interestIds,
      avatarInitials: initialsFrom(displayName.trim() || profile.displayName),
      avatarPath: avatarPath ?? undefined,
    })
    if (user && profile.avatarPath && profile.avatarPath !== avatarPath) {
      void deleteAvatarPhoto(profile.avatarPath)
    }
    setBusy(false)
    router.back()
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View className="items-center px-5 pb-3">
          <Text style={{ ...type.eyebrow, color: colors.faint }}>Edit Profile</Text>
        </View>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: space.lg }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center py-4" style={{ gap: 10 }}>
            {avatarDraft ? (
              <Image
                accessibilityLabel="Selected profile photo"
                source={{ uri: avatarDraft.uri }}
                resizeMode="cover"
                style={{ width: 96, height: 96, borderRadius: 48 }}
              />
            ) : (
              <ProfileAvatar
                path={removeAvatar ? undefined : profile.avatarPath}
                initials={initialsFrom(displayName || profile.displayName)}
                color={profile.avatarColor}
              />
            )}
            <View className="flex-row" style={{ gap: 16 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  void pickPhoto()
                    .then((photo) => {
                      if (photo) {
                        setAvatarDraft(photo)
                        setRemoveAvatar(false)
                      }
                    })
                    .catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not select photo.'))
                }
              >
                <Text className="text-sm font-semibold" style={{ color: colors.ink }}>
                  {profile.avatarPath || avatarDraft ? 'Change photo' : 'Add photo'}
                </Text>
              </Pressable>
              {profile.avatarPath || avatarDraft ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setAvatarDraft(null)
                    setRemoveAvatar(true)
                  }}
                >
                  <Text className="text-sm font-semibold" style={{ color: colors.danger }}>
                    Remove
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <Text className="text-center text-[11px]" style={{ color: colors.faint }}>
              Profile photos are public. Location metadata is removed before upload.
            </Text>
          </View>

          <Field label="Display name" value={displayName} onChange={setDisplayName} />
          <Field label="Username" value={handle} onChange={setHandle} prefix="@" />
          <Field label="Bio" value={bio} onChange={setBio} multiline />
          <Field label="Location" value={location} onChange={setLocation} placeholder="City, country" />

          <Text className="mb-2 mt-4" style={{ ...type.eyebrow, color: colors.faint }}>
            Interests
          </Text>
          <View className="mb-4 flex-row flex-wrap" style={{ gap: 8 }}>
            {curatedInterestCategories.map((category) => {
              const active = interestIds.includes(category.id)
              return (
                <Pressable
                  key={category.id}
                  onPress={() =>
                    setInterestIds((current) =>
                      current.includes(category.id)
                        ? current.filter((id) => id !== category.id)
                        : [...current, category.id],
                    )
                  }
                  className="px-3 py-1.5"
                  style={{ borderRadius: 999, backgroundColor: active ? colors.chipActive : colors.chip }}
                >
                  <Text className="text-[13px] font-medium" style={{ color: active ? colors.onAccent : colors.ink }}>
                    {category.shortLabel}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          <Pressable
            className="mb-2"
            onPress={() =>
              router.push({
                pathname: '/category-picker',
                params: { mode: 'multi', selected: interestIds.join(','), target: 'edit-profile' },
              })
            }
          >
            <Text className="text-sm font-medium" style={{ color: colors.ink }}>
              Browse all categories
            </Text>
          </Pressable>
          <Text className="mb-5 text-[12px]" style={{ color: colors.faint }}>
            Selected: {interestIds.map((id) => getCategory(id)?.shortLabel ?? id).join(', ') || 'None'}
          </Text>

          <Text className="mb-2" style={{ ...type.eyebrow, color: colors.faint }}>
            Links
          </Text>
          <Field
            label={socialProviders[4].label}
            value={website}
            onChange={setWebsite}
            placeholder={socialProviders[4].placeholder}
          />
          <Field label="Instagram" value={instagram} onChange={setInstagram} placeholder="@handle" />
          <Field label="YouTube" value={youtube} onChange={setYoutube} placeholder="@handle" />
          <Field label="TikTok" value={tiktok} onChange={setTiktok} placeholder="@handle" />
          <Field label="X" value={x} onChange={setX} placeholder="@handle" />
          {error ? <Text style={{ ...type.meta, color: colors.danger }}>{error}</Text> : null}
        </ScrollView>
        <FormActionBar
          primaryLabel="Save profile"
          busyLabel="Saving…"
          busy={busy}
          onPrimary={() => void save()}
          onSecondary={() => router.back()}
        />
      </KeyboardAvoidingView>
    </Screen>
  )
}

function Field({
  label,
  value,
  onChange,
  multiline,
  placeholder,
  prefix,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  placeholder?: string
  prefix?: string
}) {
  const { colors } = useTheme()
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: colors.faint }}>
        {label}
      </Text>
      <View className="flex-row items-center px-4" style={{ backgroundColor: colors.surface, borderRadius: radius.md }}>
        {prefix ? (
          <Text className="mr-1 text-[15px]" style={{ color: colors.faint }}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          multiline={multiline}
          className="flex-1 py-3.5 text-[15px]"
          style={{ color: colors.ink, minHeight: multiline ? 96 : undefined }}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  )
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'C'
}
