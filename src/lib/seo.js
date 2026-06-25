import { formatPrice, getFinalPrice } from './pricing'
import { getProductPath } from './slugs'
import { bannerUrl, siteAssetUrl } from './assetUrl'

export const SITE_URL = 'https://puthicsari.com'

const SITE_NAME = 'Puthic Sari'
const DEFAULT_IMAGE = bannerUrl('poster-1.jpg')
const DEFAULT_KEYWORDS = [
 'buket bunga jogja',
 'buket wisuda yogyakarta',
 'bunga artificial',
 'buket wisuda',
 'buket ulang tahun',
 'toko bunga jogja',
 'puthic sari',
]

const defaultSeo = {
 title: 'Puthic Sari - Buket Bunga Jogja',
 description: 'Koleksi buket Puthic Sari di Yogyakarta untuk wisuda, ulang tahun, anniversary, wedding, dan hadiah. Pesan melalui website atau WhatsApp.',
 image: DEFAULT_IMAGE,
 imageAlt: 'Buket Puthic Sari',
 url: '/',
 type: 'website',
 robots: 'index, follow',
}

const cleanText = (value = '') => String(value).replace(/\s+/g, ' ').trim()

const truncate = (value, max = 160) => {
 const text = cleanText(value)
 if (text.length <= max) return text
 const shortened = text.slice(0, max - 3)
 const lastSpace = shortened.lastIndexOf(' ')
 return `${shortened.slice(0, lastSpace > 80 ? lastSpace : shortened.length).trim()}...`
}

export const absoluteUrl = (path = '/') => {
 const value = cleanText(path)
 if (!value) return `${SITE_URL}/`
 const url = /^https?:\/\//i.test(value)
  ? value
  : `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`
 return encodeURI(url)
}

const normalizeKeywords = (keywords) => {
 if (!keywords) return DEFAULT_KEYWORDS.join(', ')
 if (Array.isArray(keywords)) return [...new Set([...keywords, ...DEFAULT_KEYWORDS])].filter(Boolean).join(', ')
 return cleanText(keywords)
}

const buildSeo = (seo = {}) => ({
 ...defaultSeo,
 ...seo,
 title: cleanText(seo.title || defaultSeo.title),
 description: truncate(seo.description || defaultSeo.description),
 keywords: normalizeKeywords(seo.keywords),
 image: absoluteUrl(seo.image || defaultSeo.image),
 imageAlt: cleanText(seo.imageAlt || defaultSeo.imageAlt),
 url: absoluteUrl(seo.url || defaultSeo.url),
 siteName: SITE_NAME,
 locale: 'id_ID',
 twitterCard: 'summary_large_image',
})

export const getHomeSeo = ({ searchQuery, categoryFilter, occasionFilter, bestSellerOnly, newArrivalOnly } = {}) => {
 if (searchQuery) {
   return buildSeo({
    title: `Hasil Pencarian "${searchQuery}" | Puthic Sari`,
    description: `Hasil pencarian produk Puthic Sari untuk kata kunci ${searchQuery}.`,
    keywords: [searchQuery, 'cari buket bunga', 'buket bunga yogyakarta'],
    url: '/#products',
   })

 }

 if (bestSellerOnly) {
  return buildSeo({
   title: 'Buket Best Seller | Puthic Sari Jogja',
    description: 'Koleksi buket dari Puthic Sari untuk wisuda, ulang tahun, anniversary, dan hadiah.',
   keywords: ['buket best seller', 'buket populer jogja'],
   url: '/#products',
  })
 }

 if (newArrivalOnly) {
  return buildSeo({
   title: 'New Arrivals Buket Bunga | Puthic Sari Jogja',
    description: 'Koleksi buket Puthic Sari yang tersedia di website.',
   keywords: ['buket terbaru', 'new arrivals buket', 'buket bunga jogja terbaru'],
   url: '/#products',
  })
 }

 if (categoryFilter?.name) {
  return buildSeo({
   title: `Buket ${categoryFilter.name} | Puthic Sari Jogja`,
    description: `Koleksi buket ${categoryFilter.name} dari Puthic Sari.`,
   keywords: [`buket ${categoryFilter.name}`, `${categoryFilter.name} jogja`, 'koleksi buket bunga'],
   url: '/#products',
  })
 }

 if (occasionFilter?.name) {
  return buildSeo({
   title: `Buket Untuk ${occasionFilter.name} | Puthic Sari`,
    description: `Koleksi buket Puthic Sari untuk ${occasionFilter.name}.`,
   keywords: [`buket ${occasionFilter.name}`, `hadiah ${occasionFilter.name}`, 'florist yogyakarta'],
   url: '/#products',
  })
 }

 return buildSeo(defaultSeo)
}

export const getInfoPageSeo = (slug, page) => buildSeo({
 title: `${page.label} | Puthic Sari`,
 description: page.intro || page.title,
 image: page.heroImage || DEFAULT_IMAGE,
 imageAlt: page.heroAlt || page.label,
 url: `/${slug}`,
 keywords: [page.label, page.eyebrow, 'Puthic Sari Yogyakarta'],
})

export const getProductSeo = (product) => {
 const price = getFinalPrice(product)
 const image = product.image || product.images?.[0] || DEFAULT_IMAGE
 const category = product.category ? ` kategori ${product.category}` : ''

 return buildSeo({
  title: `${product.name} | Buket Bunga Puthic Sari`,
   description: `${product.name}${category} dari Puthic Sari. Harga ${formatPrice(price)}. Pesan online atau hubungi WhatsApp jika perlu bantuan.`,
  image,
  imageAlt: product.name,
  url: getProductPath(product),
  type: 'product',
  keywords: [product.name, product.category, 'buket bunga artificial', 'toko bunga jogja'],
  productPriceAmount: price,
  productPriceCurrency: 'IDR',
 })
}
