import { useState, useEffect, useRef, useCallback } from 'react'
import { HiChevronLeft, HiChevronRight, HiPause, HiPlay } from 'react-icons/hi'
import { bannerUrl } from '../lib/assetUrl'
import { supabase } from '../lib/supabase'

/**
 * Hero — ZM-style full-width ecommerce banner carousel.
 * - Loads banners from Supabase `banners` table (admin-uploaded via BannersPage)
 * - Falls back to hardcoded promo slides when no DB banners exist
 * - 5s autoplay, smooth fade, pause on hover
 * - Prev/Next, dots, swipe support
 */
const AUTOPLAY_MS = 5000

/** Default banners shown when the admin hasn't uploaded any banners yet. */
const FALLBACK_SLIDES = [
  {
    src: '/posters/poster-1.jpg',
    mobileSrc: '/posters/poster-1.jpg',
    eyebrow: 'Koleksi Buket',
    title: 'Buket untuk Berbagai Momen',
    subtitle: 'Pilih buket untuk wisuda, ulang tahun, anniversary, dan hadiah.',
    cta: 'Lihat Koleksi',
    href: '/collections',
  },
  {
    src: '/posters/poster-2.jpg',
    mobileSrc: '/posters/poster-2.jpg',
    eyebrow: 'Buket Artificial',
    title: 'Pilihan Buket Artificial',
    subtitle: 'Lihat koleksi buket artificial yang tersedia di Puthic Sari.',
    cta: 'Lihat Koleksi',
    href: '/collections',
  },
  {
    src: '/posters/poster-3.jpg',
    mobileSrc: '/posters/poster-3.jpg',
    eyebrow: 'Chat WhatsApp',
    title: 'Buket Thumbelina Sesuai Momenmu',
    subtitle: 'Hubungi kami via WhatsApp untuk order buket thumbelina sesuai momenmu.',
    cta: 'Chat WhatsApp',
    href: 'https://wa.me/6285117606161',
  },
]

function optimizedPosterSources(src) {
  const match = src.match(/^\/posters\/(poster-\d+)\.jpg$/)
  if (!match) return null
  const base = `/posters/${match[1]}`
  return {
    avif: `${base}-640.avif 640w, ${base}-1024.avif 1024w, ${base}.avif 1672w`,
    webp: `${base}-640.webp 640w, ${base}-1024.webp 1024w, ${base}.webp 1672w`,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px',
  }
}

