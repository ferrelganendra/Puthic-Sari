const SUPABASE_BASE =
  'https://dlduhrsrulsebyrnjdlf.supabase.co/storage/v1/object/public'

// Proxy lokal Vercel -> cache CDN. Turunkan egress Supabase.
const PROXY_BASE = '/api/img'

// Ubah URL absolut Supabase -> path proxy. URL non-Supabase dibiarkan.
function toProxyUrl(urlOrPath) {
  if (urlOrPath.startsWith(SUPABASE_BASE)) {
    return urlOrPath.slice(SUPABASE_BASE.length).replace(/^\//, '')
  }
  return urlOrPath.replace(/^\//, '')
}

function viaProxy(urlOrPath) {
  return `${PROXY_BASE}/${toProxyUrl(urlOrPath)}`
}

export function productImageUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) {
    return localPath.startsWith(SUPABASE_BASE) ? viaProxy(localPath) : localPath
  }
  if (!localPath.startsWith('/product-photos/')) return localPath
  const path = localPath.replace(/^\//, '')
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return viaProxy(`product-images/${encoded}`)
}

export function productImageUrls(paths) {
  if (!Array.isArray(paths)) return []
  return paths.map(productImageUrl)
}

export function productThumbnailUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) {
    return localPath.startsWith(SUPABASE_BASE) ? viaProxy(localPath) : localPath
  }
  if (!localPath.startsWith('/product-thumbs/')) return localPath
  const path = localPath.replace(/^\//, '')
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return viaProxy(`product-images/${encoded}`)
}

export function bannerUrl(name) {
  if (!name || typeof name !== 'string') return name
  if (name.startsWith('http')) {
    return name.startsWith(SUPABASE_BASE) ? viaProxy(name) : name
  }
  const file = name.replace(/^\//, '')
  return viaProxy(`banners/${file}`)
}

export function siteAssetUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) {
    return localPath.startsWith(SUPABASE_BASE) ? viaProxy(localPath) : localPath
  }
  const path = localPath.replace(/^\//, '')
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return viaProxy(`site-assets/${encoded}`)
}

export function videoUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) return localPath
  const path = localPath.replace(/^\//, '')
  // ponytail: video langsung Supabase (Range/seek butuh support; 1 file, impact egress kecil)
  return `${SUPABASE_BASE}/videos/${path}`
}
