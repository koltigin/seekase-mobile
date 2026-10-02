import { useEffect, useRef, useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SeekaseLockup } from '../components/brand/seekase-lockup'
import { Screen } from '../components/ui/screen'
import { useAuth } from '../state/auth'
import { useAppState, useTheme } from '../state/app-state'
import { radius, type } from '../theme/tokens'

const pages = [
  {
    title: 'Your collections, your story.',
    body: 'Show books, miniatures, antiques, and everything else you collect. Give every collection a cabinet and a story.',
    image: require('../../assets/onboarding/collections-story.jpg'),
  },
  {
    title: 'Meet fellow collectors.',
    body: 'Discover cabinets, follow collectors, and connect over the objects, eras, and makers you care about.',
    image: require('../../assets/onboarding/collector-community.jpg'),
  },
  {
    title: 'Build your collector identity.',
    body: 'Build a profile around your collection. Join first with a Solana wallet, or continue with email.',
    image: require('../../assets/onboarding/collector-identity.jpg'),
  },
]

export default function OnboardingScreen() {
  const { colors } = useTheme()
  const { isAuthenticated } = useAuth()
  const { completeOnboarding, onboardingComplete } = useAppState()
  const router = useRouter()
  const { preview } = useLocalSearchParams<{ preview?: string }>()
  const replay = preview === '1' && onboardingComplete
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const last = index === pages.length - 1
  const scrollRef = useRef<ScrollView>(null)
  const [pageWidth, setPageWidth] = useState(0)
  const currentIndex = useRef(0)

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: pageWidth * currentIndex.current, animated: false })
  }, [pageWidth])

  function finish() {
    if (replay && isAuthenticated) {
      if (router.canGoBack()) router.back()
      else router.replace('/settings')
      return
    }
    if (!replay) completeOnboarding()
    router.replace('/welcome')
  }

  function goToPage(nextIndex: number) {
    if (last) {
      finish()
      return
    }
    currentIndex.current = nextIndex
    setIndex(nextIndex)
    scrollRef.current?.scrollTo({ x: pageWidth * nextIndex, animated: true })
  }

  function updateIndex(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!pageWidth) return
    const nextIndex = Math.max(0, Math.min(pages.length - 1, Math.round(event.nativeEvent.contentOffset.x / pageWidth)))
    currentIndex.current = nextIndex
    setIndex(nextIndex)
  }

  return (
    <Screen padded={false}>
      <View className="flex-1 px-5">
        <View className="flex-row items-center justify-between pt-2">
          <SeekaseLockup width={128} />
          <Pressable accessibilityRole="button" onPress={finish} hitSlop={10}>
            <Text className="text-sm font-medium" style={{ color: colors.muted }}>
              {replay && isAuthenticated ? 'Close' : 'Skip'}
            </Text>
          </Pressable>
        </View>

        <View className="mt-6 flex-1" onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}>
          {pageWidth ? (
            <ScrollView
              ref={scrollRef}
              horizontal
              style={{ flex: 1 }}
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={updateIndex}
            >
              {pages.map((page) => (
                <ScrollView
                  key={page.title}
                  style={{ width: pageWidth, flexShrink: 0 }}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <View
                    className="overflow-hidden"
                    style={{ height: Math.min(pageWidth * 0.85, height * 0.36, 280), borderRadius: radius.xl }}
                  >
                    <Image source={page.image} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                  </View>
                  <Text className="mt-8" style={{ ...type.title, color: colors.ink }}>
                    {page.title}
                  </Text>
                  <Text className="mt-3" style={{ ...type.body, color: colors.muted }}>
                    {page.body}
                  </Text>
                </ScrollView>
              ))}
            </ScrollView>
          ) : null}
        </View>

        <View
          accessible
          accessibilityLabel={`Introduction, page ${index + 1} of ${pages.length}`}
          style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 18 }}
        >
          {pages.map((_, pageIndex) => (
            <View
              key={pageIndex}
              style={{
                width: pageIndex === index ? 16 : 6,
                height: 6,
                borderRadius: 6,
                backgroundColor: pageIndex === index ? colors.ink : colors.line,
              }}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!pageWidth}
          onPress={() => goToPage(index + 1)}
          className="items-center py-3.5"
          style={{
            backgroundColor: colors.accent,
            borderRadius: radius.pill,
            marginBottom: Math.max(insets.bottom, 16),
          }}
        >
          <Text className="text-sm font-medium" style={{ color: colors.onAccent }}>
            {last ? (replay && isAuthenticated ? 'Done' : 'Get started') : 'Next'}
          </Text>
        </Pressable>
      </View>
    </Screen>
  )
}
