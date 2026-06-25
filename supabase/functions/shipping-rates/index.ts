import { biteshipItems, buildCheckoutItems } from '../_shared/checkout.ts'
import { getRates } from '../_shared/biteship.ts'
import { apiError, handleOptions, jsonResponse, normalizePostalCode, readJson } from '../_shared/http.ts'

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method tidak diizinkan.' }, 405, req)

  try {
    const body = await readJson(req)
    const destinationPostalCode = normalizePostalCode(body.destinationPostalCode)
    if (!destinationPostalCode) throw new Error('Kode pos tujuan wajib diisi.')

    const { items, subtotal } = await buildCheckoutItems(body.cart || body.items || [])
    const rates = await getRates(destinationPostalCode, biteshipItems(items))

    return jsonResponse({ success: true, subtotal, rates }, 200, req)
  } catch (error) {
    console.error('shipping-rates failed', error)
    return jsonResponse({ success: false, error: apiError(error, 'Gagal mengambil ongkir.') }, 400, req)
  }
})
