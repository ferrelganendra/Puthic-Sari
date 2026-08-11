import { useState, useEffect } from 'react'
import { HiX, HiStar, HiHeart, HiChevronLeft, HiChevronRight, HiChatAlt2, HiPencilAlt } from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'
import { useWishlist } from '../context/WishlistContext'
import { supabase } from '../lib/supabase'
import { fetchApprovedReviews, getReviewStats } from '../lib/reviews'

const WHATSAPP_PHONE = '6285117606161'
const WHATSAPP_MSG = encodeURIComponent('Halo Puthic Sari, saya ingin bertanya tentang produk Anda.')

function StarRow({ rating, size = 'sm' }) {
  const sizeClass = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  return (
    <div className="flex gap-0.5" aria-label={`Rating ${rating} dari 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <HiStar
          key={star}
          className={`${sizeClass} ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
        />
      ))}
    </div>
  )
}

function WriteReviewForm({ onSubmitted, onCancel }) {
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: name.trim(),
      rating,
      comment: comment.trim(),
      is_approved: false,
    }
    if (!payload.name || !payload.comment) {
      setStatus('error')
      setMessage('Nama dan ulasan wajib diisi.')
      return
    }
    setStatus('submitting')
    setMessage('')
    const { error } = await supabase.from('reviews').insert(payload)
    if (error) {
      setStatus('error')
      setMessage('Ulasan belum bisa dikirim. Coba lagi nanti.')
      return
    }
    setStatus('success')
    setMessage('Ulasan dikirim untuk ditinjau admin.')
    setName('')
    setRating(5)
    setComment('')
    onSubmitted?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-heading">Nama</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-border-soft bg-white px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none"
          maxLength={80}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-heading">Rating</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full border border-border-soft bg-white px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none"
        >
          {[5, 4, 3, 2, 1].map((v) => <option key={v} value={v}>{v} / 5</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-heading">Ulasan</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px] w-full border border-border-soft bg-white px-3 py-2 text-sm text-heading focus:border-primary focus:outline-none"
          maxLength={500}
          required
        />
      </div>
      {message && (
        <p className={`text-xs ${status === 'success' ? 'text-primary-dark' : 'text-sale'}`}>
          {message}
        </p>
      )}
      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-border-soft py-2.5 text-xs font-semibold uppercase tracking-button text-heading transition-colors hover:bg-secondary rounded-full"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="flex-1 bg-heading py-2.5 text-xs font-semibold uppercase tracking-button text-white transition-colors hover:bg-gray-800 disabled:opacity-60 rounded-full"
        >
          {status === 'submitting' ? 'Mengirim...' : 'Kirim'}
        </button>
      </div>
    </form>
  )
}

