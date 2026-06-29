import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts'

const BITESHIP_ORDERS_URL = 'https://dashboard.biteship.com/orders'

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method tidak diizinkan.' }, 200, req)

  try {
    const supabase = createSupabaseAdmin()
    const body = await readJson(req)
    const orderId = String(body.orderId || '').trim()
    if (!orderId) return jsonResponse({ success: false, error: 'ID pesanan wajib diisi.' }, 200, req)

    const { data: order, error: fetchErr } = await supabase
      .from('checkout_orders')
      .select('id, order_number, biteship_order_id, biteship_waybill_id, status')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) return jsonResponse({ success: false, error: 'Pesanan tidak ditemukan. Mungkin sudah dihapus.' }, 200, req)
    if (!order.biteship_order_id) return jsonResponse({ success: false, error: 'Shipment belum dibuat untuk pesanan ini. Klik ikon 📦 "Buat Shipment" dulu.' }, 200, req)
    if (!order.biteship_waybill_id) return jsonResponse({ success: false, error: 'Resi belum tersedia dari Biteship. Tunggu beberapa menit, lalu refresh dan coba print lagi.' }, 200, req)

    return jsonResponse({
      success: true,
      label: {
        officialOnly: true,
        dashboardUrl: BITESHIP_ORDERS_URL,
        message: 'Label resmi hanya tersedia dari dashboard Biteship. Dashboard Biteship akan dibuka; cari resi/order ini, lalu klik Print Orders atau Download Label.',
      },
      orderNumber: order.order_number,
      biteshipOrderId: order.biteship_order_id,
      waybillId: order.biteship_waybill_id,
    }, 200, req)
  } catch (error) {
    console.error('print-label failed', error)
    return jsonResponse({ success: false, error: 'Data label belum bisa dibaca. Cek pesanan, shipment, dan resi Biteship.' }, 200, req)
  }
})
