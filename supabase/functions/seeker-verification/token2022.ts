export const token2022Program = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
export const sgtAddress = 'GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te'

const base58Alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const mintAccountType = 1
const mintBaseLength = 82
const tlvStart = 166
const metadataPointerType = 18
const tokenGroupMemberType = 23

export function decodeBase58(value: string) {
  let numeric = 0n
  for (const character of value) {
    const digit = base58Alphabet.indexOf(character)
    if (digit < 0) return null
    numeric = numeric * 58n + BigInt(digit)
  }

  const reversed: number[] = []
  while (numeric > 0n) {
    reversed.push(Number(numeric & 255n))
    numeric >>= 8n
  }
  const leadingZeroes = [...value].findIndex((character) => character !== '1')
  const zeroCount = leadingZeroes < 0 ? value.length : leadingZeroes
  const decoded = new Uint8Array(zeroCount + reversed.length)
  decoded.set(reversed.reverse(), zeroCount)
  return decoded
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

function extension(data: Uint8Array, wantedType: number) {
  let offset = tlvStart
  while (offset + 4 <= data.length) {
    const type = data[offset] | (data[offset + 1] << 8)
    if (type === 0) return null
    const length = data[offset + 2] | (data[offset + 3] << 8)
    const valueStart = offset + 4
    const valueEnd = valueStart + length
    if (valueEnd > data.length) return null
    if (type === wantedType) return data.subarray(valueStart, valueEnd)
    offset = valueEnd
  }
  return null
}

function decodeBase64(value: string) {
  try {
    const binary = atob(value)
    return Uint8Array.from(binary, (character) => character.charCodeAt(0))
  } catch {
    return null
  }
}

/**
 * Minimal read-only decoder for the two Token-2022 mint extensions required by
 * the official SGT verification recipe. It intentionally cannot create or
 * mutate tokens.
 */
export function isOfficialSgtMintAccount(owner: string, encodedData: string, mintAddress: string) {
  if (owner !== token2022Program) return false
  const data = decodeBase64(encodedData)
  const official = decodeBase58(sgtAddress)
  const mint = decodeBase58(mintAddress)
  if (!data || !official || !mint || official.length !== 32 || mint.length !== 32) return false
  if (data.length < tlvStart || data[45] !== 1 || data[165] !== mintAccountType) return false
  if (data.subarray(mintBaseLength, 165).some((value) => value !== 0)) return false

  const metadataPointer = extension(data, metadataPointerType)
  const groupMember = extension(data, tokenGroupMemberType)
  if (!metadataPointer || metadataPointer.length < 64 || !groupMember || groupMember.length < 72) {
    return false
  }

  return (
    equalBytes(metadataPointer.subarray(32, 64), official) &&
    equalBytes(groupMember.subarray(0, 32), mint) &&
    equalBytes(groupMember.subarray(32, 64), official)
  )
}
