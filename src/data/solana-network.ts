export type SeekaseSolanaNetwork = 'devnet' | 'mainnet'

export function resolveSolanaNetwork(value: string | undefined): SeekaseSolanaNetwork {
  return value?.trim().toLowerCase() === 'mainnet' ? 'mainnet' : 'devnet'
}

export const SEEKASE_SOLANA_NETWORK = resolveSolanaNetwork(process.env.EXPO_PUBLIC_SOLANA_NETWORK)
export const SEEKASE_SOLANA_CHAIN = SEEKASE_SOLANA_NETWORK === 'mainnet' ? 'solana:mainnet' : 'solana:devnet'
export const SEEKASE_SOLANA_NETWORK_LABEL = SEEKASE_SOLANA_NETWORK === 'mainnet' ? 'Mainnet' : 'Devnet'
export const SEEKASE_SOLANA_RPC_URL =
  SEEKASE_SOLANA_NETWORK === 'mainnet'
    ? (process.env.EXPO_PUBLIC_SOLANA_MAINNET_RPC_URL ?? 'https://api.mainnet.solana.com')
    : 'https://api.devnet.solana.com'
