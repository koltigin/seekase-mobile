import Svg, { Path } from 'react-native-svg'
import categoryIconPaths from '../../../assets/brand/category-icon-paths.json'

type CategoryIconId = keyof typeof categoryIconPaths

type Props = {
  categoryId?: string | null
  subcategoryId?: string | null
  color: string
  size?: number
  strokeWidth?: number
}

export function hasCategoryIcon(categoryId?: string | null): categoryId is CategoryIconId {
  return Boolean(categoryId && categoryId in categoryIconPaths)
}

export function categoryIconId(categoryId?: string | null, _subcategoryId?: string | null): CategoryIconId {
  return hasCategoryIcon(categoryId) ? categoryId : 'other'
}

export function CategoryIcon({ categoryId, subcategoryId, color, size = 24, strokeWidth = 1.75 }: Props) {
  const iconId = categoryIconId(categoryId, subcategoryId)

  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d={categoryIconPaths[iconId]}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
