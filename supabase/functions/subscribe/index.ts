import { createSupabaseAdmin } from '../_shared/supabase.ts'
import { handleOptions, jsonResponse, readJson, safeApiError } from '../_shared/http.ts'
import { enforceRateLimit } from '../_shared/security.ts'

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method tidak diizinkan.' }, 405)

  const supabase = createSupabaseAdmin()

  try {
    await enforceRateLimit(req, 'subscribe', 5, 600)
    const body = await readJson(req)
    const email = String(body.email || '').trim().toLowerCase().slice(0, 254)
    const source = String(body.source || 'footer').trim().slice(0, 40)

    if (!email) {
      return jsonResponse({ success: false, error: 'Email harus diisi.' }, 400)
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ success: false, error: 'Format email tidak valid.' }, 400)
    }

    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, is_active')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      if (existing.is_active) {
        return jsonResponse({ success: true, message: 'Email sudah terdaftar.', status: 'already_subscribed' })
      }

      await supabase
        .from('subscribers')
        .update({ is_active: true, unsubscribed_at: null, source, updated_at: new Date().toISOString() })
        .eq('id', existing.id)

      return jsonResponse({ success: true, message: 'Berlangganan diaktifkan kembali.', status: 'resubscribed' })
    }

    const { error: insertError } = await supabase
      .from('subscribers')
      .insert({ email, source })

    if (insertError) {
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
