import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { handleOptions, jsonResponse, readJson } from '../_shared/http.ts'

const escapeHtml = (value: unknown) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const rupiah = (value: unknown) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(Number(value || 0))

function labelHtml(order: Record<string, unknown>, items: Array<Record<string, unknown>>) {
  const courier = (order.selected_courier || {}) as Record<string, unknown>
  const courierName = [courier.courierName || courier.courierCompany, courier.courierServiceName || courier.courierService]
    .filter(Boolean)
    .join(' - ')
  const rows = items.map((item) => `
    <tr>
      <td>${escapeHtml(item.product_name || item.name || 'Produk')}</td>
      <td>${escapeHtml(item.quantity || 1)}</td>
      <td>${escapeHtml(item.weight_grams || 500)}g</td>
    </tr>
  `).join('')

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Label ${escapeHtml(order.order_number)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #111; background: #f3f4f6; }
    .page { width: 100mm; min-height: 150mm; margin: 12px auto; background: #fff; border: 1px solid #111; padding: 12px; }
    .top { display: flex; justify-content: space-between; gap: 12px; border-bottom: 2px solid #111; padding-bottom: 10px; }
    .brand { font-size: 18px; font-weight: 700; }
    .muted { color: #555; font-size: 11px; }
    .waybill { text-align: right; font-size: 13px; }
    .waybill strong { display: block; font-size: 18px; letter-spacing: 1px; }
    .section { border-bottom: 1px solid #ddd; padding: 10px 0; }
    .label { font-size: 11px; font-weight: 700; color: #555; text-transform: uppercase; margin-bottom: 4px; }
    .value { font-size: 14px; line-height: 1.35; }
    .big { font-size: 18px; font-weight: 700; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
    th { background: #f8fafc; }
    .footer { margin-top: 10px; font-size: 10px; color: #555; text-align: center; }
    @media print {
      body { background: #fff; }
      .page { margin: 0; border: 1px solid #111; width: 100mm; min-height: 150mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin:12px"><button onclick="window.print()" style="padding:10px 18px;font-weight:700">Print Label</button></div>
  <main class="page">
    <div class="top">
      <div>
        <div class="brand">Puthic Sari</div>
        <div class="muted">Label pengiriman dibuat dari data website</div>
      </div>
      <div class="waybill">
        Resi
        <strong>${escapeHtml(order.biteship_waybill_id || '-')}</strong>
      </div>
    </div>

    <section class="section">
      <div class="label">Kurir</div>
      <div class="value big">${escapeHtml(courierName || '-')}</div>
      <div class="muted">Order: ${escapeHtml(order.order_number || order.id)}</div>
    </section>

    <section class="section">
      <div class="label">Penerima</div>
      <div class="value big">${escapeHtml(order.customer_name)}</div>
      <div class="value">${escapeHtml(order.customer_phone)}</div>
      <div class="value">${escapeHtml(order.destination_address)}</div>
      <div class="value">${escapeHtml(order.destination_city)} ${escapeHtml(order.destination_postal_code)}</div>
      ${order.destination_note ? `<div class="muted">Catatan: ${escapeHtml(order.destination_note)}</div>` : ''}
    </section>

    <section class="section">
      <div class="grid">
        <div>
          <div class="label">Total Ongkir</div>
          <div class="value">${rupiah(order.shipping_amount)}</div>
        </div>
        <div>
          <div class="label">Total Order</div>
          <div class="value">${rupiah(order.total_amount)}</div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="label">Isi Paket</div>
      <table>
        <thead><tr><th>Produk</th><th>Qty</th><th>Berat</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="3">Item tidak tersedia</td></tr>'}</tbody>
      </table>
    </section>

    <div class="footer">Tempel label ini di paket. Untuk label resmi Biteship, gunakan dashboard Biteship jika diperlukan.</div>
  </main>
</body>
</html>`
}

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
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) return jsonResponse({ success: false, error: 'Pesanan tidak ditemukan. Mungkin sudah dihapus.' }, 200, req)
    if (!order.biteship_order_id) return jsonResponse({ success: false, error: 'Shipment belum dibuat untuk pesanan ini. Klik ikon 📦 "Buat Shipment" dulu.' }, 200, req)
    if (!order.biteship_waybill_id) return jsonResponse({ success: false, error: 'Resi belum tersedia dari Biteship. Tunggu beberapa menit, lalu refresh dan coba print lagi.' }, 200, req)

    const { data: items, error: itemsError } = await supabase
      .from('checkout_order_items')
      .select('*')
      .eq('order_id', order.id)

    if (itemsError) throw itemsError

    return jsonResponse({ success: true, label: { html: labelHtml(order, items || []) }, waybillId: order.biteship_waybill_id }, 200, req)
  } catch (error) {
    console.error('print-label failed', error)
    return jsonResponse({ success: false, error: 'Label belum bisa dibuat. Cek data pesanan, resi, dan item order.' }, 200, req)
  }
})
