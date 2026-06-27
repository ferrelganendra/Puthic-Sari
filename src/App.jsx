import { Suspense, lazy, useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect, useTransition } from 'react'
import { CartProvider, useCart } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import TrustStrip from './components/TrustStrip'
import CategoriesSection from './components/CategoriesSection'
import ProductCollection from './components/ProductCollection'

import Toast from './components/Toast'
import SeoTags from './components/SeoTags'
import NotFound from './components/NotFound'
import { getHomeSeo, getInfoPageSeo, getProductSeo } from './lib/seo'
import { findProductBySlug, getProductPath, getProductSlug } from './lib/slugs'
import { productImageUrl, productThumbnailUrl } from './lib/assetUrl'
import { fetchApprovedReviews as fetchApprovedReviewsQuery, getReviewStats } from './lib/reviews'
import fallbackProducts from './data/products'
import { infoPages } from './data/infoPages'
import useScrollReveal from './hooks/useScrollReveal'
import { supabase } from './lib/supabase'

const ProductDetail = lazy(() => import('./components/ProductDetail'))
const Cart = lazy(() => import('./components/Cart'))
const Checkout = lazy(() => import('./components/Checkout'))
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const AuthPage = lazy(() => import('./components/AuthPage'))
const CustomerAccount = lazy(() => import('./components/CustomerAccount'))
const StoreMap = lazy(() => import('./components/StoreMap'))
const BehindTheBouquet = lazy(() => import('./components/BehindTheBouquet'))
const ResetPassword = lazy(() => import('./components/ResetPassword'))
const Testimonials = lazy(() => import('./components/Testimonials'))
const InfoPage = lazy(() => import('./components/InfoPage'))
const Footer = lazy(() => import('./components/Footer'))
const WhatsAppWidget = lazy(() => import('./components/WhatsAppWidget'))
const FloatingTabs = lazy(() => import('./components/FloatingTabs'))
const CollectionPage = lazy(() => import('./components/CollectionPage'))
const SearchResults = lazy(() => import('./components/SearchResults'))
const loadAuth = () => import('./lib/auth')

const SUPABASE_TIMEOUT_MS = 8000
const fallbackProductByName = new Map(fallbackProducts.map(product => [product.name, product]))
const preferredProductImages = new Map(fallbackProducts.map(product => [product.name, product.images]))
const productThumbnailByName = new Map(fallbackProducts.map(product => [product.name, productThumbnailUrl(`/product-thumbs/${getProductSlug(product)}.jpg`)]))

const buildProductDescription = (product) => {
 const category = product.category ? ` kategori ${product.category}` : ''
 return `${product.name}${category}. Lihat foto produk dan detail harga di halaman ini.`
}

preferredProductImages.set('Thumbelina Old Paper Bloom', [
  productImageUrl('/product-photos/Thumbelina Old Paper Bloom/WhatsApp Image 2026-06-02 at 11.47.13 (1).jpeg'),
  productImageUrl('/product-photos/Thumbelina Old Paper Bloom/WhatsApp Image 2026-06-02 at 11.47.13.jpeg'),
  productImageUrl('/product-photos/Thumbelina Old Paper Bloom/WhatsApp Image 2026-06-02 at 11.47.14.jpeg'),
  productImageUrl('/product-photos/Thumbelina Old Paper Bloom/WhatsApp Image 2026-06-02 at 11.47.14 (1).jpeg'),
])

