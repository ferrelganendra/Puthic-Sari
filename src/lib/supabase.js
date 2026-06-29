import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
 if (import.meta.env.DEV) console.warn('Supabase env vars missing — using offline mode.')
}

const AUTH_REMEMBER_KEY = 'ps_auth_remember'

function authStorage() {
 if (typeof window === 'undefined') return undefined
 const remembered = () => window.localStorage.getItem(AUTH_REMEMBER_KEY) !== 'false'
 return {
  getItem(key) {
   return remembered() ? window.localStorage.getItem(key) : window.sessionStorage.getItem(key)
  },
  setItem(key, value) {
   const storage = remembered() ? window.localStorage : window.sessionStorage
   storage.setItem(key, value)
  },
  removeItem(key) {
   window.localStorage.removeItem(key)
   window.sessionStorage.removeItem(key)
  },
 }
}

export function setAuthRemembered(remember) {
 if (typeof window === 'undefined') return
 window.localStorage.setItem(AUTH_REMEMBER_KEY, remember ? 'true' : 'false')
}

const supabaseClient = supabaseUrl && supabaseAnonKey
 ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
   persistSession: true,
   autoRefreshToken: true,
   detectSessionInUrl: true,
   storage: authStorage(),
  },
 })
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
