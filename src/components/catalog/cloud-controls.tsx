import { Pressable, Text, TextInput, View } from 'react-native'
import { useTheme } from '../../state/app-state'
import { radius, type } from '../../theme/tokens'

export function CloudButton({
  label,
  onPress,
  disabled = false,
  secondary = false,
  danger = false,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  secondary?: boolean
  danger?: boolean
}) {
  const { colors } = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: danger ? colors.danger : colors.line,
        backgroundColor: secondary ? colors.surface : colors.accent,
        opacity: disabled ? 0.5 : 1,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: secondary ? (danger ? colors.danger : colors.ink) : colors.onAccent,
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export function CloudField({
  label,
  value,
  onChange,
  multiline = false,
  maxLength = 2000,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  maxLength?: number
  disabled?: boolean
}) {
  const { colors } = useTheme()
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ ...type.meta, color: colors.muted }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        editable={!disabled}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{
          backgroundColor: colors.surface,
          color: colors.ink,
          borderRadius: radius.md,
          padding: 14,
          minHeight: multiline ? 96 : 48,
          borderWidth: 1,
          borderColor: colors.line,
        }}
      />
    </View>
  )
}
