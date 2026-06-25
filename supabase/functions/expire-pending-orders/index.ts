import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { createShipment } from '../_shared/biteship.ts'
import { biteshipItemsFromOrderRows } from '../_shared/checkout.ts'
import { getTransactionStatus, isFailedNotification, isPaidNotification } from '../_shared/midtrans.ts'
import { handleOptions, jsonResponse, safeApiError } from '../_shared/http.ts'

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  const supabase = createSupabaseAdmin()
  const result = { checked: 0, expired: 0, paid: 0, failed: 0, skipped: 0, errors: [] as string[] }

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: orders, error: fetchError } = await supabase
      .from('checkout_orders')
      .select('*')
      .eq('status', 'pending_payment')
      .eq('payment_status', 'pending')
      .lt('created_at', cutoff)

    if (fetchError) throw fetchError
    if (!orders?.length) {
      return jsonResponse({ success: true, ...result, message: 'No pending orders to expire.' })
    }

    result.checked = orders.length

    for (const order of orders) {
      try {
        const midtransOrderId = order.midtrans_order_id
        let paid = false
        let failed = false

        if (midtransOrderId) {
          const statusResponse = await getTransactionStatus(midtransOrderId)
          if (statusResponse) {
            if (isPaidNotification(statusResponse)) {
              paid = true
            } else if (isFailedNotification(statusResponse)) {
              failed = true
            }
          }
        }

        if (paid) {
          await processPaidOrder(supabase, order)
          result.paid++
        } else if (failed) {
          await supabase
            .from('checkout_orders')
            .update({ status: 'cancelled', payment_status: 'expired_local' })
            .eq('id', order.id)
          result.failed++
        } else {
          await supabase
            .from('checkout_orders')
            .update({ status: 'cancelled', payment_status: 'expired_local' })
            .eq('id', order.id)
          result.expired++
        }
      } catch (e) {
        const msg = safeApiError(e, `Gagal memproses order ${order.order_number}`)
        result.errors.push(msg)
        try {
          await supabase
            .from('checkout_orders')
            .update({ status: 'cancelled', payment_status: 'expired_local' })
            .eq('id', order.id)
        } catch { /* ignore */ }
      }
    }

    return jsonResponse({ success: true, ...result })
  } catch (error) {
    console.error('expire-pending-orders failed', error)
    return jsonResponse({ success: false, error: safeApiError(error, 'Expire job gagal.') }, 500)
  }
})

async function processPaidOrder(supabase: ReturnType<typeof createSupabaseAdmin>, order: Record<string, unknown>) {
  const orderId = order.id as string

  // Prevent duplicate processing if already has Biteship order
  if (order.biteship_order_id) {
    await supabase
      .from('checkout_orders')
      .update({
        status: order.status === 'pending_payment' ? 'paid' : (order.status as string),
        payment_status: 'caught_by_cron',
        paid_at: (order.paid_at as string) || new Date().toISOString(),
      })
      .eq('id', order.id)
    return
  }

  const { data: paidOrder, error: claimError } = await supabase
    .from('checkout_orders')
    .update({
      status: 'paid',
      payment_status: 'caught_by_cron',
      paid_at: order.paid_at as string || new Date().toISOString(),
      shipment_status: 'creating',
    })
    .eq('id', order.id)
    .is('biteship_order_id', null)
    .eq('shipment_status', 'not_created')
    .in('status', ['pending_payment', 'paid'])
    .select('*')
    .maybeSingle()

  if (claimError) throw claimError
  if (!paidOrder) return

  const { data: items, error: itemsError } = await supabase
    .from('checkout_order_items')
    .select('*')
    .eq('order_id', order.id)

  if (itemsError) throw itemsError
  if (!items?.length) throw new Error('Item order kosong.')

  const shipment = await createShipment(paidOrder, biteshipItemsFromOrderRows(items))
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
    event_type: 'created_after_cron',
    status: shipment.status || 'created',
    payload: shipment,
  })
}
