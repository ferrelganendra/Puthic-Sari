import { bannerUrl } from '../lib/assetUrl'

/**
 * WhatsAppCTA — Compact ZM-style WhatsApp consultation banner.
 * - Two-column: copy + image (or single centered)
 * - Clear WhatsApp CTA
 * - Not editorial, not a huge card
 */
export default function WhatsAppCTA() {
  return (
    <section className="py-8 md:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-secondary/40 border border-border-soft overflow-hidden">
          <div className="grid md:grid-cols-[1.4fr_1fr] items-center">
            {/* Copy */}
            <div className="px-6 py-8 md:py-10 md:px-10">
              <span className="text-[11px] font-semibold uppercase tracking-eyebrow text-primary-dark">
                Tanya Dulu
              </span>
              <h2 className="mt-2 font-display text-xl md:text-2xl text-heading leading-snug">
                Mau buket yang beda? Tanya dulu sebelum pesan.
              </h2>
              <p className="mt-2 text-sm text-text-secondary max-w-md leading-relaxed">
                 Hubungi kami lewat WhatsApp jika ingin bertanya sebelum memesan.
              </p>
                <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                <a
                  href="https://wa.me/6285117606161?text=Halo%20Puthic%20Sari%2C%20saya%20ingin%20bertanya%20tentang%20buket%20custom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-sm"
                >
                  Chat WhatsApp
                </a>
                <a href="/collections" className="btn-outline text-sm">
                  Lihat Koleksi
                </a>
              </div>
            </div>

            {/* Image */}
            <div className="relative aspect-[16/9] md:aspect-auto md:h-full md:min-h-[180px] bg-secondary">
              <img
                src={bannerUrl('poster-1.jpg')}
                alt="Buket custom Puthic Sari"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
