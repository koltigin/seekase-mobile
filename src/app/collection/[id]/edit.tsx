import { useMemo, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Screen } from '../../../components/ui/screen'
import { FormActionBar } from '../../../components/ui/form-action-bar'
import { curatedInterestCategories } from '../../../data/categories'
import { currentCollector } from '../../../data/mock-data'
import { useTheme } from '../../../state/app-state'
import { useCatalog } from '../../../state/use-catalog'
import { radius, space, type } from '../../../theme/tokens'

export default function EditCollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors } = useTheme()
  const catalog = useCatalog()
  const collection = catalog.getCollection(String(id ?? ''))

  const [title, setTitle] = useState(collection?.title ?? '')
  const [description, setDescription] = useState(collection?.description ?? '')
  const [story, setStory] = useState(collection?.story ?? '')
  const [categoryId, setCategoryId] = useState(collection?.categoryId ?? 'books')
  const [subcategory, setSubcategory] = useState(collection?.subcategory ?? '')
  const [tagsText, setTagsText] = useState((collection?.tags ?? []).join(', '))
  const [error, setError] = useState<string | null>(null)

  const isOwn = collection?.ownerId === currentCollector.id
  const isLocal = collection ? catalog.isLocalCollection(collection.id) : false
  const categoryOptions = useMemo(() => curatedInterestCategories, [])

  if (!collection || !isOwn) {
    return (
      <Screen>
        <Text style={{ ...type.title, fontSize: 24, color: colors.ink }}>Cannot edit this cabinet</Text>
        <Pressable className="mt-5" onPress={() => router.back()}>
          <Text className="text-sm font-medium" style={{ color: colors.muted }}>
            Go back
          </Text>
        </Pressable>
      </Screen>
    )
  }

  const collectionId = collection.id
  const fallbackTitle = collection.title

  function save() {
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    const patch = {
      title: title.trim() || fallbackTitle,
      description: description.trim(),
      story: story.trim(),
      categoryId,
      subcategory: subcategory.trim() || undefined,
      tags: tagsText
        .split(',')
        .map((tag: string) => tag.trim())
        .filter(Boolean),
    }
    if (isLocal) {
      catalog.updateUserCollection(collectionId, patch)
    } else {
      catalog.updateCollectionEdit(collectionId, patch)
    }
    router.back()
  }

  function confirmDelete() {
    const itemCount = catalog.itemsForCollection(collectionId).length
    const message =
      itemCount > 0
        ? `This will permanently remove the cabinet and ${itemCount} local object${itemCount === 1 ? '' : 's'} stored in it.`
        : 'This will permanently remove this local cabinet.'
    Alert.alert('Delete collection?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          catalog.deleteUserCollection(collectionId)
          router.replace('/(tabs)/collections')
        },
      },
    ])
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View className="items-center px-5 pb-3">
          <Text style={{ ...type.eyebrow, color: colors.faint }}>Edit Collection</Text>
        </View>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: space.lg }}
        >
          <Field label="Title" value={title} onChange={setTitle} />
          <Field label="Short description" value={description} onChange={setDescription} multiline />
          <Field label="Longer story" value={story} onChange={setStory} multiline />
          <Field label="Subcategory" value={subcategory} onChange={setSubcategory} placeholder="First Editions" />
          <Field label="Tags" value={tagsText} onChange={setTagsText} placeholder="Science Fiction, 1950s" />

          <Text className="mb-2 mt-2" style={{ ...type.eyebrow, color: colors.faint }}>
            Category
          </Text>
          <View className="mb-4 flex-row flex-wrap" style={{ gap: 8 }}>
            {categoryOptions.map((category) => {
              const active = category.id === categoryId
              return (
                <Pressable
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
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

          {error ? (
            <Text className="mb-3 text-sm" style={{ color: colors.muted }}>
              {error}
            </Text>
          ) : null}

          {isLocal ? (
            <Pressable
              className="mt-4 items-center py-3"
              style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line }}
              onPress={confirmDelete}
            >
              <Text className="text-sm font-medium" style={{ color: colors.ink }}>
                Delete collection
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
        <FormActionBar primaryLabel="Save collection" onPrimary={save} onSecondary={() => router.back()} />
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
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  placeholder?: string
}) {
  const { colors } = useTheme()
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-[1.2px]" style={{ color: colors.faint }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        multiline={multiline}
        className="px-4 py-3.5 text-[15px]"
        style={{
          backgroundColor: colors.surface,
          color: colors.ink,
          borderRadius: radius.md,
          minHeight: multiline ? 96 : undefined,
        }}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  )
}
