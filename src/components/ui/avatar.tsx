import { Text, View } from 'react-native'
import type { Collector } from '../../data/types'

export function Avatar({ collector, size = 40 }: { collector?: Collector; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: collector?.avatarColor ?? '#3D3228',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FBF8F2', fontSize: size * 0.34, fontWeight: '600' }}>
        {collector?.avatarInitials ?? '?'}
      </Text>
    </View>
  )
}
