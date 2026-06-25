/**
 * notify.ts — Admin WhatsApp notification via Fonnte API.
 *
 * Fonnte (fonnte.com) is an Indonesian WA API service.
 * No monthly fee; pay-per-message (~IDR 300–500 per notification).
 *
 * Environment variables:
 *   FONNTE_TOKEN          — API token from fonnte.com dashboard
 *   FONNTE_TARGET_NUMBER  — Admin's WhatsApp number (e.g. 6285117606161)
 *
 * If either env var is missing, the function silently skips (no crash).
 */

const FONNTE_BASE_URL = 'https://api.fonnte.com/send'
const NOTIFICATION_TIMEOUT_MS = 5000

export async function sendAdminWhatsAppNotification(
  message: string,
): Promise<{ sent: boolean; reason?: string }> {
  const token = Deno.env.get('FONNTE_TOKEN')
  const target = Deno.env.get('FONNTE_TARGET_NUMBER')

  if (!token) return { sent: false, reason: 'FONNTE_TOKEN not configured' }
  if (!target) return { sent: false, reason: 'FONNTE_TARGET_NUMBER not configured' }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), NOTIFICATION_TIMEOUT_MS)

    const formData = new URLSearchParams()
    formData.set('target', target)
    formData.set('message', message)

    const response = await fetch(FONNTE_BASE_URL, {
      method: 'POST',
      headers: { Authorization: token },
      body: formData,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const text = await response.text().catch(() => 'unknown')
      console.error('Fonnte notification failed', response.status, text)
      return { sent: false, reason: `HTTP ${response.status}` }
    }

    console.log('Fonnte notification sent to admin')
    return { sent: true }
  } catch (error) {
    console.error('Fonnte notification error', error)
    return { sent: false, reason: error instanceof Error ? error.message : 'unknown' }
  }
}

export function formatNewOrderMessage(order: {
  order_number?: string
  customer_name?: string
  customer_phone?: string
  total_amount?: number | string
  selected_courier?: Record<string, unknown>
}) {
  const courier = order.selected_courier as Record<string, unknown> | null
  const courierLabel = courier
    ? `${courier.courierCompany || ''} - ${courier.courierServiceName || courier.courierService || ''}`.trim()
    : '-'

  const total = typeof order.total_amount === 'number'
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.total_amount)
    : order.total_amount || '-'

  const lines = [
    '🌸 *ORDER BARU — Puthic Sari*',
    '',
    `📦 Order: *${order.order_number || '-'}*`,
    `👤 Nama: ${order.customer_name || '-'}`,
    `📱 WA: ${order.customer_phone || '-'}`,
    `💰 Total: ${total}`,
    `🚚 Kurir: ${courierLabel}`,
    '',
    'Cek dashboard admin untuk detail lengkap.',
  ]

  return lines.join('\n')
}
