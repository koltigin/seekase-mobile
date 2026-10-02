import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { getCategory, searchCategories } from '../../data/categories'
import { useTheme } from '../../state/app-state'
import { radius, type } from '../../theme/tokens'
import { CategoryIcon } from './category-icon'

type Props = {
  mode: 'single' | 'multi'
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onCustom?: (name: string) => void
}

export function CategoryPicker({ mode, selectedIds, onChange, onCustom }: Props) {
  const { colors } = useTheme()
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const results = useMemo(() => searchCategories(query), [query])

  function toggle(id: string) {
    if (mode === 'single') {
      onChange([id])
      return
    }
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id])
  }

  return (
    <View className="flex-1">
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search categories, subcategories, tags"
        placeholderTextColor={colors.faint}
        className="mx-5 mb-4 px-4 py-3.5 text-[15px]"
        style={{ backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.md }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {onCustom && query.trim() ? (
          <Pressable accessibilityRole="button" onPress={() => onCustom(query.trim())} className="mb-4 px-4 py-3">
            <Text style={{ ...type.body, color: colors.ink }}>Use “{query.trim()}” as my category</Text>
          </Pressable>
        ) : null}
        {results.map((category) => {
          const selected = selectedIds.includes(category.id)
          const open = openId === category.id
          return (
            <View
              key={category.id}
              className="mb-2"
              style={{ backgroundColor: colors.surface, borderRadius: radius.md }}
            >
              <Pressable
                className="flex-row items-center justify-between px-4 py-3.5"
                onPress={() => toggle(category.id)}
              >
                <View className="flex-1 flex-row items-center pr-3" style={{ gap: 12 }}>
                  <CategoryIcon categoryId={category.id} color={selected ? colors.ink : colors.muted} size={22} />
                  <View style={{ flex: 1 }}>
                    <Text className="text-[15px] font-medium" style={{ color: colors.ink }}>
                      {category.label}
                    </Text>
                    {category.subcategories.length > 0 ? (
                      <Text className="mt-0.5 text-[12px]" style={{ color: colors.faint }}>
                        {category.subcategories.length} subcategories
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View
                  className="h-6 w-6 items-center justify-center"
                  style={{
                    borderRadius: 999,
                    borderWidth: 1.5,
                    borderColor: selected ? colors.accent : colors.line,
                    backgroundColor: selected ? colors.accent : 'transparent',
                  }}
                >
                  {selected ? <Text style={{ color: colors.onAccent, fontSize: 12 }}>✓</Text> : null}
                </View>
              </Pressable>
              {category.subcategories.length > 0 ? (
                <Pressable className="px-4 pb-3" onPress={() => setOpenId(open ? null : category.id)}>
                  <Text className="text-[12px] font-medium" style={{ color: colors.muted }}>
                    {open ? 'Hide details' : 'Browse subcategories'}
                  </Text>
                  {open
                    ? category.subcategories.map((sub) => (
                        <Text key={sub.id} className="mt-1.5 text-[13px]" style={{ color: colors.muted }}>
                          {sub.label}
                          {sub.tags?.length ? ` · ${sub.tags.join(', ')}` : ''}
                        </Text>
                      ))
                    : null}
                </Pressable>
              ) : null}
            </View>
          )
        })}
        {results.length === 0 ? (
          <Text style={{ ...type.body, color: colors.muted }}>No categories match that search.</Text>
        ) : null}
      </ScrollView>
    </View>
  )
}

export function selectedCategoryLabels(ids: string[]) {
  return ids.map((id) => getCategory(id)?.shortLabel ?? id)
}
