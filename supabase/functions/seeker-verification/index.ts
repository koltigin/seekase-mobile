import { createClient } from '@supabase/supabase-js'
// @ts-expect-error Deno Edge Functions require explicit local TypeScript extensions.
import { isOfficialSgtMintAccount, token2022Program } from './token2022.ts'

declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (request: Request) => Response | Promise<Response>): void
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const base58Alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const encoder = new TextEncoder()

type VerificationStatus = 'unknown' | 'verified' | 'not_verified'

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function buffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function hex(bytes: Uint8Array) {
  return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('')
}

function validAddress(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 32 || value.length > 44) return false
  if ([...value].some((character) => !base58Alphabet.includes(character))) return false

  let numeric = 0n
  for (const character of value) numeric = numeric * 58n + BigInt(base58Alphabet.indexOf(character))
  let byteLength = 0
  while (numeric > 0n) {
    numeric >>= 8n
    byteLength += 1
  }
  let leadingZeroes = 0
  while (value[leadingZeroes] === '1') leadingZeroes += 1
  return byteLength + leadingZeroes === 32
}

async function privateHash(value: string, pepper: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    buffer(encoder.encode(pepper)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, buffer(encoder.encode(value)))))
}

type HeliusTokenAccount = {
  account?: {
    data?: {
      parsed?: {
        info?: { mint?: string; tokenAmount?: { amount?: string } }
      }
    }
  }
}

async function nonZeroToken2022Mints(rpcUrl: string, walletAddress: string) {
  const mints = new Set<string>()
  let paginationKey: string | undefined
  let pageCount = 0

  do {
    pageCount += 1
    if (pageCount > 20) throw new Error('Token account pagination limit exceeded.')
    const rpcResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `seekase-sgt-${pageCount}`,
        method: 'getTokenAccountsByOwnerV2',
        params: [
          walletAddress,
          { programId: token2022Program },
          {
            encoding: 'jsonParsed',
            limit: 1000,
            ...(paginationKey ? { paginationKey } : {}),
          },
        ],
      }),
    })
    if (!rpcResponse.ok) throw new Error(`SGT RPC request failed with ${rpcResponse.status}.`)
    const payload = await rpcResponse.json()
    if (payload.error) throw new Error('SGT RPC returned an error.')
    const page = Array.isArray(payload.result?.value)
      ? { accounts: payload.result.value, paginationKey: payload.result.paginationKey }
      : (payload.result?.value ?? {})
    for (const tokenAccount of (page.accounts ?? []) as HeliusTokenAccount[]) {
      const info = tokenAccount.account?.data?.parsed?.info
      if (typeof info?.mint === 'string' && info.tokenAmount?.amount !== '0') mints.add(info.mint)
    }
    paginationKey = typeof page.paginationKey === 'string' ? page.paginationKey : undefined
  } while (paginationKey)

  return [...mints]
}

async function findSgtMint(rpcUrl: string, walletAddress: string) {
  const mintAddresses = await nonZeroToken2022Mints(rpcUrl, walletAddress)
  const batchSize = 100

  for (let index = 0; index < mintAddresses.length; index += batchSize) {
    const batch = mintAddresses.slice(index, index + batchSize)
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `seekase-sgt-mints-${index / batchSize + 1}`,
        method: 'getMultipleAccounts',
        params: [batch, { encoding: 'base64' }],
      }),
    })
    if (!response.ok) throw new Error(`SGT mint request failed with ${response.status}.`)
    const payload = await response.json()
    if (payload.error || !Array.isArray(payload.result?.value)) {
      throw new Error('SGT mint RPC returned an error.')
    }
    for (let accountIndex = 0; accountIndex < batch.length; accountIndex += 1) {
      const account = payload.result.value[accountIndex]
      const encodedData = Array.isArray(account?.data) ? account.data[0] : null
      if (
        typeof account?.owner === 'string' &&
        typeof encodedData === 'string' &&
        isOfficialSgtMintAccount(account.owner, encodedData, batch[accountIndex])
      ) {
        return batch[accountIndex]
      }
    }
  }
  return null
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const pepper = Deno.env.get('WALLET_AUTH_PEPPER')
  const heliusApiKey = Deno.env.get('HELIUS_API_KEY')
  if (!supabaseUrl || !serviceRole || !pepper || pepper.length < 32) {
    return json(503, { error: 'Seeker verification is not configured.' })
  }

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/iu, '')
    if (!token) return json(401, { error: 'Sign in to check Seeker eligibility.' })
    const current = await admin.auth.getUser(token)
    const user = current.data.user
    if (current.error || !user || user.is_anonymous) {
      return json(401, { error: 'Sign in to check Seeker eligibility.' })
    }
    const readStoredStatus = async () => {
      const result = await admin
        .from('seeker_verifications')
        .select('status,checked_at,expires_at')
        .eq('user_id', user.id)
        .maybeSingle()
      if (result.error) throw result.error
      if (!result.data || Date.parse(result.data.expires_at) <= Date.now()) {
        return { status: 'unknown' as VerificationStatus, checkedAt: null, expiresAt: null }
      }
      return {
        status: result.data.status as VerificationStatus,
        checkedAt: result.data.checked_at as string,
        expiresAt: result.data.expires_at as string,
      }
    }
    const body = await request.json()

    if (body.action === 'status') return json(200, await readStoredStatus())
    if (body.action !== 'verify' || !validAddress(body.address)) {
      return json(400, { error: 'A valid connected Solana wallet is required.' })
    }
    if (!heliusApiKey) return json(503, { error: 'Seeker verification is not available yet.' })

    const walletLookupHash = await privateHash(body.address, pepper)
    const linked = await admin
      .from('wallet_identities')
      .select('user_id')
      .eq('wallet_lookup_hash', walletLookupHash)
      .eq('user_id', user.id)
      .maybeSingle()
    if (linked.error) throw linked.error
    if (!linked.data) return json(403, { error: 'Connect and verify this wallet with your Seekase account first.' })

    const existing = await readStoredStatus()
    if (existing.checkedAt && Date.now() - Date.parse(existing.checkedAt) < 60_000) {
      return json(200, existing)
    }

    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(heliusApiKey)}`
    const sgtMint = await findSgtMint(rpcUrl, body.address)
    const checkedAt = new Date()
    const expiresAt = new Date(checkedAt.getTime() + 24 * 60 * 60 * 1000)
    const mintLookupHash = sgtMint ? await privateHash(`seeker-genesis:${sgtMint}`, pepper) : null
    const applied = await admin.rpc('apply_seeker_verification', {
      expected_user_id: user.id,
      expected_wallet_lookup_hash: walletLookupHash,
      verified_mint_lookup_hash: mintLookupHash,
      verification_checked_at: checkedAt.toISOString(),
      verification_expires_at: expiresAt.toISOString(),
    })
    if (applied.error) throw applied.error

    return json(200, {
      status: sgtMint ? 'verified' : 'not_verified',
      checkedAt: checkedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('seeker-verification', error instanceof Error ? error.message : 'Unknown error')
    return json(502, { error: 'Seeker verification could not be completed. Please try again.' })
  }
})
