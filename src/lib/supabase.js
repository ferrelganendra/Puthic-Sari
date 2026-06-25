import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
 if (import.meta.env.DEV) console.warn('Supabase env vars missing — using offline mode.')
}

const supabaseClient = supabaseUrl && supabaseAnonKey
 ? createClient(supabaseUrl, supabaseAnonKey)
 : null

export function requireSupabase() {
 if (!supabaseClient) {
  throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.')
 }
 return supabaseClient
}

export const supabase = supabaseClient || new Proxy({}, {
 get(_target, prop) {
  const client = requireSupabase()
  const value = client[prop]
  return typeof value === 'function' ? value.bind(client) : value
 },
})
