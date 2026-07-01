import { biteshipItems, buildCheckoutItems } from '../_shared/checkout.ts'
import { getRates } from '../_shared/biteship.ts'
import { apiError, handleOptions, jsonResponse, normalizePostalCode, readJson } from '../_shared/http.ts'
import { enforceRateLimit } from '../_shared/security.ts'

function destination(body: Record<string, unknown>) {
  const postalCode = normalizePostalCode(body.destinationPostalCode)
  if (!postalCode) throw new Error('Kode pos tujuan wajib diisi.')
  const areaId = String(body.destinationAreaId || '').trim()
  const latitude = Number(body.destinationLatitude || 0)
  const longitude = Number(body.destinationLongitude || 0)
  return areaId ? { postalCode, areaId, latitude, longitude } : { postalCode, latitude, longitude }
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method tidak diizinkan.' }, 405, req)

  try {
    await enforceRateLimit(req, 'shipping-rates', 30)
    const body = await readJson(req)
    const { items, subtotal } = await buildCheckoutItems(body.cart || body.items || [])
    const rates = await getRates(destination(body), biteshipItems(items))

    return jsonResponse({ success: true, subtotal, rates }, 200, req)
  } catch (error) {
    console.error('shipping-rates failed', error)
    return jsonResponse({ success: false, error: apiError(error, 'Gagal mengambil ongkir.') }, 400, req)
  }
})
