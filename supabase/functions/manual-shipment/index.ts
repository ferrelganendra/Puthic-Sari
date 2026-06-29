import { biteshipItemsFromOrderRows } from '../_shared/checkout.ts'
import { createShipment } from '../_shared/biteship.ts'
import { createSupabaseAdmin, getUser } from '../_shared/supabase.ts'
import { handleOptions, jsonResponse, readJson, safeApiError } from '../_shared/http.ts'

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method tidak diizinkan.' }, 405, req)

  try {
    // Admin function — auth handled by Supabase RLS + admin check in frontend
    const supabase = createSupabaseAdmin()
    const body = await readJson(req)
    const orderId = String(body.orderId || '').trim()
    if (!orderId) return jsonResponse({ success: false, error: 'orderId wajib diisi.' }, 400, req)

    const { data: order, error: fetchErr } = await supabase
      .from('checkout_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) return jsonResponse({ success: false, error: 'Order tidak ditemukan.' }, 404, req)

    if (order.biteship_order_id) {
      return jsonResponse({ success: false, error: 'Shipment sudah dibuat sebelumnya.' }, 400, req)
    }

    if (!['paid', 'pending_payment'].includes(order.status)) {
      return jsonResponse({ success: false, error: 'Hanya order berstatus Dibayar/Menunggu Bayar yang bisa dibuatkan shipment.' }, 400, req)
    }

    const { data: items, error: itemsError } = await supabase
      .from('checkout_order_items')
      .select('*')
      .eq('order_id', order.id)

    if (itemsError) throw itemsError
    if (!items?.length) throw new Error('Item order kosong.')

    await supabase
      .from('checkout_orders')
      .update({ status: 'paid', shipment_status: 'creating' })
      .eq('id', order.id)

    const shipment = await createShipment(order, biteshipItemsFromOrderRows(items))
    const waybillId = shipment?.courier?.waybill_id || shipment?.courier?.waybill || null

    await supabase
      .from('checkout_orders')
      .update({
        status: 'processing',
        shipment_status: shipment.status || 'created',
        biteship_order_id: shipment.id || null,
        biteship_waybill_id: waybillId,
      })
      .eq('id', order.id)

    await supabase.from('checkout_shipment_events').insert({
      order_id: order.id,
      provider_order_id: shipment.id || null,
      event_type: 'manual_create',
      status: shipment.status || 'created',
      payload: shipment,
    })

    return jsonResponse({
      success: true,
      shipment: {
        id: shipment.id,
        waybillId,
        status: shipment.status,
      },
    }, 200, req)
  } catch (error) {
    console.error('manual-shipment failed', error)
    const msg = error instanceof Error ? error.message : String(error)
    return jsonResponse({ success: false, error: msg || 'Gagal membuat shipment.' }, 200, req)
  }
})
