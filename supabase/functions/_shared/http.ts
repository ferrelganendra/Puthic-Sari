// Origins that are always allowed (production + development).
const ALLOWED_ORIGINS = new Set([
  'https://puthicsari.com',
  'https://www.puthicsari.com',
  'https://puthic-sari.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
])

function resolveCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin') || ''
  // Server-to-server (no Origin) → allowed — webhooks don't send Origin
  if (!origin) return Deno.env.get('PUBLIC_SITE_ORIGIN') || '*'
  // Known origins are echoed back
  if (ALLOWED_ORIGINS.has(origin)) return origin
  // Env-configured production origin
  const envOrigin = Deno.env.get('PUBLIC_SITE_ORIGIN') || ''
  if (envOrigin && origin === envOrigin) return origin
  // Unknown origin → deny (browser will block the request)
  return ''
}

function dynamicCorsHeaders(req?: Request) {
  return {
    'access-control-allow-origin': req ? resolveCorsOrigin(req) : (Deno.env.get('PUBLIC_SITE_ORIGIN') || '*'),
    'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
  }
}

export const corsHeaders = dynamicCorsHeaders()

export function jsonResponse(payload: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...(req ? dynamicCorsHeaders(req) : corsHeaders),
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

export function handleOptions(req: Request) {
  if (req.method !== 'OPTIONS') return null
  return new Response('ok', { headers: dynamicCorsHeaders(req) })
}

export async function readJson(req: Request) {
  try {
    return await req.json()
  } catch (_error) {
    return {}
  }
}

export function requireEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} belum dikonfigurasi.`)
  return value
}

export function normalizePhone(phone: unknown) {
  return String(phone || '').replace(/[^0-9+]/g, '')
}

export function normalizePostalCode(value: unknown) {
  const postalCode = Number(String(value || '').replace(/[^0-9]/g, ''))
  return Number.isInteger(postalCode) && postalCode > 0 ? postalCode : null
}

export function apiError(error: unknown, fallback = 'Terjadi kesalahan.') {
  if (error instanceof Error) return error.message || fallback
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const data = error as Record<string, unknown>
    return String(data.message || data.details || data.error || fallback)
  }
  return fallback
}

export function safeApiError(error: unknown, fallback = 'Terjadi kesalahan. Silakan coba lagi atau hubungi admin.') {
  const message = apiError(error, fallback)
  if (/keranjang kosong/i.test(message)) return 'Keranjang kosong.'
  if (/produk tidak ditemukan/i.test(message)) return 'Produk tidak ditemukan.'
  if (/tidak aktif|sold out/i.test(message)) return message
  if (/nama penerima|nomor whatsapp|alamat pengiriman|kode pos tujuan|pilih layanan kurir/i.test(message)) return message
  if (/layanan kurir tidak tersedia/i.test(message)) return 'Layanan kurir tidak tersedia. Cek ongkir ulang.'
  if (/biteship|courier|fetch|network|timeout|saldo|midtrans|supabase|service_role|server_key|apikey|api key|jwt/i.test(message)) return fallback
  return fallback
}
