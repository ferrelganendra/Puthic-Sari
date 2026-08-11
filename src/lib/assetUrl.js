const SUPABASE_BASE =
  'https://dlduhrsrulsebyrnjdlf.supabase.co/storage/v1/object/public'

export function productImageUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) return localPath
  if (!localPath.startsWith('/product-photos/')) return localPath
  const path = localPath.replace(/^\//, '')
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return `${SUPABASE_BASE}/product-images/${encoded}`
}

export function productImageUrls(paths) {
  if (!Array.isArray(paths)) return []
  return paths.map(productImageUrl)
}

export function productThumbnailUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) return localPath
  if (!localPath.startsWith('/product-thumbs/')) return localPath
  const path = localPath.replace(/^\//, '')
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return `${SUPABASE_BASE}/product-images/${encoded}`
}

export function bannerUrl(name) {
  if (!name || typeof name !== 'string') return name
  if (name.startsWith('http')) return name
  const file = name.replace(/^\//, '')
  return `${SUPABASE_BASE}/banners/${file}`
}

export function siteAssetUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) return localPath
  const path = localPath.replace(/^\//, '')
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return `${SUPABASE_BASE}/site-assets/${encoded}`
}

export function videoUrl(localPath) {
  if (!localPath || typeof localPath !== 'string') return localPath
  if (localPath.startsWith('http')) return localPath
  const path = localPath.replace(/^\//, '')
  return `${SUPABASE_BASE}/videos/${path}`
}
