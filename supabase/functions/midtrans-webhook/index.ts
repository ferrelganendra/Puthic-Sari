import { biteshipItemsFromOrderRows } from '../_shared/checkout.ts'
import { createShipment } from '../_shared/biteship.ts'
import { isFailedNotification, isPaidNotification, isRefundNotification, verifyMidtransSignature } from '../_shared/midtrans.ts'
import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { handleOptions, jsonResponse, readJson, safeApiError } from '../_shared/http.ts'
import { formatNewOrderMessage, sendAdminWhatsAppNotification } from '../_shared/notify.ts'

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method tidak diizinkan.' }, 405)

  const supabase = createSupabaseAdmin()

  try {
    const notification = await readJson(req)
    const signatureValid = await verifyMidtransSignature(notification)
    const midtransOrderId = String(notification.order_id || '')

    const { data: order } = await supabase
      .from('checkout_orders')
      .select('*')
      .eq('midtrans_order_id', midtransOrderId)
      .maybeSingle()

    await supabase.from('checkout_payment_events').insert({
      order_id: order?.id || null,
      provider_order_id: midtransOrderId,
      event_type: 'notification',
      transaction_status: notification.transaction_status || null,
      fraud_status: notification.fraud_status || null,
      signature_valid: signatureValid,
      payload: notification,
    })

    if (!signatureValid) {
      return jsonResponse({ success: false, error: 'Signature Midtrans tidak valid.' }, 403)
    }
    if (!order) {
      return jsonResponse({ success: false, error: 'Order tidak ditemukan.' }, 404)
    }

    const notifiedAmount = Number(notification.gross_amount)
    if (!Number.isFinite(notifiedAmount) || notifiedAmount !== Number(order.total_amount)) {
      await supabase.from('checkout_payment_events').insert({
        order_id: order.id,
        provider_order_id: midtransOrderId,
        event_type: 'amount_mismatch',
        transaction_status: notification.transaction_status || null,
        fraud_status: notification.fraud_status || null,
        signature_valid: signatureValid,
        payload: notification,
      })
      console.error('Midtrans gross_amount mismatch', { orderId: order.id, midtransOrderId, notifiedAmount, expectedAmount: order.total_amount })
      return jsonResponse({ success: false, error: 'Nominal pembayaran tidak sesuai.' }, 409)
    }

    if (isRefundNotification(notification)) {
      await supabase
        .from('checkout_orders')
        .update({
          status: 'refunded',
          payment_status: String(notification.transaction_status || 'refund'),
          midtrans_transaction_id: notification.transaction_id || null,
          midtrans_payment_type: notification.payment_type || null,
        })
        .eq('id', order.id)

      return jsonResponse({ success: true, status: 'refunded' })
    }

    if (isFailedNotification(notification)) {
      await supabase
        .from('checkout_orders')
        .update({
          status: 'payment_failed',
          payment_status: String(notification.transaction_status || 'failed'),
          midtrans_transaction_id: notification.transaction_id || null,
          midtrans_payment_type: notification.payment_type || null,
        })
        .eq('id', order.id)

      return jsonResponse({ success: true, status: 'payment_failed' })
    }

    if (!isPaidNotification(notification)) {
      await supabase
        .from('checkout_orders')
        .update({
          payment_status: String(notification.transaction_status || 'pending'),
          midtrans_transaction_id: notification.transaction_id || null,
          midtrans_payment_type: notification.payment_type || null,
        })
        .eq('id', order.id)

      return jsonResponse({ success: true, status: 'payment_pending' })
    }

    if (order.biteship_order_id) {
      await supabase
        .from('checkout_orders')
        .update({
          status: order.status === 'pending_payment' ? 'paid' : order.status,
          payment_status: String(notification.transaction_status || 'paid'),
          midtrans_transaction_id: notification.transaction_id || null,
          midtrans_payment_type: notification.payment_type || null,
          paid_at: order.paid_at || new Date().toISOString(),
        })
        .eq('id', order.id)

      return jsonResponse({ success: true, status: 'already_shipment_created' })
    }

    const { data: paidOrder, error: claimError } = await supabase
      .from('checkout_orders')
      .update({
        status: 'paid',
        payment_status: String(notification.transaction_status || 'paid'),
        midtrans_transaction_id: notification.transaction_id || null,
        midtrans_payment_type: notification.payment_type || null,
        paid_at: order.paid_at || new Date().toISOString(),
        shipment_status: 'creating',
      })
      .eq('id', order.id)
      .is('biteship_order_id', null)
      .eq('shipment_status', 'not_created')
      .in('status', ['pending_payment', 'paid'])
      .select('*')
      .maybeSingle()

    if (claimError) throw claimError
    if (!paidOrder) {
      return jsonResponse({ success: true, status: 'shipment_already_claimed' })
    }

    // Fire-and-forget admin WhatsApp notification (does not block webhook response)
    sendAdminWhatsAppNotification(formatNewOrderMessage(paidOrder))
      .catch((err) => console.error('Admin notification dispatch error', err))

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
      event_type: 'created_after_payment',
      status: shipment.status || 'created',
      payload: shipment,
    })

    return jsonResponse({ success: true, status: 'paid_shipment_created' })
  } catch (error) {
    console.error('midtrans-webhook failed', error)
    return jsonResponse({ success: false, error: safeApiError(error, 'Webhook Midtrans gagal.') }, 500)
  }
})
