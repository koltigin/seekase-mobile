// @ts-expect-error Supabase Edge Runtime resolves Deno npm specifiers during deployment.
// eslint-disable-next-line import/no-unresolved
import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (request: Request) => Response | Promise<Response>): void
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
}
const memoProgram = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
const signaturePattern = /^[1-9A-HJ-NP-Za-km-z]{80,90}$/u
const walletAddressPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/u
const enc = new TextEncoder()
const dec = new TextDecoder('utf-8', { fatal: true })
type CheckInNetwork = 'devnet' | 'mainnet'

function checkInNetwork(value: string | undefined): CheckInNetwork | null {
  if (!value || value === 'devnet') return 'devnet'
  if (value === 'mainnet') return 'mainnet'
  return null
}

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

function buffer(bytes: Uint8Array) {
  return bytes.slice().buffer as ArrayBuffer
}

function hex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function fromBase58(value: string) {
  if (!value || [...value].some((character) => !alphabet.includes(character))) throw new Error('Invalid base58.')
  let numeric = 0n
  for (const character of value) numeric = numeric * 58n + BigInt(alphabet.indexOf(character))
  const decoded: number[] = []
  while (numeric > 0n) {
    decoded.push(Number(numeric & 255n))
    numeric >>= 8n
  }
  decoded.reverse()
  let leadingZeroes = 0
  while (value[leadingZeroes] === '1') leadingZeroes += 1
  return Uint8Array.from([...new Array(leadingZeroes).fill(0), ...decoded])
}

async function walletHash(address: string, pepper: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    buffer(enc.encode(pepper)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, buffer(enc.encode(address)))))
}

function utcDay(timestamp = Date.now()) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function deriveStatus(days: string[], today: string) {
  const ordered = [...new Set(days)].sort().reverse()
  const toDay = (value: string) => Math.floor(Date.parse(`${value}T00:00:00.000Z`) / 86_400_000)
  const numbers = ordered.map(toDay).filter(Number.isFinite)
  if (!numbers.length) {
    return { checkedInToday: false, currentStreak: 0, longestStreak: 0, totalCheckIns: 0, lastCheckInDay: null }
  }
  let run = 1
  let longestStreak = 1
  for (let index = 1; index < numbers.length; index += 1) {
    if (numbers[index - 1] - numbers[index] === 1) {
      run += 1
      longestStreak = Math.max(longestStreak, run)
    } else run = 1
  }
  const todayNumber = toDay(today)
  let currentStreak = 0
  if (numbers[0] === todayNumber || numbers[0] === todayNumber - 1) {
    currentStreak = 1
    for (let index = 1; index < numbers.length; index += 1) {
      if (numbers[index - 1] - numbers[index] !== 1) break
      currentStreak += 1
    }
  }
  return {
    checkedInToday: ordered[0] === today,
    currentStreak,
    longestStreak,
    totalCheckIns: ordered.length,
    lastCheckInDay: ordered[0],
  }
}

