import { describe, expect, it } from 'vitest'
import { resolveSolanaNetwork } from '../src/data/solana-network'

describe('Solana network configuration', () => {
  it('keeps development builds on Devnet by default', () => {
    expect(resolveSolanaNetwork(undefined)).toBe('devnet')
    expect(resolveSolanaNetwork('unexpected')).toBe('devnet')
  })

  it('enables Mainnet only through the explicit release value', () => {
    expect(resolveSolanaNetwork('mainnet')).toBe('mainnet')
    expect(resolveSolanaNetwork(' MAINNET ')).toBe('mainnet')
  })
})
