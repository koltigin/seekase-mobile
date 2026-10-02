import { Linking, Pressable, View } from 'react-native'
import { socialHref, type SocialLinks, type SocialProvider } from '../../data/social'
import { useTheme } from '../../state/app-state'
import { SocialProviderIcon } from './social-provider-icon'

const providerNames: Record<SocialProvider, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  x: 'X',
  website: 'Website',
}

export function SocialLinksRow({ links }: { links: SocialLinks }) {
  const { colors } = useTheme()
  const entries = (Object.entries(links) as [SocialProvider, string | undefined][]).filter(([, value]) => value)

  if (entries.length === 0) {
    return null
  }

  return (
    <View className="mt-4 flex-row justify-center" style={{ gap: 10 }}>
      {entries.map(([provider, value]) => (
        <Pressable
          key={provider}
          onPress={() => void Linking.openURL(socialHref(provider, value ?? ''))}
          accessibilityRole="link"
          accessibilityLabel={`Open ${providerNames[provider]}`}
          accessibilityHint="Opens this collector's social profile"
          hitSlop={8}
          android_ripple={{ color: colors.chip }}
          className="h-11 w-11 items-center justify-center"
          style={({ pressed }) => ({
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surfaceElevated,
            elevation: pressed ? 0 : 2,
            shadowColor: '#000000',
            shadowOpacity: pressed ? 0.04 : 0.12,
            shadowRadius: pressed ? 1 : 5,
            shadowOffset: { width: 0, height: pressed ? 1 : 3 },
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}
        >
          <SocialProviderIcon provider={provider} color={colors.ink} size={20} />
        </Pressable>
      ))}
    </View>
  )
}
