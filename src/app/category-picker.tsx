import { useState } from 'react'
import { Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CategoryPicker } from '../components/category/category-picker'
import { Screen } from '../components/ui/screen'
import { FormActionBar } from '../components/ui/form-action-bar'
import { emitCategoryPick } from '../state/category-pick'
import { useTheme } from '../state/app-state'
import { type } from '../theme/tokens'

export default function CategoryPickerScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ mode?: string; selected?: string; target?: string }>()
  const mode = params.mode === 'multi' ? 'multi' : 'single'
  const initial = params.selected ? params.selected.split(',').filter(Boolean) : []
  const [selected, setSelected] = useState<string[]>(initial)
  const target =
    params.target === 'add' || params.target === 'edit-profile' || params.target === 'interests'
      ? params.target
      : undefined

  function done() {
    emitCategoryPick(selected, target)
    router.back()
  }

  return (
    <Screen padded={false}>
      <View className="items-center px-5 pb-3">
        <Text style={{ ...type.eyebrow, color: colors.faint }}>Categories</Text>
      </View>
      <Text className="px-5 pb-3" style={{ ...type.body, color: colors.muted }}>
        Search the full taxonomy. Discover stays a short curated rail.
      </Text>
      <CategoryPicker mode={mode} selectedIds={selected} onChange={setSelected} />
      <FormActionBar
        primaryLabel={mode === 'single' ? 'Use this category' : 'Save categories'}
        primaryDisabled={mode === 'single' && !selected[0]}
        onPrimary={done}
        onSecondary={() => router.back()}
      />
    </Screen>
  )
}
