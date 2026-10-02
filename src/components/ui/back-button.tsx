import { Pressable, Text } from 'react-native'
import { useTheme } from '../../state/app-state'
import { IconBack } from './icons'

export function BackButton({
  label = 'Back',
  onPress,
  disabled = false,
}: {
  label?: string
  onPress: () => void
  disabled?: boolean
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => ({
        minHeight: 52,
        minWidth: 96,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: disabled ? 0.38 : pressed ? 0.58 : 1,
      })}
    >
      <IconBack color={colors.ink} size={26} />
      <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  )
}
