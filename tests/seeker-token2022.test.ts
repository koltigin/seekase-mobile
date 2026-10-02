import { describe, expect, it } from 'vitest'

import {
  decodeBase58,
  isOfficialSgtMintAccount,
  sgtAddress,
  token2022Program,
} from '../supabase/functions/seeker-verification/token2022'

function base64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
}

function writeExtension(target: Uint8Array, offset: number, type: number, value: Uint8Array) {
  target[offset] = type & 255
  target[offset + 1] = type >> 8
  target[offset + 2] = value.length & 255
  target[offset + 3] = value.length >> 8
  target.set(value, offset + 4)
  return offset + 4 + value.length
}

function officialMintFixture() {
  const official = decodeBase58(sgtAddress)!
  const data = new Uint8Array(166 + 4 + 64 + 4 + 72)
  data[45] = 1
  data[165] = 1

  const metadataPointer = new Uint8Array(64)
  metadataPointer.set(official, 32)
  let offset = writeExtension(data, 166, 18, metadataPointer)

  const groupMember = new Uint8Array(72)
  groupMember.set(official, 0)
  groupMember.set(official, 32)
  offset = writeExtension(data, offset, 23, groupMember)
  expect(offset).toBe(data.length)
  return data
}

describe('minimal Token-2022 SGT decoder', () => {
  it('requires the official metadata pointer, group, and member mint', () => {
    expect(isOfficialSgtMintAccount(token2022Program, base64(officialMintFixture()), sgtAddress)).toBe(true)
  })

  it('rejects a spoofed group and the wrong token program', () => {
    const spoofed = officialMintFixture()
    spoofed[166 + 4 + 64 + 4 + 32] ^= 1

    expect(isOfficialSgtMintAccount(token2022Program, base64(spoofed), sgtAddress)).toBe(false)
    expect(
      isOfficialSgtMintAccount('11111111111111111111111111111111', base64(officialMintFixture()), sgtAddress),
    ).toBe(false)
  })

  it('rejects malformed extension lengths', () => {
    const malformed = officialMintFixture()
    malformed[166 + 2] = 255
    malformed[166 + 3] = 255

    expect(isOfficialSgtMintAccount(token2022Program, base64(malformed), sgtAddress)).toBe(false)
  })
})
