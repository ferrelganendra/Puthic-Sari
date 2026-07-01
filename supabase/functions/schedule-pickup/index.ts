import { schedulePickup } from '../_shared/biteship.ts'
import { createSupabaseAdmin, requireAdminUser } from '../_shared/supabase.ts'
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts'

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method tidak diizinkan.' }, 200, req)

  try {
    await requireAdminUser(req)
    const supabase = createSupabaseAdmin()
    const body = await readJson(req)
    const orderId = String(body.orderId || '').trim()
    if (!orderId) return jsonResponse({ success: false, error: 'ID pesanan wajib diisi.' }, 200, req)

    const { data: order, error: fetchErr } = await supabase
      .from('checkout_orders')
      .select('id, biteship_order_id, status, shipment_status')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) return jsonResponse({ success: false, error: 'Pesanan tidak ditemukan. Mungkin sudah dihapus.' }, 200, req)
    if (!order.biteship_order_id) return jsonResponse({ success: false, error: 'Shipment belum dibuat. Klik ikon 📦 "Buat Shipment" dulu.' }, 200, req)

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
    const msg = error instanceof Error ? error.message : String(error)
    return jsonResponse({ success: false, error: msg || 'Gagal menjadwalkan pickup. Coba cek dashboard Biteship.' }, 200, req)
  }
})
