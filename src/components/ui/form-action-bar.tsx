import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../state/app-state'
import { radius } from '../../theme/tokens'

export function FormActionBar({
  primaryLabel,
  busyLabel,
  secondaryLabel = 'Cancel',
  busy = false,
  primaryDisabled = false,
  onPrimary,
  onSecondary,
}: {
  primaryLabel: string
  busyLabel?: string
  secondaryLabel?: string
  busy?: boolean
  primaryDisabled?: boolean
  onPrimary: () => void
  onSecondary: () => void
}) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const disabled = busy || primaryDisabled

  return (
    <View
      className="flex-row px-5 pt-3"
      style={{
        gap: 10,
        paddingBottom: Math.max(insets.bottom, 12),
        borderTopWidth: 1,
        borderTopColor: colors.line,
        backgroundColor: colors.background,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={secondaryLabel}
        disabled={busy}
        onPress={onSecondary}
        className="items-center justify-center py-3.5"
        style={{
          flex: 1,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: colors.line,
          opacity: busy ? 0.6 : 1,
        }}
      >
        <Text className="text-sm font-medium" style={{ color: colors.ink }}>
          {secondaryLabel}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
        disabled={disabled}
        onPress={onPrimary}
        className="items-center justify-center py-3.5"
        style={{ flex: 1.35, borderRadius: radius.pill, backgroundColor: colors.accent, opacity: disabled ? 0.55 : 1 }}
      >
        <Text className="text-sm font-semibold" style={{ color: colors.onAccent }}>
          {busy ? (busyLabel ?? primaryLabel) : primaryLabel}
        </Text>
      </Pressable>
    </View>
  )
}
