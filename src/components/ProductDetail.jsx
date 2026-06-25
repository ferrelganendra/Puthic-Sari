import { useState, useMemo, useEffect, useCallback } from 'react'
import { HiMinus, HiPlus, HiShoppingBag, HiChevronLeft, HiChevronRight, HiHeart, HiCheck, HiTruck, HiRefresh, HiShieldCheck, HiArrowLeft, HiStar } from 'react-icons/hi'
import { HiArrowRight } from 'react-icons/hi'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { getFinalPrice, hasDiscount, formatPrice } from '../lib/pricing'
import ProductCard from './ProductCard'
import { supabase } from '../lib/supabase'
import { fetchApprovedReviews, getReviewStats } from '../lib/reviews'

/**
 * ProductDetailPage — full-page product detail (ZaskiaMecca-style).
 * - URL: /products/{slug}
 * - 2-col grid: gallery left, info right (info sticky on scroll)
 * - Tabs: Deskripsi | Material | Info Pengiriman
 * - Breadcrumbs
 * - Sticky bottom add-to-cart bar (mobile only)
 * - Trust micro-badges
 * - Related products carousel below
 */
function Breadcrumbs({ product, onHome, onCollectionNavigate }) {
  return (
    <nav className="text-xs text-gray-500 mb-4 sm:mb-6" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li><button onClick={onHome} className="hover:text-accent transition-colors uppercase tracking-button">Beranda</button></li>
        <li><span className="text-gray-300">/</span></li>
        {product.category && (
          <>
            <li><button onClick={() => onCollectionNavigate?.(product.category)} className="hover:text-accent transition-colors uppercase tracking-button">{product.category}</button></li>
            <li><span className="text-gray-300">/</span></li>
          </>
        )}
        <li className="text-heading truncate max-w-[200px] sm:max-w-md">{product.name}</li>
      </ol>
    </nav>
  )
}

