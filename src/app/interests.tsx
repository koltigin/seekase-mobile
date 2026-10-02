import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { CategoryIcon } from '../components/category/category-icon'
import { CategoryPicker } from '../components/category/category-picker'
import { Screen } from '../components/ui/screen'
import { curatedInterestCategories } from '../data/categories'
import { useAppState, useTheme } from '../state/app-state'
import { radius, type } from '../theme/tokens'

export default function InterestsScreen() {
  const { colors } = useTheme()
  const { profile, updateProfile, completeInterests } = useAppState()
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>(profile.interestIds)
  const [browseAll, setBrowseAll] = useState(false)

  function finish() {
    updateProfile({ interestIds: selected })
    completeInterests()
    router.replace('/(tabs)')
  }

  return (
    <Screen padded={false}>
      <View className="px-5 pb-3">
        <Text style={{ ...type.eyebrow, color: colors.faint }}>Collector interests</Text>
        <Text className="mt-1" style={{ ...type.title, color: colors.ink }}>
          What do you collect?
        </Text>
        <Text className="mt-3" style={{ ...type.body, color: colors.muted }}>
          Choose a few interests. You can change these anytime.
        </Text>
      </View>

      {browseAll ? (
        <CategoryPicker mode="multi" selectedIds={selected} onChange={setSelected} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {curatedInterestCategories.map((category) => {
              const active = selected.includes(category.id)
              return (
                <Pressable
                  key={category.id}
                  onPress={() =>
                    setSelected((current) =>
                      current.includes(category.id)
                        ? current.filter((id) => id !== category.id)
                        : [...current, category.id],
                    )
                  }
                  className="px-4 py-2"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 7,
                    borderRadius: 999,
                    backgroundColor: active ? colors.chipActive : colors.chip,
                  }}
                >
                  <CategoryIcon
                    categoryId={category.id}
                    color={active ? colors.onAccent : colors.ink}
                    size={16}
                    strokeWidth={1.8}
                  />
                  <Text className="text-sm font-medium" style={{ color: active ? colors.onAccent : colors.ink }}>
                    {category.shortLabel}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          <Pressable className="mt-6" onPress={() => setBrowseAll(true)}>
            <Text className="text-sm font-medium" style={{ color: colors.ink }}>
              Browse all categories
            </Text>
          </Pressable>
        </ScrollView>
      )}

      <View className="px-5 pb-6 pt-3">
        <Pressable
          onPress={finish}
          className="items-center py-3.5"
          style={{ backgroundColor: colors.accent, borderRadius: radius.pill }}
        >
          <Text className="text-sm font-medium" style={{ color: colors.onAccent }}>
            Continue
          </Text>
        </Pressable>
        <Text className="mt-3 text-center text-[12px]" style={{ color: colors.faint }}>
          You can change these anytime from your profile.
        </Text>
      </View>
    </Screen>
  )
}
