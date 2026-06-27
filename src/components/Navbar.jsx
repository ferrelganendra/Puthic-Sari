import { useState, useEffect, useRef } from 'react'
import { HiMenu, HiX, HiShoppingBag, HiSearch, HiUser, HiChevronDown, HiChevronRight, HiChevronLeft, HiHeart } from 'react-icons/hi'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { siteAssetUrl } from '../lib/assetUrl'

/**
 * Navbar — ZM-style ecommerce navigation.
 * - Logo LEFT, nav links center-left, actions right
 * - Uppercase nav: SALE, NEW ARRIVALS, COLLECTION, OFFLINE STORE
 * - Mega-menu under COLLECTION
 */
export default function Navbar({
  onSearch, onSearchNavigate, onAccount, onCategorySelect, onOccasionSelect,
  onBestSellerSelect, onNewArrival, onHome, onStoreSelect, onCollectionNavigate,
  categories = [], occasions = [], isLoggedIn,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerLevel, setDrawerLevel] = useState('main')
  const [drawerTitle, setDrawerTitle] = useState('')
  const [searchVal, setSearchVal] = useState('')
  const [showMega, setShowMega] = useState(false)
  const megaTimeoutRef = useRef(null)
  const { setIsCartOpen, totalItems } = useCart()
  const { wishlistCount } = useWishlist()

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const openDrawer = () => { setDrawerOpen(true); setDrawerLevel('main') }
  const closeDrawer = () => { setDrawerOpen(false); setDrawerLevel('main'); setDrawerTitle('') }
  const goToLevel = (level, title) => { setDrawerLevel(level); setDrawerTitle(title) }
  const backLevel = () => {
    if (drawerLevel === 'flower' || drawerLevel === 'occasion') setDrawerLevel('collection')
    else setDrawerLevel('main')
    setDrawerTitle('')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      onSearchNavigate(searchVal.trim())
      setSearchVal('')
      closeDrawer()
    }
  }

  const handleSearchInput = (value) => {
    setSearchVal(value)
    if (value.length >= 3) onSearch?.(value)
  }

  const handleMegaEnter = () => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current)
    setShowMega(true)
  }
  const handleMegaLeave = () => {
    megaTimeoutRef.current = setTimeout(() => setShowMega(false), 150)
  }

  const navProductTypes = [
    { name: 'Buket Artificial', slug: 'Artificial Flowers' },
    { name: 'Buket Segar', slug: 'Fresh Flowers' },
    { name: 'Giftbox', slug: 'Giftbox' },
  ]
  const navOccasions = [
    { name: 'Wisuda', slug: 'Wisuda' },
    { name: 'Ulang Tahun', slug: 'Ulang Tahun' },
    { name: 'Anniversary', slug: 'Anniversary' },
    { name: 'Wedding', slug: 'Wedding' },
    { name: 'Hadiah', slug: 'Hadiah' },
    { name: 'Grand Opening', slug: 'Grand Opening' },
  ]
  const navRecipients = [
    { name: 'Untuk Pria', slug: 'Pria' },
    { name: 'Untuk Wanita', slug: 'Wanita' },
  ]

  return (
    <>
      <nav className="bg-background border-b border-border-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4">

            {/* Mobile hamburger */}
            <button
              onClick={openDrawer}
              className="lg:hidden -ml-1 p-2 text-heading"
              aria-label="Buka menu"
            >
              <HiMenu className="text-2xl" />
            </button>

            {/* Desktop: Logo + Nav links */}
            <div className="hidden lg:flex items-center gap-8">
              {/* Logo — left */}
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); onHome?.() }}
                className="flex-shrink-0"
                aria-label="Puthic Sari — Beranda"
              >
                <img
                  src={siteAssetUrl('logo-navbar-small.jpg')}
                  alt="Puthic Sari"
                  width="320"
                  height="174"
                  decoding="async"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </a>

              {/* Nav links — uppercase ZM-style */}
              <div className="flex items-center gap-6">
                <a
                  href="/collections"
                  onClick={(e) => { e.preventDefault(); onCollectionNavigate?.(null) }}
                  className="text-xs font-medium uppercase tracking-button text-heading hover:text-primary transition-colors"
                >
                  Sale
                </a>
                <a
                  href="#products"
                  onClick={(e) => { e.preventDefault(); onNewArrival?.(); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }) }}
                  className="text-xs font-medium uppercase tracking-button text-heading hover:text-primary transition-colors"
                >
                  New Arrivals
                </a>

                {/* Collection with mega-menu */}
                <div
                  className="relative"
                  onMouseEnter={handleMegaEnter}
                  onMouseLeave={handleMegaLeave}
                >
                  <button className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-button text-heading hover:text-primary transition-colors py-2">
                    Collection
                    <HiChevronDown className={`w-3 h-3 transition-transform ${showMega ? 'rotate-180' : ''}`} />
                  </button>
                  {showMega && (
                    <div className="absolute top-full left-0 bg-surface shadow-soft-lg rounded-b-[14px] z-50 min-w-[760px] p-8 mt-1">
                      <div className="grid grid-cols-3 gap-10">
                        <div>
                          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-eyebrow text-primary-dark">Berdasarkan Produk</h4>
                          <div className="flex flex-col gap-2.5">
                            {navProductTypes.map(type => (
                              <a
                                key={type.slug}
                                href={`/collections/${encodeURIComponent(type.slug)}`}
                                onClick={(e) => { e.preventDefault(); onCollectionNavigate?.(type.slug); setShowMega(false) }}
                                className="text-sm text-text-primary hover:text-primary transition-colors"
                              >
                                {type.name}
                              </a>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-eyebrow text-primary-dark">Berdasarkan Momen</h4>
                          <div className="flex flex-col gap-2.5">
                            {navOccasions.map(occ => (
                              <a
                                key={occ.slug}
                                href={`/collections/${encodeURIComponent(occ.slug)}`}
                                onClick={(e) => { e.preventDefault(); onCollectionNavigate?.(occ.slug); setShowMega(false) }}
                                className="text-sm text-text-primary hover:text-primary transition-colors"
                              >
                                {occ.name}
                              </a>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-eyebrow text-primary-dark">Berdasarkan Penerima</h4>
                          <div className="flex flex-col gap-2.5">
                            {navRecipients.map(recipient => (
                              <a
                                key={recipient.slug}
                                href={`/collections/${encodeURIComponent(recipient.slug)}`}
                                onClick={(e) => { e.preventDefault(); onCollectionNavigate?.(recipient.slug); setShowMega(false) }}
                                className="text-sm text-text-primary hover:text-primary transition-colors"
                              >
                                {recipient.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-border-soft flex items-center justify-between">
                        <a
                          href="/collections"
                          onClick={(e) => { e.preventDefault(); onCollectionNavigate?.(null); setShowMega(false) }}
                          className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-1.5"
                        >
                          Lihat Semua Produk
                          <HiChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Offline Store */}
                <a
                  href="#store"
                  onClick={(e) => { e.preventDefault(); onStoreSelect?.() }}
                  className="text-xs font-medium uppercase tracking-button text-heading hover:text-primary transition-colors"
                >
                  Offline Store
                </a>
              </div>
            </div>

            {/* Right — search, wishlist, account, cart */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Desktop inline search */}
              <form
                onSubmit={handleSearch}
                className="hidden lg:flex items-center gap-2 bg-secondary/40 rounded-full px-3 py-1.5 w-48 xl:w-56 focus-within:bg-secondary/70 transition-colors"
              >
                <HiSearch className="text-text-secondary text-sm flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Cari buket..."
                  value={searchVal}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="flex-1 text-xs bg-transparent text-heading placeholder:text-text-muted focus:outline-none"
                />
              </form>

              {/* Mobile search */}
              <button
                onClick={() => { setDrawerOpen(false); onSearchNavigate?.('') }}
                className="lg:hidden text-heading p-1"
                aria-label="Cari"
              >
                <HiSearch className="text-xl" />
              </button>

              {/* Wishlist */}
              <button
                onClick={() => onSearchNavigate?.('')}
                className="relative text-heading hover:text-primary transition-colors p-1"
                aria-label="Wishlist"
              >
                <HiHeart className="text-xl" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center font-bold leading-none rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Account */}
              <button
                onClick={onAccount}
                className="relative text-heading hover:text-primary transition-colors p-1"
                aria-label={isLoggedIn ? 'Akun saya' : 'Login'}
              >
                <HiUser className="text-xl" />
                {isLoggedIn && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-success border-2 border-background rounded-full" />
                )}
              </button>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative text-heading hover:text-primary transition-colors p-1"
                aria-label="Keranjang belanja"
              >
                <HiShoppingBag className="text-xl" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center font-bold leading-none rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />
          <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-surface flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 border-b border-border-soft flex-shrink-0">
              {drawerLevel !== 'main' ? (
                <button onClick={backLevel} className="flex items-center gap-1 text-sm text-text-primary hover:text-primary">
                  <HiChevronLeft className="text-base" /> Kembali
                </button>
              ) : (
                <span className="text-base font-display text-heading">Menu</span>
              )}
              <button onClick={closeDrawer} className="text-heading p-2 -mr-2" aria-label="Tutup menu">
                <HiX className="text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {drawerLevel === 'main' && (
                <div className="px-4 py-2">
                  <form onSubmit={handleSearch} className="flex items-center gap-2 bg-secondary/40 rounded-full px-4 py-2.5 mb-5">
                    <HiSearch className="text-text-secondary" />
                    <input
                      type="text"
                      placeholder="Cari buket..."
                      value={searchVal}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      className="flex-1 text-sm bg-transparent focus:outline-none"
                    />
                  </form>

                  <p className="eyebrow text-primary-dark px-1 py-2">Berdasarkan Produk</p>
                  {navProductTypes.map(type => (
                    <button
                      key={type.slug}
                      onClick={() => { onCollectionNavigate?.(type.slug); closeDrawer() }}
                      className="w-full flex items-center justify-between py-3 text-[15px] text-text-primary hover:text-primary border-b border-border-soft"
                    >
                      <span>{type.name}</span>
                      <HiChevronRight className="text-base text-text-muted" />
                    </button>
                  ))}

                  <p className="eyebrow text-primary-dark px-1 py-2 mt-4">Berdasarkan Momen</p>
                  {navOccasions.map(occ => (
                    <button
                      key={occ.slug}
                      onClick={() => { onCollectionNavigate?.(occ.slug); closeDrawer() }}
                      className="w-full flex items-center justify-between py-3 text-[15px] text-text-primary hover:text-primary border-b border-border-soft"
                    >
                      <span>{occ.name}</span>
                      <HiChevronRight className="text-base text-text-muted" />
                    </button>
                  ))}

                  <p className="eyebrow text-primary-dark px-1 py-2 mt-4">Berdasarkan Penerima</p>
                  {navRecipients.map(recipient => (
                    <button
                      key={recipient.slug}
                      onClick={() => { onCollectionNavigate?.(recipient.slug); closeDrawer() }}
                      className="w-full flex items-center justify-between py-3 text-[15px] text-text-primary hover:text-primary border-b border-border-soft"
                    >
                      <span>{recipient.name}</span>
                      <HiChevronRight className="text-base text-text-muted" />
                    </button>
                  ))}

                  <p className="eyebrow text-primary-dark px-1 py-2 mt-4">Lainnya</p>
                  {[
                    { label: 'Sale', fn: () => { onCollectionNavigate?.(null); closeDrawer() } },
                    { label: 'New Arrivals', fn: () => { onNewArrival?.(); closeDrawer() } },
                    { label: 'Semua Produk', fn: () => { onCollectionNavigate?.(null); closeDrawer() } },
                    { label: 'Offline Store', fn: () => { onStoreSelect?.(); closeDrawer() } },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={item.fn}
                      className="w-full flex items-center justify-between py-3 text-[15px] text-text-primary hover:text-primary border-b border-border-soft"
                    >
                      <span>{item.label}</span>
                      <HiChevronRight className="text-base text-text-muted" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
