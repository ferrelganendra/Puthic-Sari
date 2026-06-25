import { biteshipItems, buildCheckoutItems, midtransItems, orderItemRows, orderNumber } from '../_shared/checkout.ts'
import { resolveSelectedRate } from '../_shared/biteship.ts'
import { createSnapTransaction } from '../_shared/midtrans.ts'
import { createSupabaseAdmin, getUser } from '../_shared/supabase.ts'
import { handleOptions, jsonResponse, normalizePhone, normalizePostalCode, readJson, safeApiError } from '../_shared/http.ts'

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method tidak diizinkan.' }, 405, req)

  const supabase = createSupabaseAdmin()
  let insertedOrderId: string | null = null

  try {
    const body = await readJson(req)
    const user = await getUser(req)
    const customerName = String(body.customerName || '').trim()
    const customerPhone = normalizePhone(body.customerPhone)
    const customerEmail = String(body.customerEmail || user?.email || '').trim() || null
    const destinationAddress = String(body.destinationAddress || '').trim()
    const destinationPostalCode = normalizePostalCode(body.destinationPostalCode)
    const destinationAreaId = String(body.destinationAreaId || '').trim() || null
    const destinationAreaName = String(body.destinationAreaName || '').trim() || null
    const destinationNote = String(body.destinationNote || '').trim() || null
    const note = String(body.orderNote || '').trim() || null

    if (!customerName) throw new Error('Nama penerima wajib diisi.')
    if (!customerPhone) throw new Error('Nomor WhatsApp wajib diisi.')
    if (!destinationAddress) throw new Error('Alamat pengiriman wajib diisi.')
    if (!destinationPostalCode) throw new Error('Kode pos tujuan wajib diisi.')
    if (!body.selectedRate?.courierCompany || !body.selectedRate?.courierService) {
      throw new Error('Pilih layanan kurir terlebih dahulu.')
    }

    const checkout = await buildCheckoutItems(body.cart || body.items || [])
    const selectedRate = await resolveSelectedRate(
      destinationAreaId ? { postalCode: destinationPostalCode, areaId: destinationAreaId } : { postalCode: destinationPostalCode },
      biteshipItems(checkout.items),
      body.selectedRate,
    )
    const totalAmount = checkout.subtotal + selectedRate.price
    const nextOrderNumber = orderNumber()

    const { data: order, error: orderError } = await supabase
      .from('checkout_orders')
      .insert({
        order_number: nextOrderNumber,
        user_id: user?.id || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        destination_address: destinationAddress,
        destination_postal_code: destinationPostalCode,
        destination_note: destinationNote,
        order_note: note,
        subtotal_amount: checkout.subtotal,
        shipping_amount: selectedRate.price,
        total_amount: totalAmount,
        selected_courier: selectedRate,
        midtrans_order_id: nextOrderNumber,
        metadata: {
          channel: 'website',
          destination_area_id: destinationAreaId,
          destination_area_name: destinationAreaName,
        },
      })
      .select('*')
      .single()

    if (orderError) throw orderError
    insertedOrderId = order.id

    const { error: itemsError } = await supabase.from('checkout_order_items').insert(orderItemRows(order.id, checkout.items))
    if (itemsError) throw itemsError

    const midtransPayload = {
      transaction_details: {
        order_id: nextOrderNumber,
        gross_amount: totalAmount,
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail || undefined,
        phone: customerPhone,
        shipping_address: {
          first_name: customerName,
          phone: customerPhone,
          address: destinationAddress,
          postal_code: String(destinationPostalCode),
          country_code: 'IDN',
        },
      },
      item_details: midtransItems(checkout.items, selectedRate.price),
      callbacks: {
        finish: Deno.env.get('MIDTRANS_FINISH_URL') || undefined,
      },
    }

    const snap = await createSnapTransaction(midtransPayload)
    await supabase
      .from('checkout_orders')
      .update({ midtrans_redirect_url: snap.redirect_url || null })
      .eq('id', order.id)

    return jsonResponse({
      success: true,
      order: {
        id: order.id,
        orderNumber: nextOrderNumber,
        status: order.status,
        subtotal: checkout.subtotal,
        shipping: selectedRate.price,
        total: totalAmount,
      },
      payment: {
        provider: 'midtrans',
        token: snap.token,
        redirectUrl: snap.redirect_url,
      },
    }, 200, req)
  } catch (error) {
    if (insertedOrderId) {
      await supabase.from('checkout_orders').update({ status: 'payment_failed', payment_status: 'init_failed' }).eq('id', insertedOrderId)
    }
    console.error('create-payment failed', error)
    return jsonResponse({ success: false, error: safeApiError(error, 'Gagal membuat pembayaran. Silakan coba lagi atau hubungi admin.') }, 400, req)
  }
})
