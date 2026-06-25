const BITESHIP_BASE_URL = 'https://api.biteship.com'

const DEFAULT_ORIGIN = {
  contactName: process.env.BITESHIP_ORIGIN_CONTACT_NAME || 'Puthic Sari',
  contactPhone: process.env.BITESHIP_ORIGIN_CONTACT_PHONE || '6285117606161',
  address: process.env.BITESHIP_ORIGIN_ADDRESS || 'Jl. Perumnas, Ngropoh, Condongcatur, Kec. Depok, Sleman, DI Yogyakarta 55283',
  postalCode: Number(process.env.BITESHIP_ORIGIN_POSTAL_CODE || 55283),
}

const DEFAULT_COURIERS = process.env.BITESHIP_COURIERS || ''
const DEFAULT_ITEM_WEIGHT = Number(process.env.BITESHIP_DEFAULT_ITEM_WEIGHT_GRAMS || 500)
const DEFAULT_ITEM_LENGTH = Number(process.env.BITESHIP_DEFAULT_ITEM_LENGTH_CM || 30)
const DEFAULT_ITEM_WIDTH = Number(process.env.BITESHIP_DEFAULT_ITEM_WIDTH_CM || 20)
const DEFAULT_ITEM_HEIGHT = Number(process.env.BITESHIP_DEFAULT_ITEM_HEIGHT_CM || 10)

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(payload))
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}')

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

export function requireMethod(req, res, method) {
  if (req.method === method) return true
  res.setHeader('allow', method)
  sendJson(res, 405, { success: false, error: `Method ${req.method} not allowed` })
  return false
}

export function getBiteshipApiKey() {
  return process.env.BITESHIP_API_KEY
}

export function getOrigin() {
  return DEFAULT_ORIGIN
}

export function getCouriers() {
  return DEFAULT_COURIERS
}

export function formatBiteshipError(data, fallback) {
  const error = data?.error || data?.message || fallback
  if (/no sufficient balance/i.test(error)) {
    return 'Saldo Biteship belum cukup untuk cek ongkir. Top up saldo sandbox atau gunakan API key production setelah aktivasi.'
  }
  return error
}

export function normalizePhone(phone) {
  return String(phone || '').replace(/[^0-9+]/g, '')
}

export function normalizePostalCode(value) {
  const postalCode = Number(String(value || '').replace(/[^0-9]/g, ''))
  return Number.isInteger(postalCode) && postalCode > 0 ? postalCode : null
}

export function normalizeCartItems(cart = []) {
  return cart
    .map((item) => {
      const quantity = Math.max(1, Number(item.quantity || 1))
      const value = Math.max(1000, Math.round(Number(item.price || item.value || 0)))

      return {
        name: String(item.name || 'Produk Puthic Sari').slice(0, 120),
        description: String(item.description || item.category || 'Buket bunga artificial').slice(0, 180),
        value,
        quantity,
        length: Math.max(1, Number(item.length || DEFAULT_ITEM_LENGTH)),
        width: Math.max(1, Number(item.width || DEFAULT_ITEM_WIDTH)),
        height: Math.max(1, Number(item.height || DEFAULT_ITEM_HEIGHT)),
        weight: Math.max(1, Number(item.weight || DEFAULT_ITEM_WEIGHT)),
      }
    })
    .filter((item) => item.value > 0 && item.quantity > 0)
}

export async function biteshipRequest(path, options = {}) {
  const apiKey = getBiteshipApiKey()
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      data: { success: false, error: 'BITESHIP_API_KEY belum dikonfigurasi di server.' },
    }
  }

  const response = await fetch(`${BITESHIP_BASE_URL}${path}`, {
    ...options,
    headers: {
      authorization: apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(async () => ({ success: false, error: await response.text() }))
  return { ok: response.ok, status: response.status, data }
}
