import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import fallbackProducts from '../src/data/products.js'
import { infoPageSlugs } from '../src/data/infoPages.js'
import { getProductPath } from '../src/lib/slugs.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const outputPath = resolve(rootDir, 'public', 'sitemap.xml')
const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://puthicsari.com').replace(/\/$/, '')
const today = new Date().toISOString().slice(0, 10)

const escapeXml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

const absoluteUrl = (path = '/') => {
  const value = String(path || '/')
  // Already a full URL (e.g. Supabase Storage) — return as-is, already encoded
  if (/^https?:\/\//i.test(value)) return value
  const url = `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`
  return encodeURI(url)
}

async function getProducts() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return fallbackProducts

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await supabase
      .from('products')
      .select('id,name,description,price,category,images,is_active')
      .eq('is_active', true)
      .order('id', { ascending: true })

    if (error) throw error
    return Array.isArray(data) && data.length > 0 ? data : fallbackProducts
  } catch (error) {
    console.warn(`Sitemap memakai produk lokal: ${error.message}`)
    return fallbackProducts
  }
}

const buildUrlNode = ({ loc, changefreq, priority, lastmod = today, image }) => {
  const imageNode = image?.loc ? `
    <image:image>
      <image:loc>${escapeXml(absoluteUrl(image.loc))}</image:loc>
      ${image.title ? `<image:title>${escapeXml(image.title)}</image:title>` : ''}
    </image:image>` : ''

  return `  <url>
    <loc>${escapeXml(absoluteUrl(loc))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageNode}
  </url>`
}

const dedupeEntries = (entries) => {
  const seen = new Set()
  return entries.filter(entry => {
    const loc = absoluteUrl(entry.loc)
    if (seen.has(loc)) return false
    seen.add(loc)
    return true
  })
}

const products = await getProducts()
const entries = dedupeEntries([
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  ...infoPageSlugs.map(slug => ({ loc: `/${slug}`, changefreq: 'monthly', priority: '0.7' })),
  ...products.map(product => ({
    loc: getProductPath(product),
    changefreq: 'weekly',
    priority: '0.8',
    image: {
      loc: product.image || product.images?.[0],
      title: product.name,
    },
  })),
])

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.map(buildUrlNode).join('\n')}
</urlset>
`

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, xml, 'utf8')

console.log(`Generated ${entries.length} sitemap URLs -> ${outputPath}`)
