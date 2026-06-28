import { getLabel } from '../_shared/biteship.ts'
import { createSupabaseAdmin, getUser } from '../_shared/supabase.ts'
import { handleOptions, jsonResponse, readJson, safeApiError } from '../_shared/http.ts'

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method tidak diizinkan.' }, 405, req)

  try {
    const user = await getUser(req)
    if (!user) return jsonResponse({ success: false, error: 'Unauthorized.' }, 401, req)

    const supabase = createSupabaseAdmin()
    const body = await readJson(req)
    const orderId = String(body.orderId || '').trim()
    if (!orderId) return jsonResponse({ success: false, error: 'orderId wajib diisi.' }, 400, req)

    const { data: order, error: fetchErr } = await supabase
      .from('checkout_orders')
      .select('id, biteship_order_id, biteship_waybill_id, status')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) return jsonResponse({ success: false, error: 'Order tidak ditemukan.' }, 404, req)
    if (!order.biteship_order_id) return jsonResponse({ success: false, error: 'Shipment belum dibuat untuk order ini.' }, 400, req)

    const label = await getLabel(order.biteship_order_id)

    return jsonResponse({ success: true, label, waybillId: order.biteship_waybill_id }, 200, req)
  } catch (error) {
    console.error('print-label failed', error)
    return jsonResponse({ success: false, error: safeApiError(error, 'Gagal mengambil label pengiriman.') }, 400, req)
  }
})
