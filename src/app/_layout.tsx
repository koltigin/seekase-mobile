import '../global.css'

import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import {
  AppIdentity,
  createSolanaDevnet,
  createSolanaLocalnet,
  createSolanaMainnet,
  MobileWalletProvider,
} from '@wallet-ui/react-native-kit'
import { AuthGate } from '../components/navigation/auth-gate'
import { NetworkProvider } from '../features/network/network-provider'
import { AppStateProvider, useTheme } from '../state/app-state'
import { AuthProvider } from '../state/auth'
import { WalletIdentityProvider } from '../state/wallet-identity'
import { SEEKASE_SOLANA_NETWORK, SEEKASE_SOLANA_RPC_URL } from '../data/solana-network'

// Localnet: run `npx solana-mobile localnet` to start it and forward it to the device.
const networks =
  SEEKASE_SOLANA_NETWORK === 'mainnet'
    ? [createSolanaMainnet({ url: SEEKASE_SOLANA_RPC_URL })]
    : [createSolanaDevnet(), createSolanaLocalnet({ url: 'http://localhost:8899' })]
const identity: AppIdentity = {
  name: 'Seekase',
  uri: 'https://seekase.app',
  icon: 'assets/mark.svg',
}
const queryClient = new QueryClient()

function ThemedStack() {
  const { colors, resolvedScheme } = useTheme()

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background)
  }, [colors.background])

  return (
    <>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      <AuthGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
          }}
        />
      </AuthGate>
    </>
  )
}

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <AuthProvider>
          <NetworkProvider
            networks={networks}
            render={({ selectedNetwork }) => (
              <MobileWalletProvider cluster={selectedNetwork} identity={identity}>
                <WalletIdentityProvider>
                  <ThemedStack />
                </WalletIdentityProvider>
              </MobileWalletProvider>
            )}
          />
        </AuthProvider>
      </AppStateProvider>
    </QueryClientProvider>
  )
}
