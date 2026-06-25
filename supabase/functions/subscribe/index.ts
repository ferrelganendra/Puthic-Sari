/**
 * subscribe — Public Edge Function for newsletter subscribe.
 *
 * Accepts a POST with { email, source? }.
 * Inserts into public.subscribers table if email is not already subscribed.
 * Handles duplicates gracefully: returns success if already subscribed.
 *
 * Security:
 * - No auth required (public endpoint)
 * - Rate limiting: rely on Supabase project-level DDoS protection
 * - RLS allows anon INSERT into subscribers
 */

import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { handleOptions, jsonResponse, readJson, safeApiError } from '../_shared/http.ts'

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method tidak diizinkan.' }, 405)

  const supabase = createSupabaseAdmin()

  try {
    const body = await readJson(req)
    const email = String(body.email || '').trim().toLowerCase()
    const source = String(body.source || 'footer').trim()

    // Validate email
    if (!email) {
      return jsonResponse({ success: false, error: 'Email harus diisi.' }, 400)
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ success: false, error: 'Format email tidak valid.' }, 400)
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, is_active')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      // Already subscribed and active — return success (idempotent)
      if (existing.is_active) {
        return jsonResponse({ success: true, message: 'Email sudah terdaftar.', status: 'already_subscribed' })
      }

      // Was previously unsubscribed — re-activate
      await supabase
        .from('subscribers')
        .update({ is_active: true, unsubscribed_at: null, source, updated_at: new Date().toISOString() })
        .eq('id', existing.id)

      return jsonResponse({ success: true, message: 'Berlangganan diaktifkan kembali.', status: 'resubscribed' })
    }

    // New subscriber
    const { error: insertError } = await supabase
      .from('subscribers')
      .insert({ email, source })

    if (insertError) {
      // Handle unique constraint violation gracefully
      if (insertError.code === '23505') {
        return jsonResponse({ success: true, message: 'Email sudah terdaftar.', status: 'already_subscribed' })
      }
      throw insertError
    }

    return jsonResponse({
      success: true,
      message: 'Terima kasih sudah berlangganan!',
      status: 'subscribed',
    })
  } catch (error) {
    console.error('subscribe function error', error)
    return jsonResponse({ success: false, error: safeApiError(error, 'Gagal mendaftar. Coba lagi nanti.') }, 500)
  }
})
