import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { getCollector } from '../../data/mock-data'
import type { Comment } from '../../data/types'
import { useTheme } from '../../state/app-state'
import { navigateToCollector } from '../../utils/collector-nav'
import { Avatar } from '../ui/avatar'

export function CommentRow({ comment, last = false }: { comment: Comment; last?: boolean }) {
  const { colors } = useTheme()
  const router = useRouter()
  const actor = getCollector(comment.actorId)

  return (
    <View
      className="flex-row items-start py-3.5"
      style={last ? undefined : { borderBottomWidth: 1, borderBottomColor: colors.line }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open collector ${actor?.displayName ?? 'Collector'}`}
        className="flex-row items-start"
        style={{ flex: 1 }}
        onPress={() => {
          if (actor) {
            navigateToCollector(router, actor.id)
          }
        }}
      >
        <Avatar collector={actor} size={36} />
        <View className="ml-3 min-w-0 flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-[14px] font-semibold" style={{ color: colors.ink }} numberOfLines={1}>
              {actor?.displayName ?? 'Collector'}
            </Text>
            <Text className="ml-2 text-[11px]" style={{ color: colors.faint }}>
              {comment.timeLabel}
            </Text>
          </View>
          <Text className="mt-1 text-[14px] leading-5" style={{ color: colors.muted }}>
            {comment.text}
          </Text>
        </View>
      </Pressable>
    </View>
  )
}
