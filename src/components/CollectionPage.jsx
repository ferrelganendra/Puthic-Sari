import { useState, useMemo } from 'react'
import { HiSortAscending, HiFilter, HiX, HiArrowLeft } from 'react-icons/hi'
import ProductCard from './ProductCard'
import { getFinalPrice } from '../lib/pricing'

const ITEMS_PER_PAGE = 12

const sortOptions = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga: Rendah ke Tinggi' },
  { value: 'price_desc', label: 'Harga: Tinggi ke Rendah' },
  { value: 'name_asc', label: 'Nama: A-Z' },
  { value: 'best_seller', label: 'Best Seller' },
]

const priceRanges = [
  { value: 'all', label: 'Semua Harga' },
  { value: '0-200000', label: 'Di bawah Rp200.000' },
  { value: '200000-400000', label: 'Rp200.000 - Rp400.000' },
  { value: '400000-600000', label: 'Rp400.000 - Rp600.000' },
  { value: '600000+', label: 'Di atas Rp600.000' },
]

const collectionLabel = {
  'Artificial Flowers': 'Buket Artificial',
  'Fresh Flowers': 'Buket Segar',
  Giftbox: 'Giftbox',
  Pria: 'Untuk Pria',
  Wanita: 'Untuk Wanita',
}

export default function CollectionPage({ products, categories, onViewDetail, initialCategory = null, onHome }) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedPrice, setSelectedPrice] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (selectedCategory === 'Best Seller') {
      result = result.filter(p => p.is_best_seller)
    } else if (selectedCategory === 'New Arrivals') {
      result = result.filter(p => p.is_new_arrival)
    } else if (selectedCategory === 'Wisuda') {
      result = result.filter(p => Array.isArray(p.occasionIds) && p.occasionIds.includes(1))
    } else if (selectedCategory === 'Ulang Tahun') {
      result = result.filter(p => Array.isArray(p.occasionIds) && p.occasionIds.includes(2))
    } else if (selectedCategory === 'Anniversary') {
      result = result.filter(p => Array.isArray(p.occasionIds) && p.occasionIds.includes(3))
    } else if (selectedCategory === 'Wedding') {
      result = result.filter(p => Array.isArray(p.occasionIds) && p.occasionIds.includes(4))
    } else if (selectedCategory === 'Hadiah') {
      result = result.filter(p => Array.isArray(p.occasionIds) && p.occasionIds.includes(5))
    } else if (selectedCategory === 'Grand Opening') {
      result = result.filter(p => Array.isArray(p.occasionIds) && p.occasionIds.includes(6))
    } else if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory)
    }

    if (selectedPrice !== 'all') {
      if (selectedPrice.endsWith('+')) {
        const minVal = parseInt(selectedPrice)
        result = result.filter(p => getFinalPrice(p) >= minVal)
      } else {
        const [min, max] = selectedPrice.split('-').map(Number)
        result = result.filter(p => {
          const price = getFinalPrice(p)
          return price >= min && price < max
        })
      }
    }

    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => getFinalPrice(a) - getFinalPrice(b))
        break
      case 'price_desc':
        result.sort((a, b) => getFinalPrice(b) - getFinalPrice(a))
        break
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'best_seller':
        result.sort((a, b) => (b.is_best_seller ? 1 : 0) - (a.is_best_seller ? 1 : 0))
        break
      case 'newest':
      default:
        result.sort((a, b) => b.id - a.id)
        break
    }

    return result
  }, [products, selectedCategory, selectedPrice, sortBy])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat)
    setCurrentPage(1)
  }

  const handlePriceChange = (price) => {
    setSelectedPrice(price)
    setCurrentPage(1)
  }

  const handleSortChange = (sort) => {
    setSortBy(sort)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSelectedCategory(null)
    setSelectedPrice('all')
    setSortBy('newest')
    setCurrentPage(1)
  }

  const hasActiveFilters = selectedCategory || selectedPrice !== 'all' || sortBy !== 'newest'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => onHome?.()}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-eyebrow text-text-muted hover:text-heading transition-colors mb-4"
          >
            <HiArrowLeft className="text-base" />
            Kembali ke Beranda
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-heading">
                {selectedCategory === 'Best Seller' ? 'Best Seller'
                  : selectedCategory === 'New Arrivals' ? 'New Arrivals'
                  : collectionLabel[selectedCategory] || selectedCategory || 'Semua Produk'}
              </h1>
              <p className="mt-1 text-sm text-text-muted">
                {filteredProducts.length} produk ditemukan
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium text-body hover:border-heading transition-colors"
              >
                <HiFilter className="text-base" />
                Filter
              </button>
              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none bg-white border border-border rounded-xl px-4 py-2 pr-8 text-sm font-medium text-body cursor-pointer hover:border-heading transition-colors focus:outline-none"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <HiSortAscending className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
          {/* Sidebar Filters */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="sticky top-24 space-y-6">
              {/* Active filters */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Filter Aktif</span>
                  <button onClick={clearFilters} className="text-xs text-sale hover:text-red-700 transition-colors">
                    Reset
                  </button>
                </div>
              )}

              {/* Category filter */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-heading mb-3">Jenis Produk</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleCategoryChange(null)}
                    className={`block w-full text-left px-3 py-2 text-sm rounded-xl transition-colors ${
                      !selectedCategory ? 'bg-heading text-white font-medium' : 'text-text-secondary hover:bg-secondary/40'
                    }`}
                  >
                    Semua
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id || cat.name}
                      onClick={() => handleCategoryChange(cat.name)}
                      className={`block w-full text-left px-3 py-2 text-sm rounded-xl transition-colors ${
                        selectedCategory === cat.name ? 'bg-heading text-white font-medium' : 'text-text-secondary hover:bg-secondary/40'
                      }`}
                    >
                      {collectionLabel[cat.name] || cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price filter */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-heading mb-3">Harga</h3>
                <div className="space-y-1">
                  {priceRanges.map(range => (
                    <button
                      key={range.value}
                      onClick={() => handlePriceChange(range.value)}
                      className={`block w-full text-left px-3 py-2 text-sm rounded-xl transition-colors ${
                        selectedPrice === range.value ? 'bg-heading text-white font-medium' : 'text-text-secondary hover:bg-secondary/40'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div>
            {paginatedProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-text-muted text-sm">Tidak ada produk yang cocok dengan filter.</p>
                <button onClick={clearFilters} className="mt-4 text-sm font-medium text-heading hover:underline">
                  Reset Filter
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
                  {paginatedProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onViewDetail={onViewDetail}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium border border-border rounded-xl text-body hover:border-heading disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Sebelumnya
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 text-sm font-medium rounded-xl transition-colors ${
                          currentPage === page
                            ? 'bg-heading text-white'
                            : 'border border-border text-body hover:border-heading'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium border border-border rounded-xl text-body hover:border-heading disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
