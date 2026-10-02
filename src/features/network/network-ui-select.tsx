import { Pressable, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { useNetwork } from './use-network'

// A segmented control for switching between the configured networks.
export function NetworkUiSelect() {
  const { networks, selectedNetwork, setSelectedNetwork } = useNetwork()

  return (
    <View className="flex-row rounded-full p-1" style={{ backgroundColor: colors.chip }}>
      {networks.map((network) => {
        const isSelected = network.id === selectedNetwork.id
        return (
          <Pressable
            key={network.id}
            onPress={() => setSelectedNetwork(network)}
            className="rounded-full px-5 py-2"
            style={{ backgroundColor: isSelected ? colors.surface : 'transparent' }}
          >
            <Text className="text-sm font-semibold" style={{ color: isSelected ? colors.ink : colors.muted }}>
              {network.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
