import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const AUTH_TTL_SECONDS = 300

export function parseBearerToken(req) {
 const header = req?.headers?.authorization || req?.headers?.Authorization || ''
 const match = String(header).match(/^Bearer\s+(.+)$/i)
 return match?.[1]?.trim() || null
}

export function createUploadAuth({ privateKey, publicKey, now = Math.floor(Date.now() / 1000), token = crypto.randomUUID() }) {
 if (!privateKey || !publicKey) throw new Error('ImageKit credentials are not configured.')
 const expire = now + AUTH_TTL_SECONDS
 const signature = crypto.createHmac('sha1', privateKey).update(`${token}${expire}`).digest('hex')
 return { token, expire, signature, publicKey }
}

function sendJson(res, statusCode, payload) {
 res.statusCode = statusCode
 res.setHeader('content-type', 'application/json; charset=utf-8')
 res.setHeader('cache-control', 'no-store')
 res.end(JSON.stringify(payload))
}

async function getAdminUser(accessToken) {
 const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
 const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
 if (!supabaseUrl || !serviceRoleKey) return { error: 'server-config' }

 const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
 })
 const { data: { user }, error: authError } = await client.auth.getUser(accessToken)
 if (authError || !user) return { error: 'unauthorized' }

 const { data: profile, error: profileError } = await client
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .maybeSingle()

 if (profileError) return { error: 'server-auth' }
 if (profile?.role !== 'admin') return { error: 'forbidden' }
 return { user }
}

export default async function handler(req, res) {
 if (req.method !== 'POST') {
  res.setHeader('allow', 'POST')
  sendJson(res, 405, { error: 'Method not allowed' })
  return
 }

 const accessToken = parseBearerToken(req)
 if (!accessToken) {
  sendJson(res, 401, { error: 'Authentication required' })
  return
 }

 try {
  const result = await getAdminUser(accessToken)
  if (result.error === 'server-config' || result.error === 'server-auth') {
   sendJson(res, 500, { error: 'Upload authentication is not configured' })
   return
  }
  if (result.error === 'forbidden') {
   sendJson(res, 403, { error: 'Admin access required' })
   return
  }
  if (result.error) {
   sendJson(res, 401, { error: 'Invalid session' })
   return
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || process.env.VITE_IMAGEKIT_PUBLIC_KEY
  sendJson(res, 200, createUploadAuth({ privateKey, publicKey }))
 } catch {
  sendJson(res, 500, { error: 'Could not create upload authentication' })
 }
}
