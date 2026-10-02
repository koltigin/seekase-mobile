import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '../../state/app-state'
import { type } from '../../theme/tokens'

export function ScreenHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  const { colors } = useTheme()

  return (
    <View className="flex-row items-end justify-between px-5 pb-3">
      <View className="flex-1 pr-3">
        <Text style={{ ...type.eyebrow, textTransform: 'none', color: colors.faint }}>
          {eyebrow.toLocaleUpperCase('en-US')}
        </Text>
        <Text className="mt-0.5" style={{ ...type.title, color: colors.ink }}>
          {title}
        </Text>
      </View>
      {action}
    </View>
  )
}
