import { searchAreas } from '../_shared/biteship.ts'
import { apiError, handleOptions, jsonResponse, readJson } from '../_shared/http.ts'
import { enforceRateLimit } from '../_shared/security.ts'

Deno.serve(async (req) => {
  const options = handleOptions(req)
  if (options) return options
  if (req.method !== 'POST') return jsonResponse({ success: false, error: 'Method tidak diizinkan.' }, 405, req)

  try {
    await enforceRateLimit(req, 'biteship-areas', 30)
    const body = await readJson(req)
    const input = String(body.input || '').trim()
    const areas = await searchAreas(input)
    return jsonResponse({ success: true, areas }, 200, req)
  } catch (error) {
    console.error('biteship-areas failed', error)
    return jsonResponse({ success: false, error: apiError(error, 'Gagal mencari area Biteship.') }, 400, req)
  }
})
