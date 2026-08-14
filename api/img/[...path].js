// Proxy gambar Supabase -> Vercel CDN cache.
// Tujuan: egress Supabase cuma kena 1x per gambar; sisanya di-serve cache Vercel.
// Cache immutable: file storage tidak bisa di-overwrite dengan konten beda (object storage),
// jadi max-age panjang aman.
const SUPABASE_PROJECT = 'dlduhrsrulsebyrnjdlf'

const BUCKETS = new Set(['product-images', 'banners', 'site-assets', 'videos'])

// Vercel decode query params, jadi path di sini sudah decoded (spasi, +, dst).
const BAD_CHARS = /[\\:*?"<>|\x00-\x1f]/

function escapeHeader(v) {
  return String(v).replace(/[\r\n]/g, '')
}

export default async function handler(req, res) {
  const path = (req.query?.path || []).join('/')

  if (!path) {
    res.statusCode = 404
    res.end('Not found')
    return
  }

  const [bucket, ...rest] = path.split('/')
  if (!BUCKETS.has(bucket)) {
    res.statusCode = 404
    res.end('Not found')
    return
  }

  const segments = rest.filter((s) => s !== '')
  if (
    segments.length === 0 ||
    segments.some((s) => s === '..' || s === '.' || BAD_CHARS.test(s))
  ) {
    res.statusCode = 400
    res.end('Bad request')
    return
  }

  // ponytail: encode-decode roundtrip; filename dengan % literal di storage akan salah.
  // Belum ada kasus; kalau muncul, ganti sumber path ke req.url raw.
  const objectPath = segments.map(encodeURIComponent).join('/')

  const upstream = `https://${SUPABASE_PROJECT}.supabase.co/storage/v1/object/public/${bucket}/${objectPath}`

  try {
    const upstreamRes = await fetch(upstream, {
      redirect: 'follow',
      headers: { accept: '*/*' },
    })

    if (!upstreamRes.ok) {
      // Supabase storage return 400 (bukan 404) untuk object tidak ditemukan.
      res.statusCode = upstreamRes.status === 404 || upstreamRes.status === 400 ? 404 : 502
      res.end(res.statusCode === 404 ? 'Not found' : 'Upstream error')
      return
    }

    const headers = upstreamRes.headers
    res.statusCode = 200
    res.setHeader('cache-control', 'public, max-age=31536000, immutable')
    res.setHeader('content-type', escapeHeader(headers.get('content-type') || 'application/octet-stream'))
    const len = headers.get('content-length')
    if (len) res.setHeader('content-length', len)
    const etag = headers.get('etag')
    if (etag) res.setHeader('etag', etag)
    res.setHeader('x-content-type-options', 'nosniff')

    const buf = await upstreamRes.arrayBuffer()
    res.end(Buffer.from(buf))
  } catch {
    res.statusCode = 502
    res.end('Upstream error')
  }
}
