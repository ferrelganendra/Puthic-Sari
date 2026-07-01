import { HiCheckCircle } from 'react-icons/hi'
import { videoUrl } from '../lib/assetUrl'

const points = [
  'Lihat koleksi buket yang tersedia',
  'Pilih produk sesuai kebutuhan hadiah',
  'Hubungi WhatsApp jika membutuhkan bantuan',
]

/**
 * BehindTheBouquet — Compact workshop section.
 * - ZM-style two-column with video + text
 * - New client copy
 */
export default function BehindTheBouquet() {
  return (
    <section className="border-y border-border-soft bg-white py-10 md:py-14">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[0.7fr_1fr] md:items-center lg:px-8">
        <div className="mx-auto w-full max-w-[320px]" data-reveal="fade-right">
          <div className="rounded-xl overflow-hidden border border-border-soft bg-secondary">
            <video
              src={videoUrl('behind-the-bouquet.mp4')}
              className="aspect-[9/16] max-h-[400px] w-full object-cover md:max-h-none"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Proses merangkai buket Puthic Sari"
            />
          </div>
        </div>

        <div data-reveal="fade-left" style={{ '--reveal-delay': '100ms' }}>
          <span className="text-[11px] font-semibold uppercase tracking-eyebrow text-primary-dark">
            Behind the Bouquet
          </span>
          <h2 className="mt-2 font-display text-2xl md:text-3xl font-medium leading-snug text-heading">
            Pilihan buket untuk kebutuhan hadiahmu
          </h2>
          <p className="mt-3 max-w-lg text-sm text-text-secondary leading-relaxed">
            Lihat koleksi Puthic Sari dan pilih buket yang sesuai dengan kebutuhanmu.
          </p>
          <p className="mt-2 max-w-lg text-sm text-text-secondary leading-relaxed">
            Jika perlu bantuan sebelum memesan, hubungi kami melalui WhatsApp.
          </p>

          <div className="mt-5 space-y-2.5">
            {points.map(point => (
              <div key={point} className="flex items-start gap-2.5 text-sm text-text-primary">
                <HiCheckCircle className="mt-0.5 text-success flex-shrink-0" />
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <a href="#products" className="btn-primary text-sm">
              Lihat Koleksi
            </a>
            <a
              href="https://wa.me/6285117606161"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-sm"
            >
              Chat WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
