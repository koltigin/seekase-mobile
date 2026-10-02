import { createClient, type SupabaseClient } from '@supabase/supabase-js'

declare const Deno: {
  env: { get(name: string): string | undefined }
  serve(handler: (request: Request) => Response | Promise<Response>): void
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

async function deleteOwnedPhotos(admin: SupabaseClient, userId: string) {
  const bucket = admin.storage.from('item-images')
  for (;;) {
    const listed = await bucket.list(userId, { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } })
    if (listed.error) throw listed.error
    const paths = (listed.data ?? []).filter((entry) => entry.id).map((entry) => `${userId}/${entry.name}`)
    if (paths.length === 0) return
    const removed = await bucket.remove(paths)
    if (removed.error) throw removed.error
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRole) return json(503, { error: 'Account deletion is not configured.' })

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/iu, '')
    if (!token) return json(401, { error: 'Sign in to delete your account.' })
    const current = await admin.auth.getUser(token)
    const user = current.data.user
    if (current.error || !user || user.is_anonymous) return json(401, { error: 'Sign in to delete your account.' })

    const body = await request.json()
    if (body.confirmation !== 'DELETE') return json(400, { error: 'Account deletion was not confirmed.' })

    // Storage objects are not covered by Postgres/auth cascade deletion.
    // Abort before deleting the account if every owned photo cannot be removed.
    await deleteOwnedPhotos(admin, user.id)
    const deleted = await admin.auth.admin.deleteUser(user.id)
    if (deleted.error) throw deleted.error
    return json(200, { deleted: true })
  } catch (error) {
    console.error('delete-account', error instanceof Error ? error.message : 'Unknown error')
    return json(502, { error: 'Your account could not be deleted. No successful deletion was reported.' })
  }
})