const normalizeProduct = (product) => {
  const fallback = fallbackProductByName.get(product.name) || {}
  const remoteImages = Array.isArray(product.images) && product.images.length > 0 ? product.images : []
  const fallbackImages = preferredProductImages.get(product.name) || (Array.isArray(fallback.images) ? fallback.images : [])
  // DB images are Supabase Storage URLs. If DB is unavailable, convert
  // fallback local paths to Storage URLs so every image path works the same way.
  const images = remoteImages.length > 0
    ? remoteImages
    : (Array.isArray(fallbackImages) ? fallbackImages.map(pi => productImageUrl(pi)) : [])
  const badge = (product.badge || fallback.badge || '').toLowerCase()
  const fallbackBestSeller = fallback.is_best_seller ?? badge.includes('best seller')
  const fallbackNewArrival = fallback.is_new_arrival ?? (badge.includes('baru') || badge.includes('new'))

  return {
   ...fallback,
   ...product,
   images,
   image: images[0] || product.image || fallback.image || '',
   thumbnail: product.thumbnail || fallback.thumbnail || productThumbnailByName.get(product.name),
   category: product.category || fallback.category,
   description: buildProductDescription({ ...fallback, ...product }),
   material: product.material || fallback.material || null,
   occasionIds: (product.product_occasions || []).map(po => po.occasion_id),
   is_best_seller: Boolean(product.is_best_seller || fallbackBestSeller),
   is_sold_out: product.is_sold_out ?? product.isSoldOut ?? fallback.is_sold_out ?? fallback.isSoldOut ?? false,
   is_new_arrival: Boolean(product.is_new_arrival || fallbackNewArrival),
  }
 }

const localProducts = fallbackProducts.map(normalizeProduct)

const localCategories = [...new Set(localProducts.map(product => product.category).filter(Boolean))]
 .sort((a, b) => a.localeCompare(b))
 .map((name, index) => ({ id: `local-${index}`, name }))

