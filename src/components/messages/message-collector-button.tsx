import { useState } from 'react'
import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { openDirectConversation, type MessageContext } from '../../repositories/message-repository'
import { useTheme } from '../../state/app-state'
import { type } from '../../theme/tokens'
import { CloudButton } from '../catalog/cloud-controls'

export function MessageCollectorButton({ peerId, context }: { peerId: string; context?: MessageContext }) {
  const router = useRouter()
  const { colors } = useTheme()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function open() {
    if (busy) return
    setBusy(true)
    setError(null)
    const result = await openDirectConversation(peerId)
    setBusy(false)
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    router.push({
      pathname: '/messages/[id]',
      params: {
        id: result.data,
        ...(context?.kind === 'collection' ? { collectionId: context.id } : {}),
        ...(context?.kind === 'item' ? { itemId: context.id } : {}),
        ...(context?.title ? { contextTitle: context.title } : {}),
      },
    })
  }

  return (
    <View style={{ gap: 7 }}>
      <CloudButton
        label={busy ? 'Opening messages…' : 'Message collector'}
        secondary
        disabled={busy}
        onPress={() => void open()}
      />
      {error ? (
        <Text accessibilityRole="alert" style={{ ...type.meta, color: colors.danger }}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}
