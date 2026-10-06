import { useEffect } from 'react'
import { Text } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen } from '../../components/ui/screen'
import { useTheme } from '../../state/app-state'
import { type } from '../../theme/tokens'

export default function OAuthCallbackScreen() {
  const router = useRouter()
  const { colors } = useTheme()

  useEffect(() => {
    const timeout = setTimeout(() => router.back(), 800)
    return () => clearTimeout(timeout)
  }, [router])

  return (
    <Screen>
      <Text style={{ ...type.eyebrow, color: colors.faint }}>SEEKASE ACCOUNT</Text>
      <Text className="mt-3" style={{ ...type.title, color: colors.ink }}>
        Completing Google connection…
      </Text>
      <Text className="mt-3" style={{ ...type.body, color: colors.muted }}>
        Returning securely to Seekase.
      </Text>
    </Screen>
  )
}
