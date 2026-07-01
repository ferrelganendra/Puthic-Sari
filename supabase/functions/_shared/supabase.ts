import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { requireEnv } from './http.ts'

export function createSupabaseAdmin() {
  return createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

export async function getUserId(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_ANON_KEY'),
    {
      global: { headers: { authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )

  const { data } = await supabase.auth.getUser()
  return data.user?.id || null
}

export async function getUser(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_ANON_KEY'),
    {
      global: { headers: { authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )

  const { data } = await supabase.auth.getUser()
  return data.user || null
}

export async function requireAdminUser(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const serviceRoleToken = `Bearer ${requireEnv('SUPABASE_SERVICE_ROLE_KEY')}`
  if (authHeader === serviceRoleToken) return null

  const user = await getUser(req)
  if (!user?.id) throw new Error('Login admin diperlukan.')

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  if (data?.role !== 'admin') throw new Error('Akses admin diperlukan.')
  return user
}
