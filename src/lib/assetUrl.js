import imagekitAssets from '../data/imagekitAssets.js'

const SUPABASE_BASE =
  'https://dlduhrsrulsebyrnjdlf.supabase.co/storage/v1/object/public'
const IMAGEKIT_BASE = (
  import.meta.env?.VITE_IMAGEKIT_URL_ENDPOINT
  || (typeof process !== 'undefined' ? process.env.VITE_IMAGEKIT_URL_ENDPOINT : '')
  || ''
).replace(/\/$/, '')
const PROXY_BASE = '/api/img?p='

function imageKitUrl(storageKey) {
  const path = imagekitAssets[storageKey]
  return IMAGEKIT_BASE && path ? `${IMAGEKIT_BASE}/${path}` : null
}

function imageKitOrProxy(...storageKeys) {
  for (const storageKey of storageKeys) {
    const imageUrl = imageKitUrl(storageKey)
    if (imageUrl) return imageUrl
  }
  return viaProxy(storageKeys[0])
}

function imageKitKeyFromSupabase(url) {
  if (!url.startsWith(SUPABASE_BASE)) return null
  const encodedPath = url.slice(SUPABASE_BASE.length).replace(/^\//, '')
  try {
    return decodeURIComponent(encodedPath)
  } catch {
    return encodedPath
  }
}

function migratedUrl(url) {
  const key = imageKitKeyFromSupabase(url)
  return key ? imageKitUrl(key) : null
}

// Ubah URL absolut Supabase -> path proxy. URL non-Supabase dibiarkan.
function toProxyPath(urlOrPath) {
  if (urlOrPath.startsWith(SUPABASE_BASE)) {
    return urlOrPath.slice(SUPABASE_BASE.length).replace(/^\//, '')
  }
  return urlOrPath.replace(/^\//, '')
}

function viaProxy(urlOrPath) {
  const p = toProxyPath(urlOrPath)
  // Normalisasi: decode dulu (DB simpan path udah encoded), encode sekali.
  // Cegah double-encode (%20 -> %2520) yang bikin Supabase 404.
  let normalized
  try {
    normalized = decodeURIComponent(p)
  } catch {
    normalized = p
  }
  return `${PROXY_BASE}${encodeURIComponent(normalized)}`
}

export function productImageUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) {
    return localPath.startsWith(SUPABASE_BASE) ? migratedUrl(localPath) || viaProxy(localPath) : localPath
  }
  if (!localPath.startsWith('/product-photos/')) return localPath
  const path = localPath.replace(/^\//, '')
  return imageKitOrProxy(`product-images/${path}`)
}

export function productImageUrls(paths) {
  if (!Array.isArray(paths)) return []
  return paths.map(productImageUrl)
}

export function productThumbnailUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) {
    return localPath.startsWith(SUPABASE_BASE) ? migratedUrl(localPath) || viaProxy(localPath) : localPath
  }
  if (!localPath.startsWith('/product-thumbs/')) return localPath
  const path = localPath.replace(/^\//, '')
  return imageKitOrProxy(`product-images/${path}`)
}

export function bannerUrl(name) {
  if (!name || typeof name !== 'string') return name
  if (name.startsWith('http')) {
    return name.startsWith(SUPABASE_BASE) ? migratedUrl(name) || viaProxy(name) : name
  }
  const file = name.replace(/^\//, '')
  return imageKitOrProxy(`banners/${file}`, `product-images/banners/${file}`)
}

export function siteAssetUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) {
    return localPath.startsWith(SUPABASE_BASE) ? migratedUrl(localPath) || viaProxy(localPath) : localPath
  }
  const path = localPath.replace(/^\//, '')
  return imageKitOrProxy(`site-assets/${path}`)
}

export function videoUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) {
    return localPath.startsWith(SUPABASE_BASE) ? migratedUrl(localPath) || localPath : localPath
  }
  const path = localPath.replace(/^\//, '')
  return imageKitUrl(`videos/${path}`) || `${SUPABASE_BASE}/videos/${path}`
}
