import { useCallback, useEffect, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import {
  createComment,
  deleteComment,
  listComments,
  type CloudComment,
  type CommentTarget,
} from '../../repositories/comment-repository'
import { useTheme } from '../../state/app-state'
import { radius, type } from '../../theme/tokens'
import { CloudButton } from '../catalog/cloud-controls'
import { SafetyActions } from '../safety/safety-actions'

export function CloudComments({ target, userId }: { target: CommentTarget; userId: string }) {
  const { colors } = useTheme()
  const targetKind = target.kind
  const targetId = target.id
  const [comments, setComments] = useState<CloudComment[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const commentTarget: CommentTarget = { kind: targetKind, id: targetId }
    const result = await listComments(commentTarget)
    if (result.ok) setComments(result.data)
    else setError(result.error.message)
    setLoading(false)
  }, [targetId, targetKind])

  useEffect(() => {
    // Defer the async state transition until after the effect has subscribed.
    void Promise.resolve().then(refresh)
  }, [refresh])

  async function post() {
    if (busy || !draft.trim()) return
    setBusy(true)
    setError(null)
    const commentTarget: CommentTarget = { kind: targetKind, id: targetId }
    const result = await createComment(userId, commentTarget, draft)
    if (result.ok) {
      setDraft('')
      await refresh()
    } else setError(result.error.message)
    setBusy(false)
  }

  async function remove(commentId: string) {
    if (busy) return
    setBusy(true)
    setError(null)
    const result = await deleteComment(userId, commentId)
    if (result.ok) setComments((current) => current.filter((comment) => comment.id !== commentId))
    else setError(result.error.message)
    setBusy(false)
  }

  return (
    <View style={{ gap: 14, paddingTop: 10 }}>
      <Text style={{ ...type.title, fontSize: 24, color: colors.ink }}>Comments ({comments.length})</Text>
      {loading ? <Text style={{ ...type.meta, color: colors.muted }}>Loading comments…</Text> : null}
      {!loading && comments.length === 0 ? (
        <Text style={{ ...type.meta, color: colors.muted }}>No comments yet. Start the conversation.</Text>
      ) : null}
      {comments.map((comment) => (
        <View
          key={comment.id}
          style={{ padding: 16, gap: 5, borderRadius: radius.lg, backgroundColor: colors.surface }}
        >
          <Text style={{ ...type.body, color: colors.ink }}>{comment.authorName}</Text>
          <Text style={{ ...type.meta, color: colors.muted }}>@{comment.authorHandle}</Text>
          <Text style={{ ...type.body, color: colors.ink }}>{comment.body}</Text>
          {comment.authorId === userId ? (
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void remove(comment.id)} hitSlop={8}>
              <Text style={{ ...type.meta, color: colors.danger }}>Delete comment</Text>
            </Pressable>
          ) : (
            <SafetyActions
              userId={userId}
              targetType="comment"
              targetId={comment.id}
              collectorId={comment.authorId}
              showBlock={false}
              compact
            />
          )}
        </View>
      ))}
      <TextInput
        accessibilityLabel="Write a comment"
        placeholder="Write a comment"
        placeholderTextColor={colors.faint}
        value={draft}
        onChangeText={setDraft}
        multiline
        maxLength={1000}
        style={{
          ...type.body,
          color: colors.ink,
          minHeight: 96,
          padding: 16,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface,
          textAlignVertical: 'top',
        }}
      />
      <CloudButton
        label={busy ? 'Posting…' : 'Post comment'}
        disabled={busy || !draft.trim()}
        onPress={() => void post()}
      />
      {error ? (
        <Text accessibilityRole="alert" style={{ ...type.meta, color: colors.danger }}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}