const getPageSlugFromLocation = () => {
 const slug = window.location.hash.replace(/^#\/?/, '').split('?')[0]
 if (infoPages[slug]) return slug

 const pathSlug = window.location.pathname.replace(/^\/|\/$/g, '')
 return infoPages[pathSlug] ? pathSlug : null
}

const getProductSlugFromLocation = () => {
 const match = window.location.pathname.match(/^\/products\/([^/]+)/)
 return match ? decodeURIComponent(match[1]) : null
}

const getCollectionSlugFromLocation = () => {
 const match = window.location.pathname.match(/^\/collections\/([^/]+)/)
 if (match) return decodeURIComponent(match[1])
 // Bare /collections → show all products
 if (window.location.pathname === '/collections') return 'all'
 return null
}

const getSearchQueryFromLocation = () => {
 const params = new URLSearchParams(window.location.search)
 return params.get('q') || null
}

const withTimeout = (promise, label) => new Promise((resolve, reject) => {
 const timer = setTimeout(() => reject(new Error(`${label} timeout`)), SUPABASE_TIMEOUT_MS)

 promise
  .then(value => {
   clearTimeout(timer)
   resolve(value)
  })
  .catch(error => {
   clearTimeout(timer)
   reject(error)
  })
})

function LazyOnVisible({ children, minHeight = 0, rootMargin = '500px' }) {
 const ref = useRef(null)
 const [visible, setVisible] = useState(false)

 useEffect(() => {
  if (visible) return undefined
  if (!('IntersectionObserver' in window)) {
   setVisible(true)
   return undefined
  }

  const observer = new IntersectionObserver(([entry]) => {
   if (entry.isIntersecting) {
    setVisible(true)
    observer.disconnect()
   }
  }, { rootMargin })

  if (ref.current) observer.observe(ref.current)
  return () => observer.disconnect()
 }, [rootMargin, visible])

 return (
  <div ref={ref} style={visible ? undefined : { minHeight }}>
   {visible ? children : null}
  </div>
 )
}

function LazyAfterIdle({ children, timeout = 6000 }) {
 const [ready, setReady] = useState(false)

 useEffect(() => {
  let idleId
  const delayId = window.setTimeout(() => {
   if ('requestIdleCallback' in window) {
    idleId = window.requestIdleCallback(() => setReady(true), { timeout: 1200 })
   } else {
    setReady(true)
   }
  }, timeout)

  return () => {
   window.clearTimeout(delayId)
   if (idleId) window.cancelIdleCallback(idleId)
  }
 }, [timeout])

 return ready ? children : null
}

function DeferredCart({ onCheckout }) {
 const { isCartOpen } = useCart()

 if (isCartOpen) {
  return (
   <Suspense fallback={null}>
    <Cart onCheckout={onCheckout} />
   </Suspense>
  )
 }

 return (
  <Suspense fallback={null}>
   <LazyAfterIdle timeout={6000}>
    <Cart onCheckout={onCheckout} />
   </LazyAfterIdle>
  </Suspense>
 )
}

function scheduleIdle(callback, timeout = 1400) {
 let idleId
 const delayId = window.setTimeout(() => {
  if ('requestIdleCallback' in window) {
   idleId = window.requestIdleCallback(callback, { timeout: 1200 })
  } else {
   callback()
  }
 }, timeout)

 return () => {
  window.clearTimeout(delayId)
  if (idleId) window.cancelIdleCallback(idleId)
 }
}

function AppInner() {
 useScrollReveal()
 const { syncCartWithProducts } = useCart()
 const syncCartRef = useRef(syncCartWithProducts)
 useEffect(() => { syncCartRef.current = syncCartWithProducts }, [syncCartWithProducts])

 const [searchQuery, setSearchQuery] = useState('')
 const [categoryFilter, setCategoryFilter] = useState(null)
 const [occasionFilter, setOccasionFilter] = useState(null)
 const [bestSellerOnly, setBestSellerOnly] = useState(false)
 const [newArrivalOnly, setNewArrivalOnly] = useState(false)
 const [selectedProduct, setSelectedProduct] = useState(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [authRoute, setAuthRoute] = useState(null) // 'login' | 'register' | 'forgot-password' | null
  const [accountRoute, setAccountRoute] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [showResetPwd, setShowResetPwd] = useState(() => window.location.pathname.startsWith('/reset-password'))
  const [products, setProducts] = useState(localProducts)
  const [categories, setCategories] = useState(localCategories)
  const [occasions, setOccasions] = useState([])
  const [approvedReviews, setApprovedReviews] = useState([])

  const [loading, setLoading] = useState(true)
  const [activePageSlug, setActivePageSlug] = useState(() => getPageSlugFromLocation())
  const [routeProductSlug, setRouteProductSlug] = useState(() => getProductSlugFromLocation())
  const [collectionSlug, setCollectionSlug] = useState(() => getCollectionSlugFromLocation())
  const [searchPageQuery, setSearchPageQuery] = useState(() => getSearchQueryFromLocation())
  const [notFoundRoute, setNotFoundRoute] = useState(false)
  const [pendingScrollRestore, setPendingScrollRestore] = useState(null)
  const [isPending, startTransition] = useTransition()

 // Auth state
 const [session, setSession] = useState(null)
 const [profile, setProfile] = useState(null)
 const [authLoading, setAuthLoading] = useState(true)

  // Scroll memory — save per history entry so Back returns to clicked position
 const saveScrollPosition = useCallback((target) => {
  const key = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const scrollY = window.scrollY
  const anchor = target?.closest?.('[data-scroll-anchor]')?.dataset.scrollAnchor || null
  const anchorTop = target?.closest?.('[data-scroll-anchor]')?.getBoundingClientRect().top || 0
  const scrollState = { scrollY, anchor, anchorTop }
  sessionStorage.setItem(`puthicsari-scroll:${key}`, JSON.stringify(scrollState))
  window.history.replaceState({ ...(window.history.state || {}), ...scrollState }, '')
 }, [])

 const getSavedScrollPosition = useCallback((state = window.history.state) => {
  const key = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const saved = sessionStorage.getItem(`puthicsari-scroll:${key}`)
  if (saved) {
   try { return JSON.parse(saved) } catch { return { scrollY: parseInt(saved, 10) || 0 } }
  }
  return {
   scrollY: Number.isFinite(state?.scrollY) ? state.scrollY : 0,
   anchor: state?.anchor || null,
   anchorTop: Number.isFinite(state?.anchorTop) ? state.anchorTop : 0,
  }
 }, [])

 useLayoutEffect(() => {
  if (pendingScrollRestore === null) return
  const target = pendingScrollRestore.anchor
   ? document.querySelector(`[data-scroll-anchor="${CSS.escape(pendingScrollRestore.anchor)}"]`)
   : null
  const top = target
   ? window.scrollY + target.getBoundingClientRect().top - pendingScrollRestore.anchorTop
   : pendingScrollRestore.scrollY
  window.scrollTo({ top, behavior: 'instant' })
  setPendingScrollRestore(null)
 }, [pendingScrollRestore, activePageSlug, routeProductSlug, collectionSlug, searchPageQuery, notFoundRoute])

 const scrollToHomeSection = useCallback((id) => {
  startTransition(() => {
   setActivePageSlug(null)
   setRouteProductSlug(null)
   setCollectionSlug(null)
     setSearchPageQuery(null)
     setSelectedProduct(null)
     setNotFoundRoute(false)
    })
  const nextUrl = id ? `/#${id}` : '/'
  if (`${window.location.pathname}${window.location.hash}` !== nextUrl) {
    window.history.pushState({ scrollY: id ? 0 : window.scrollY }, '', nextUrl)
  }
  window.requestAnimationFrame(() => {
   if (id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
     setPendingScrollRestore(getSavedScrollPosition())
    }
   })
  }, [getSavedScrollPosition])

  useEffect(() => {
    const handleLocationChange = (event) => {
      const isPopstate = event?.type === 'popstate'
      const popScrollY = isPopstate ? getSavedScrollPosition(event.state) : null
     const pageSlug = getPageSlugFromLocation()
    const productSlug = getProductSlugFromLocation()
    const collSlug = getCollectionSlugFromLocation()
    const searchQ = getSearchQueryFromLocation()
    const resetPath = window.location.pathname.startsWith('/reset-password')
    const loginPath = window.location.pathname.startsWith('/login')
    const registerPath = window.location.pathname.startsWith('/register')
    const forgotPath = window.location.pathname.startsWith('/forgot-password')
    const accountPath = window.location.pathname.startsWith('/account')
    const authRoute = loginPath ? 'login' : registerPath ? 'register' : forgotPath ? 'forgot-password' : null
    const path = window.location.pathname
    const knownPath = path === '/' || resetPath || loginPath || registerPath || forgotPath || accountPath || Boolean(pageSlug || productSlug || collSlug || searchQ)

    setShowResetPwd(resetPath)
    setAuthRoute(authRoute)
    setAccountRoute(accountPath)
    setNotFoundRoute(!knownPath)
    startTransition(() => {
     setActivePageSlug(pageSlug)
     setRouteProductSlug(productSlug)
     setCollectionSlug(collSlug)
     setSearchPageQuery(searchQ)
    })

   if (pageSlug || productSlug || collSlug || searchQ || !knownPath) {
    if (isPopstate) setPendingScrollRestore(popScrollY)
    else window.scrollTo({ top: 0, behavior: 'smooth' })
    return
   }

   startTransition(() => {
    setSelectedProduct(null)
   })

    const anchor = window.location.hash.replace('#', '')
   if (isPopstate) {
    setPendingScrollRestore(popScrollY)
   } else if (anchor === 'products' || anchor === 'store' || anchor === 'reviews') {
    window.requestAnimationFrame(() => {
     document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
    })
   }
  }

  window.addEventListener('hashchange', handleLocationChange)
  window.addEventListener('popstate', handleLocationChange)
  handleLocationChange()
  return () => {
   window.removeEventListener('hashchange', handleLocationChange)
   window.removeEventListener('popstate', handleLocationChange)
  }
 }, [])

  useEffect(() => {
   if (!routeProductSlug) return
   const routeProduct = findProductBySlug(products, routeProductSlug)
   if (routeProduct) {
    setNotFoundRoute(false)
    setActivePageSlug(null)
    setSelectedProduct(routeProduct)
    return
   }

   setSelectedProduct(null)
   setNotFoundRoute(true)
  }, [products, routeProductSlug])

  // Listen for open-auth event from Checkout/Cart — navigate to full page login
  useEffect(() => {
   const handleOpenAuth = () => {
    saveScrollPosition()
    window.history.pushState({ scrollY: 0 }, '', '/login')
    setAuthRoute('login')
   }
   window.addEventListener('open-auth', handleOpenAuth)
   return () => window.removeEventListener('open-auth', handleOpenAuth)
  }, [saveScrollPosition])

  // Listen for view-product event from ProductDetail related products
  useEffect(() => {
   const handleViewProductEvent = (e) => {
    if (e.detail) {
     handleViewProduct(e.detail)
    }
   }
   window.addEventListener('view-product', handleViewProductEvent)
   return () => window.removeEventListener('view-product', handleViewProductEvent)
  }, [])

 const fetchProducts = useCallback(async () => {
   try {
    const { data, error } = await withTimeout(

    supabase
     .from('products')
     .select('*, product_occasions(occasion_id)')
     .eq('is_active', true)
     .order('id', { ascending: true }),
    'Fetch produk Supabase'
   )

   if (error) throw error
    if (Array.isArray(data) && data.length > 0) {
     const normalized = data.map(normalizeProduct)
     setProducts(normalized)
     syncCartRef.current(normalized)
    }
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Menggunakan produk lokal:', error.message)
  } finally {
   setLoading(false)
  }
  }, [])

  const fetchApprovedReviews = useCallback(async () => {
   try {
     const reviews = await withTimeout(
      fetchApprovedReviewsQuery(supabase, { limit: 6 }),
      'Fetch approved reviews Supabase'
     )

     setApprovedReviews(reviews)

   } catch (error) {
     if (import.meta.env.DEV) console.warn('Review publik Supabase tidak tersedia:', error.message)
    setApprovedReviews([])
   }
  }, [])

  // Check existing session on mount

 useEffect(() => {
  let cancelled = false
  let subscription

  async function initAuth() {
   try {
     const { ensureProfile } = await loadAuth()

    const { data: { session } } = await supabase.auth.getSession()

    if (!cancelled && session) {
     setSession(session)
     const p = await ensureProfile(session.user)
     if (!cancelled) setProfile(p)
    }

     const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
       setProfile(null)
       setAuthLoading(false)
       return
      }

      setAuthLoading(false)
     })

    subscription = data.subscription
   } catch (error) {
     if (import.meta.env.DEV) console.warn('Gagal membaca sesi:', error.message)
   } finally {
    if (!cancelled) setAuthLoading(false)
   }
  }

  initAuth()

  return () => {
   cancelled = true
   subscription?.unsubscribe()
  }
 }, [])

 useEffect(() => {
  async function fetchCategories() {
   try {
    const { data, error } = await withTimeout(
     supabase
      .from('categories')
      .select('*')
      .order('name'),
     'Fetch kategori Supabase'
    )
    if (error) throw error
    if (Array.isArray(data) && data.length > 0) setCategories(data)
   } catch (error) {
     if (import.meta.env.DEV) console.warn('Menggunakan kategori lokal:', error.message)
   }
  }

  async function fetchOccasions() {
   try {
    const { data, error } = await withTimeout(
     supabase
      .from('occasions')
      .select('*')
      .order('id'),
     'Fetch occasion Supabase'
    )
    if (error) throw error
    setOccasions(data || [])
   } catch (error) {
     if (import.meta.env.DEV) console.warn('Occasion Supabase tidak tersedia:', error.message)
   }
  }

   if (routeProductSlug) {
    fetchProducts()
    fetchCategories()
    fetchOccasions()
    fetchApprovedReviews()
    return undefined
   }

   return scheduleIdle(() => {
    fetchProducts()
    fetchCategories()
    fetchOccasions()
    fetchApprovedReviews()
   }, 6000)
  }, [fetchApprovedReviews, fetchProducts, routeProductSlug])


 useEffect(() => {
  let cancelled = false
  let channel

  const cancelIdle = scheduleIdle(async () => {
   try {
    if (cancelled) return

    channel = supabase
     .channel('storefront-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_occasions' }, fetchProducts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchApprovedReviews)
      .subscribe()

   } catch (error) {
     if (import.meta.env.DEV) console.warn('Realtime produk tidak aktif:', error.message)
   }
  }, 9000)

  return () => {
   cancelled = true
   cancelIdle()
    if (channel) {
     supabase.removeChannel(channel).catch(() => {})
    }

  }
  }, [fetchApprovedReviews, fetchProducts])

  // Filter by category from navbar/menu

 const handleCategorySelect = (category) => {
  setCategoryFilter(category)
  setOccasionFilter(null)
  setBestSellerOnly(false)
  setNewArrivalOnly(false)
  setSearchQuery('')
  scrollToHomeSection('products')
 }

 // Filter by occasion from navbar/menu
 const handleOccasionSelect = (occasion) => {
  setOccasionFilter(occasion)
  setCategoryFilter(null)
  setBestSellerOnly(false)
  setNewArrivalOnly(false)
  setSearchQuery('')
  scrollToHomeSection('products')
 }

  const handleBestSellerSelect = () => {
   setBestSellerOnly(true)
   setCategoryFilter(null)
   setOccasionFilter(null)
   setNewArrivalOnly(false)
   setSearchQuery('')
   handleCollectionNavigate('Best Seller')
  }

  // Handle NEW ARRIVALS filter by is_new_arrival flag
  const handleNewArrival = () => {
   setNewArrivalOnly(true)
   setBestSellerOnly(false)
   setCategoryFilter(null)
   setOccasionFilter(null)
   setSearchQuery('')
   handleCollectionNavigate('New Arrivals')
  }

 const handleSearchChange = (query) => {
  setSearchQuery(query)
  scrollToHomeSection('products')
 }

  // Navigate to collection page
  const handleCollectionNavigate = (category = null, target = null) => {
   saveScrollPosition(target)
   startTransition(() => {
    setActivePageSlug(null)
    setRouteProductSlug(null)
     setSearchPageQuery(null)
     setSelectedProduct(null)
     setNotFoundRoute(false)
    })
    const path = category ? `/collections/${encodeURIComponent(category)}` : '/collections'
    window.history.pushState({ scrollY: 0 }, '', path)
   startTransition(() => {
    setCollectionSlug(category || 'all')
   })
   window.scrollTo({ top: 0, behavior: 'instant' })
  }

  // Navigate to search page
  const handleSearchNavigate = (query) => {
   saveScrollPosition()
   startTransition(() => {
    setActivePageSlug(null)
    setRouteProductSlug(null)
     setCollectionSlug(null)
     setSelectedProduct(null)
     setNotFoundRoute(false)
    })
    const path = query ? `/search?q=${encodeURIComponent(query)}` : '/search'
    window.history.pushState({ scrollY: 0 }, '', path)
   startTransition(() => {
    setSearchPageQuery(query || '')
   })
   window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleHome = () => {
   startTransition(() => {
    setCategoryFilter(null)
    setOccasionFilter(null)
    setBestSellerOnly(false)
    setNewArrivalOnly(false)
     setSearchQuery('')
     setCollectionSlug(null)
     setSearchPageQuery(null)
     setNotFoundRoute(false)
    })
   scrollToHomeSection(null)
  }

  // Handle account icon click
   const handleAccountClick = () => {
    if (session && profile) {
      if (profile.role === 'admin') {
       setNotFoundRoute(false)
       setShowAdmin(true)
      } else {
        saveScrollPosition()
        window.history.pushState({ scrollY: 0 }, '', '/account')
        setNotFoundRoute(false)
       setAccountRoute(true)
      }
      } else {
       saveScrollPosition()
       window.history.pushState({ scrollY: 0 }, '', '/login')
      setNotFoundRoute(false)
      setAuthRoute('login')
     }
   }

  // Handle successful auth
  const handleAuth = (newSession, newProfile) => {
   setSession(newSession)
   setProfile(newProfile)
   setAuthRoute(null)

   // Redirect based on role
   if (newProfile?.role === 'admin') {
    setShowAdmin(true)
    } else {
     window.history.pushState({ scrollY: 0 }, '', '/account')
     setAccountRoute(true)
    }
  }

  // Handle logout
  const handleLogout = () => {
   setSession(null)
   setProfile(null)
   setAccountRoute(false)
   setShowAdmin(false)
   window.history.pushState({ scrollY: 0 }, '', '/')
  }

 const handleViewProduct = (product, event) => {
   saveScrollPosition(event?.currentTarget)
   startTransition(() => {
    setActivePageSlug(null)
    setRouteProductSlug(null)
    setNotFoundRoute(false)
   })
   setSelectedProduct(product)
  const productPath = getProductPath(product)
  if (window.location.pathname !== productPath) {
   window.history.pushState({ scrollY: 0 }, '', productPath)
  }
 }

 const handleCloseProduct = () => {
  setSelectedProduct(null)
  setRouteProductSlug(null)
  if (window.location.pathname.startsWith('/products/')) {
   window.history.pushState({ scrollY: window.scrollY }, '', '/')
  }
 }

  const currentPage = activePageSlug ? infoPages[activePageSlug] : null
  const reviewStats = useMemo(() => getReviewStats(approvedReviews), [approvedReviews])
  const seo = selectedProduct

  ? getProductSeo(selectedProduct)
  : currentPage
   ? getInfoPageSeo(activePageSlug, currentPage)
   : getHomeSeo({ searchQuery, categoryFilter, occasionFilter, bestSellerOnly, newArrivalOnly })

  return (
   <>
     <SeoTags seo={seo} product={selectedProduct} reviews={selectedProduct ? [] : approvedReviews} reviewStats={selectedProduct ? null : reviewStats} />
      <div className="min-h-screen bg-background">
      {showResetPwd ? (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" /></div>}>
          <ResetPassword onClose={() => window.history.pushState({}, '', '/')} />
        </Suspense>
      ) : authRoute ? (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" /></div>}>
         <AuthPage
          key={authRoute}
          onAuth={handleAuth}
          initialTab={authRoute === 'forgot-password' ? 'login' : authRoute}
         />
        </Suspense>
      ) : accountRoute && authLoading ? (
        <div className="min-h-screen bg-background flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" /></div>
      ) : accountRoute && session && profile ? (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" /></div>}>
         <CustomerAccount
          session={session}
          profile={profile}
          onClose={() => window.history.pushState({}, '', '/')}
          onLogout={handleLogout}
         />
        </Suspense>
      ) : showCheckout ? (
       <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" /></div>}>
        <Checkout onClose={() => setShowCheckout(false)} />
       </Suspense>
      ) : notFoundRoute ? (
        <>
         <Navbar
         onSearch={handleSearchChange}
         onSearchNavigate={handleSearchNavigate}
         onAccount={handleAccountClick}
         onCategorySelect={handleCategorySelect}
         onOccasionSelect={handleOccasionSelect}
         onBestSellerSelect={handleBestSellerSelect}
         onNewArrival={handleNewArrival}
         onHome={handleHome}
         onStoreSelect={() => scrollToHomeSection('store')}
         onCollectionNavigate={handleCollectionNavigate}
         categories={categories}
         occasions={occasions}
         isLoggedIn={!!session}
        />
        <NotFound onHome={handleHome} />
        <Suspense fallback={null}>
         <LazyOnVisible minHeight={360} rootMargin="700px">
          <Footer />
         </LazyOnVisible>
        </Suspense>
       </>
      ) : selectedProduct && routeProductSlug && loading ? (
       <div className="min-h-screen bg-background flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" /></div>
      ) : selectedProduct ? (
       <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Navbar
         onSearch={handleSearchChange}
         onSearchNavigate={handleSearchNavigate}
         onAccount={handleAccountClick}
         onCategorySelect={handleCategorySelect}
         onOccasionSelect={handleOccasionSelect}
         onBestSellerSelect={handleBestSellerSelect}
         onNewArrival={handleNewArrival}
         onHome={handleHome}
         onStoreSelect={() => scrollToHomeSection('store')}
         onCollectionNavigate={handleCollectionNavigate}
         categories={categories}
         occasions={occasions}
         isLoggedIn={!!session}
        />
         <ProductDetail
         product={selectedProduct}
         allProducts={products}
         onClose={handleCloseProduct}
         onCollectionNavigate={handleCollectionNavigate}
         onHome={handleHome}
        />
        <Suspense fallback={null}>
          <LazyOnVisible minHeight={360} rootMargin="700px">
           <Footer />
          </LazyOnVisible>
        </Suspense>
       </Suspense>
      ) : (
        <>
         <Navbar
        onSearch={handleSearchChange}
        onSearchNavigate={handleSearchNavigate}
        onAccount={handleAccountClick}
        onCategorySelect={handleCategorySelect}
        onOccasionSelect={handleOccasionSelect}
        onBestSellerSelect={handleBestSellerSelect}
        onNewArrival={handleNewArrival}
        onHome={handleHome}
        onStoreSelect={() => scrollToHomeSection('store')}
        onCollectionNavigate={handleCollectionNavigate}
        categories={categories}
        occasions={occasions}
        isLoggedIn={!!session}
       />
     {activePageSlug ? (
       <Suspense fallback={<div className="min-h-[50vh] bg-background" />}>
        <InfoPage slug={activePageSlug} onHome={handleHome} />
       </Suspense>
      ) : collectionSlug ? (
        <Suspense fallback={<div className="min-h-[50vh] bg-background" />}>
         <CollectionPage
          products={products}
          categories={categories}
          onViewDetail={handleViewProduct}
          initialCategory={collectionSlug === 'all' ? null : collectionSlug}
          onHome={handleHome}
         />
        </Suspense>
     ) : searchPageQuery !== null ? (
       <Suspense fallback={<div className="min-h-[50vh] bg-background" />}>
         <SearchResults
         products={products}
         onViewDetail={handleViewProduct}
         onSearch={handleSearchNavigate}
         onHome={handleHome}
         initialQuery={searchPageQuery}
        />
      </Suspense>
     ) : (
       <>
        <Hero />
        <TrustStrip />
        <CategoriesSection
         onCategorySelect={handleCategorySelect}
         onCollectionNavigate={handleCollectionNavigate}
         categories={categories}
         products={products}
        />
         {loading ? (
          <div className="max-w-7xl mx-auto px-4 py-16 text-center text-text-muted text-sm">Memuat produk...</div>
         ) : (
          <>
           <ProductCollection
            title="Best Seller"
            eyebrow="Paling Diminati"
            products={products.filter(p => p.is_best_seller)}
            onViewDetail={handleViewProduct}
            limit={8}
            ctaLabel="Lihat Semua"
            onViewAll={handleBestSellerSelect}
          />
          <ProductCollection
            title="New Arrivals"
            eyebrow="Koleksi Baru"
            products={products.filter(p => p.is_new_arrival)}
            onViewDetail={handleViewProduct}
            limit={8}
            ctaLabel="Lihat Semua"
            onViewAll={handleNewArrival}
            background="#FFF4F0"
          />
         </>
        )}
          <BehindTheBouquet />

          <StoreMap />


       </>
     )}
     <Suspense fallback={null}>
      <LazyOnVisible minHeight={360} rootMargin="700px">
       <Footer />
      </LazyOnVisible>
     </Suspense>
      </>
     )}
      <DeferredCart onCheckout={() => setShowCheckout(true)} />
      <Toast />
    {showAdmin && (
     <Suspense fallback={null}>
      <AdminDashboard
       onClose={() => {
        fetchProducts()
        setShowAdmin(false)
       }}
       onProductsChanged={fetchProducts}
      />
     </Suspense>
    )}
      <Suspense fallback={null}>
       <FloatingTabs
        onViewProduct={(p) => window.dispatchEvent(new CustomEvent('view-product', { detail: p }))}
        products={products}
       />
      </Suspense>
    </div>
   </>
  )
}

export default function App() {
 return (
  <WishlistProvider>
   <CartProvider>
    <AppInner />
   </CartProvider>
  </WishlistProvider>
 )
}
