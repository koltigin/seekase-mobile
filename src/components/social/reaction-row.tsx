import { Pressable, Text, View } from 'react-native'
import { useAppState, useTheme } from '../../state/app-state'
import { IconBookmark, IconHeart } from '../ui/icons'

type Props = {
  likes: number
  collectionId: string
}

/** Discover card reactions — shared persistent Like/Save for collections. */
export function ReactionRow({ likes, collectionId }: Props) {
  const { colors } = useTheme()
  const { social, toggleLikeCollection, toggleSaveCollection } = useAppState()
  const liked = social.likedCollectionIds.includes(collectionId)
  const saved = social.savedCollectionIds.includes(collectionId)
  const count = Math.max(0, likes + (liked ? 1 : 0))

  return (
    <View className="flex-row items-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={liked ? 'Unlike collection' : 'Like collection'}
        accessibilityState={{ selected: liked }}
        onPress={(event) => {
          event.stopPropagation?.()
          toggleLikeCollection(collectionId)
        }}
        hitSlop={10}
        className="flex-row items-center px-1 py-1"
      >
        <IconHeart color={colors.like} size={16} filled={liked} />
        <Text className="ml-1.5 text-[13px]" style={{ color: colors.like }}>
          {count}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saved ? 'Remove collection from saved' : 'Save collection'}
        accessibilityState={{ selected: saved }}
        onPress={(event) => {
          event.stopPropagation?.()
          toggleSaveCollection(collectionId)
        }}
        hitSlop={10}
        className="ml-3 px-1 py-1"
      >
        <IconBookmark color={saved ? colors.ink : colors.faint} size={15} filled={saved} />
      </Pressable>
    </View>
  )
}
