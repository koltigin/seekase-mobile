import { createClient } from '@supabase/supabase-js'

declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (request: Request) => Response | Promise<Response>): void }

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info' }
const enc = new TextEncoder()
const dec = new TextDecoder('utf-8', { fatal: true })
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}
function hex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
function buffer(bytes: Uint8Array) { return bytes.slice().buffer as ArrayBuffer }
function fromBase64(value: string) {
  if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(value) || value.length % 4) throw new Error('Invalid base64.')
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}
function fromBase58(value: string) {
  if (!value || [...value].some((character) => !alphabet.includes(character))) throw new Error('Invalid address.')
  let numeric = 0n
  for (const character of value) numeric = numeric * 58n + BigInt(alphabet.indexOf(character))
  const decoded: number[] = []
  while (numeric > 0n) { decoded.push(Number(numeric & 255n)); numeric >>= 8n }
  decoded.reverse()
  let leadingZeroes = 0
  while (value[leadingZeroes] === '1') leadingZeroes += 1
  return Uint8Array.from([...new Array(leadingZeroes).fill(0), ...decoded])
}
async function sha256(value: Uint8Array | string) {
  const bytes = typeof value === 'string' ? enc.encode(value) : value
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer(bytes))))
}
async function walletHash(address: string, pepper: string) {
  const key = await crypto.subtle.importKey('raw', buffer(enc.encode(pepper)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, buffer(enc.encode(address)))))
}
function message(input: Record<string, string>) {
  let value = `${input.domain} wants you to sign in with your Solana account:\n${input.address}`
  if (input.statement) value += `\n\n${input.statement}`
  const fields: string[] = []
  for (const [label, field] of [['URI','uri'],['Version','version'],['Chain ID','chainId'],['Nonce','nonce'],['Issued At','issuedAt'],['Expiration Time','expirationTime'],['Request ID','requestId']]) {
    if (input[field]) fields.push(`${label}: ${input[field]}`)
  }
  if (fields.length) value += `\n\n${fields.join('\n')}`
  return value
}
function address(value: unknown) {
  if (typeof value !== 'string' || value.length < 32 || value.length > 44) throw new Error('Invalid address.')
  const key = fromBase58(value)
  if (key.length !== 32) throw new Error('Invalid address.')
  return { value, key }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return response(405, { error: 'Method not allowed.' })
  const url = Deno.env.get('SUPABASE_URL'), role = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const pepper = Deno.env.get('WALLET_AUTH_PEPPER'), domain = Deno.env.get('WALLET_AUTH_DOMAIN'), uri = Deno.env.get('WALLET_AUTH_URI')
  const solanaNetwork = Deno.env.get('WALLET_AUTH_SOLANA_NETWORK') ?? 'devnet'
  if (!url || !role || !pepper || pepper.length < 32 || !domain || !uri || !['devnet', 'mainnet'].includes(solanaNetwork)) return response(503, { error: 'Wallet authentication is not configured.' })
  const admin = createClient(url, role, { auth: { persistSession: false, autoRefreshToken: false } })
  try {
    const body = await request.json()
    if (body.action === 'status') {
      const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/iu, '')
      if (!token || token === role) return response(401, { error: 'Sign in to check wallet verification.' })
      const current = await admin.auth.getUser(token)
      if (current.error || !current.data.user) return response(401, { error: 'Sign in to check wallet verification.' })
      const identity = await admin
        .from('wallet_identities')
        .select('last_verified_at')
        .eq('user_id', current.data.user.id)
        .order('last_verified_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (identity.error) throw identity.error
      return response(200, {
        verified: Boolean(identity.data),
        verifiedAt: identity.data?.last_verified_at ?? null,
      })
    }
    const wallet = address(body.address)
    const lookup = await walletHash(wallet.value, pepper)
    if (body.action === 'challenge') {
      const intent = body.intent === 'link' ? 'link' : body.intent === 'signin' ? 'signin' : null
      if (!intent) return response(400, { error: 'Choose wallet sign-in or account linking.' })
      if (intent === 'link') {
        const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/iu, '')
        if (!token || token === role) return response(401, { error: 'Sign in to link a wallet.' })
        const current = await admin.auth.getUser(token)
        if (current.error || !current.data.user || current.data.user.is_anonymous) {
          return response(401, { error: 'Sign in to link a wallet.' })
        }
      }
      const recent = await admin.from('wallet_auth_challenges').select('request_id', { count: 'exact', head: true }).eq('wallet_lookup_hash', lookup).gte('created_at', new Date(Date.now() - 60_000).toISOString())
      if (recent.error) throw recent.error
      if ((recent.count ?? 0) >= 5) return response(429, { error: 'Too many wallet sign-in attempts. Please wait a minute.' })
      const issued = new Date(), expires = new Date(issued.getTime() + 300_000)
      // SIWS wallets require at least eight strictly alphanumeric nonce
      // characters. Hex keeps the nonce random while remaining compatible
      // with Seeker Wallet and other strict SIWS implementations.
      const payload: Record<string, string> = { domain, address: wallet.value, intent, statement: intent === 'link' ? 'Link this wallet to your open Seekase account. This does not send a transaction or spend SOL.' : 'Sign in to Seekase. This does not send a transaction or spend SOL.', uri, version: '1', chainId: solanaNetwork === 'mainnet' ? 'solana:mainnet' : 'solana:devnet', nonce: hex(crypto.getRandomValues(new Uint8Array(18))), issuedAt: issued.toISOString(), expirationTime: expires.toISOString(), requestId: crypto.randomUUID() }
      const { error } = await admin.from('wallet_auth_challenges').insert({ request_id: payload.requestId, wallet_lookup_hash: lookup, nonce_hash: await sha256(payload.nonce), signed_message_hash: await sha256(message(payload)), expected_fields: payload, expires_at: payload.expirationTime })
      if (error) throw error
      return response(200, { payload })
    }
    if (body.action !== 'verify' || !uuid.test(body.requestId)) return response(400, { error: 'Invalid request.' })
    if (body.signatureType && String(body.signatureType).toLowerCase() !== 'ed25519') return response(400, { error: 'Unsupported signature type.' })
    const signed = fromBase64(body.signedMessage), signature = fromBase64(body.signature), signedHash = await sha256(signed)
    const { data: challenge, error } = await admin.from('wallet_auth_challenges').select('expected_fields,expires_at,consumed_at,signed_message_hash').eq('request_id', body.requestId).eq('wallet_lookup_hash', lookup).maybeSingle()
    if (error) throw error
    if (!challenge || challenge.consumed_at || Date.parse(challenge.expires_at) <= Date.now()) return response(401, { error: 'This wallet sign-in request is invalid or expired.' })
    if (challenge.signed_message_hash !== signedHash || dec.decode(signed) !== message(challenge.expected_fields as Record<string, string>)) return response(401, { error: 'The signed message does not match this sign-in request.' })
    if (signature.length !== 64) return response(401, { error: 'Wallet signature verification failed.' })
    const publicKey = await crypto.subtle.importKey('raw', buffer(wallet.key), { name: 'Ed25519' }, false, ['verify'])
    if (!(await crypto.subtle.verify('Ed25519', publicKey, buffer(signature), buffer(signed)))) return response(401, { error: 'Wallet signature verification failed.' })
    const consumed = await admin.rpc('consume_wallet_auth_challenge', { challenge_request_id: body.requestId, expected_wallet_lookup_hash: lookup, expected_signed_message_hash: signedHash })
    if (consumed.error) throw consumed.error
    if (!consumed.data) return response(409, { error: 'This wallet sign-in request was already used.' })
    const found = await admin.from('wallet_identities').select('user_id').eq('wallet_lookup_hash', lookup).maybeSingle()
    if (found.error) throw found.error
    const intent = (challenge.expected_fields as Record<string, string>).intent
    if (intent !== 'signin' && intent !== 'link') return response(400, { error: 'Invalid wallet request intent.' })
    if (intent === 'link') {
      const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/iu, '')
      if (!token || token === role) return response(401, { error: 'Sign in to link a wallet.' })
      const current = await admin.auth.getUser(token)
      if (current.error || !current.data.user || current.data.user.is_anonymous) {
        return response(401, { error: 'Sign in to link a wallet.' })
      }
      if (found.data?.user_id && found.data.user_id !== current.data.user.id) {
        return response(409, {
          code: 'wallet_already_linked',
          error: 'This wallet belongs to another Seekase account. Sign in to that account before starting account recovery.',
        })
      }
      const linkedAt = new Date().toISOString()
      const linked = await admin.from('wallet_identities').upsert(
        { wallet_lookup_hash: lookup, user_id: current.data.user.id, last_verified_at: linkedAt },
        { onConflict: 'wallet_lookup_hash' },
      )
      if (linked.error) throw linked.error
      return response(200, { linked: true, verifiedAt: linkedAt })
    }
    let userId = found.data?.user_id as string | undefined
    let email: string | undefined
    if (userId) { const result = await admin.auth.admin.getUserById(userId); if (result.error) throw result.error; email = result.data.user.email }
    else {
      email = `wallet-${lookup}@auth.seekase.invalid`
      const safeHandle = `collector_${crypto.randomUUID().replaceAll('-', '').slice(0, 8)}`
      const created = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { auth_provider: 'solana', display_name: 'New Collector', handle: safeHandle },
      })
      if (created.error) throw created.error
      userId = created.data.user.id
    }
    if (!userId || !email) throw new Error('Could not resolve wallet account.')
    const linked = await admin.from('wallet_identities').upsert({ wallet_lookup_hash: lookup, user_id: userId, last_verified_at: new Date().toISOString() }, { onConflict: 'wallet_lookup_hash', ignoreDuplicates: true })
    if (linked.error) throw linked.error
    const resolved = await admin.from('wallet_identities').select('user_id').eq('wallet_lookup_hash', lookup).single()
    if (resolved.error) throw resolved.error
    const resolvedUserId = resolved.data.user_id
    if (typeof resolvedUserId !== 'string') throw new Error('Could not resolve wallet account owner.')
    if (resolvedUserId !== userId) {
      userId = resolvedUserId
      const owner = await admin.auth.admin.getUserById(resolvedUserId)
      if (owner.error) throw owner.error
      email = owner.data.user.email
    }
    if (!email) throw new Error('Could not resolve wallet account email.')
    const loginEmail = email
    const login = await admin.auth.admin.generateLink({ type: 'magiclink', email: loginEmail })
    if (login.error) throw login.error
    return response(200, { tokenHash: login.data.properties.hashed_token, verificationType: 'magiclink' })
  } catch (error) {
    console.error('wallet-auth', error instanceof Error ? error.message : 'Unknown error')
    return response(400, { error: 'Wallet authentication failed.' })
  }
})
