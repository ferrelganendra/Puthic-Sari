import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { handleOptions, jsonResponse, readJson, safeApiError } from '../_shared/http.ts'

// --- Status mapping: Biteship → our internal shipment_status on checkout_orders ---
// Biteship status flow (14 values):
//   confirmed → scheduled → allocated → picking_up → picked → in_transit → dropping_off → delivered
//   Terminal errors: cancelled, on_hold, return_in_transit, returned, rejected, courier_not_found, disposed
const BITESHIP_TO_SHIPMENT_STATUS: Record<string, string> = {
  // Active states (courier is picking up / shipping)
  confirmed: 'created',          // Order confirmed, AWB generated
  scheduled: 'scheduled',        // Courier scheduled
  allocated: 'allocated',        // Courier assigned, waiting to pick up
  picking_up: 'picking_up',      // Courier on the way to pick up
  picked: 'picked',              // Package picked up
  in_transit: 'in_transit',      // In transit (middle mile)
  dropping_off: 'dropping_off',  // Courier delivering to customer (last mile)
  // Terminal states
  delivered: 'delivered',        // Package delivered
  cancelled: 'cancelled',        // Order cancelled
  returned: 'returned',          // Package returned to sender
  rejected: 'rejected',          // Order rejected (e.g. wrong address)
  courier_not_found: 'courier_not_found', // No courier available
  disposed: 'disposed',          // Package disposed/destroyed
  on_hold: 'on_hold',            // On hold (will ship after resolved)
  return_in_transit: 'return_in_transit', // Return to sender in transit
}

// Biteship statuses where the package is actively in transit → set order.status='shipped'
const IN_TRANSIT_STATUSES = new Set(['in_transit', 'dropping_off'])

// Biteship statuses that mean the order is fully delivered → set order.status='completed'
const DELIVERED_STATUSES = new Set(['delivered'])

// Biteship statuses that mean the order is a terminal failure → set order.status='cancelled'
const FAILED_STATUSES = new Set(['cancelled', 'returned', 'rejected', 'courier_not_found', 'disposed'])

