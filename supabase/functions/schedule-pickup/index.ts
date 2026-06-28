import { schedulePickup } from '../_shared/biteship.ts'
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
      .select('id, biteship_order_id, status, shipment_status')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) return jsonResponse({ success: false, error: 'Order tidak ditemukan.' }, 404, req)
    if (!order.biteship_order_id) return jsonResponse({ success: false, error: 'Shipment belum dibuat untuk order ini.' }, 400, req)

    const result = await schedulePickup(order.biteship_order_id)

    await supabase.from('checkout_shipment_events').insert({
      order_id: order.id,
      provider_order_id: order.biteship_order_id,
      event_type: 'pickup_scheduled',
      status: result.status || 'scheduled',
      payload: result,
    })

    return jsonResponse({ success: true, pickup: result }, 200, req)
  } catch (error) {
    console.error('schedule-pickup failed', error)
    return jsonResponse({ success: false, error: safeApiError(error, 'Gagal menjadwalkan pickup.') }, 400, req)
  }
})