export default function Hero() {
  const [activeSlides, setActiveSlides] = useState(FALLBACK_SLIDES)
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [announce, setAnnounce] = useState('')
  const timersRef = useRef({ delay: null, interval: null })
  const touchStartX = useRef(null)
  const touchEndX = useRef(null)

  // Keep a ref so navigation callbacks always see the latest slides
  const activeSlidesRef = useRef(activeSlides)
  activeSlidesRef.current = activeSlides

  // --- Load banners from Supabase on mount ---
  useEffect(() => {
    let cancelled = false
    const loadBanners = async () => {
      if (cancelled) return
      try {
        const { data } = await supabase
          .from('banners')
          .select('id, image_url, sort_order, is_active')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(5)

        if (cancelled) return
        if (data && data.length > 0) {
          const dbSlides = data
            .filter((b) => b.image_url)
            .map((banner, i) => ({
              src: banner.image_url,
              mobileSrc: banner.image_url,
              // Keep the text overlay from fallback so it doesn't flash-disappear
              ...(FALLBACK_SLIDES[i] || {
                eyebrow: '',
                title: '',
                subtitle: '',
                cta: '',
                href: '/collections',
              }),
            }))
          if (dbSlides.length > 0) {
            // Preload the first DB banner before swapping to avoid gray flash
            const img = new Image()
            img.onload = () => {
              if (cancelled) return
              setActiveSlides(dbSlides)
              setCurrent(0)
            }
            img.onerror = () => {
              if (cancelled) return
              setActiveSlides(dbSlides)
              setCurrent(0)
            }
            img.src = dbSlides[0].src
          }
        }
      } catch {
        // Silently fall back to hardcoded slides
      }
    }

    // Tiny delay so the local fallback is painted first, then swap to DB
    const timeout = setTimeout(loadBanners, 50)

    return () => { cancelled = true; clearTimeout(timeout) }
  }, [])

  const clearTimers = useCallback(() => {
    if (timersRef.current.delay) clearTimeout(timersRef.current.delay)
    if (timersRef.current.interval) clearInterval(timersRef.current.interval)
    timersRef.current.delay = null
    timersRef.current.interval = null
  }, [])

  const slideCount = activeSlides.length

  useEffect(() => {
    setAnnounce(`Menampilkan banner ${current + 1} dari ${slideCount}`)
  }, [current, slideCount])

  useEffect(() => {
    if (paused) { clearTimers(); return undefined }
    clearTimers()
    const start = setTimeout(() => {
      setCurrent(prev => (prev + 1) % slideCount)
      timersRef.current.interval = setInterval(() => {
        setCurrent(prev => (prev + 1) % slideCount)
      }, AUTOPLAY_MS)
    }, AUTOPLAY_MS)
    timersRef.current.delay = start
    return clearTimers
  }, [paused, clearTimers, slideCount])

  const goTo = useCallback((idx) => {
    clearTimers()
    setCurrent(idx)
    if (!paused) {
      const start = setTimeout(() => {
        setCurrent(prev => (prev + 1) % activeSlidesRef.current.length)
        timersRef.current.interval = setInterval(() => {
          setCurrent(prev => (prev + 1) % activeSlidesRef.current.length)
        }, AUTOPLAY_MS)
      }, AUTOPLAY_MS)
      timersRef.current.delay = start
    }
  }, [paused, clearTimers])

  const prev = useCallback(() => goTo((current - 1 + activeSlidesRef.current.length) % activeSlidesRef.current.length), [current, goTo])
  const next = useCallback(() => goTo((current + 1) % activeSlidesRef.current.length), [current, goTo])

  // Swipe handling
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchMove = (e) => { touchEndX.current = e.touches[0].clientX }
  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) next()
      else prev()
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  return (
    <section
      className="relative w-full"
      aria-label="Hero Puthic Sari"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">{announce}</div>

      <div className="relative isolate w-full overflow-hidden rounded-2xl bg-secondary transform-gpu md:rounded-[28px]" style={{ aspectRatio: '16/9' }}>
        {activeSlides.map((slide, i) => (
          <a
            key={slide.src + i}
            href={slide.href}
            aria-label={slide.cta || 'Banner Puthic Sari'}
            aria-hidden={i !== current}
            tabIndex={i === current ? 0 : -1}
            className={`absolute inset-0 overflow-hidden rounded-[inherit] transition-opacity duration-700 ease-in-out ${
              i === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {(() => {
              const optimized = optimizedPosterSources(slide.src)
              if (optimized) {
                return (
                  <picture>
                    <source type="image/avif" srcSet={optimized.avif} sizes={optimized.sizes} />
                    <source type="image/webp" srcSet={optimized.webp} sizes={optimized.sizes} />
                    <img
                      src={slide.src}
                      alt=""
                      loading={i === 0 ? 'eager' : 'lazy'}
                      fetchpriority={i === 0 ? 'high' : 'auto'}
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </picture>
                )
              }
              return slide.mobileSrc && slide.mobileSrc !== slide.src ? (
                <picture>
                  <source media="(max-width: 640px)" srcSet={slide.mobileSrc} />
                  <img
                    src={slide.src}
                    alt=""
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchpriority={i === 0 ? 'high' : 'auto'}
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </picture>
              ) : (
                <img
                  src={slide.src}
                  alt=""
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchpriority={i === 0 ? 'high' : 'auto'}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )
            })()}

            {/* Gradient overlay for text readability (only when slide has text) */}
            {(slide.eyebrow || slide.title) && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />

                {/* Text overlay */}
                <div className="absolute inset-0 flex items-center">
                  <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
                    <div className="max-w-lg">
                      {slide.eyebrow && (
                        <p className="text-[11px] sm:text-xs uppercase tracking-eyebrow font-semibold text-white/80 mb-1.5 sm:mb-2">
                          {slide.eyebrow}
                        </p>
                      )}
                      {slide.title && (
                        <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-display font-medium text-white leading-tight">
                          {slide.title}
                        </h2>
                      )}
                      {slide.subtitle && (
                        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white/85 max-w-md leading-relaxed hidden sm:block">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.cta && (
                        <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 bg-white text-heading px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold hover:bg-white/90 transition-colors">
                            {slide.cta}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </a>
        ))}

        {/* Prev / Next chevrons */}
        <button
          onClick={(e) => { e.preventDefault(); prev() }}
          aria-label="Banner sebelumnya"
          className="absolute left-2 sm:left-4 top-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 -translate-y-1/2 items-center justify-center bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
        >
          <HiChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); next() }}
          aria-label="Banner berikutnya"
          className="absolute right-2 sm:right-4 top-1/2 z-20 flex h-9 w-9 sm:h-10 sm:w-10 -translate-y-1/2 items-center justify-center bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
        >
          <HiChevronRight className="w-4 h-4" />
        </button>

        {/* Dots + pause */}
        <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1.5 backdrop-blur-sm">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Tampilkan banner ${i + 1}`}
                aria-current={i === current ? 'true' : undefined}
                className={`h-1 transition-all duration-300 ${
                  i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
            <button
              onClick={() => setPaused(p => !p)}
              aria-label={paused ? 'Putar otomatis' : 'Jeda putar otomatis'}
              className="ml-1 flex h-6 w-6 items-center justify-center text-white/70 transition-colors hover:text-white"
            >
              {paused ? <HiPlay className="h-3 w-3 ml-0.5" /> : <HiPause className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
