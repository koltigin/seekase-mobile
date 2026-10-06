import Svg, { G, Path, Rect } from 'react-native-svg'
import { useTheme } from '../../state/app-state'

/** Canonical Seekase mark + wordmark from assets/brand/seekase-lockup-*.svg. */
export function SeekaseLockup({ width = 148 }: { width?: number }) {
  const { colors } = useTheme()
  const height = (width * 180) / 740

  return (
    <Svg accessibilityLabel="Seekase" width={width} height={height} viewBox="0 0 740 180">
      <G
        transform="translate(8 21) scale(1.25)"
        fill="none"
        stroke={colors.ink}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path
          d="M82 27H43C32 27 27 31 27 38C27 45 34 48 43 52L69 64C77 68 81 72 81 78C81 85 75 88 66 88H28"
          strokeWidth={13}
        />
        <Path d="M45 39V75M47 56L66 39M47 56L68 75" strokeWidth={9} />
      </G>
      <Rect x={94.25} y={104.75} width={8.75} height={8.75} rx={1.75} fill={colors.like} />
      <G
        transform="translate(138 10)"
        fill="none"
        stroke={colors.ink}
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M76 46C66 30 31 31 31 52C31 76 77 65 77 94C77 119 42 124 27 104" />
        <Path d="M101 84H153C153 61 105 59 101 88C98 116 137 123 154 104" />
        <Path d="M177 84H229C229 61 181 59 177 88C174 116 213 123 230 104" />
        <Path d="M258 34V116M260 92L293 65M260 92L296 116" />
        <Path d="M364 76C349 58 312 64 312 91C312 119 349 124 364 104M365 66V116" />
        <Path d="M436 71C423 60 391 62 391 78C391 96 436 85 436 104C436 120 405 122 391 111" />
        <Path d="M463 84H515C515 61 467 59 463 88C460 116 499 123 516 104" />
      </G>
      <Rect x={421} y={77} width={10} height={10} rx={2} fill={colors.like} />
    </Svg>
  )
}
