import { Tabs } from 'expo-router'
import { SeekaseTabBar } from '../../components/navigation/seekase-tab-bar'
import { useTheme } from '../../state/app-state'

export default function TabsLayout() {
  const { colors } = useTheme()

  return (
    <Tabs
      tabBar={(props) => <SeekaseTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Discover' }} />
      <Tabs.Screen name="collections" options={{ title: 'Collections' }} />
      <Tabs.Screen name="add" options={{ title: 'Add' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
