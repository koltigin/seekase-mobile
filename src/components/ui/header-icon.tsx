import type { ReactNode } from 'react'
import { Pressable } from 'react-native'
import { useTheme } from '../../state/app-state'

export function HeaderIcon({
  onPress,
  children,
}: {
  onPress: () => void
  children: ReactNode
}) {
  const { colors } = useTheme()

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      className="h-9 w-9 items-center justify-center"
      style={{ borderRadius: 999, borderWidth: 1, borderColor: colors.line }}
    >
      {children}
    </Pressable>
  )
}
