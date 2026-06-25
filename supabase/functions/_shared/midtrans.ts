import { requireEnv } from './http.ts'

function isProduction() {
  return Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true'
}

function snapBaseUrl() {
  return isProduction()
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions'
}

function authHeader() {
  return `Basic ${btoa(`${requireEnv('MIDTRANS_SERVER_KEY')}:`)}`
}

export async function createSnapTransaction(payload: Record<string, unknown>) {
  const response = await fetch(snapBaseUrl(), {
    method: 'POST',
    headers: {
      authorization: authHeader(),
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(async () => ({ error_messages: [await response.text()] }))
  if (!response.ok) {
    const message = Array.isArray(data.error_messages) ? data.error_messages.join(' ') : 'Gagal membuat transaksi Midtrans.'
    throw new Error(message)
  }
  return data
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  const left = new TextEncoder().encode(a)
  const right = new TextEncoder().encode(b)
  let diff = 0
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i]
  return diff === 0
}

export async function verifyMidtransSignature(notification: Record<string, unknown>) {
  const orderId = String(notification.order_id || '')
  const statusCode = String(notification.status_code || '')
  const grossAmount = String(notification.gross_amount || '')
  const signature = String(notification.signature_key || '')
  const raw = `${orderId}${statusCode}${grossAmount}${requireEnv('MIDTRANS_SERVER_KEY')}`
  const bytes = new TextEncoder().encode(raw)
  const digest = await crypto.subtle.digest('SHA-512', bytes)
  const hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return timingSafeEqual(hash, signature)
}

export function isPaidNotification(notification: Record<string, unknown>) {
  const transactionStatus = String(notification.transaction_status || '')
  const fraudStatus = String(notification.fraud_status || '')
  if (transactionStatus === 'settlement') return true
  if (transactionStatus === 'capture' && fraudStatus !== 'deny') return true
  return false
}

export function isRefundNotification(notification: Record<string, unknown>) {
  return ['refund', 'partial_refund'].includes(String(notification.transaction_status || ''))
}

export async function getTransactionStatus(orderId: string) {
  const response = await fetch(`${snapBaseUrl()}/${orderId}/status`, {
    method: 'GET',
    headers: {
      authorization: authHeader(),
      accept: 'application/json',
    },
  })
  if (response.status === 404) return null
  const data = await response.json().catch(async () => null)
  if (!response.ok) throw new Error(`Midtrans status fetch failed: ${response.status}`)
  return data as Record<string, unknown> | null
}

export function isFailedNotification(notification: Record<string, unknown>) {
  return ['deny', 'cancel', 'expire', 'failure'].includes(String(notification.transaction_status || ''))
}
