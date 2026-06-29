import { getLabel } from '../_shared/biteship.ts'
import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts'

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
      .select('id, biteship_order_id, biteship_waybill_id, status')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) return jsonResponse({ success: false, error: 'Pesanan tidak ditemukan. Mungkin sudah dihapus.' }, 200, req)
    if (!order.biteship_order_id) return jsonResponse({ success: false, error: 'Shipment belum dibuat untuk pesanan ini. Klik ikon 📦 "Buat Shipment" dulu.' }, 200, req)

    const label = await getLabel(order.biteship_order_id)

    return jsonResponse({ success: true, label, waybillId: order.biteship_waybill_id }, 200, req)
  } catch (error) {
    console.error('print-label failed', error)
    const msg = error instanceof Error ? error.message : String(error)
    return jsonResponse({ success: false, error: msg || 'Gagal mengambil label. Coba buka dashboard Biteship langsung untuk cetak label.' }, 200, req)
  }
})
