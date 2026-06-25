import { sendJson } from '../_biteship.js'

export default async function handler(_req, res) {
  sendJson(res, 410, {
    success: false,
    error: 'Endpoint lama dinonaktifkan. Gunakan Supabase Edge Function create-payment supaya shipment hanya dibuat setelah pembayaran terverifikasi.',
  })
}
