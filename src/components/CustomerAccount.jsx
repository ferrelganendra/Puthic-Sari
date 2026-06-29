import { useState, useEffect } from 'react'
import { HiOutlineUser, HiOutlineLogout, HiOutlineShoppingBag, HiOutlineClock, HiOutlineTruck, HiOutlineKey, HiOutlineEye, HiOutlineEyeOff, HiCheckCircle, HiChevronLeft } from 'react-icons/hi'
import { supabase } from '../lib/supabase'
import { formatPrice } from '../lib/pricing'
import { explainError } from '../lib/errorMessages'

function OrderStatusBadge({ status }) {
  const map = {
    pending_payment: { label: 'Menunggu Pembayaran', color: 'bg-yellow-50 text-yellow-700' },
    payment_failed: { label: 'Pembayaran Gagal', color: 'bg-red-50 text-red-700' },
    paid: { label: 'Dibayar', color: 'bg-green-50 text-green-700' },
    processing: { label: 'Diproses', color: 'bg-blue-50 text-blue-700' },
    shipped: { label: 'Dikirim', color: 'bg-purple-50 text-purple-700' },
    completed: { label: 'Selesai', color: 'bg-green-50 text-green-800' },
    cancelled: { label: 'Dibatalkan', color: 'bg-red-50 text-red-700' },
    refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-700' },
  }
  const info = map[status] || { label: status || '-', color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${info.color}`}>
      {info.label}
    </span>
  )
}

function PasswordForm({ onComplete }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!currentPassword) { setError('Password lama wajib diisi.'); return }
    if (newPassword.length < 6) { setError('Password baru minimal 6 karakter.'); return }
    if (newPassword !== confirmPassword) { setError('Konfirmasi password tidak cocok.'); return }
    if (newPassword === currentPassword) { setError('Password baru harus berbeda dari password lama.'); return }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email
      if (!email) { setError('Sesi tidak valid. Silakan login ulang.'); setLoading(false); return }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
      if (signInError) { setError('Password lama salah.'); setLoading(false); return }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) { setError(explainError(updateError, 'Password baru belum bisa disimpan. Coba login ulang, lalu ulangi.')); setLoading(false); return }

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(explainError(err, 'Password belum bisa diubah. Cek koneksi atau coba login ulang.'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full border border-border rounded-xl px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none transition-colors'

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-heading mb-1">Ganti Password</h3>
        <p className="text-xs text-text-muted">Masukkan password lalu password baru.</p>
      </div>

      {success ? (
        <div className="border border-green-100 bg-green-50 rounded-xl p-4 text-center">
          <HiCheckCircle className="text-2xl text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-700">Password berhasil diubah!</p>
          <p className="text-xs text-green-600 mt-1">Gunakan password baru untuk login selanjutnya.</p>
          {onComplete && <button onClick={onComplete} className="mt-3 text-xs text-text-muted hover:text-heading underline transition-colors">Tutup</button>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Password Lama</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className={`${inputClass} pr-10`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-heading transition-colors p-1">
                {showPass ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Password Baru</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              className={inputClass}
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Konfirmasi Password Baru</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className={inputClass}
              placeholder="Ketik ulang password baru"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="border border-red-100 bg-red-50 rounded-xl px-3 py-2.5">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-heading text-white py-2.5 text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 uppercase tracking-wide"
          >
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function CustomerAccount({ session, profile, onClose, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  useEffect(() => {
    if (activeTab !== 'orders') return
    setLoadingOrders(true)
    supabase
      .from('checkout_orders')
      .select('id, order_number, status, total_amount, created_at, biteship_waybill_id')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || [])
        setLoadingOrders(false)
      })
      .catch(() => setLoadingOrders(false))
  }, [activeTab, session.user.id])

  const tabs = [
    { id: 'profile', label: 'Profil', icon: HiOutlineUser },
    { id: 'orders', label: 'Pesanan', icon: HiOutlineShoppingBag },
    { id: 'password', label: 'Password', icon: HiOutlineKey },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg py-6 px-4">
        {/* Back navigation */}
        <div className="mb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-heading transition-colors"
          >
            <HiChevronLeft className="text-base" />
            Kembali
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-border/50 overflow-hidden">
          {/* Header */}
          <div className="bg-secondary/30 px-6 py-5 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-heading flex items-center justify-center text-white font-bold text-sm">
                  {session.user.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-heading text-sm">{profile?.name || session.user.user_metadata?.name || session.user.email}</p>
                  <p className="text-xs text-text-muted">{session.user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <HiOutlineLogout className="text-sm" />
                Keluar
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border px-6 gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'border-heading text-heading' : 'border-transparent text-text-muted hover:text-body'
                }`}
              >
                <tab.icon className="text-base" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Email</label>
                  <p className="text-sm text-heading">{session.user.email}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Nama</label>
                  <p className="text-sm text-heading">{profile?.name || session.user.user_metadata?.name || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Member sejak</label>
                  <p className="text-sm text-heading">
                    {new Date(session.user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <PasswordForm onComplete={onClose} />
            )}

            {activeTab === 'orders' && (
              <div>
                {loadingOrders ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse border border-border rounded-xl p-4">
                        <div className="flex justify-between mb-2">
                          <div className="h-3 bg-secondary rounded w-32" />
                          <div className="h-3 bg-secondary rounded w-20" />
                        </div>
                        <div className="h-3 bg-secondary/50 rounded w-24 mt-1" />
                        <div className="h-3 bg-secondary/50 rounded w-16 mt-2" />
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-10">
                    <HiOutlineClock className="text-3xl text-text-muted mx-auto mb-3" />
                    <p className="text-sm text-text-muted font-medium">Belum ada pesanan</p>
                    <p className="text-xs text-text-muted/60 mt-1">Pesanan kamu akan muncul di sini setelah checkout.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map(order => (
                      <div key={order.id} className="border border-border rounded-xl p-4 hover:border-border transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-xs font-mono font-semibold text-heading">{order.order_number || `#${order.id}`}</p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                          <span />
                          <p className="text-sm font-semibold text-heading">{formatPrice(order.total_amount)}</p>
                        </div>
                        {order.biteship_waybill_id && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                            <HiOutlineTruck />
                            <span>Resi: {order.biteship_waybill_id}</span>
                          </div>
                        )}
                        {order.status === 'pending_payment' && (
                          <button
                            onClick={() => window.open(`https://wa.me/6285117606161?text=${encodeURIComponent(`Halo Puthic Sari, saya mau konfirmasi pembayaran untuk order ${order.order_number || order.id}`)}`, '_blank')}
                            className="mt-3 w-full text-xs font-medium text-success bg-green-50 hover:bg-green-100 py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                          >
                            Konfirmasi Pembayaran via WhatsApp
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
