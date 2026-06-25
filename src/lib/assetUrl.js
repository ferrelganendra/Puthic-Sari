/**
 * Centralized Supabase Storage URL helpers.
 * 
 * All static assets that used to live in /public/ are now served from Supabase
 * Storage. Use these helpers to build URLs so we never hardcode the bucket
 * base or the URL-encoding rules in component code.
 */

const SUPABASE_BASE =
  'https://dlduhrsrulsebyrnjdlf.supabase.co/storage/v1/object/public'

/**
 * Convert a local "/product-photos/..." path to a full Supabase Storage URL.
 * Returns the input unchanged if it's already a full URL or not a product photo.
 */
export function productImageUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) return localPath
  if (!localPath.startsWith('/product-photos/')) return localPath
  const path = localPath.replace(/^\//, '')
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return `${SUPABASE_BASE}/product-images/${encoded}`
}

/**
 * Convert an array of product image paths. Convenience wrapper.
 */
export function productImageUrls(paths) {
  if (!Array.isArray(paths)) return []
  return paths.map(productImageUrl)
}

/**
 * Local "/product-thumbs/..." → Storage URL
 */
export function productThumbnailUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) return localPath
  if (!localPath.startsWith('/product-thumbs/')) return localPath
  const path = localPath.replace(/^\//, '')
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return `${SUPABASE_BASE}/product-images/${encoded}`
}

/**
 * Banner: "/poster-1.jpg" → Storage URL.
 * Use this for hero/poster images stored in the `banners` bucket.
 */
export function bannerUrl(name) {
  if (!name || typeof name !== 'string') return name
  if (name.startsWith('http')) return name
  // name may be "poster-1.jpg" or "/poster-1.jpg"
  const basename = name.replace(/^\//, '')
  return `${SUPABASE_BASE}/banners/${basename}`
}

/**
 * Site asset: "/footer/..." or "/logo.jpeg" → Storage URL.
 * site-assets bucket.
 */
export function siteAssetUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) return localPath
  const path = localPath.replace(/^\//, '')
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return `${SUPABASE_BASE}/site-assets/${encoded}`
}

/**
 * Videos: "/videos/..." → Storage URL.
 */
export function videoUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) return localPath
  const path = localPath.replace(/^\//, '')
  return `${SUPABASE_BASE}/videos/${path}`
}
