import { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../state/app-state'

export function Screen({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: colors.background,
        paddingTop: insets.top + 8,
        paddingHorizontal: padded ? 20 : 0,
      }}
    >
      {children}
    </View>
  )
}
