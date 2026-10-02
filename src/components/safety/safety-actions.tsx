import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  blockCollector,
  reportContent,
  type ReportReason,
  type ReportTargetType,
} from '../../repositories/moderation-repository'
import { useTheme } from '../../state/app-state'
import { radius, type } from '../../theme/tokens'
import { CloudButton } from '../catalog/cloud-controls'

const reasons: { id: ReportReason; label: string }[] = [
  { id: 'spam', label: 'Spam or misleading' },
  { id: 'harassment', label: 'Harassment' },
  { id: 'hate', label: 'Hate or abuse' },
  { id: 'sexual', label: 'Sexual content' },
  { id: 'violence', label: 'Violence' },
  { id: 'illegal', label: 'Illegal content' },
  { id: 'other', label: 'Something else' },
]

export function SafetyActions({
  userId,
  targetType,
  targetId,
  collectorId,
  showBlock = true,
  compact = false,
  compactLabel = 'Report comment',
}: {
  userId: string
  targetType: ReportTargetType
  targetId: string
  collectorId?: string
  showBlock?: boolean
  compact?: boolean
  compactLabel?: string
}) {
  const { colors } = useTheme()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [reportOpen, setReportOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const canBlock = showBlock && Boolean(collectorId && collectorId !== userId)

  async function submitReport(reason: ReportReason) {
    if (busy) return
    setBusy(true)
    setMessage(null)
    const result = await reportContent({ reporterId: userId, targetType, targetId, reason })
    setBusy(false)
    if (result.ok) {
      setReportOpen(false)
      setMessage('Report submitted. Thank you for helping keep Seekase safe.')
    } else setMessage(result.error.message)
  }

  async function confirmBlock() {
    if (busy || !collectorId) return
    setBusy(true)
    setMessage(null)
    const result = await blockCollector(userId, collectorId)
    setBusy(false)
    if (!result.ok) {
      setMessage(result.error.message)
      return
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['blocked-collectors'] }),
      queryClient.invalidateQueries({ queryKey: ['public-discover-collections'] }),
    ])
    router.replace('/(tabs)')
  }

  return (
    <View style={{ gap: 10, paddingTop: 8 }}>
      {!compact ? <Text style={{ ...type.eyebrow, textTransform: 'none', color: colors.faint }}>SAFETY</Text> : null}
      {reportOpen ? (
        <View style={{ gap: 8, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface }}>
          <Text style={{ ...type.body, fontWeight: '600', color: colors.ink }}>Why are you reporting this?</Text>
          {reasons.map((reason) => (
            <Pressable
              key={reason.id}
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void submitReport(reason.id)}
              style={{ paddingVertical: 9 }}
            >
              <Text style={{ ...type.meta, color: colors.ink }}>{reason.label}</Text>
            </Pressable>
          ))}
          <CloudButton label="Cancel report" secondary disabled={busy} onPress={() => setReportOpen(false)} />
        </View>
      ) : (
        <CloudButton
          label={compact ? compactLabel : 'Report'}
          secondary
          disabled={busy}
          onPress={() => setReportOpen(true)}
        />
      )}

      {canBlock && blockOpen ? (
        <View style={{ gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface }}>
          <Text style={{ ...type.body, color: colors.ink }}>Block this collector?</Text>
          <Text style={{ ...type.meta, color: colors.muted }}>
            Their collections and activity will be hidden from your account after blocking.
          </Text>
          <CloudButton label="Block collector" secondary danger disabled={busy} onPress={() => void confirmBlock()} />
          <CloudButton label="Keep collector visible" secondary disabled={busy} onPress={() => setBlockOpen(false)} />
        </View>
      ) : canBlock ? (
        <CloudButton label="Block collector" secondary danger disabled={busy} onPress={() => setBlockOpen(true)} />
      ) : null}

      {message ? (
        <Text
          accessibilityRole="alert"
          style={{ ...type.meta, color: message.startsWith('Report submitted') ? colors.muted : colors.danger }}
        >
          {message}
        </Text>
      ) : null}
    </View>
  )
}