async function rpcTransaction(rpcUrl: string, transactionSignature: string) {
  // A wallet can report confirmation before an RPC's transaction-history index
  // exposes the transaction. Retry the read so a valid check-in is not lost to
  // normal Mainnet indexing delay.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const rpcResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [transactionSignature, { commitment: 'confirmed', encoding: 'json', maxSupportedTransactionVersion: 0 }],
      }),
    })
    if (!rpcResponse.ok) {
      if (attempt === 7) throw new Error(`Solana RPC request failed with HTTP ${rpcResponse.status}.`)
    } else {
      const payload = await rpcResponse.json()
      if (payload.error) {
        if (attempt === 7) throw new Error(`Solana RPC rejected the transaction lookup: ${payload.error.code ?? 'unknown'}.`)
      } else if (payload.result) return payload.result
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000))
  }
  return null
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return response(405, { error: 'Method not allowed.' })

  const url = Deno.env.get('SUPABASE_URL')
  const role = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const pepper = Deno.env.get('WALLET_AUTH_PEPPER')
  const network = checkInNetwork(Deno.env.get('CHECKIN_SOLANA_NETWORK'))
  const rpcUrl =
    Deno.env.get('CHECKIN_SOLANA_RPC_URL') ??
    (network === 'mainnet' ? 'https://api.mainnet.solana.com' : 'https://api.devnet.solana.com')
  if (!url || !role || !pepper || pepper.length < 32 || !network) {
    return response(503, { error: 'Daily check-in is not configured.' })
  }

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/iu, '')
  if (!token || token === role) return response(401, { error: 'Sign in to use daily check-in.' })
  const admin = createClient(url, role, { auth: { persistSession: false, autoRefreshToken: false } })

  try {
    const current = await admin.auth.getUser(token)
    if (current.error || !current.data.user || current.data.user.is_anonymous) {
      return response(401, { error: 'Sign in to use daily check-in.' })
    }
    const userId = current.data.user.id
    const body = await request.json()

    const status = async () => {
      const history = await admin
        .from('daily_check_ins')
        .select('checkin_day')
        .eq('user_id', userId)
        .order('checkin_day', { ascending: false })
      if (history.error) throw history.error
      return deriveStatus(
        history.data.map((entry: { checkin_day: string }) => entry.checkin_day),
        utcDay(),
      )
    }

    if (body.action === 'status') return response(200, await status())

    const identity = await admin.from('wallet_identities').select('wallet_lookup_hash').eq('user_id', userId)
    if (identity.error) throw identity.error
    if (!identity.data.length) return response(403, { error: 'Connect and verify a Solana wallet first.' })

    if (body.action === 'request') {
      if (typeof body.walletAddress !== 'string' || !walletAddressPattern.test(body.walletAddress)) {
        return response(400, { error: 'The connected wallet address is invalid.' })
      }
      const connectedWalletHash = await walletHash(body.walletAddress, pepper)
      if (!identity.data.some((entry: { wallet_lookup_hash: string }) => entry.wallet_lookup_hash === connectedWalletHash)) {
        return response(403, {
          error:
            'This wallet is not linked to the signed-in Seekase account. Sign in with this wallet or reconnect the linked wallet before checking in.',
        })
      }
      const currentStatus = await status()
      if (currentStatus.checkedInToday) return response(409, { error: 'Today’s check-in is already complete.' })
      const recent = await admin
        .from('daily_checkin_challenges')
        .select('request_id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 60_000).toISOString())
      if (recent.error) throw recent.error
      if ((recent.count ?? 0) >= 5) return response(429, { error: 'Too many check-in attempts. Please wait a minute.' })
      const requestId = crypto.randomUUID()
      const memo = `seekase:check-in:v1:${requestId}`
      // Mobile wallet approval may temporarily leave the app. Fifteen minutes
      // keeps that round trip practical while challenges remain single-use.
      const expiresAt = new Date(Date.now() + 900_000).toISOString()
      const inserted = await admin.from('daily_checkin_challenges').insert({
        request_id: requestId,
        user_id: userId,
        expected_memo: memo,
        expires_at: expiresAt,
      })
      if (inserted.error) throw inserted.error
      return response(200, { requestId, memo, network, expiresAt })
    }

    if (body.action !== 'confirm' || !uuid.test(body.requestId) || !signaturePattern.test(body.transactionSignature)) {
      return response(400, { error: 'Invalid check-in confirmation.' })
    }
    const challenge = await admin
      .from('daily_checkin_challenges')
      .select('expected_memo,expires_at,consumed_at,created_at')
      .eq('request_id', body.requestId)
      .eq('user_id', userId)
      .maybeSingle()
    if (challenge.error) throw challenge.error
    if (!challenge.data || challenge.data.consumed_at || Date.parse(challenge.data.expires_at) <= Date.now()) {
      return response(401, { error: 'This check-in request is invalid or expired.' })
    }
    const expectedMemo = challenge.data.expected_memo

    const transaction = await rpcTransaction(rpcUrl, body.transactionSignature)
    if (!transaction || transaction.meta?.err || typeof transaction.blockTime !== 'number') {
      return response(409, { error: `The ${network === 'mainnet' ? 'Mainnet' : 'Devnet'} transaction is not confirmed yet.` })
    }
    const blockTimeMs = transaction.blockTime * 1000
    if (
      blockTimeMs < Date.parse(challenge.data.created_at) - 30_000 ||
      blockTimeMs > Date.parse(challenge.data.expires_at) + 300_000
    ) {
      return response(401, { error: 'The transaction time does not match this check-in request.' })
    }

    const transactionMessage = transaction.transaction?.message
    const accountKeys = transactionMessage?.accountKeys
    const instructions = transactionMessage?.instructions
    const signerCount = transactionMessage?.header?.numRequiredSignatures
    if (!Array.isArray(accountKeys) || !Array.isArray(instructions) || typeof signerCount !== 'number') {
      return response(401, { error: 'The check-in transaction format is invalid.' })
    }
    const signerAddresses = accountKeys
      .slice(0, signerCount)
      .filter((entry: unknown): entry is string => typeof entry === 'string')
    const expectedHashes = new Set(
      identity.data.map((entry: { wallet_lookup_hash: string }) => entry.wallet_lookup_hash),
    )
    const signerHashes = await Promise.all(signerAddresses.map((signer) => walletHash(signer, pepper)))
    if (!signerHashes.some((hash) => expectedHashes.has(hash))) {
      return response(403, { error: 'This transaction was not signed by a wallet linked to your account.' })
    }

    const memoMatches = instructions.some((instruction: Record<string, unknown>) => {
      if (typeof instruction.programIdIndex !== 'number' || accountKeys[instruction.programIdIndex] !== memoProgram)
        return false
      if (typeof instruction.data !== 'string') return false
      try {
        return dec.decode(fromBase58(instruction.data)) === expectedMemo
      } catch {
        return false
      }
    })
    if (!memoMatches) return response(401, { error: 'The signed transaction does not contain this check-in request.' })

    const consumed = await admin.rpc('consume_daily_checkin_challenge', {
      challenge_request_id: body.requestId,
      expected_user_id: userId,
    })
    if (consumed.error) throw consumed.error
    if (!consumed.data) return response(409, { error: 'This check-in request was already used.' })

    const blockTime = new Date(blockTimeMs).toISOString()
    const inserted = await admin.from('daily_check_ins').insert({
      user_id: userId,
      checkin_day: utcDay(blockTimeMs),
      transaction_signature: body.transactionSignature,
      network: network === 'mainnet' ? 'mainnet-beta' : 'devnet',
      block_time: blockTime,
    })
    if (inserted.error && inserted.error.code !== '23505') throw inserted.error
    return response(200, { verified: true, status: await status() })
  } catch (error) {
    console.error('daily-checkin', error instanceof Error ? error.message : 'Unknown error')
    return response(400, { error: 'Daily check-in could not be verified.' })
  }
})
