import { useState, useEffect } from 'react'
import { HiCheck, HiOutlineEye, HiOutlineEyeOff, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi'
import { supabase } from '../lib/supabase'
import { siteAssetUrl } from '../lib/assetUrl'

/**
 * ResetPassword — Full page shown when user clicks the link from password reset email.
 * The URL contains a recovery token in the hash, e.g.:
 *   /reset-password#access_token=...&type=recovery&refresh_token=...
 * Supabase auto-detects the recovery session, so we can call updateUser() to set
 * a new password.
 */
export default function ResetPassword({ onClose }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState(false)

  // On mount: check if we have a recovery session from the URL hash
  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        if (session) {
          setValidSession(true)
        } else {
          setError('Link reset tidak valid atau sudah kadaluarsa. Minta link baru.')
        }
      } catch (err) {
        if (!mounted) return
        setError('Link reset tidak valid atau sudah kadaluarsa.')
      } finally {
        if (mounted) setVerifying(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY' || session) {
        setValidSession(true)
        setVerifying(false)
      }
    })

    checkSession()
    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password minimal 6 karakter.'); return }
    if (password !== confirmPassword) { setError('Password tidak cocok.'); return }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setSuccess(true)
      await supabase.auth.signOut()
    } catch (err) {
      setError(err.message || 'Gagal mengubah password. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full border border-border rounded-xl px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none transition-colors'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <img src={siteAssetUrl('logo.jpeg')} alt="Puthic Sari" className="h-14 w-14 mx-auto rounded-2xl object-cover shadow-sm" />
          <h1 className="mt-4 text-xl font-medium text-heading">Puthic Sari</h1>
          <p className="text-sm text-body mt-1">Reset Password</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-8">
          {verifying ? (
            <div className="py-10 text-center text-sm text-text-muted">
              <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-heading" />
              Memverifikasi link...
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-green-50 rounded-xl">
                <HiCheckCircle className="text-2xl text-green-600" />
              </div>
              <h3 className="text-base font-medium text-heading mb-1">Password berhasil diubah!</h3>
              <p className="text-sm text-body mb-5">Silakan masuk dengan password baru kamu.</p>
              <button
                onClick={() => { window.location.href = '/' }}
                className="w-full bg-heading text-white py-3 rounded-xl text-sm font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors"
              >
                Kembali ke Beranda
              </button>
            </div>
          ) : !validSession ? (
            <div>
              <div className="border border-red-100 bg-red-50 rounded-xl px-4 py-3 mb-4 flex gap-2 items-start">
                <HiExclamationCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error || 'Link tidak valid.'}</p>
              </div>
              <button
                onClick={() => { window.location.href = '/' }}
                className="w-full bg-heading text-white py-3 rounded-xl text-sm font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors"
              >
                Kembali ke Beranda
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-heading mb-1">Buat Password Baru</h3>
                <p className="text-xs text-body mb-4">Minimal 6 karakter. Pastikan kuat dan mudah diingat.</p>
              </div>
              <div>
                <label className="block text-xs text-body uppercase tracking-wide mb-1.5 font-medium">Password Baru</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                    className={`${inputClass} pr-11`}
                    placeholder="Masukkan password baru"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-heading transition-colors p-1">
                    {showPass ? <HiOutlineEyeOff className="text-lg" /> : <HiOutlineEye className="text-lg" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-body uppercase tracking-wide mb-1.5 font-medium">Konfirmasi Password Baru</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Ketik ulang password baru"
                />
              </div>

              {error && (
                <div className="border border-red-100 bg-red-50 rounded-xl px-4 py-3 flex gap-2 items-start">
                  <HiExclamationCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-heading text-white py-3 rounded-xl text-sm font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
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
