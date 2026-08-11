import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { handleOptions, jsonResponse, readJson, safeApiError } from '../_shared/http.ts'

const BITESHIP_TO_SHIPMENT_STATUS: Record<string, string> = {
  confirmed: 'created',
  scheduled: 'scheduled',
  allocated: 'allocated',
  picking_up: 'picking_up',
  picked: 'picked',
  in_transit: 'in_transit',
  dropping_off: 'dropping_off',
  delivered: 'delivered',
  cancelled: 'cancelled',
  returned: 'returned',
  rejected: 'rejected',
  courier_not_found: 'courier_not_found',
  disposed: 'disposed',
  on_hold: 'on_hold',
  return_in_transit: 'return_in_transit',
}

const IN_TRANSIT_STATUSES = new Set(['in_transit', 'dropping_off'])

const DELIVERED_STATUSES = new Set(['delivered'])

const FAILED_STATUSES = new Set(['cancelled', 'returned', 'rejected', 'courier_not_found', 'disposed'])

function verifyBiteshipSignature(headers: Headers): { valid: boolean; reason?: string } {
  const key = Deno.env.get('BITESHIP_WEBHOOK_SIGNATURE_KEY')
  const secret = Deno.env.get('BITESHIP_WEBHOOK_SIGNATURE_SECRET')

  if (!key || !secret) {
    console.error('Biteship webhook: BITESHIP_WEBHOOK_SIGNATURE_KEY/SECRET not configured — rejecting all requests.')
    return { valid: false, reason: 'signature_not_configured' }
  }

  const received = headers.get(key)
  if (!received) {
    return { valid: false, reason: 'signature_header_missing' }
  }

  if (received.length !== secret.length) {
    return { valid: false, reason: 'signature_mismatch' }
  }
  const encoder = new TextEncoder()
  const a = encoder.encode(received)
  const b = encoder.encode(secret)
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i]
  }
  if (diff !== 0) {
    return { valid: false, reason: 'signature_mismatch' }
  }
  return { valid: true }
}

async function lookupOrder(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  payload: Record<string, unknown>,
) {
  const biteshipOrderId = String(payload.order_id || '').trim()
  const referenceId = String(payload.reference_id || '').trim()

  if (!biteshipOrderId && !referenceId) {
    return { order: null, lookupMethod: null as string | null }
  }

  if (biteshipOrderId) {
    const { data: order } = await supabase
      .from('checkout_orders')
      .select('*')
      .eq('biteship_order_id', biteshipOrderId)
      .maybeSingle()

    if (order) return { order, lookupMethod: 'biteship_order_id' }
  }

  if (referenceId) {
    const { data: order } = await supabase
      .from('checkout_orders')
      .select('*')
      .eq('order_number', referenceId)
      .maybeSingle()

    if (order) return { order, lookupMethod: 'reference_id' }
  }

  return { order: null, lookupMethod: biteshipOrderId ? 'biteship_order_id' : 'reference_id' }
}

async function isRecentDuplicate(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  orderId: string,
  providerOrderId: string,
  eventType: string,
  status: string | null,
): Promise<boolean> {
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('checkout_shipment_events')
    .select('id')
    .eq('order_id', orderId)
    .eq('provider_order_id', providerOrderId)
    .eq('event_type', eventType)
    .gte('created_at', windowStart)
    .limit(1)

  query = status ? query.eq('status', status) : query.is('status', null)
  const { data: recent } = await query

  return Boolean(recent && recent.length > 0)
}

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options

  if (req.method !== 'POST') {
    return new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } })
  }

  const body = await readJson(req).catch(() => ({}))
  const event = String(body.event || '').trim()

  if (!event) {
    return new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } })
  }

  const supabase = createSupabaseAdmin()

  try {
    const sigResult = verifyBiteshipSignature(req.headers)
    if (!sigResult.valid) {
      console.error('Biteship webhook signature invalid', { reason: sigResult.reason })
      return jsonResponse({ success: false, error: 'Signature tidak valid.' }, 403)
    }

    const { order, lookupMethod } = await lookupOrder(supabase, body)
    const biteshipOrderId = String(body.order_id || '')
    const payloadStatus = String(body.status || '').trim() || null

    if (order) {
      const duplicate = await isRecentDuplicate(supabase, order.id, biteshipOrderId, event, payloadStatus)
      if (duplicate) {
        return jsonResponse({ success: true, status: 'duplicate_skipped' })
      }
    }

    await supabase.from('checkout_shipment_events').insert({
      order_id: order?.id || null,
      provider_order_id: biteshipOrderId || null,
      event_type: event,
      status: payloadStatus,
      payload: body,
    })

    if (!order) {
      console.warn('Biteship webhook: order not found', {
        event,
        biteshipOrderId,
        lookupMethod,
        referenceId: payload.reference_id || null,
      })
      return jsonResponse({ success: true, status: 'order_not_found_logged' })
    }

    switch (event) {
      case 'order.status':
        return await handleOrderStatus(supabase, order, body, payloadStatus)
      case 'order.waybill_id':
        return await handleOrderWaybill(supabase, order, body, payloadStatus)
      case 'order.price':
        return await handleOrderPrice(supabase, order, body, payloadStatus)
      default:
        console.warn('Biteship webhook: unknown event', { event })
        return jsonResponse({ success: true, status: 'unknown_event_logged' })
    }
  } catch (error) {
    console.error('biteship-webhook failed', error)
    return jsonResponse({ success: false, error: safeApiError(error, 'Webhook Biteship gagal.') }, 500)
  }
})


