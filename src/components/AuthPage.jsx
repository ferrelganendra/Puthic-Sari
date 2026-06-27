import { useState } from 'react'
import { HiOutlineEye, HiOutlineEyeOff, HiCheck } from 'react-icons/hi'
import { supabase } from '../lib/supabase'
import { ensureProfile } from '../lib/auth'
import { siteAssetUrl } from '../lib/assetUrl'

/**
 * AuthPage — full-page login / register / forgot-password.
 * Replaces the old AuthModal popup for a consistent, non-AI-slop experience.
 */
const profileTimeout = (user) => new Promise(resolve => {
  const role = user.email?.toLowerCase() === 'careersprintid@gmail.com' ? 'admin' : 'customer'
  setTimeout(() => resolve({ id: user.id, email: user.email, role }), 5000)
})

const ensureProfileWithTimeout = (user) => Promise.race([
  ensureProfile(user),
  profileTimeout(user),
])

const signInWithTimeout = async (email, password) => {
  const signIn = supabase.auth.signInWithPassword({ email, password })
  const timeout = new Promise(resolve => setTimeout(() => resolve({ timedOut: true }), 5000))
  const result = await Promise.race([signIn, timeout])
  if (!result.timedOut) return result

  const { data: { session } } = await supabase.auth.getSession()
  return session
    ? { data: { session, user: session.user }, error: null }
    : await signIn
}

export default function AuthPage({ onAuth, initialTab = 'login' }) {
  const [tab, setTab] = useState(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    const { data, error: authError } = await signInWithTimeout(email, password)
    if (authError) { setError('Email atau password salah.'); setLoading(false); return }
    const profile = await ensureProfileWithTimeout(data.user)
    onAuth(data.session, profile)
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('')
    if (password !== confirmPassword) { setError('Password tidak cocok.'); setLoading(false); return }
    if (password.length < 6) { setError('Password minimal 6 karakter.'); setLoading(false); return }
    const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    if (authError) { setError(authError.message); setLoading(false); return }
    if (data.user && !data.session) { setSuccess('Akun berhasil dibuat! Cek email untuk verifikasi.'); setLoading(false); return }
    if (data.session) { const profile = await ensureProfileWithTimeout(data.user); onAuth(data.session, profile) }
    setLoading(false)
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: `${window.location.origin}/reset-password` })
    if (resetErr) setError(resetErr.message); else setForgotSent(true)
    setLoading(false)
  }

  const inputClass = 'w-full border border-border rounded-lg px-4 py-3 text-sm text-heading bg-white focus:border-accent focus:outline-none transition-colors'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <img src={siteAssetUrl('logo.jpeg')} alt="Puthic Sari" className="h-14 w-14 mx-auto rounded-2xl object-cover shadow-sm" />
          <h1 className="mt-4 text-xl font-medium text-heading">Puthic Sari</h1>
          <p className="text-sm text-body mt-1">Buket Bunga Jogja</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-8">
          {/* Tabs — pill style */}
          <div className="flex gap-1 bg-background rounded-xl p-1 mb-6">
            <button
              onClick={() => { setTab('login'); setError(''); setSuccess(''); setShowForgot(false) }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'login' ? 'bg-white text-heading shadow-sm' : 'text-body hover:text-heading'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); setSuccess(''); setShowForgot(false) }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'register' ? 'bg-white text-heading shadow-sm' : 'text-body hover:text-heading'
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Success message (after register) */}
          {success && (
            <div className="border border-green-100 bg-green-50 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
              <HiCheck className="text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Login / Register Form */}
          {!success && (
            <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {tab === 'register' && (
                <div>
                  <label className="block text-xs text-body uppercase tracking-wide mb-1.5 font-medium">Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="Nama kamu"
                    autoFocus
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-body uppercase tracking-wide mb-1.5 font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="email@contoh.com"
                  autoFocus={tab === 'login'}
                />
              </div>
              <div>
                <label className="block text-xs text-body uppercase tracking-wide mb-1.5 font-medium">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className={`${inputClass} pr-11`}
                    placeholder="Minimal 6 karakter"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-heading transition-colors p-1">
                    {showPass ? <HiOutlineEyeOff className="text-lg" /> : <HiOutlineEye className="text-lg" />}
                  </button>
                </div>
              </div>
              {tab === 'register' && (
                <div>
                  <label className="block text-xs text-body uppercase tracking-wide mb-1.5 font-medium">Konfirmasi Password</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="Ketik ulang password"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="border border-red-100 bg-red-50 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-heading text-white py-3 rounded-xl text-sm font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Memproses...' : (tab === 'login' ? 'Masuk' : 'Daftar')}
              </button>

              {/* Forgot password (login only) */}
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setForgotEmail(email); setError('') }}
                  className="w-full text-center text-xs text-body hover:text-accent transition-colors py-1 uppercase tracking-wide"
                >
                  Lupa password?
                </button>
              )}
            </form>
          )}

          {/* Forgot password form (inline, replaces form when active) */}
          {showForgot && (
            <div className="mt-2 pt-4 border-t border-border">
              {forgotSent ? (
                <div className="text-center py-2">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center bg-accent/10 rounded-xl">
                    <HiCheck className="text-lg text-accent" />
                  </div>
                  <h3 className="text-sm font-medium text-heading mb-1">Email terkirim!</h3>
                  <p className="text-xs text-body mb-4">Cek inbox kamu untuk link reset password.</p>
                  <button
                    onClick={() => { setShowForgot(false); setForgotSent(false) }}
                    className="w-full bg-heading text-white py-3 rounded-xl text-sm font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-heading mb-1">Reset Password</h3>
                    <p className="text-xs text-body">Masukkan email. Kami kirim link reset password.</p>
                  </div>
                  <div>
                    <label className="block text-xs text-body uppercase tracking-wide mb-1.5 font-medium">Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="email@contoh.com"
                    />
                  </div>
                  {error && (
                    <div className="border border-red-100 bg-red-50 rounded-xl px-3 py-2">
                      <p className="text-xs text-red-700">{error}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowForgot(false); setError('') }}
                      className="flex-1 border border-border rounded-xl px-4 py-2.5 text-xs uppercase tracking-wide text-body hover:text-heading transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-heading text-white rounded-xl py-2.5 text-xs uppercase tracking-wide font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Mengirim...' : 'Kirim Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <a href="/" className="text-sm text-body hover:text-heading transition-colors inline-flex items-center gap-1.5">
            <span>←</span> Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  )
}
