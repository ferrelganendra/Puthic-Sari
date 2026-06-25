import { useMemo } from 'react'
import { HiStar, HiChatAlt2 } from 'react-icons/hi'

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5" aria-label={`Rating ${rating} dari 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <HiStar
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-amber-500' : 'text-gray-200'}`}
          fill="currentColor"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

function formatReviewDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Testimonials({ reviews = [], reviewStats = null }) {
  return (
    <section className="bg-white py-10 md:py-14 border-y border-border-soft">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 md:mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-eyebrow text-primary-dark">
              Ulasan Pelanggan
            </span>
            <h2 className="mt-2 text-base md:text-lg uppercase tracking-button font-medium text-heading">
              {reviews.length > 0 ? 'Apa kata pelanggan kami' : 'Belum ada ulasan'}
            </h2>
          </div>
          {reviewStats && (
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <HiStar className="h-4 w-4 text-amber-500" fill="currentColor" />
                <span className="font-semibold text-heading">{reviewStats.average.toFixed(1)}</span>
              </div>
              <span>{reviewStats.count} ulasan</span>
            </div>
          )}
        </div>

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-lg bg-background border border-border-soft p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-heading uppercase tracking-button">{review.name}</p>
                  <StarRow rating={review.rating} />
                </div>
                <p className="mt-3 text-sm text-text-secondary leading-relaxed">{review.comment}</p>
                {review.created_at && (
                  <p className="mt-3 text-xs text-text-muted">{formatReviewDate(review.created_at)}</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-background border border-border-soft p-8 text-center">
            <HiChatAlt2 className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-secondary">Belum ada ulasan yang ditampilkan.</p>
            <p className="mt-1 text-xs text-text-muted">Klik tab "Reviews" di sebelah kiri untuk menulis ulasan pertama.</p>
          </div>
        )}
      </div>
    </section>
  )
}
