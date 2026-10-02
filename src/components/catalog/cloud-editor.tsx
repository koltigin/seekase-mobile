import { useState, useEffect, useRef } from 'react'
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import type { CollectibleItem, Collection } from '../../data/types'
import { CategoryPicker } from '../category/category-picker'
import { categoryLabel, collectibleLabels } from '../../data/categories'
import { useTheme } from '../../state/app-state'
import type { CloudCatalogAction } from '../../services/cloud-catalog'
import { CloudButton, CloudField } from './cloud-controls'
import { type } from '../../theme/tokens'
import { pickPhoto, type PhotoDraft } from '../../services/pick-photo'
import { AccountPhoto } from './account-photo'

export type CloudEditorTarget =
  { kind: 'collection'; value?: Collection } | { kind: 'item'; collection?: Collection; value?: CollectibleItem }

type DetailKey = 'year' | 'maker' | 'author' | 'publisher' | 'manufacturer' | 'model' | 'issuer' | 'country'
const labels: Record<DetailKey, string> = {
  year: 'Year',
  maker: 'Maker',
  author: 'Author',
  publisher: 'Publisher',
  manufacturer: 'Brand / manufacturer',
  model: 'Model',
  issuer: 'Issuer',
  country: 'Country',
}
function fieldsFor(category: string): DetailKey[] {
  if (category === 'books' || category === 'comics') return ['author', 'publisher', 'year']
  if (
    ['cameras', 'retro-tech', 'computers', 'phones', 'audio', 'vaping', 'toys', 'diecast', 'miniatures'].includes(
      category,
    )
  )
    return ['manufacturer', 'model', 'year']
  if (category === 'coins' || category === 'stamps') return ['issuer', 'country', 'year']
  return ['maker', 'year']
}