function ReviewsPanel({ onClose }) {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('list')

  const fetchReviews = async () => {
    try {
      const reviews = await fetchApprovedReviews(supabase, { limit: 20 })
      setReviews(reviews)
      setStats(getReviewStats(reviews))
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchReviews() }, [])

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-heading">Ulasan Pelanggan</h3>
          {stats && (
            <div className="mt-1 flex items-center gap-2">
              <StarRow rating={Math.round(stats.average)} />
              <span className="text-xs text-text-muted">{stats.average.toFixed(1)} · {stats.count} ulasan</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-secondary transition-colors"
          aria-label="Tutup"
        >
          <HiX className="h-5 w-5" />
        </button>
      </div>

      {mode === 'list' ? (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse space-y-2 rounded-lg border border-border-soft p-4">
                    <div className="h-3 w-1/3 bg-secondary" />
                    <div className="h-3 w-full bg-secondary" />
                    <div className="h-3 w-2/3 bg-secondary" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/40 text-primary">
                  <HiChatAlt2 className="h-7 w-7" />
                </div>
                <p className="mt-3 text-sm font-medium text-heading">Belum ada ulasan</p>
                <p className="mt-1 text-xs text-text-muted">Jadilah yang pertama memberi ulasan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <article key={r.id} className="rounded-lg border border-border-soft p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-heading">{r.name}</p>
                      <StarRow rating={Number(r.rating)} />
                    </div>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed">{r.comment}</p>
                    {r.created_at && (
                      <p className="mt-2 text-[11px] text-text-muted">
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border-soft px-5 py-4">
            <button
              onClick={() => setMode('write')}
              className="flex w-full items-center justify-center gap-2 bg-heading py-3 text-xs font-semibold uppercase tracking-button text-white transition-colors hover:bg-gray-800 rounded-full"
            >
              <HiPencilAlt className="h-4 w-4" />
              Tulis Ulasan
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-4 text-xs text-text-secondary">Ulasan kamu akan ditinjau admin sebelum ditampilkan.</p>
          <WriteReviewForm
            onSubmitted={() => { setMode('list'); fetchReviews() }}
            onCancel={() => setMode('list')}
          />
        </div>
      )}
    </div>
  )
}

function WishlistPanel({ onClose, onViewProduct, products }) {
  const { wishlist } = useWishlist()
  const [current, setCurrent] = useState(0)

  const wishlistProducts = wishlist
    .map(id => products.find(p => p.id === id))
    .filter(Boolean)

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-heading">Wishlist Saya</h3>
          <p className="mt-1 text-xs text-text-muted">{wishlistProducts.length} produk disimpan</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-secondary transition-colors"
          aria-label="Tutup"
        >
          <HiX className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {wishlistProducts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/40 text-primary">
              <HiHeart className="h-7 w-7" />
            </div>
            <p className="mt-3 text-sm font-medium text-heading">Wishlist kosong</p>
            <p className="mt-1 text-xs text-text-muted">Tap ikon hati di produk untuk menyimpan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wishlistProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => { onViewProduct?.(p); onClose() }}
                className="flex w-full items-center gap-3 rounded-lg border border-border-soft p-3 text-left transition-colors hover:border-primary hover:bg-secondary/20"
              >
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                  <img src={p.thumbnail || p.image} alt={p.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-heading">{p.name}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{p.category}</p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p.price)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SidePanel({ open, side, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex">
      <button
        onClick={onClose}
        className="flex-1 bg-black/30 transition-opacity"
        aria-label="Tutup panel"
      />
      <div
        className={`w-[360px] max-w-[90vw] bg-white shadow-2xl flex flex-col ${side === 'right' ? '' : 'order-first'}`}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}

export default function FloatingTabs({ onViewProduct, products = [] }) {
  const [openSide, setOpenSide] = useState(null)

  return (
    <>
      <button
        onClick={() => setOpenSide('left')}
        className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 md:flex flex-col items-center gap-1.5 bg-white border border-border-soft border-l-0 px-3 py-4 rounded-r-xl shadow-md transition-all hover:border-primary hover:pr-4 group"
        aria-label="Lihat ulasan"
      >
        <HiStar className="h-5 w-5 text-amber-400 group-hover:text-amber-500" fill="currentColor" />
      </button>

      <button
        onClick={() => setOpenSide('right')}
        className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 md:flex flex-col items-center gap-1.5 bg-white border border-border-soft border-r-0 px-3 py-4 rounded-l-xl shadow-md transition-all hover:border-primary hover:pl-4 group"
        aria-label="Lihat wishlist"
      >
        <HiHeart className="h-5 w-5 text-primary group-hover:fill-primary" />
      </button>

      <a
        href={`https://wa.me/${WHATSAPP_PHONE}?text=${WHATSAPP_MSG}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 md:bottom-8 md:right-8"
        aria-label="Chat via WhatsApp"
      >
        <FaWhatsapp className="h-7 w-7" />
      </a>

      <SidePanel open={openSide === 'left'} side="left" onClose={() => setOpenSide(null)}>
        <ReviewsPanel onClose={() => setOpenSide(null)} />
      </SidePanel>

      <SidePanel open={openSide === 'right'} side="right" onClose={() => setOpenSide(null)}>
        <WishlistPanel onClose={() => setOpenSide(null)} onViewProduct={onViewProduct} products={products} />
      </SidePanel>
    </>
  )
}
