import { Pressable, ScrollView, Text, View } from 'react-native'
import { CategoryIcon } from '../category/category-icon'
import { curatedInterestCategories, discoverRail } from '../../data/categories'
import { useTheme } from '../../state/app-state'
import { radius } from '../../theme/tokens'

type Props = {
  selectedId: string
  onSelect: (categoryId: string) => void
  rail?: 'discover' | 'catalog'
}

export function CategoryChips({ selectedId, onSelect, rail = 'discover' }: Props) {
  const { colors } = useTheme()
  const options = rail === 'discover' ? discoverRail : curatedInterestCategories

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 28 }}>
      {options.map((category) => {
        const isSelected = category.id === selectedId
        return (
          <Pressable
            key={category.id}
            onPress={() => onSelect(category.id)}
            className="px-4 py-2"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              backgroundColor: isSelected ? colors.chipActive : colors.chip,
              borderRadius: radius.pill,
            }}
          >
            <View accessibilityElementsHidden>
              <CategoryIcon
                categoryId={category.id}
                color={isSelected ? colors.onAccent : colors.ink}
                size={16}
                strokeWidth={1.8}
              />
            </View>
            <Text className="text-sm font-medium" style={{ color: isSelected ? colors.onAccent : colors.ink }}>
              {category.shortLabel}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
