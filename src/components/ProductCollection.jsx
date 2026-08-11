import { memo, useMemo } from 'react'
import ProductCard from './ProductCard'

function ProductCollection({
  title,
  subtitle,
  eyebrow,
  products,
  onViewDetail,
  limit = 8,
  ctaLabel = 'Lihat Semua',
  onViewAll,
  background = 'transparent',
  id,
}) {
  const visible = useMemo(() => products.slice(0, limit), [products, limit])
  if (!visible.length) return null

  return (
    <section
      id={id || (title === 'Best Seller' ? 'products' : undefined)}
      className="py-10 md:py-14 lg:py-16"
      style={{ backgroundColor: background }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            {eyebrow && (
              <span className="eyebrow text-primary-dark mb-2 block">{eyebrow}</span>
            )}
            <h2 className="font-display text-2xl md:text-3xl lg:text-[2.25rem] text-heading leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm md:text-base text-text-secondary max-w-md">
                {subtitle}
              </p>
            )}
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors self-start sm:self-end group"
            >
              {ctaLabel}
              <svg
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:gap-6 sm:grid-cols-3 md:grid-cols-4">
          {visible.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default memo(ProductCollection)