async function handleOrderStatus(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  order: Record<string, unknown>,
  payload: Record<string, unknown>,
  status: string | null,
) {
  const internalStatus = status ? BITESHIP_TO_SHIPMENT_STATUS[status] : null
  const courierWaybillId = String(payload.courier_waybill_id || '').trim() || null
  const courierTrackingId = String(payload.courier_tracking_id || '').trim() || null

  const update: Record<string, unknown> = {}

  if (internalStatus && internalStatus !== order.shipment_status) {
    update.shipment_status = internalStatus
  }

  if (courierWaybillId && courierWaybillId !== order.biteship_waybill_id) {
    update.biteship_waybill_id = courierWaybillId
  }

  if (status && IN_TRANSIT_STATUSES.has(status) && order.status !== 'shipped' && order.status !== 'completed') {
    update.status = 'shipped'
    update.shipped_at = new Date().toISOString()
  }

  if (status && DELIVERED_STATUSES.has(status) && order.status !== 'completed') {
    update.status = 'completed'
    if (!order.shipped_at) {
      update.shipped_at = new Date().toISOString()
    }
  }

  if (status && FAILED_STATUSES.has(status) && order.status !== 'completed' && order.status !== 'refunded') {
    update.status = 'cancelled'
  }

  const existingMetadata = (order.metadata as Record<string, unknown>) || {}
  update.metadata = {
    ...existingMetadata,
    biteship_last_event: 'order.status',
    biteship_last_status: status,
    biteship_courier_company: String(payload.courier_company || existingMetadata.biteship_courier_company || ''),
    biteship_courier_type: String(payload.courier_type || existingMetadata.biteship_courier_type || ''),
    biteship_courier_tracking_id: courierTrackingId || existingMetadata.biteship_courier_tracking_id || null,
    biteship_last_update: new Date().toISOString(),
  }

  if (Object.keys(update).length === 0 || (Object.keys(update).length === 1 && update.metadata)) {
    await supabase
      .from('checkout_orders')
      .update(update)
      .eq('id', order.id)
    return jsonResponse({ success: true, status: 'no_status_change_metadata_updated' })
  }

  await supabase
    .from('checkout_orders')
    .update(update)
    .eq('id', order.id)

  return jsonResponse({
    success: true,
    status: internalStatus || 'unknown_status',
    orderId: order.id,
    waybillUpdated: Boolean(courierWaybillId && courierWaybillId !== order.biteship_waybill_id),
  })
}

async function handleOrderWaybill(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  order: Record<string, unknown>,
  payload: Record<string, unknown>,
  status: string | null,
) {
  const courierWaybillId = String(payload.courier_waybill_id || '').trim() || null

  const update: Record<string, unknown> = {}

  if (courierWaybillId && courierWaybillId !== order.biteship_waybill_id) {
    update.biteship_waybill_id = courierWaybillId
  }

  if (status) {
    const internalStatus = BITESHIP_TO_SHIPMENT_STATUS[status]
    if (internalStatus && internalStatus !== order.shipment_status) {
      update.shipment_status = internalStatus
    }
  }

  const existingMetadata = (order.metadata as Record<string, unknown>) || {}
  update.metadata = {
    ...existingMetadata,
    biteship_last_event: 'order.waybill_id',
    biteship_courier_tracking_id: String(payload.courier_tracking_id || existingMetadata.biteship_courier_tracking_id || ''),
    biteship_last_update: new Date().toISOString(),
  }

  await supabase
    .from('checkout_orders')
    .update(update)
    .eq('id', order.id)

  return jsonResponse({
    success: true,
    status: 'waybill_updated',
    orderId: order.id,
    waybillId: courierWaybillId,
  })
}

async function handleOrderPrice(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  order: Record<string, unknown>,
  payload: Record<string, unknown>,
  status: string | null,
) {
  const existingMetadata = (order.metadata as Record<string, unknown>) || {}
  const priceHistory = (existingMetadata.biteship_price_history as unknown[]) || []

  priceHistory.push({
    price: Number(payload.price || 0),
    shipping_fee: Number(payload.shippment_fee || 0),
    proof_of_delivery_fee: Number(payload.proof_of_delivery_fee || 0),
    cod_fee: Number(payload.cash_on_delivery_fee || 0),
    status: status,
    updated_at: new Date().toISOString(),
  })

  const update: Record<string, unknown> = {
    metadata: {
      ...existingMetadata,
      biteship_last_event: 'order.price',
      biteship_last_price: Number(payload.price || 0),
      biteship_last_update: new Date().toISOString(),
      biteship_price_history: priceHistory,
    },
  }

  if (status) {
    const internalStatus = BITESHIP_TO_SHIPMENT_STATUS[status]
    if (internalStatus && internalStatus !== order.shipment_status) {
      update.shipment_status = internalStatus
    }
  }

  const courierWaybillId = String(payload.courier_waybill_id || '').trim() || null
  if (courierWaybillId && courierWaybillId !== order.biteship_waybill_id) {
    update.biteship_waybill_id = courierWaybillId
  }

  await supabase
    .from('checkout_orders')
    .update(update)
    .eq('id', order.id)

  return jsonResponse({
    success: true,
    status: 'price_updated',
    orderId: order.id,
    price: Number(payload.price || 0),
  })
}
