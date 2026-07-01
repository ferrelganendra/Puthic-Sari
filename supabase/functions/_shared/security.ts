import { createSupabaseAdmin } from './supabase.ts'

const encoder = new TextEncoder()

function clientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return req.headers.get('cf-connecting-ip') || forwarded || req.headers.get('x-real-ip') || 'unknown'
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function enforceRateLimit(req: Request, endpoint: string, limit: number, windowSeconds = 60) {
  const identifierHash = await sha256(`${endpoint}:${clientIp(req)}`)
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.rpc('hit_function_rate_limit', {
    p_endpoint: endpoint,
    p_identifier_hash: identifierHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) throw error
  if (data === true) throw new Error('Terlalu banyak request. Coba lagi sebentar lagi.')
}
