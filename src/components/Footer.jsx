import { useState } from 'react'
import { FaInstagram, FaTiktok, FaFacebookF, FaYoutube } from 'react-icons/fa'
import { SiShopee } from 'react-icons/si'
import { HiChevronDown, HiArrowRight, HiCheck, HiRefresh } from 'react-icons/hi'
import { supabase } from '../lib/supabase'
import { explainError } from '../lib/errorMessages'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (e) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setError('Email belum diisi')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Format email tidak valid')
      return
    }
    setLoading(true)
    try {
      const { error: insertError } = await supabase
        .from('subscribers')
        .insert({ email: trimmed, source: 'footer' })

      if (insertError) {
        if (insertError.code === '23505') {
          setSubscribed(true)
          setEmail('')
          setTimeout(() => setSubscribed(false), 5000)
          setLoading(false)
          return
        }
        throw insertError
      }

      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 5000)
    } catch (err) {
      setError(explainError(err, 'Email belum bisa didaftarkan. Cek koneksi atau coba lagi nanti.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="bg-background text-text-primary border-t border-border-soft">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 gap-8 py-9 md:grid-cols-2 lg:grid-cols-[0.9fr_0.85fr_1fr_1fr] lg:gap-10 lg:py-10">

          <details open className="md:open group">
            <summary className="md:cursor-default list-none flex items-center justify-between md:pointer-events-none py-2 md:py-0">
              <h3 className="text-xs font-semibold uppercase tracking-eyebrow text-heading">Informasi</h3>
              <HiChevronDown className="md:hidden text-base text-text-muted group-open:rotate-180 transition-transform" />
            </summary>
            <ul className="mt-4 md:mt-5 space-y-2.5 text-sm text-text-secondary">
              <li><a href="/bisnis-kami" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/bisnis-kami'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-primary transition-colors">Bisnis Kami</a></li>
              <li><a href="/tentang-kami" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/tentang-kami'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-primary transition-colors">Tentang Kami</a></li>
              <li><a href="/faq" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/faq'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="/syarat-ketentuan" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/syarat-ketentuan'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-primary transition-colors">Syarat dan Ketentuan</a></li>
              <li><a href="/kebijakan-privasi" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/kebijakan-privasi'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-primary transition-colors">Kebijakan Privasi</a></li>
            </ul>
          </details>

          <details open className="md:open group">
            <summary className="md:cursor-default list-none flex items-center justify-between md:pointer-events-none py-2 md:py-0">
              <h3 className="text-xs font-semibold uppercase tracking-eyebrow text-heading">Bantuan</h3>
              <HiChevronDown className="md:hidden text-base text-text-muted group-open:rotate-180 transition-transform" />
            </summary>
            <ul className="mt-4 md:mt-5 space-y-2.5 text-sm text-text-secondary">
              <li><a href="/cara-memesan" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/cara-memesan'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-primary transition-colors">Cara Memesan</a></li>
              <li><a href="/faq" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/faq'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="/syarat-ketentuan" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/syarat-ketentuan'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-primary transition-colors">Syarat dan Ketentuan</a></li>
              <li><a href="/kebijakan-privasi" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/kebijakan-privasi'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-primary transition-colors">Kebijakan Privasi</a></li>
            </ul>
          </details>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-eyebrow text-heading">Hubungi Kami</h3>
            <ul className="mt-5 space-y-3 text-sm text-text-secondary">
              <li className="leading-relaxed">
                Jl. Perumnas, Ngropoh, Condongcatur,<br />Kec. Depok, Sleman, DIY 55283
              </li>
              <li>
                <a href="https://wa.me/6285117606161" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  +62 851-1760-6161
                </a>
              </li>
              <li>
                <a href="mailto:hello@puthicsari.com" className="hover:text-primary transition-colors">
                  hello@puthicsari.com
                </a>
              </li>
            </ul>
            <div className="flex gap-2 mt-4">
              <a href="https://www.facebook.com/puthicsari" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition-all hover:border-primary hover:bg-primary hover:text-white" aria-label="Facebook Puthic Sari">
                <FaFacebookF className="text-xs" />
              </a>
              <a href="https://www.instagram.com/puthic.sari/" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition-all hover:border-primary hover:bg-primary hover:text-white" aria-label="Instagram Puthic Sari">
                <FaInstagram className="text-xs" />
              </a>
              <a href="https://www.youtube.com/@puthicsari" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition-all hover:border-primary hover:bg-primary hover:text-white" aria-label="YouTube Puthic Sari">
                <FaYoutube className="text-xs" />
              </a>
              <a href="https://www.tiktok.com/@puthic.sari" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition-all hover:border-heading hover:bg-heading hover:text-white" aria-label="TikTok Puthic Sari">
                <FaTiktok className="text-xs" />
              </a>
              <a href="https://shopee.co.id/puthic.sari" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition-all hover:border-orange-500 hover:bg-orange-500 hover:text-white" aria-label="Shopee Puthic Sari">
                <SiShopee className="text-xs" />
              </a>
            </div>
          </div>

          <details open className="md:open group">
            <summary className="md:cursor-default list-none flex items-center justify-between md:pointer-events-none py-2 md:py-0">
              <h3 className="text-xs font-semibold uppercase tracking-eyebrow text-heading">Berlangganan</h3>
              <HiChevronDown className="md:hidden text-base text-text-muted group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-4 md:mt-5">
              <p className="text-sm text-text-secondary leading-relaxed">
                untuk menerima pembaruan, akses ke penawaran eksklusif dan lebih
              </p>
              <form onSubmit={handleSubscribe} className="mt-4">
                <div className="flex items-stretch border-b border-border-soft focus-within:border-primary transition-colors">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="Email"
                    aria-label="Email"
                    className="flex-1 bg-transparent text-sm text-heading placeholder:text-text-muted focus:outline-none py-2.5"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe"
                    className="px-3 text-text-muted hover:text-primary transition-colors disabled:opacity-40"
                    disabled={subscribed || loading}
                  >
                    {subscribed ? <HiCheck className="text-base" /> : loading ? <HiRefresh className="text-base animate-spin" /> : <HiArrowRight className="text-base" />}
                  </button>
                </div>
                {error && <p className="mt-2 text-xs text-sale">{error}</p>}
                {subscribed && <p className="mt-2 text-xs text-primary">Terima kasih sudah berlangganan! Email kamu sudah tersimpan.</p>}
              </form>
            </div>
          </details>
        </div>

        <div className="border-t border-border-soft py-5 space-y-3">
          <p className="text-xs sm:text-sm text-text-muted text-center">
            <span className="italic text-heading/80">- We Sell the Sign of Love -</span>
          </p>
          <div className="grid grid-cols-1 items-center gap-3 text-center md:grid-cols-3">
            <p className="text-xs text-text-muted md:text-left">&copy; 2026 Puthic Sari. All rights reserved.</p>

            <p className="text-xs text-text-muted">
              Designed & Developed by{' '}
              <a href="https://ferrelganendra.my.id" target="_blank" rel="noopener noreferrer" className="hover:text-heading transition-colors underline underline-offset-4 decoration-[1px]">
                Ferrel Ganendra
              </a>
            </p>

            <div className="flex justify-center gap-4 text-xs text-text-muted md:justify-end">
              <a href="/syarat-ketentuan" className="hover:text-heading transition-colors">Syarat & Ketentuan</a>
              <a href="/kebijakan-privasi" className="hover:text-heading transition-colors">Privasi</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
