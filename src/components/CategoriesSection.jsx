
import { useMemo } from 'react'
import { productImageUrl } from '../lib/assetUrl'

const CATEGORIES = [
  { name: 'Buket Artificial', slug: 'Artificial Flowers', subtitle: 'Tahan lama, selalu cantik' },
  { name: 'Buket Segar',    slug: 'Fresh Flowers',      subtitle: 'Kesegaran bunga asli' },
  { name: 'Ulang Tahun',    slug: 'Ulang Tahun',        subtitle: 'Kejutan yang berkesan' },
  { name: 'Wisuda',         slug: 'Wisuda',             subtitle: 'Rayakan pencapaiannya' },
  { name: 'Anniversary',    slug: 'Anniversary',        subtitle: 'Ekspresikan cinta' },
  { name: 'Giftbox',        slug: 'Giftbox',            subtitle: 'Hadiah dalam kotak' },
  { name: 'Untuk Pria',     slug: 'Pria',               subtitle: 'Maskulin & elegan' },
  { name: 'Untuk Wanita',   slug: 'Wanita',             subtitle: 'Lembut dan manis' },
]

function getCategoryProducts(products, slug) {
  switch (slug) {
    case 'Best Seller':
      return products.filter(p => p.is_best_seller)
    case 'New Arrivals':
      return products.filter(p => p.is_new_arrival)
    case 'Wisuda':
      return products.filter(p => Array.isArray(p.occasionIds) && p.occasionIds.includes(1))
    case 'Ulang Tahun':
      return products.filter(p => Array.isArray(p.occasionIds) && p.occasionIds.includes(2))
    case 'Anniversary':
      return products.filter(p => Array.isArray(p.occasionIds) && p.occasionIds.includes(3))
    case 'Wedding':
      return products.filter(p => Array.isArray(p.occasionIds) && p.occasionIds.includes(4))
    case 'Hadiah':
      return products.filter(p => Array.isArray(p.occasionIds) && p.occasionIds.includes(5))
    case 'Grand Opening':
      return products.filter(p => Array.isArray(p.occasionIds) && p.occasionIds.includes(6))
    default:
      return products.filter(p => {
        if (!p.category) return false
        const cat = p.category.toLowerCase()
        const slugLower = slug.toLowerCase()
        return cat === slugLower || cat.includes(slugLower) || slugLower.includes(cat)
      })
  }
}

function getCategoryImage(products, slug) {
  const filtered = getCategoryProducts(products, slug)
  const first = filtered.find(p => p.images?.length > 0)
  return first?.images[0] || null
}

function CategoryCard({ name, subtitle, slug, image, onClick }) {
  return (
    <a
      href={`/collections/${encodeURIComponent(slug)}`}
      onClick={onClick}
      data-scroll-anchor={`category-${slug}`}
      className="group relative block rounded-2xl shadow-none transition-shadow duration-300 hover:shadow-soft-lg"
      style={{ aspectRatio: '3 / 4' }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-2xl bg-secondary/30">
        {image ? (
          <img
            src={productImageUrl(image)}
            alt={name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.opacity = '0' }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-secondary via-secondary/60 to-primary-soft/30 p-4 text-center">
            <svg
              className="absolute -bottom-4 -right-4 h-24 w-24 text-primary-soft/40"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              strokeLinecap="round"
            >
              <path d="M20 80 Q40 50 50 30 Q60 50 80 80" />
              <path d="M35 80 Q45 65 50 50 Q55 65 65 80" />
              <path d="M50 80 L50 45" />
            </svg>
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-primary-dark">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="relative mt-2 text-[10px] font-semibold uppercase tracking-eyebrow text-primary-dark/70">
              Segera Hadir
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
        <h3 className="font-display text-sm sm:text-base font-semibold text-white leading-tight">
          {name}
        </h3>
        <p className="mt-0.5 text-[11px] sm:text-xs text-white/80 leading-snug">
          {subtitle}
        </p>
      </div>

      <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/0 text-white opacity-0 transition-all duration-300 group-hover:bg-white/95 group-hover:text-primary-dark group-hover:opacity-100">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </a>
  )
}

function BestSellerHero({ onClick }) {
  return (
    <a
      href="/collections/Best%20Seller"
      onClick={onClick}
      data-scroll-anchor="category-Best Seller"
      className="group relative block h-[220px] rounded-2xl shadow-none transition-shadow duration-300 hover:shadow-soft-lg sm:h-auto sm:aspect-[21/7]"
    >
      <div className="absolute inset-0 overflow-hidden rounded-2xl bg-secondary/30">
        <picture>
          <source type="image/avif" srcSet="/posters/poster-1-640.avif 640w, /posters/poster-1-1024.avif 1024w, /posters/poster-1.avif 1672w" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px" />
          <source type="image/webp" srcSet="/posters/poster-1-640.webp 640w, /posters/poster-1-1024.webp 1024w, /posters/poster-1.webp 1672w" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px" />
          <img
            src="/posters/poster-1.jpg"
            alt="Koleksi Best Seller Puthic Sari"
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />

        <span className="absolute top-4 left-4 sm:top-5 sm:left-5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-eyebrow text-primary-dark backdrop-blur-sm">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 L14.5 8.5 L21.5 9.5 L16.5 14 L18 21 L12 17.5 L6 21 L7.5 14 L2.5 9.5 L9.5 8.5 Z" />
        </svg>
          Best Seller
        </span>

          <div className="absolute inset-y-0 left-0 flex items-center p-5 sm:p-7">
          <div className="max-w-md mt-8 sm:mt-0">
            <h3 className="font-display text-lg sm:text-2xl md:text-3xl font-semibold text-white leading-tight">
              Paling Diminati
            </h3>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-white/85 leading-snug max-w-xs">
              Buket pilihan yang paling disukai pelanggan kami.
            </p>
            <span className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-eyebrow text-white/95 transition-all group-hover:gap-2.5">
              Lihat Koleksi
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}

export default function CategoriesSection({ products = [], onCategorySelect, onCollectionNavigate }) {
  const slugImageMap = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return {}
    const map = {}
    for (const cat of CATEGORIES) {
      map[cat.slug] = getCategoryImage(products, cat.slug)
    }
    return map
  }, [products])

  const handleClick = (e, slug) => {
    e.preventDefault()
    if (onCollectionNavigate) onCollectionNavigate(slug, e.currentTarget)
    else if (onCategorySelect) onCategorySelect({ name: slug })
  }

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 md:mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-primary-dark">
              Koleksi
            </p>
            <h2 className="mt-1 font-display text-xl md:text-2xl text-heading">
              Temukan Buket untuk Setiap Momen
            </h2>
          </div>
          <a
            href="/collections"
            onClick={(e) => handleClick(e, 'all')}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary-dark hover:text-primary transition-colors"
          >
            Semua Koleksi
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

        <div className="mb-3">
          <BestSellerHero onClick={(e) => handleClick(e, 'Best Seller')} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.slug}
              name={cat.name}
              subtitle={cat.subtitle}
              slug={cat.slug}
              image={slugImageMap[cat.slug]}
              onClick={(e) => handleClick(e, cat.slug)}
            />
          ))}
        </div>

        <div className="mt-5 sm:hidden text-center">
          <a
            href="/collections"
            onClick={(e) => handleClick(e, 'all')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-dark hover:text-primary transition-colors"
          >
            Lihat Semua Koleksi
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
