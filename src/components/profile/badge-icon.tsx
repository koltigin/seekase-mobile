import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import badgeIconPaths from '../../../assets/brand/badge-icon-paths.json'
import type { BadgeFamily } from '../../data/badges'
import { useTheme } from '../../state/app-state'

type BadgeIconId = keyof typeof badgeIconPaths

const familyFallback: Record<BadgeFamily, BadgeIconId> = {
  wallet: 'wallet-verified',
  seeker: 'seeker-genesis',
  milestone: 'first-collection',
  streak: 'streak-7',
}

function isBadgeIconId(id?: string): id is BadgeIconId {
  return Boolean(id && id in badgeIconPaths)
}

export function BadgeIcon({ id, family, size = 24 }: { id?: string; family: BadgeFamily; size?: number }) {
  const { colors } = useTheme()
  const iconId = isBadgeIconId(id) ? id : familyFallback[family]
  const paths = badgeIconPaths[iconId]

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d={paths.primary} stroke={colors.ink} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        {'accent' in paths && paths.accent ? <Path d={paths.accent} fill={colors.like} /> : null}
      </Svg>
    </View>
  )
}
