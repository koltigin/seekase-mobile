import { View } from 'react-native'

type IconProps = {
  color: string
  size?: number
}

export function IconSearch({ color, size = 20 }: IconProps) {
  const ring = size * 0.52
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          width: ring,
          height: ring,
          borderRadius: ring,
          borderWidth: 1.7,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.34,
          height: 1.7,
          backgroundColor: color,
          right: 2,
          bottom: 3,
          borderRadius: 1,
          transform: [{ rotate: '42deg' }],
        }}
      />
    </View>
  )
}

export function IconBell({ color, size = 20 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        style={{
          width: size * 0.52,
          height: size * 0.5,
          borderTopLeftRadius: size,
          borderTopRightRadius: size,
          borderWidth: 1.6,
          borderBottomWidth: 0,
          borderColor: color,
          marginBottom: 3,
        }}
      />
      <View style={{ width: size * 0.64, height: 1.6, backgroundColor: color, borderRadius: 1 }} />
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 4,
          borderWidth: 1.4,
          borderColor: color,
          marginTop: 2,
        }}
      />
    </View>
  )
}

export function IconDots({ color, size = 20 }: IconProps) {
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      {[0, 1, 2].map((index) => (
        <View key={index} style={{ width: 3.2, height: 3.2, borderRadius: 3, backgroundColor: color }} />
      ))}
    </View>
  )
}

export function IconHeart({ color, size = 18, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.62,
          height: size * 0.56,
          borderRadius: 3,
          borderWidth: 1.5,
          borderColor: color,
          backgroundColor: filled ? color : 'transparent',
          transform: [{ rotate: '45deg' }],
          marginTop: 2,
        }}
      />
    </View>
  )
}

export function IconBookmark({ color, size = 18, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.48,
          height: size * 0.68,
          borderWidth: 1.5,
          borderColor: color,
          backgroundColor: filled ? color : 'transparent',
          borderBottomWidth: 0,
        }}
      />
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.24,
          borderRightWidth: size * 0.24,
          borderTopWidth: size * 0.2,
          borderLeftColor: filled ? color : 'transparent',
          borderRightColor: filled ? color : 'transparent',
          borderTopColor: filled ? color : color,
          marginTop: -1,
        }}
      />
    </View>
  )
}

export function IconCompass({ color, size = 22 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 45, 90, 135].map((angle) => (
        <View
          key={angle}
          style={{
            position: 'absolute',
            width: size * 0.84,
            height: 1.7,
            borderRadius: 1,
            backgroundColor: color,
            transform: [{ rotate: `${angle}deg` }],
          }}
        />
      ))}
      <View style={{ width: size * 0.22, height: size * 0.22, borderRadius: size, backgroundColor: color }} />
    </View>
  )
}

export function IconGrid({ color, size = 22 }: IconProps) {
  const cell = size * 0.3
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', gap: size * 0.14, alignContent: 'center', justifyContent: 'center' }}>
      {[0, 1, 2, 3].map((index) => (
        <View key={index} style={{ width: cell, height: cell, borderRadius: 2, borderWidth: 1.5, borderColor: color }} />
      ))}
    </View>
  )
}

export function IconPlus({ color, size = 22 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size * 0.58, height: 1.8, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', width: 1.8, height: size * 0.58, backgroundColor: color, borderRadius: 1 }} />
    </View>
  )
}

export function IconPulse({ color, size = 22 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size * 0.82, height: 1.5, backgroundColor: color, position: 'absolute' }} />
      <View
        style={{
          width: size * 0.2,
          height: size * 0.4,
          borderLeftWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: color,
          transform: [{ skewX: '-18deg' }],
        }}
      />
    </View>
  )
}

export function IconCamera({ color, size = 22 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.78,
          height: size * 0.52,
          borderRadius: 4,
          borderWidth: 1.5,
          borderColor: color,
          marginTop: 3,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 2,
          width: size * 0.28,
          height: size * 0.16,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          borderWidth: 1.5,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
    </View>
  )
}

export function IconPerson({ color, size = 22 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        style={{
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: size,
          borderWidth: 1.5,
          borderColor: color,
          marginBottom: 2,
        }}
      />
      <View
        style={{
          width: size * 0.58,
          height: size * 0.28,
          borderTopLeftRadius: size,
          borderTopRightRadius: size,
          borderWidth: 1.5,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
    </View>
  )
}

export function IconShare({ color, size = 18 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: size,
          borderWidth: 1.5,
          borderColor: color,
          position: 'absolute',
          top: 1,
          right: 1,
        }}
      />
      <View
        style={{
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: size,
          borderWidth: 1.5,
          borderColor: color,
          position: 'absolute',
          bottom: 1,
          left: 1,
        }}
      />
      <View
        style={{
          width: size * 0.42,
          height: 1.5,
          backgroundColor: color,
          transform: [{ rotate: '-35deg' }],
        }}
      />
    </View>
  )
}

export function IconComment({ color, size = 18 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.72,
          height: size * 0.52,
          borderRadius: 5,
          borderWidth: 1.5,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 1,
          left: size * 0.22,
          width: size * 0.22,
          height: size * 0.22,
          borderLeftWidth: 1.5,
          borderBottomWidth: 1.5,
          borderColor: color,
          transform: [{ rotate: '-40deg' }],
        }}
      />
    </View>
  )
}

export function IconBack({ color, size = 20 }: IconProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.42,
          height: size * 0.42,
          borderLeftWidth: 1.8,
          borderBottomWidth: 1.8,
          borderColor: color,
          transform: [{ rotate: '45deg' }, { translateX: 2 }],
        }}
      />
    </View>
  )
}
