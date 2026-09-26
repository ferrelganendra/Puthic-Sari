// Proxy gambar Supabase + ImageKit -> Vercel CDN cache.
// Tujuan: gambar disajikan lewat domain sendiri (bebas blokir ISP) dan di-cache di Vercel Edge.
// Route: /api/img?p=<path>
import imagekitAssets from '../src/data/imagekitAssets.js'

const SUPABASE_PROJECT = 'dlduhrsrulsebyrnjdlf'
const IMAGEKIT_ENDPOINT = (
  (typeof process !== 'undefined' && process.env?.VITE_IMAGEKIT_URL_ENDPOINT)
  || 'https://ik.imagekit.io/fqdpfuwjf'
).replace(/\/$/, '')

const ALLOWED_ROOTS = new Set([
  'product-images',
  'banners',
  'site-assets',
  'videos',
  'migrated',
  'products',
])

const BAD_CHARS = /[\\:*?"<>|\x00-\x1f]/

function escapeHeader(v) {
  return String(v).replace(/[\r\n]/g, '')
}

async function safeFetch(url) {
  try {
    return await fetch(url, {
      redirect: 'follow',
      headers: { accept: '*/*' },
    })
  } catch (err) {
    if (url.includes('ik.imagekit.io')) {
      try {
        const dohRes = await fetch('https://cloudflare-dns.com/dns-query?name=ik.imagekit.io&type=A', {
          headers: { accept: 'application/dns-json' },
        })
        const data = await dohRes.json()
        const ip = data.Answer?.find((a) => a.type === 1)?.data
        if (ip) {
          const https = await import('node:https')
          const parsed = new URL(url)
          return await new Promise((resolve, reject) => {
            const req = https.request({
              hostname: ip,
              port: 443,
              path: parsed.pathname + parsed.search,
              method: 'GET',
              headers: {
                Host: 'ik.imagekit.io',
                'User-Agent': 'curl/7.68.0',
                accept: '*/*',
              },
              servername: 'ik.imagekit.io',
            }, (res) => {
              const chunks = []
              res.on('data', (c) => chunks.push(c))
              res.on('end', () => {
                const body = Buffer.concat(chunks)
                resolve({
                  ok: res.statusCode >= 200 && res.statusCode < 300,
                  status: res.statusCode,
                  headers: {
                    get(name) { return res.headers[name.toLowerCase()] || null },
                  },
                  arrayBuffer: async () => body,
                })
              })
            })
            req.on('error', reject)
            req.end()
          })
        }
      } catch {
        // Fall through
      }
    }
    throw err
  }
}

export default async function handler(req, res) {
  let rawPath = req.query?.p || req.query?.path || ''

  if (!rawPath) {
    res.statusCode = 404
    res.end('Not found')
    return
  }

  // Normalisasi jika menerima URL absolut
  if (rawPath.startsWith('https://ik.imagekit.io/')) {
    const afterOrigin = rawPath.slice('https://ik.imagekit.io/'.length)
    const firstSlash = afterOrigin.indexOf('/')
    rawPath = firstSlash !== -1 ? afterOrigin.slice(firstSlash + 1) : afterOrigin
  } else if (rawPath.startsWith(`https://${SUPABASE_PROJECT}.supabase.co/storage/v1/object/public/`)) {
    rawPath = rawPath.slice(`https://${SUPABASE_PROJECT}.supabase.co/storage/v1/object/public/`.length)
  }

  rawPath = rawPath.replace(/^\//, '')

  const [root, ...rest] = rawPath.split('/')
  if (!ALLOWED_ROOTS.has(root)) {
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

  const objectPath = segments.map(encodeURIComponent).join('/')

  // Tentukan kandidat upstream
  const upstreams = []

  if (root === 'migrated' || root === 'products') {
    upstreams.push(`${IMAGEKIT_ENDPOINT}/${root}/${objectPath}`)
  } else {
    // Cek apakah ada di mapping ImageKit
    const mapped = imagekitAssets[rawPath]
    if (mapped) {
      upstreams.push(`${IMAGEKIT_ENDPOINT}/${mapped}`)
    }
    // Fallback atau default ke Supabase
    upstreams.push(`https://${SUPABASE_PROJECT}.supabase.co/storage/v1/object/public/${root}/${objectPath}`)
  }

  for (const upstream of upstreams) {
    try {
      const upstreamRes = await safeFetch(upstream)
      if (upstreamRes.ok) {
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
        return
      }
    } catch {
      // Coba upstream berikutnya
    }
  }

  res.statusCode = 404
  res.end('Not found')
}
