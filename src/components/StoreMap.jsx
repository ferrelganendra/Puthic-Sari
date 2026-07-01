import { useState } from 'react'
import { HiExternalLink, HiLocationMarker } from 'react-icons/hi'

const mapsUrl = 'https://maps.app.goo.gl/bb2LpSu4wTnKAgfL6'
const embedUrl = 'https://www.google.com/maps?q=Puthic%20Sari%20Flowers%20Jl.%20Perumnas%20No.204%20Condongcatur%20Depok%20Sleman&z=16&output=embed'

/**
 * StoreMap — Offline store section with map.
 * - Warm brand-aligned design
 * - Editorial heading + clean layout
 * - Fallback for when iframe fails to load
 */
export default function StoreMap() {
  const [iframeError, setIframeError] = useState(false)

  return (
    <section id="store" className="bg-white py-10 md:py-12 lg:py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[0.82fr_1.18fr] md:items-center lg:gap-10">
          <div className="max-w-sm" data-reveal="fade-right">
            <span className="eyebrow text-primary-dark">Offline Store</span>
            <h2 className="mt-3 font-display text-[2rem] leading-[1.12] text-heading md:text-[2.45rem] lg:text-[2.75rem]">
              Mampir ke{' '}
              <span className="italic text-primary">toko kami</span>
            </h2>

            <div className="mt-6 space-y-4 text-[0.95rem] leading-relaxed text-text-secondary">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-eyebrow text-heading">Alamat</p>
                <p>Jl. Perumnas, Ngropoh, Condongcatur,<br />Kec. Depok, Sleman, DIY 55283</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-eyebrow text-heading">Jam Buka</p>
                <p>Setiap hari, 10.00-21.00 WIB</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-eyebrow text-heading">WhatsApp</p>
                <a href="https://wa.me/6285117606161" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
                  +62 851-1760-6161
                </a>
              </div>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 btn-primary text-sm"
            >
              <HiLocationMarker className="text-base" />
              Buka di Google Maps
            </a>
          </div>

          <div className="overflow-hidden rounded-[1.25rem] border border-border-soft bg-surface shadow-card" data-reveal="fade-left" style={{ '--reveal-delay': '120ms' }}>
            <div className="relative h-[240px] md:h-[360px] lg:h-[400px] xl:h-[420px]">
              {iframeError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary text-center px-6">
                  <HiLocationMarker className="h-12 w-12 text-text-muted mb-3" />
                  <p className="text-sm font-medium text-heading mb-1">Peta tidak dapat dimuat</p>
                  <p className="text-xs text-text-muted mb-4">Klik tombol di bawah untuk membuka di Google Maps.</p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    Buka di Google Maps
                    <HiExternalLink className="text-sm" />
                  </a>
                </div>
              ) : (
                <>
                  <iframe
                    title="Google Maps lokasi Puthic Sari Flowers"
                    src={embedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    onError={() => setIframeError(true)}
                    className="absolute inset-0 h-full w-full border-0"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-4 text-white">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase opacity-80">Google Maps</p>
                        <p className="mt-1 font-medium">Puthic Sari Flowers</p>
                      </div>
                      <HiExternalLink className="mb-1 text-lg opacity-80" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
