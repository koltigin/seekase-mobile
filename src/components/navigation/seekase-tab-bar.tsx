import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs'
import { useTheme } from '../../state/app-state'
import { useAuth } from '../../state/auth'
import { useActivityUnread } from '../../state/use-activity-unread'
import { useMessageInbox } from '../../state/use-message-inbox'
import { IconBell, IconCompass, IconGrid, IconPerson, IconPlus } from '../ui/icons'

const tabs = [
  { name: 'index', label: 'Discover', icon: IconCompass },
  { name: 'collections', label: 'Collections', icon: IconGrid },
  { name: 'add', label: 'Add', icon: IconPlus },
  { name: 'activity', label: 'Activity', icon: IconBell },
  { name: 'profile', label: 'Profile', icon: IconPerson },
] as const

export function SeekaseTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { user } = useAuth()
  const { unreadCount } = useActivityUnread(user?.id)
  const { unreadCount: unreadMessages } = useMessageInbox(user?.id)
  const activityBadgeCount = unreadCount + unreadMessages

  return (
    <View
      className="flex-row items-end justify-between px-3 pt-2"
      style={{
        backgroundColor: colors.tabBar,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        paddingBottom: Math.max(insets.bottom, 10),
      }}
    >
      {state.routes.map((route, index) => {
        const meta = tabs.find((tab) => tab.name === route.name)
        if (!meta) {
          return null
        }
        const focused = state.index === index
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }
        const Icon = meta.icon
        const isAdd = route.name === 'add'

        if (isAdd) {
          return (
            <Pressable key={route.key} onPress={onPress} className="w-[18%] items-center pb-0.5">
              <View
                className="items-center justify-center rounded-full"
                style={{
                  width: 48,
                  height: 48,
                  marginTop: -10,
                  backgroundColor: colors.accent,
                }}
              >
                <Icon color={colors.onAccent} size={20} />
              </View>
              <Text className="mt-1 text-[11px] font-medium" style={{ color: focused ? colors.ink : colors.faint }}>
                {meta.label}
              </Text>
            </Pressable>
          )
        }

        return (
          <Pressable key={route.key} onPress={onPress} className="w-[20.5%] items-center py-1">
            <View>
              <Icon color={focused ? colors.ink : colors.faint} size={22} />
              {route.name === 'activity' && activityBadgeCount > 0 ? (
                <View
                  accessibilityLabel={`${activityBadgeCount} unread updates and messages`}
                  style={{
                    position: 'absolute',
                    right: -5,
                    top: -4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.like,
                  }}
                />
              ) : null}
            </View>
            <Text className="mt-1 text-[11px] font-medium" style={{ color: focused ? colors.ink : colors.faint }}>
              {meta.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
