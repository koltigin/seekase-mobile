import Svg, { Circle, Line, Path, Rect } from 'react-native-svg'
import type { SocialProvider } from '../../data/social'

type Props = {
  color: string
  provider: SocialProvider
  size?: number
}

export function SocialProviderIcon({ color, provider, size = 18 }: Props) {
  const common = { fill: 'none', stroke: color, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  if (provider === 'instagram') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
        <Rect x="3" y="3" width="18" height="18" rx="5" strokeWidth="1.8" {...common} />
        <Circle cx="12" cy="12" r="4.1" strokeWidth="1.8" {...common} />
        <Circle cx="17.4" cy="6.7" r="1" fill={color} />
      </Svg>
    )
  }

  if (provider === 'youtube') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
        <Path
          d="M21 8.1a3 3 0 0 0-2.1-2.2C17 5.4 12 5.4 12 5.4s-5 0-6.9.5A3 3 0 0 0 3 8.1 31 31 0 0 0 2.6 12 31 31 0 0 0 3 15.9a3 3 0 0 0 2.1 2.2c1.9.5 6.9.5 6.9.5s5 0 6.9-.5a3 3 0 0 0 2.1-2.2 31 31 0 0 0 .4-3.9 31 31 0 0 0-.4-3.9Z"
          strokeWidth="1.7"
          {...common}
        />
        <Path d="m10 9 5 3-5 3Z" fill={color} stroke="none" />
      </Svg>
    )
  }

  if (provider === 'tiktok') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
        <Path d="M14.2 4v10.3a4.4 4.4 0 1 1-3.3-4.3" strokeWidth="2" {...common} />
        <Path d="M14.2 4c.6 2.6 2.2 4 4.8 4.3" strokeWidth="2" {...common} />
      </Svg>
    )
  }

  if (provider === 'x') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
        <Path d="M5 4.5 18.8 19.5M19 4.5 5.2 19.5" strokeWidth="1.9" {...common} />
      </Svg>
    )
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Circle cx="12" cy="12" r="9" strokeWidth="1.7" {...common} />
      <Path
        d="M3.5 12h17M12 3c2.4 2.5 3.7 5.5 3.7 9S14.4 18.5 12 21M12 3c-2.4 2.5-3.7 5.5-3.7 9s1.3 6.5 3.7 9"
        strokeWidth="1.5"
        {...common}
      />
      <Line x1="5.2" y1="7.7" x2="18.8" y2="7.7" strokeWidth="1.3" {...common} />
      <Line x1="5.2" y1="16.3" x2="18.8" y2="16.3" strokeWidth="1.3" {...common} />
    </Svg>
  )
}
