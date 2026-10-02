import { useMemo, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Screen } from '../../../components/ui/screen'
import { FormActionBar } from '../../../components/ui/form-action-bar'
import { curatedInterestCategories } from '../../../data/categories'
import {
  OBJECT_CONDITIONS,
  OBJECT_CONDITION_LABELS,
  OBJECT_STATUSES,
  OBJECT_STATUS_LABELS,
} from '../../../data/item-metadata'
import { currentCollector } from '../../../data/mock-data'
import type { ObjectCondition, ObjectStatus } from '../../../data/types'
import { useTheme } from '../../../state/app-state'
import { useCatalog } from '../../../state/use-catalog'
import { radius, space, type } from '../../../theme/tokens'

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors } = useTheme()
  const catalog = useCatalog()
  const item = catalog.getItem(String(id ?? ''))
  const collection = item ? catalog.getCollection(item.collectionId) : undefined
  const isOwn = collection?.ownerId === currentCollector.id
  const isLocal = item ? catalog.isLocalItem(item.id) : false
  const ownedCollections = catalog.ownCollections

  const [title, setTitle] = useState(item?.title ?? '')
  const [collectionId, setCollectionId] = useState(item?.collectionId ?? '')
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? collection?.categoryId ?? 'books')
  const [subcategory, setSubcategory] = useState(item?.subcategory ?? '')
  const [tagsText, setTagsText] = useState((item?.tags ?? []).join(', '))
  const [year, setYear] = useState(item?.year ?? '')
  const [story, setStory] = useState(item?.story ?? '')
  const [provenance, setProvenance] = useState(item?.provenance ?? '')
  const [condition, setCondition] = useState<ObjectCondition>(item?.condition ?? 'unknown')
  const [status, setStatus] = useState<ObjectStatus>(item?.status ?? 'in-collection')
  const [author, setAuthor] = useState(item?.author ?? '')
  const [manufacturer, setManufacturer] = useState(item?.manufacturer ?? '')
  const [publisher, setPublisher] = useState(item?.publisher ?? '')
  const [maker, setMaker] = useState(item?.maker ?? '')
  const [issuer, setIssuer] = useState(item?.issuer ?? '')
  const [model, setModel] = useState(item?.model ?? '')
  const [country, setCountry] = useState(item?.country ?? '')
  const [acquisitionYear, setAcquisitionYear] = useState(item?.acquisitionYear ?? '')
  const [acquisitionPlace, setAcquisitionPlace] = useState(item?.acquisitionPlace ?? '')
  const [error, setError] = useState<string | null>(null)

  const categoryOptions = useMemo(() => curatedInterestCategories, [])

  if (!item || !collection || !isOwn) {
    return (
      <Screen>
        <Text style={{ ...type.title, fontSize: 24, color: colors.ink }}>Cannot edit this object</Text>
        <Pressable className="mt-5" onPress={() => router.back()}>
          <Text className="text-sm font-medium" style={{ color: colors.muted }}>
            Go back
          </Text>
        </Pressable>
      </Screen>
    )
  }

  const itemId = item.id
  const fallbackTitle = item.title
  const fallbackCollectionId = item.collectionId

  function save() {
    if (!title.trim()) {
      setError('Object name is required.')
      return
    }
    const nextCollectionId = collectionId || fallbackCollectionId
    if (!nextCollectionId) {
      setError('Choose a collection.')
      return
    }
    const patch = {
      title: title.trim() || fallbackTitle,
      collectionId: nextCollectionId,
      categoryId,
      subcategory: subcategory.trim() || undefined,
      tags: tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      year: year.trim() || undefined,
      story: story.trim() || undefined,
      provenance: provenance.trim() || undefined,
      condition,
      status,
      author: author.trim() || undefined,
      manufacturer: manufacturer.trim() || undefined,
      maker: maker.trim() || undefined,
      publisher: publisher.trim() || undefined,
      issuer: issuer.trim() || undefined,
      model: model.trim() || undefined,
      country: country.trim() || undefined,
      acquisitionYear: acquisitionYear.trim() || undefined,
      acquisitionPlace: acquisitionPlace.trim() || undefined,
    }
    if (isLocal) {
      catalog.updateUserItem(itemId, patch)
    } else {
      catalog.updateItemEdit(itemId, patch)
    }
    router.back()
  }

  function confirmDelete() {
    Alert.alert('Delete object?', 'This removes the local catalog entry from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const parentId = collectionId || fallbackCollectionId
          catalog.deleteUserItem(itemId)
          if (parentId) {
            router.replace(`/collection/${parentId}`)
          } else {
            router.replace('/(tabs)/collections')
          }
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
          <Text style={{ ...type.eyebrow, color: colors.faint }}>Edit Item</Text>
        </View>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: space.lg }}
        >
          <Field label="Object name" value={title} onChange={setTitle} />
          <Field label="Year or date" value={year} onChange={setYear} placeholder="1984" />
          <Field label="Story" value={story} onChange={setStory} multiline />
          <Field label="Provenance" value={provenance} onChange={setProvenance} multiline />
          <Field label="Subcategory" value={subcategory} onChange={setSubcategory} placeholder="Portable Audio" />
          <Field label="Tags" value={tagsText} onChange={setTagsText} placeholder="Sony, Walkman, 1980s" />

          <Text className="mb-2 mt-2" style={{ ...type.eyebrow, color: colors.faint }}>
            Collection
          </Text>
          <View className="mb-4 flex-row flex-wrap" style={{ gap: 8 }}>
            {ownedCollections.map((entry) => {
              const active = entry.id === collectionId
              return (
                <Pressable
                  key={entry.id}
                  onPress={() => {
                    setCollectionId(entry.id)
                    setCategoryId(entry.categoryId)
                  }}
                  className="px-3 py-1.5"
                  style={{ borderRadius: 999, backgroundColor: active ? colors.chipActive : colors.chip }}
                >
                  <Text className="text-[13px] font-medium" style={{ color: active ? colors.onAccent : colors.ink }}>
                    {entry.title}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <Text className="mb-2" style={{ ...type.eyebrow, color: colors.faint }}>
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

          <Text className="mb-2" style={{ ...type.eyebrow, color: colors.faint }}>
            Condition
          </Text>
          <View className="mb-4 flex-row flex-wrap" style={{ gap: 8 }}>
            {OBJECT_CONDITIONS.map((entry) => {
              const active = entry === condition
              return (
                <Pressable
                  key={entry}
                  onPress={() => setCondition(entry)}
                  className="px-3 py-1.5"
                  style={{ borderRadius: 999, backgroundColor: active ? colors.chipActive : colors.chip }}
                >
                  <Text className="text-[12px] font-medium" style={{ color: active ? colors.onAccent : colors.ink }}>
                    {OBJECT_CONDITION_LABELS[entry]}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <Text className="mb-2" style={{ ...type.eyebrow, color: colors.faint }}>
            Object status
          </Text>
          <View className="mb-4 flex-row flex-wrap" style={{ gap: 8 }}>
            {OBJECT_STATUSES.map((entry) => {
              const active = entry === status
              return (
                <Pressable
                  key={entry}
                  onPress={() => setStatus(entry)}
                  className="px-3 py-1.5"
                  style={{ borderRadius: 999, backgroundColor: active ? colors.chipActive : colors.chip }}
                >
                  <Text className="text-[12px] font-medium" style={{ color: active ? colors.onAccent : colors.ink }}>
                    {OBJECT_STATUS_LABELS[entry]}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          <Text className="mb-4 text-[12px]" style={{ color: colors.muted }}>
            Status is a collector signal. It is not a price, listing, or checkout.
          </Text>

          <Field label="Author" value={author} onChange={setAuthor} />
          <Field label="Manufacturer" value={manufacturer} onChange={setManufacturer} />
          {categoryId === 'books' ? <Field label="Publisher" value={publisher} onChange={setPublisher} /> : null}
          {categoryId !== 'books' || maker ? (
            <Field
              label={categoryId === 'books' ? 'Maker (previously entered)' : 'Maker'}
              value={maker}
              onChange={setMaker}
            />
          ) : null}
          <Field label="Issuer" value={issuer} onChange={setIssuer} />
          <Field label="Model" value={model} onChange={setModel} />
          <Field label="Origin / country" value={country} onChange={setCountry} />
          <Field label="Acquired year" value={acquisitionYear} onChange={setAcquisitionYear} />
          <Field label="Acquired place" value={acquisitionPlace} onChange={setAcquisitionPlace} />

          {error ? (
            <Text className="mb-3 text-sm" style={{ color: colors.muted }}>
              {error}
            </Text>
          ) : null}

          {isLocal ? (
            <Pressable
              className="mt-2 mb-4 items-center py-3"
              style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line }}
              onPress={confirmDelete}
            >
              <Text className="text-sm font-medium" style={{ color: colors.ink }}>
                Delete object
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
        <FormActionBar primaryLabel="Save item" onPrimary={save} onSecondary={() => router.back()} />
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