// --- Signature verification ---
// Biteship's webhook security: a static custom header pair configured in the dashboard.
//   BITESHIP_WEBHOOK_SIGNATURE_KEY   = the header NAME Biteship sends (e.g. "X-Biteship-Signature")
//   BITESHIP_WEBHOOK_SIGNATURE_SECRET = the secret header VALUE (only Biteship + this server know it)
//
// This is NOT HMAC — Biteship sends the secret verbatim in the named header.
// We verify it with a timing-safe comparison to prevent timing attacks.
// This function is deployed with --no-verify-jwt, so the Supabase gateway does NOT
// require an Authorization header. The ONLY authentication is this custom header.
function verifyBiteshipSignature(headers: Headers): { valid: boolean; reason?: string } {
  const key = Deno.env.get('BITESHIP_WEBHOOK_SIGNATURE_KEY')
  const secret = Deno.env.get('BITESHIP_WEBHOOK_SIGNATURE_SECRET')

  if (!key || !secret) {
    // This should never happen in production — secrets must be set.
    // Reject all requests rather than accepting unauthenticated ones.
    console.error('Biteship webhook: BITESHIP_WEBHOOK_SIGNATURE_KEY/SECRET not configured — rejecting all requests.')
    return { valid: false, reason: 'signature_not_configured' }
  }

  const received = headers.get(key)
  if (!received) {
    return { valid: false, reason: 'signature_header_missing' }
  }

  // Timing-safe comparison to prevent timing side-channel attacks
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

// --- Order lookup ---
// Primary: match checkout_orders.biteship_order_id = payload.order_id
// Fallback: if payload contains reference_id (our order_number), match by that
async function lookupOrder(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  payload: Record<string, unknown>,
) {
  const biteshipOrderId = String(payload.order_id || '').trim()
  const referenceId = String(payload.reference_id || '').trim()

  if (!biteshipOrderId && !referenceId) {
    return { order: null, lookupMethod: null as string | null }
  }

  // Try 1: biteship_order_id (most reliable, already stored by midtrans-webhook)
  if (biteshipOrderId) {
    const { data: order } = await supabase
      .from('checkout_orders')
      .select('*')
      .eq('biteship_order_id', biteshipOrderId)
      .maybeSingle()

    if (order) return { order, lookupMethod: 'biteship_order_id' }
  }

  // Try 2: reference_id (= our order_number, set when createShipment is called)
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

// --- Idempotency check ---
// Returns true if an event with the same (provider_order_id + event_type + status) was logged
// within the last 24 hours. This catches delayed duplicate deliveries from Biteship's retry mechanism.
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

// --- Main handler ---
Deno.serve(async (req) => {
  // Accept server-to-server POST from Biteship (no origin header needed)
  // Also handle OPTIONS for safety (some HTTP clients send preflight)
  const options = handleOptions(req)
  if (options) return options
  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method tidak diizinkan.' }, 405)
  }

  const supabase = createSupabaseAdmin()

  try {
    // 1. Verify signature
    const sigResult = verifyBiteshipSignature(req.headers)
    if (!sigResult.valid) {
      console.error('Biteship webhook signature invalid', { reason: sigResult.reason })
      return jsonResponse({ success: false, error: 'Signature tidak valid.' }, 403)
    }

    // 2. Parse payload
    const payload = await readJson(req)
    const event = String(payload.event || '').trim()

    if (!event) {
      return jsonResponse({ success: false, error: 'Field "event" wajib diisi.' }, 400)
    }

    // 3. Lookup order in our database
    const { order, lookupMethod } = await lookupOrder(supabase, payload)
    const biteshipOrderId = String(payload.order_id || '')
    const payloadStatus = String(payload.status || '').trim() || null

    // 4. Idempotency: check BEFORE logging, so we don't match the event we're about to insert
    if (order) {
      const duplicate = await isRecentDuplicate(supabase, order.id, biteshipOrderId, event, payloadStatus)
      if (duplicate) {
        return jsonResponse({ success: true, status: 'duplicate_skipped' })
      }
    }

    // 5. Log the raw event for audit trail (after dedup check, so the insert doesn't match itself)
    await supabase.from('checkout_shipment_events').insert({
      order_id: order?.id || null,
      provider_order_id: biteshipOrderId || null,
      event_type: event,
      status: payloadStatus,
      payload,
    })

    if (!order) {
      console.warn('Biteship webhook: order not found', {
        event,
        biteshipOrderId,
        lookupMethod,
        referenceId: payload.reference_id || null,
      })
      // Return 200 to Biteship so they don't retry — we logged the event for admin review
      return jsonResponse({ success: true, status: 'order_not_found_logged' })
    }

    // 6. Route to handler based on event type
    switch (event) {
      case 'order.status':
        return await handleOrderStatus(supabase, order, payload, payloadStatus)
      case 'order.waybill_id':
        return await handleOrderWaybill(supabase, order, payload, payloadStatus)
      case 'order.price':
        return await handleOrderPrice(supabase, order, payload, payloadStatus)
      default:
        console.warn('Biteship webhook: unknown event', { event })
        return jsonResponse({ success: true, status: 'unknown_event_logged' })
    }
  } catch (error) {
    console.error('biteship-webhook failed', error)
    return jsonResponse({ success: false, error: safeApiError(error, 'Webhook Biteship gagal.') }, 500)
  }
})

// --- Event handlers ---

async function handleOrderStatus(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  order: Record<string, unknown>,
  payload: Record<string, unknown>,
  status: string | null,
) {
  const internalStatus = status ? BITESHIP_TO_SHIPMENT_STATUS[status] : null
  const courierWaybillId = String(payload.courier_waybill_id || '').trim() || null
  const courierTrackingId = String(payload.courier_tracking_id || '').trim() || null

  // Build update object
  const update: Record<string, unknown> = {}

  // Update shipment_status to the mapped Biteship status
  if (internalStatus && internalStatus !== order.shipment_status) {
    update.shipment_status = internalStatus
  }

  // If waybill ID is present and new, update it
  if (courierWaybillId && courierWaybillId !== order.biteship_waybill_id) {
    update.biteship_waybill_id = courierWaybillId
  }

  // If the order is in transit (shipped, but not yet delivered), update order status to 'shipped'
  // and set shipped_at. This matches the customer-facing flow:
  //   processing (being prepared) → shipped (in transit) → completed (delivered)
  if (status && IN_TRANSIT_STATUSES.has(status) && order.status !== 'shipped' && order.status !== 'completed') {
    update.status = 'shipped'
    update.shipped_at = new Date().toISOString()
  }

  // If the order is delivered, update order status to 'completed' (preserve shipped_at)
  if (status && DELIVERED_STATUSES.has(status) && order.status !== 'completed') {
    update.status = 'completed'
    if (!order.shipped_at) {
      // If shipped transition was missed somehow, fall back to now
      update.shipped_at = new Date().toISOString()
    }
  }

  // If the order hit a terminal failure, mark as cancelled (but only if still active)
  if (status && FAILED_STATUSES.has(status) && order.status !== 'completed' && order.status !== 'refunded') {
    update.status = 'cancelled'
  }

  // Store courier details in metadata for admin visibility
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
    // Nothing meaningful to update (metadata-only update still worth saving for audit)
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

  // Some waybill events also carry a status update
  if (status) {
    const internalStatus = BITESHIP_TO_SHIPMENT_STATUS[status]
    if (internalStatus && internalStatus !== order.shipment_status) {
      update.shipment_status = internalStatus
    }
  }

  // Update metadata
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
  // Price update: the actual shipping cost may differ from the quoted rate.
  // We store this in metadata for admin reconciliation; we do NOT change shipping_amount
  // because the customer has already been charged the quoted amount.
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

  // If the event also carries a status change
  if (status) {
    const internalStatus = BITESHIP_TO_SHIPMENT_STATUS[status]
    if (internalStatus && internalStatus !== order.shipment_status) {
      update.shipment_status = internalStatus
    }
  }

  // Waybill update if present
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