export function CloudEditor({
  target,
  busy,
  error,
  onSave,
  onCancel,
  collections = [],
  destination = 'account',
}: {
  target: CloudEditorTarget
  busy: boolean
  error: string | null
  onSave: (action: CloudCatalogAction, photo?: PhotoDraft) => void
  onCancel: () => void
  collections?: Collection[]
  destination?: 'account' | 'device'
}) {
  const { colors } = useTheme()
  const [photo, setPhoto] = useState<PhotoDraft | undefined>()
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  async function choosePhoto() {
    setSelecting(true)
    setPhotoError(null)
    try {
      const chosen = await pickPhoto()
      if (alive.current && chosen) setPhoto(chosen)
    } catch {
      if (alive.current) setPhotoError('Could not prepare this photo. Please try another image.')
    } finally {
      if (alive.current) setSelecting(false)
    }
  }
  const initial = target.value
  const item = target.kind === 'item' ? target.value : undefined
  const [title, setTitle] = useState(initial?.title ?? '')
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? (target.kind === 'item' ? target.collection?.categoryId : undefined) ?? '',
  )
  const [collectionId, setCollectionId] = useState(
    target.kind === 'item' ? (item?.collectionId ?? target.collection?.id ?? '') : '',
  )
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? '')
  const [tags, setTags] = useState(initial?.tags?.join(', ') ?? '')
  const [description, setDescription] = useState(
    target.kind === 'collection' ? (target.value?.description ?? '') : (item?.story ?? ''),
  )
  const [provenance, setProvenance] = useState(item?.provenance ?? '')
  const [details, setDetails] = useState(
    () =>
      Object.fromEntries(Object.keys(labels).map((key) => [key, item?.[key as DetailKey] ?? ''])) as Record<
        DetailKey,
        string
      >,
  )
  const [expanded, setExpanded] = useState(Boolean(initial))
  const [pickCategory, setPickCategory] = useState(!categoryId)
  const maxTitle = target.kind === 'collection' ? 120 : 160
  const visibleFields = fieldsFor(categoryId)
  // Keep populated fields accessible even after a category change.
  const detailFields = [
    ...visibleFields,
    ...(Object.keys(labels) as DetailKey[]).filter((key) => !visibleFields.includes(key) && details[key]),
  ]
  const needsAccountPhoto =
    destination === 'account' && target.kind === 'item' && !photo && !item?.coverPath

  function save() {
    if (selecting || busy || !categoryId || !title.trim() || needsAccountPhoto) return
    const common = {
      title: title.trim(),
      categoryId,
      subcategoryId: subcategory.trim(),
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    }
    if (target.kind === 'collection') {
      const input = { ...common, description: description.trim() }
      onSave(
        target.value ? { kind: 'update-collection', id: target.value.id, input } : { kind: 'create-collection', input },
      )
    } else {
      const input = {
        ...common,
        ...Object.fromEntries(Object.entries(details).map(([key, value]) => [key, value.trim()])),
        story: description.trim(),
        provenance: provenance.trim(),
      }
      if (target.value)
        onSave(
          {
            kind: 'update-item',
            id: target.value.id,
            input: { ...input, collectionId: collectionId || target.value.collectionId },
          },
          photo,
        )
      else if (collectionId) onSave({ kind: 'create-item', input: { ...input, collectionId } }, photo)
      else onSave({ kind: 'create-ungrouped-item', input }, photo)
    }
  }

  if (pickCategory)
    return (
      <View style={{ flex: 1, gap: 16 }}>
        <Text style={{ ...type.title, color: colors.ink }}>Choose a category</Text>
        <CloudButton
          label={categoryId ? 'Back to details' : 'Cancel'}
          secondary
          onPress={() => (categoryId ? setPickCategory(false) : onCancel())}
        />
        <CategoryPicker
          mode="single"
          selectedIds={[categoryId]}
          onChange={(ids) => {
            setCategoryId(ids[0])
            setPickCategory(false)
          }}
          onCustom={(name) => {
            setCategoryId('other')
            setSubcategory(name.slice(0, 120))
            setPickCategory(false)
          }}
        />
      </View>
    )

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16, paddingBottom: 100 }}>
        <Text style={{ ...type.title, color: colors.ink }}>
          {initial ? 'Edit' : 'New'}{' '}
          {target.kind === 'collection' ? 'collection' : collectibleLabels(categoryId, subcategory).singular}
        </Text>
        <Text style={{ ...type.meta, color: colors.muted }}>
          {destination === 'account'
            ? target.kind === 'item'
              ? 'A photo is required. Saved items can appear in your public collection.'
              : 'Saved to your account. This collection appears publicly after you add its first photographed item.'
            : 'Saved only on this device.'}
        </Text>
        <CloudButton
          label={`Category · ${categoryId === 'other' && subcategory ? subcategory : categoryLabel(categoryId)}`}
          secondary
          disabled={busy || selecting}
          onPress={() => setPickCategory(true)}
        />
        {categoryId === 'other' ? (
          <CloudField
            label="Your category (optional)"
            value={subcategory}
            onChange={setSubcategory}
            maxLength={120}
            disabled={busy || selecting}
          />
        ) : null}
        <CloudField
          label={target.kind === 'collection' ? 'Collection name' : collectibleLabels(categoryId, subcategory).title}
          value={title}
          onChange={setTitle}
          maxLength={maxTitle}
          disabled={busy || selecting}
        />
        {target.kind === 'item' && destination === 'account' ? (
          <View style={{ gap: 12 }}>
            {photo ? (
              <Image
                source={{ uri: photo.uri }}
                accessibilityLabel="Selected photo preview"
                resizeMode="contain"
                style={{ width: '100%', height: 220 }}
              />
            ) : (
              <AccountPhoto path={item?.coverPath} />
            )}
            <CloudButton
              label={
                selecting
                  ? 'Preparing photo…'
                  : photo || item?.coverPath
                    ? 'Choose another photo'
                    : 'Add photo (required)'
              }
              secondary
              disabled={busy || selecting}
              onPress={() => void choosePhoto()}
            />
            {photo ? (
              <>
                <Text style={{ ...type.meta, color: colors.muted }}>
                  Uploads when you save · {Math.ceil(photo.bytes.length / 1024)} KB. Saved photos are visible to other
                  users.
                </Text>
                <CloudButton
                  label="Discard selected photo"
                  secondary
                  disabled={busy || selecting}
                  onPress={() => setPhoto(undefined)}
                />
              </>
            ) : null}
            {photoError ? (
              <Text accessibilityRole="alert" style={{ ...type.meta, color: colors.danger }}>
                {photoError}
              </Text>
            ) : null}
            {needsAccountPhoto ? (
              <Text accessibilityRole="alert" style={{ ...type.meta, color: colors.danger }}>
                Choose a clear photo before saving this item.
              </Text>
            ) : null}
          </View>
        ) : null}
        {target.kind === 'item' ? (
          <Text style={{ ...type.meta, color: colors.muted }}>
            {collectionId
              ? `In ${collections.find((entry) => entry.id === collectionId)?.title ?? target.collection?.title ?? 'your collection'}`
              : 'Saved in Ungrouped items. Choose a collection under Optional details or organize it later.'}
          </Text>
        ) : null}
        <CloudButton
          label={expanded ? 'Hide optional details' : 'Optional details'}
          secondary
          disabled={busy || selecting}
          onPress={() => setExpanded(!expanded)}
        />
        {expanded ? (
          <>
            {target.kind === 'item' && collections.length ? (
              <>
                <Text style={{ ...type.meta, color: colors.muted }}>Collection (optional)</Text>
                {!target.value ? (
                  <CloudButton
                    label={!collectionId ? '✓ Ungrouped items' : 'Ungrouped items'}
                    secondary
                    disabled={busy || selecting}
                    onPress={() => setCollectionId('')}
                  />
                ) : null}
                {collections.map((entry) => (
                  <CloudButton
                    key={entry.id}
                    label={`${collectionId === entry.id ? '✓ ' : ''}${entry.title === 'My objects' && entry.categoryId === 'other' ? 'Ungrouped items' : entry.title}`}
                    secondary
                    disabled={busy || selecting}
                    onPress={() => setCollectionId(entry.id)}
                  />
                ))}
              </>
            ) : null}
            {categoryId !== 'other' ? (
              <CloudField
                label="Subcategory (optional)"
                value={subcategory}
                onChange={setSubcategory}
                maxLength={120}
                disabled={busy || selecting}
              />
            ) : null}
            {target.kind === 'item'
              ? detailFields.map((key) => (
                  <CloudField
                    key={key}
                    label={labels[key]}
                    value={details[key]}
                    onChange={(value) => setDetails((current) => ({ ...current, [key]: value }))}
                    maxLength={160}
                    disabled={busy || selecting}
                  />
                ))
              : null}
            <CloudField
              label="Tags, separated by commas"
              value={tags}
              onChange={setTags}
              maxLength={500}
              disabled={busy || selecting}
            />
            <CloudField
              label={target.kind === 'collection' ? 'Description' : 'Story'}
              value={description}
              onChange={setDescription}
              multiline
              disabled={busy || selecting}
            />
            {target.kind === 'item' ? (
              <CloudField
                label="Where did you get it? (optional)"
                value={provenance}
                onChange={setProvenance}
                multiline
                disabled={busy || selecting}
              />
            ) : null}
          </>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={{ ...type.body, color: colors.danger }}>
            {error}
          </Text>
        ) : null}
        <CloudButton
          label={busy ? 'Saving…' : destination === 'account' ? 'Save to account' : 'Save on this device'}
          disabled={
            busy || selecting || !title.trim() || !categoryId || title.trim().length > maxTitle || needsAccountPhoto
          }
          onPress={save}
        />
        <CloudButton label="Cancel" secondary disabled={busy || selecting} onPress={onCancel} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
