import { memo, useState } from 'react'
import { HiHeart, HiSparkles, HiOutlineStar } from 'react-icons/hi'
import { useWishlist } from '../context/WishlistContext'
import { productImageUrl } from '../lib/assetUrl'


const PRICE_FORMAT = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

function ProductCard({ product, onViewDetail, priority = false }) {
  const { toggleWishlist, isWishlisted } = useWishlist()
  const [imgLoaded, setImgLoaded] = useState(false)

  const formatPrice = (price) => PRICE_FORMAT.format(price)

  const discount = product.discount_percent || 0
  const hasDiscount = discount > 0
  const finalPrice = hasDiscount ? Math.round(product.price * (1 - discount / 100)) : product.price
  const isSoldOut = product.is_sold_out ?? product.isSoldOut ?? false
  const images = product.images?.length ? product.images : [product.image].filter(Boolean)
  const displayImg = productImageUrl(images[0] || product.thumbnail || product.image)
  const wishlisted = isWishlisted(product.id)
  const pricePrefix = product.price_from ? 'Mulai ' : ''

  const badge = (product.badge || '').toLowerCase()
  const showBestseller = product.is_best_seller && !badge.includes('best seller') && !badge.includes('best')
  const showNew = product.is_new_arrival && !showBestseller
  const badgeLabel = badge.includes('best seller') ? 'Best Seller'
    : badge.includes('baru') || badge.includes('new') ? 'Baru'
    : badge.includes('custom') ? 'Custom'
    : badge.includes('sale') ? 'Sale'
    : showBestseller ? 'Best Seller'
    : showNew ? 'Baru'
    : null

  const badgeType = badgeLabel === 'Best Seller' ? 'bestseller'
    : badgeLabel === 'Baru' || badgeLabel === 'New' ? 'new'
    : badgeLabel === 'Custom' ? 'custom'
    : badgeLabel === 'Sale' || hasDiscount ? 'sale'
    : null

  return (
    <article className="group flex flex-col" data-scroll-anchor={`product-${product.id}`}>
      <div
        className="relative aspect-[4/5] rounded-[14px] overflow-hidden bg-secondary cursor-pointer"
        onClick={(event) => onViewDetail(product, event)}
      >
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary-deep/40 to-secondary animate-pulse" />
        )}
        <img
          src={displayImg}
          alt={product.name}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
          className={`h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.04] ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/8 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="absolute top-3 left-3">
          {isSoldOut ? (
            <span className="badge-soldout">Sold Out</span>
          ) : hasDiscount ? (
            <span className="badge-sale">Sale {discount}%</span>
          ) : badgeLabel === 'Best Seller' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white bg-gradient-to-r from-amber-600 to-amber-800 rounded-full shadow-md">
              <HiOutlineStar className="text-[11px]" />
              Best Seller
            </span>
          ) : badgeLabel === 'Baru' || badgeLabel === 'New' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white bg-gradient-to-r from-primary to-primary-dark rounded-full shadow-md">
              <HiSparkles className="text-[11px]" />
              Baru
            </span>
          ) : badgeLabel ? (
            <span className={`badge-${badgeType}`}>{badgeLabel}</span>
          ) : null}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id) }}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-soft"
          aria-label={wishlisted ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
        >
          <HiHeart className={`text-base transition-colors ${wishlisted ? 'text-[#C85C5C] fill-[#C85C5C]' : 'text-text-muted'}`} />
        </button>

        {!isSoldOut && (
          <div
            className="absolute inset-x-0 bottom-0 p-3 pt-8 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 cursor-pointer"
            onClick={(event) => onViewDetail(product, event)}
          >
            <span className="block w-full py-2.5 text-center text-xs font-semibold text-white bg-white/20 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/30 transition-colors">
              Lihat Detail
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 md:mt-4 flex flex-col gap-1 px-0.5">
        <h3
          onClick={(event) => onViewDetail(product, event)}
          className="text-sm md:text-[15px] font-medium text-heading leading-snug line-clamp-2 cursor-pointer hover:text-primary transition-colors"
        >
          {product.name}
        </h3>

        {product.category && (
          <p className="text-xs font-medium text-text-secondary">{product.category}</p>
        )}

        <p className="flex items-baseline gap-2 mt-0.5">
          <span className="text-sm md:text-base font-semibold text-heading">
            {pricePrefix}{formatPrice(finalPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-text-muted line-through">{formatPrice(product.price)}</span>
          )}
        </p>
      </div>
    </article>
  )
}

export default memo(ProductCard)