function TrustBadges() {
  const items = [
    { icon: HiTruck, label: 'Info pengiriman' },
    { icon: HiRefresh, label: 'Bantuan pesanan' },
    { icon: HiShieldCheck, label: 'Data produk' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 pt-5 border-t border-border">
      {items.map((it, i) => {
        const Icon = it.icon
        return (
          <div key={i} className="flex items-center gap-1.5 text-xs text-body">
            <Icon className="text-base text-heading" aria-hidden="true" />
            <span className="uppercase tracking-button">{it.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function Tabs({ product }) {
  const [active, setActive] = useState('description')
  const tabs = [
    { id: 'description', label: 'Deskripsi' },
    { id: 'material', label: 'Material' },
    { id: 'shipping', label: 'Info Pengiriman' },
  ]
  return (
    <div className="mt-10 sm:mt-12">
      {/* Tab header */}
      <div className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-4 sm:px-6 py-3 text-xs uppercase tracking-button font-medium transition-colors -mb-px border-b-2 ${
              active === t.id ? 'border-accent text-heading' : 'border-transparent text-body hover:text-heading'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Tab content */}
      <div className="py-5 sm:py-6 text-sm leading-7 text-body">
        {active === 'description' && (
          <p className="whitespace-pre-line">{product.description || 'Belum ada deskripsi untuk produk ini.'}</p>
        )}
        {active === 'material' && (
          product.material ? (
            <div className="space-y-2">
              <p><span className="text-heading font-medium">Material:</span> {product.material}</p>
              <p className="text-xs text-gray-500">Material info diambil langsung dari data produk.</p>
            </div>
          ) : (
            <p className="text-gray-500">Info material belum tersedia untuk produk ini.</p>
          )
        )}
        {active === 'shipping' && (
          <ul className="space-y-2 list-disc pl-5">
            <li>Masukkan alamat pengiriman saat checkout.</li>
            <li>Pilih metode pengiriman yang tersedia di halaman checkout.</li>
            <li>Estimasi dan biaya pengiriman mengikuti data yang tampil saat checkout.</li>
            <li>Hubungi kami jika ada kendala pada pesanan.</li>
          </ul>
        )}
      </div>
    </div>
  )
}

function RelatedProducts({ currentProduct, allProducts, onViewDetail }) {
  const related = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return []
    return allProducts
      .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
      .slice(0, 4)
  }, [currentProduct, allProducts])

  if (related.length === 0) return null

  return (
    <section className="mt-16 sm:mt-20 border-t border-border pt-10 sm:pt-12">
      <h2 className="text-base sm:text-lg uppercase tracking-button font-medium text-heading mb-6">Produk Serupa</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} onViewDetail={onViewDetail} />
        ))}
      </div>
    </section>
  )
}

function ProductReviewsSection({ product }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const fetchReviews = useCallback(async () => {
    try {
      const reviews = await fetchApprovedReviews(supabase, { limit: 6, productId: product.id })
      setReviews(reviews)
    } catch (e) {
      // silent
    } finally {
      setLoading(false)
    }
  }, [product.id])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      product_id: product.id,
      name: name.trim(),
      rating: Number(rating),
      comment: comment.trim(),
      is_approved: false,
    }
    if (!payload.name || !payload.comment) {
      setStatus('error')
      setMessage('Nama dan ulasan wajib diisi.')
      return
    }
    setStatus('submitting')
    setMessage('')
    const { error } = await supabase.from('reviews').insert(payload)
    if (error) {
      setStatus('error')
      setMessage('Ulasan belum bisa dikirim. Coba lagi nanti.')
      return
    }
    setStatus('success')
    setMessage('Ulasan dikirim untuk ditinjau admin.')
    setName('')
    setRating(5)
    setComment('')
    fetchReviews()
  }

  const stats = getReviewStats(reviews)

  return (
    <section className="mt-16 sm:mt-20 border-t border-border pt-10 sm:pt-12">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-eyebrow text-primary-dark">
            Ulasan Pelanggan
          </span>
          <h2 className="mt-2 text-base sm:text-lg uppercase tracking-button font-medium text-heading">
            Apa kata mereka tentang produk ini
          </h2>
        </div>
        {stats && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <HiStar
                  key={star}
                  className={`h-4 w-4 ${star <= Math.round(stats.average) ? 'text-amber-400' : 'text-gray-200'}`}
                  fill="currentColor"
                />
              ))}
            </div>
            <span className="font-semibold text-heading">{stats.average.toFixed(1)}</span>
            <span>· {stats.count} ulasan</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Reviews list */}
        <div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse space-y-2 rounded-lg border border-border-soft p-4">
                  <div className="h-3 w-1/3 bg-secondary" />
                  <div className="h-3 w-full bg-secondary" />
                  <div className="h-3 w-2/3 bg-secondary" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-lg border border-border-soft bg-secondary/20 p-6 text-center">
              <p className="text-sm text-text-secondary">Belum ada ulasan untuk produk ini.</p>
              <p className="mt-1 text-xs text-text-muted">Jadilah yang pertama memberikan ulasan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <article key={r.id} className="rounded-lg border border-border-soft p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-heading">{r.name}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <HiStar
                          key={star}
                          className={`h-3.5 w-3.5 ${star <= Number(r.rating) ? 'text-amber-400' : 'text-gray-200'}`}
                          fill="currentColor"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">{r.comment}</p>
                  {r.created_at && (
                    <p className="mt-2 text-[11px] text-text-muted">
                      {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Submit form */}
        <div className="rounded-lg border border-border-soft bg-secondary/20 p-5 self-start">
          <h3 className="text-sm font-semibold text-heading">Tulis Ulasan</h3>
          <p className="mt-1 text-xs text-text-muted leading-relaxed">Ulasan akan ditinjau admin sebelum ditampilkan.</p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-heading" htmlFor="pd-review-name">Nama</label>
              <input
                id="pd-review-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="w-full border border-border-soft bg-white px-3 py-2.5 text-sm text-heading focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-heading" htmlFor="pd-review-rating">Rating</label>
              <select
                id="pd-review-rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full border border-border-soft bg-white px-3 py-2.5 text-sm text-heading focus:border-primary focus:outline-none"
              >
                {[5, 4, 3, 2, 1].map((v) => (
                  <option key={v} value={v}>{v} / 5</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-heading" htmlFor="pd-review-comment">Ulasan</label>
              <textarea
                id="pd-review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                className="min-h-[100px] w-full border border-border-soft bg-white px-3 py-2.5 text-sm text-heading focus:border-primary focus:outline-none"
                required
              />
            </div>
            {message && (
              <p className={`text-xs ${status === 'success' ? 'text-primary-dark' : 'text-sale'}`} role={status === 'error' ? 'alert' : 'status'}>
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-heading py-3 text-xs font-semibold uppercase tracking-button text-white transition-colors hover:bg-gray-800 disabled:opacity-60 rounded-full"
            >
              {status === 'submitting' ? 'Mengirim...' : 'Kirim Ulasan'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default function ProductDetailPage({ product, allProducts = [], onClose, onCollectionNavigate, onHome }) {
  const { addToCart } = useCart()
  const { toggleWishlist, isWishlisted } = useWishlist()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [currentImg, setCurrentImg] = useState(0)
  const [showStickyBar, setShowStickyBar] = useState(false)

  // Show sticky bar after scroll past the main ATC button
  useEffect(() => {
    const onScroll = () => {
      setShowStickyBar(window.scrollY > 600)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll to top on product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setCurrentImg(0)
    setQuantity(1)
  }, [product?.id])

  if (!product) return null

  const images = product.images?.length ? product.images : [product.image].filter(Boolean)
  const nextImg = () => setCurrentImg((currentImg + 1) % images.length)
  const prevImg = () => setCurrentImg((currentImg - 1 + images.length) % images.length)
  const finalPrice = getFinalPrice(product)
  const discounted = hasDiscount(product)
  const isSoldOut = product.is_sold_out ?? product.isSoldOut ?? false
  const wishlisted = isWishlisted(product.id)

  const handleAdd = () => {
    if (addToCart(product, quantity)) {
      setAdded(true)
      setTimeout(() => setAdded(false), 1800)
    }
  }

  return (
      <div className="bg-background min-h-screen">
      {/* Main container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button
          onClick={onHome}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-button text-text-muted hover:text-heading transition-colors mb-4 sm:mb-6"
          aria-label="Kembali ke beranda"
        >
          <HiArrowLeft className="text-base" />
          Kembali ke Beranda
        </button>
        <Breadcrumbs product={product} onHome={onHome} onCollectionNavigate={onCollectionNavigate} />

        <div className="grid md:grid-cols-2 gap-6 md:gap-10 lg:gap-12">
          {/* Left: Image gallery */}
          <div>
            {/* Main image */}
            <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
              <img
                src={images[currentImg]}
                alt={product.name}
                loading="eager"
                className="h-full w-full object-cover"
              />
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                {discounted && <span className="badge-sale">SALE</span>}
                {isSoldOut && <span className="badge-soldout">Sold Out</span>}
              </div>
              {/* Prev/next arrows */}
              {images.length > 1 && (
                <>
                  <button onClick={prevImg} aria-label="Foto sebelumnya" className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center bg-white/90 text-heading hover:bg-white">
                    <HiChevronLeft />
                  </button>
                  <button onClick={nextImg} aria-label="Foto berikutnya" className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center bg-white/90 text-heading hover:bg-white">
                    <HiChevronRight />
                  </button>
                </>
              )}
              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] px-2 py-1">
                  {currentImg + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setCurrentImg(i)}
                    className={`h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden border transition-all ${
                      i === currentImg ? 'border-accent' : 'border-border opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info (sticky on desktop) */}
          <div className="md:sticky md:top-24 md:self-start">
            {product.category && (
              <p className="text-xs uppercase tracking-button text-gray-500">{product.category}</p>
            )}
            <div className="flex items-start justify-between gap-3 mt-2">
              <h1 className="text-2xl sm:text-3xl font-medium text-heading leading-tight">{product.name}</h1>
              <button
                onClick={() => toggleWishlist(product.id)}
                className="flex-shrink-0 p-2 -mr-2"
                aria-label={wishlisted ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
              >
                <HiHeart className={`text-2xl transition-colors ${wishlisted ? 'text-accent fill-accent' : 'text-gray-300 hover:text-gray-500'}`} />
              </button>
            </div>

            {/* Price */}
            <div className="mt-4">
              {discounted ? (
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-medium text-heading">{formatPrice(finalPrice)}</span>
                  <span className="text-base text-gray-400 line-through">{formatPrice(product.price)}</span>
                </div>
              ) : (
                <span className="text-2xl sm:text-3xl font-medium text-heading">{formatPrice(finalPrice)}</span>
              )}
              {product.price_from && (
                <p className="text-xs text-gray-500 mt-1">*Harga mulai dari, tergantung variasi</p>
              )}
            </div>

            {/* Material — only if real data */}
            {product.material && (
              <p className="mt-4 text-sm text-body">
                <span className="text-heading font-medium">Material:</span> {product.material}
              </p>
            )}

            {/* Description preview */}
            <p className="mt-5 text-sm leading-7 text-body line-clamp-4">{product.description}</p>

            {/* Quantity + Add to cart (desktop) */}
            <div className="mt-7 space-y-4 hidden md:block">
              <div className="flex items-center justify-between">
                <span className="text-sm text-body uppercase tracking-button">Jumlah</span>
                <div className="flex items-center border border-border">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Kurangi" className="flex h-10 w-10 items-center justify-center text-body hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" disabled={quantity <= 1}>
                    <HiMinus className="text-sm" />
                  </button>
                  <span className="w-12 text-center text-sm font-medium border-x border-border">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(10, quantity + 1))} aria-label="Tambah" className="flex h-10 w-10 items-center justify-center text-body hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" disabled={quantity >= 10}>
                    <HiPlus className="text-sm" />
                  </button>
                </div>
              </div>
              {quantity >= 10 && (
                <p className="text-xs text-amber-600 text-right">Maks 10 item per order. Hubungi kami untuk grosir.</p>
              )}

              <button
                onClick={handleAdd}
                disabled={isSoldOut}
                className={`flex w-full min-h-12 items-center justify-center gap-2 text-sm font-medium uppercase tracking-button transition-colors ${
                  isSoldOut ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : added ? 'bg-accent text-white'
                  : 'bg-heading text-white hover:bg-gray-800'
                }`}
              >
                {added ? (
                  <>
                    <HiCheck className="text-base" /> Ditambahkan
                  </>
                ) : (
                  <>
                    <HiShoppingBag className="text-base" /> {isSoldOut ? 'Sold Out' : 'Tambah ke Keranjang'}
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="w-full text-xs uppercase tracking-button text-body hover:text-accent transition-colors py-2.5 border border-border rounded-xl hover:border-heading"
              >
                Lanjut Belanja
              </button>
            </div>

            <TrustBadges />
          </div>
        </div>

        {/* Tabs (full width below the grid) */}
        <Tabs product={product} />

        {/* Related products */}
        <RelatedProducts
          currentProduct={product}
          allProducts={allProducts}
          onViewDetail={(p) => {
            window.dispatchEvent(new CustomEvent('view-product', { detail: p }))
          }}
        />

        {/* Product reviews */}
        <ProductReviewsSection product={product} />
      </div>

      {/* Sticky bottom ATC bar — mobile only, visible after scroll */}
      {showStickyBar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border px-4 py-3 flex items-center gap-3 shadow-lg">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate">{product.name}</p>
            <p className="text-sm font-medium text-heading">{formatPrice(finalPrice)}</p>
          </div>
          <button
            onClick={handleAdd}
            disabled={isSoldOut}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium uppercase tracking-button transition-colors ${
              isSoldOut ? 'bg-gray-200 text-gray-500' : added ? 'bg-accent text-white' : 'bg-heading text-white'
            }`}
          >
            {added ? <><HiCheck /> Ditambah</> : <><HiShoppingBag /> Tambah</>}
          </button>
        </div>
      )}
    </div>
  )
}
