import { useMemo, useState, useEffect, useCallback } from 'react'
import { HiCheck, HiCheckCircle, HiExclamationCircle, HiRefresh, HiX } from 'react-icons/hi'
import { useCart } from '../context/CartContext'
import { getFinalPrice, formatPrice } from '../lib/pricing'
import { supabase } from '../lib/supabase'
import { explainError } from '../lib/errorMessages'
import AddressSearch from './AddressSearch'

/**
 * Checkout — ZaskiaMecca-style step-based guest checkout.
 * Step 1: Kontak (nama, email, HP)
 * Step 2: Alamat (saved addresses + manual input)
 * Step 3: Pengiriman (Biteship rates)
 * Step 4: Pembayaran (Midtrans)
 *
 * Guest checkout: no login required. Email = identifier.
 * Saved addresses: auto-load from Supabase when email exists.
 */

const snapScriptUrl = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true'
  ? 'https://app.midtrans.com/snap/snap.js'
  : 'https://app.sandbox.midtrans.com/snap/snap.js'
let snapScriptPromise = null

const STEPS = [
  { id: 1, label: 'Kontak' },
  { id: 2, label: 'Alamat' },
  { id: 3, label: 'Pengiriman' },
  { id: 4, label: 'Pembayaran' },
]

function apiErrorMessage(data, fallback) {
  return explainError(data?.error || data?.message, fallback)
}

function safeCheckoutErrorMessage(error, fallback = 'Checkout gagal. Cek data pesanan, alamat, kurir, dan pembayaran. Jika masih gagal, hubungi admin.') {
  const message = error?.message || String(error || '')
  if (/keranjang kosong|produk tidak ditemukan|tidak aktif|sold out|nama penerima|nomor whatsapp|alamat pengiriman|kode pos|area biteship|pilih layanan kurir|layanan kurir tidak tersedia/i.test(message)) {
    return message
  }
  return explainError(error, fallback)
}

async function invokeCheckoutFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    const errorData = await error.context?.clone?.().json?.().catch(() => null)
    throw new Error(apiErrorMessage(errorData, error.message || 'Request checkout gagal.'))
  }
  if (!data?.success) throw new Error(apiErrorMessage(data, 'Request checkout gagal.'))
  return data
}

function loadMidtransSnap() {
  if (window.snap) return Promise.resolve(window.snap)
  const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY
  if (!clientKey) return Promise.reject(new Error('VITE_MIDTRANS_CLIENT_KEY belum dikonfigurasi.'))
  if (!snapScriptPromise) {
    snapScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = snapScriptUrl
      script.async = true
      script.setAttribute('data-client-key', clientKey)
      script.onload = () => resolve(window.snap)
      script.onerror = () => {
        snapScriptPromise = null
        reject(new Error('Gagal memuat Midtrans Snap.'))
      }
      document.body.appendChild(script)
    })
  }
  return snapScriptPromise
}

function rateId(rate) {
  return `${rate.courierCompany}-${rate.courierService}-${rate.price}`
}

function courierLabel(rate) {
  const courier = rate.courierName || rate.courierCompany?.toUpperCase()
  const service = rate.courierServiceName || rate.courierService?.toUpperCase()
  return [courier, service].filter(Boolean).join(' - ')
}

// Step indicator component
function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 px-4 py-5 border-b border-border">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center justify-center w-7 h-7 text-xs font-medium border-2 rounded-xl transition-colors ${
            currentStep === step.id ? 'border-accent bg-accent text-white'
            : currentStep > step.id ? 'border-heading bg-heading text-white'
            : 'border-border text-body'
          }`}>
            {currentStep > step.id ? <HiCheck className="text-sm" /> : step.id}
          </div>
          <span className={`hidden sm:inline ml-2 text-xs uppercase tracking-button font-medium ${
            currentStep === step.id ? 'text-heading' : 'text-gray-400'
          }`}>{step.label}</span>
          {i < STEPS.length - 1 && <div className={`hidden sm:block w-8 h-px mx-2 ${currentStep > step.id ? 'bg-heading' : 'bg-border'}`} />}
        </div>
      ))}
    </div>
  )
}

// Saved address component
function SavedAddressCard({ address, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left border rounded-xl p-3 transition-all ${
        isSelected ? 'border-accent bg-accent/5' : 'border-border hover:border-heading'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-body uppercase tracking-button">{address.label}</span>
        {address.is_default && <span className="text-[10px] text-accent font-medium">DEFAULT</span>}
      </div>
      <p className="text-sm text-heading line-clamp-2">{address.address_line}</p>
      {address.city && <p className="text-xs text-gray-500 mt-1">{address.city} {address.postal_code}</p>}
    </button>
  )
}

export default function Checkout({ onClose }) {
  const { cart, totalPrice, clearCart } = useCart()
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Contact fields
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)

  // Address fields
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [addressMode, setAddressMode] = useState('select') // select | manual
  const [savedAddresses, setSavedAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [manualCity, setManualCity] = useState('')
  const [manualPostalCode, setManualPostalCode] = useState('')
  const [manualAreaId, setManualAreaId] = useState('')
  const [manualAreaName, setManualAreaName] = useState('')
  const [manualNeedsDetail, setManualNeedsDetail] = useState(false)
  const [manualLatitude, setManualLatitude] = useState(0)
  const [manualLongitude, setManualLongitude] = useState(0)
  const [manualNote, setManualNote] = useState('')

  // Shipping
  const [rates, setRates] = useState([])
  const [selectedRate, setSelectedRate] = useState(null)
  const [loadingRates, setLoadingRates] = useState(false)
  const [serverSubtotal, setServerSubtotal] = useState(null)

  // Payment
  const [orderNote, setOrderNote] = useState('')
  const [createdOrder, setCreatedOrder] = useState(null)

  const items = useMemo(() => cart.map(item => ({
    id: item.id,
    quantity: item.quantity,
  })), [cart])

  const subtotal = serverSubtotal ?? totalPrice
  const shippingPrice = selectedRate?.price || 0
  const grandTotal = subtotal + shippingPrice

  // Active address (selected from saved or manual)
  const activeAddress = useMemo(() => {
    if (addressMode === 'manual') {
      return {
        full_name: customerName,
        address_line: manualAddress,
        postal_code: manualPostalCode.replace(/\D/g, ''),
        city: manualCity,
        area_id: manualAreaId,
        area_name: manualAreaName,
        latitude: manualLatitude,
        longitude: manualLongitude,
        note: manualNote,
      }
    }
    return selectedAddress
  }, [addressMode, selectedAddress, manualAddress, manualPostalCode, manualCity, manualAreaId, manualAreaName, manualLatitude, manualLongitude, manualNote, customerName])

  const isAddressValid = activeAddress?.address_line && /^\d{5}$/.test(activeAddress.postal_code)

  // Fetch saved addresses when email changes (debounced)
  useEffect(() => {
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      setSavedAddresses([])
      return
    }
    setLoadingAddresses(true)
    const timeout = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user || session.user.email?.toLowerCase() !== customerEmail.trim().toLowerCase()) {
          setSavedAddresses([])
          return
        }

        const { data } = await supabase
          .from('customer_addresses')
          .select('*')
          .eq('email', customerEmail.trim().toLowerCase())
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false })
        if (data?.length) {
          setSavedAddresses(data)
          // Auto-select default
          const def = data.find(a => a.is_default)
          if (def) setSelectedAddress(def)
        }
      } catch {
        // Table may not exist yet — ignore silently
      } finally {
        setLoadingAddresses(false)
      }
    }, 600)
    return () => clearTimeout(timeout)
  }, [customerEmail])

  // Step validation
  const getEmailError = (email) => {
    const trimmed = email.trim()
    if (!trimmed) return 'Email harus diisi.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Format email tidak valid.'
    return null
  }
  const emailFieldError = currentStep === 1 && emailTouched ? getEmailError(customerEmail) : null
  const displayError = error || emailFieldError
  const validateStep1 = () => {
    if (!customerName.trim()) return 'Nama harus diisi.'
    const emailError = getEmailError(customerEmail)
    if (emailError) return emailError
    if (!customerPhone.trim()) return 'No. WhatsApp harus diisi.'
    if (!/^(\+62|62|0)[0-9]{8,13}$/.test(customerPhone.trim())) return 'Format nomor WhatsApp salah.'
    return null
  }

  const validateStep2 = () => {
    if (!activeAddress?.address_line?.trim()) return 'Pilih alamat dari hasil pencarian atau pakai alamat yang diketik.'
    if (manualNeedsDetail && !manualNote.trim()) return 'Lengkapi detail alamat agar pengiriman dapat diproses.'
    if (!/^\d{5}$/.test(activeAddress.postal_code?.trim() || '')) return 'Isi kode pos 5 digit agar ongkir bisa dihitung.'
    return null
  }

  const nextStep = () => {
    setError('')
    if (currentStep === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
      // If no saved addresses, go to manual
      if (savedAddresses.length === 0) setAddressMode('manual')
      setCurrentStep(2)
    } else if (currentStep === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
      // Save address if manual + email provided
      if (addressMode === 'manual') saveManualAddress()
      setCurrentStep(3)
    } else if (currentStep === 3) {
      if (!selectedRate) { setError('Pilih kurir terlebih dahulu.'); return }
      setCurrentStep(4)
    }
  }

  const prevStep = () => {
    setError('')
    setCurrentStep(s => Math.max(1, s - 1))
  }

  // Save manual address to Supabase (fire-and-forget)
  const saveManualAddress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user || session.user.email?.toLowerCase() !== customerEmail.trim().toLowerCase()) return

      await supabase.from('customer_addresses').insert({
        user_id: session.user.id,
        email: customerEmail.trim().toLowerCase(),
        full_name: customerName.trim(),
        label: 'Rumah',
        address_line: manualAddress.trim(),
        city: manualCity.trim() || null,
        postal_code: manualPostalCode.trim(),
        note: manualNote.trim() || null,
        is_default: savedAddresses.length === 0,
      })
    } catch {
      // Best-effort — don't block checkout
    }
  }

  const fetchRates = async () => {
    setError('')
    setRates([])
    setSelectedRate(null)

    if (!isAddressValid) {
      setError('Masukkan kode pos 5 digit yang valid.')
      return
    }

    setLoadingRates(true)
    try {
      const data = await invokeCheckoutFunction('shipping-rates', {
        destinationPostalCode: activeAddress.postal_code.trim(),
        destinationAreaId: activeAddress.area_id || '',
        destinationLatitude: activeAddress.latitude || 0,
        destinationLongitude: activeAddress.longitude || 0,
        cart: items,
      })
      setRates(data.rates || [])
      setSelectedRate(data.rates?.[0] || null)
      setServerSubtotal(data.subtotal ?? totalPrice)
      if (!data.rates?.length) setError('Belum ada layanan kurir tersedia untuk kode pos ini.')
    } catch (err) {
      if (import.meta.env.DEV) console.error('fetchRates failed', err)
      setError(safeCheckoutErrorMessage(err, 'Gagal mengambil ongkir. Silakan hubungi admin untuk bantuan kurir manual.'))
    } finally {
      setLoadingRates(false)
    }
  }

  const openPayment = async (order, payment) => {
    if (!payment?.token && payment?.redirectUrl) {
      window.location.href = payment.redirectUrl
      return
    }
    let handled = false
    const snap = await loadMidtransSnap()

    // Close any existing Snap popup before opening a new one to avoid
    // "Invalid state transition from PopupInView to PopupInView" errors.
    if (typeof snap.hide === 'function') {
      try { snap.hide() } catch { /* no-op */ }
    }

    try {
      snap.pay(payment.token, {
        onSuccess: (result) => { handled = true; setCreatedOrder({ ...order, payment, paymentState: 'success', midtransResult: result }); clearCart() },
        onPending: (result) => { handled = true; setCreatedOrder({ ...order, payment, paymentState: 'pending', midtransResult: result }); clearCart() },
        onError: () => { handled = true; setError('Pembayaran gagal diproses oleh Midtrans. Coba ulangi pembayaran. Jika tetap gagal, hubungi admin dengan nomor order ini.') },
        onClose: () => { if (!handled) setCreatedOrder({ ...order, payment, paymentState: 'closed' }) },
      })
    } catch (err) {
      if (import.meta.env.DEV) console.error('snap.pay failed', err)
      setError(explainError(err, 'Halaman pembayaran Midtrans belum bisa dibuka. Cek koneksi internet dan konfigurasi Midtrans.'))
    }
  }

  const createOrder = async () => {
    setError('')
    if (!selectedRate) { setError('Cek ongkir dan pilih kurir.'); return }

    // Guard against double-invocation (StrictMode + double-click)
    if (submitting) return
    setSubmitting(true)
    try {
      const data = await invokeCheckoutFunction('create-payment', {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        destinationAddress: activeAddress.address_line.trim(),
        destinationPostalCode: activeAddress.postal_code.trim(),
        destinationAreaId: activeAddress.area_id || '',
        destinationAreaName: activeAddress.area_name || '',
        destinationLatitude: activeAddress.latitude || 0,
        destinationLongitude: activeAddress.longitude || 0,
        destinationNote: activeAddress.note || '',
        destinationCity: activeAddress.city || '',
        selectedRate,
        orderNote,
        cart: items,
      })
      await openPayment(data.order, data.payment)
    } catch (err) {
      if (import.meta.env.DEV) console.error('createOrder failed', err)
      setError(safeCheckoutErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Success / pending screen
  if (createdOrder) {
    const isPaid = createdOrder.paymentState === 'success'
    const isPending = ['pending', 'closed'].includes(createdOrder.paymentState) || createdOrder.status === 'pending_payment'
    const whatsappText = encodeURIComponent(
      `Halo Puthic Sari, saya sudah order dari website.\nOrder: ${createdOrder.orderNumber}\nStatus: ${createdOrder.paymentState || createdOrder.status || '-'}`
    )
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-xl py-8 px-4">
          <div className="bg-white rounded-2xl shadow-soft border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="font-medium text-heading">{isPaid ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran'}</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-heading transition-colors"><HiX className="text-xl" /></button>
            </div>
            <div className="p-6">
              <div className={`border rounded-xl p-5 ${isPaid ? 'border-green-100 bg-green-50' : 'border-yellow-100 bg-yellow-50'}`}>
              {isPaid ? <HiCheckCircle className="mb-3 text-3xl text-green-600" /> : <HiExclamationCircle className="mb-3 text-3xl text-yellow-500" />}
              <p className="font-semibold text-heading">
                {isPaid ? 'Pembayaran diterima. Pengiriman diproses otomatis.' : isPending ? 'Order dibuat, tapi pembayaran belum selesai.' : 'Order dibuat tapi belum dibayar.'}
              </p>
              <div className="mt-4 space-y-2 text-sm text-body">
                <div className="flex justify-between"><span>Order</span><span className="font-mono text-heading">{createdOrder.orderNumber}</span></div>
                <div className="flex justify-between"><span>Status</span><span className="font-semibold text-heading">{createdOrder.status || '-'}</span></div>
              <div className="flex justify-between"><span>Total</span><span className="font-semibold text-heading">{formatPrice(createdOrder.total)}</span></div>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {!isPaid && (
                <button type="button" onClick={() => openPayment(createdOrder, createdOrder.payment)} className="btn-primary w-full text-center py-3">Buka Pembayaran</button>
              )}
              <a href={`https://wa.me/6285117606161?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="btn-outline w-full text-center py-3">Konfirmasi WhatsApp</a>
              <button type="button" onClick={onClose} className="w-full text-xs uppercase tracking-button text-body hover:text-accent transition-colors py-3">Tutup</button>
            </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main checkout form
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl py-6 px-4">
        <div className="bg-white rounded-2xl shadow-soft border border-border/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-medium text-heading">Checkout</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-heading transition-colors" aria-label="Tutup checkout">
              <HiX className="text-xl" />
            </button>
          </div>

        {/* Step indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Error banner */}
        {displayError && (
          <div className="mx-6 mt-4 flex gap-3 border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <HiExclamationCircle className="mt-0.5 flex-shrink-0 text-lg" />
            <span>{displayError}</span>
          </div>
        )}

        <div className="p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div>
              {/* STEP 1: Contact */}
              {currentStep === 1 && (
                <section>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-button text-heading">Informasi Pemesan</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-body mb-1 uppercase tracking-button">Nama Lengkap</label>
                      <input
                        required
                        type="text"
                        value={customerName}
                        onChange={(e) => { setCustomerName(e.target.value); setError('') }}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none"
                    placeholder="Nama penerima"
                  />
                    </div>
                    <div>
                      <label className="block text-xs text-body mb-1 uppercase tracking-button">Email</label>
                      <input
                        required
                        type="email"
                        value={customerEmail}
                        onChange={(e) => { setCustomerEmail(e.target.value); setError('') }}
                        onBlur={() => setEmailTouched(true)}
                        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none"
                        placeholder="email@domain.com"
                      />
                      {loadingAddresses && <p className="text-xs text-gray-400 mt-1">Mencari alamat tersimpan...</p>}
                      {savedAddresses.length > 0 && !loadingAddresses && (
                        <p className="text-xs text-accent mt-1">✓ {savedAddresses.length} alamat tersimpan ditemukan</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-body mb-1 uppercase tracking-button">No. WhatsApp</label>
                      <input
                        required
                        type="tel"
                        pattern="^(\+62|62|0)[0-9]{8,13}$"
                        title="Format: diawali 08, 628, atau +62"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none"
                        placeholder="08123456789"
                      />
                    </div>
                  </div>
                  {/* Account upsell */}
                  <div className="mt-6 bg-footer-bg border border-border rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-heading text-white flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-heading">Buat Akun untuk Tracking</h4>
                        <p className="text-xs text-body mt-0.5">Gunakan akun untuk melihat riwayat pesanan.</p>
                        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-auth'))} className="mt-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors uppercase tracking-button">
                          Daftar Sekarang →
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* STEP 2: Address */}
              {currentStep === 2 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-button text-heading">Alamat Pengiriman</h3>
                    {savedAddresses.length > 0 && addressMode === 'select' && (
                      <button type="button" onClick={() => { setAddressMode('manual'); setSelectedAddress(null) }} className="text-xs text-accent hover:text-accent-hover uppercase tracking-button transition-colors">
                        Alamat Baru
                      </button>
                    )}
                  </div>

                  {savedAddresses.length > 0 && addressMode === 'select' ? (
                    <div className="space-y-3">
                      {savedAddresses.map(addr => (
                        <SavedAddressCard
                          key={addr.id}
                          address={addr}
                          isSelected={selectedAddress?.id === addr.id}
                          onSelect={() => { setSelectedAddress(addr); setError('') }}
                        />
                      ))}
                      <p className="text-xs text-gray-400">Atau <button type="button" onClick={() => { setAddressMode('manual'); setSelectedAddress(null) }} className="text-accent underline">cari alamat baru</button></p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AddressSearch
                        onSelect={({ address, city, postalCode, areaId, areaName, latitude, longitude, needsDetail }) => {
                          setManualAddress(address)
                          setManualCity(city)
                          setManualPostalCode(postalCode || '')
                          setManualAreaId(areaId || '')
                          setManualAreaName(areaName || '')
                          setManualNeedsDetail(Boolean(needsDetail || !postalCode))
                          setManualLatitude(latitude || 0)
                          setManualLongitude(longitude || 0)
                          setRates([])
                          setSelectedRate(null)
                          setError('')
                        }}
                        onClear={() => {
                          setManualAddress('')
                          setManualCity('')
                          setManualPostalCode('')
                          setManualAreaId('')
                          setManualAreaName('')
                          setManualNeedsDetail(false)
                          setManualLatitude(0)
                          setManualLongitude(0)
                          setRates([])
                          setSelectedRate(null)
                        }}
                      />

                      {manualAddress && (
                        <>
                          <div className="rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-body">
                            <p className="font-medium text-heading">Alamat terpilih</p>
                            <p className="mt-1 leading-relaxed">{manualAddress}</p>
                            <p className="mt-1 text-text-muted">{manualCity || 'Kota/kabupaten belum diisi'} · {manualPostalCode || 'Kode pos belum diisi'}</p>
                            {manualAreaName && <p className="mt-1 text-text-muted">Area Biteship: {manualAreaName}</p>}
                          </div>
                          {(manualNeedsDetail || !manualPostalCode) && (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div>
                                <label className="block text-xs text-body mb-1.5 uppercase tracking-button">Kota/Kabupaten</label>
                                <input
                                  value={manualCity}
                                  onChange={(e) => { setManualCity(e.target.value); setRates([]); setSelectedRate(null) }}
                                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none transition-colors"
                                  placeholder="Contoh: Sleman"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-body mb-1.5 uppercase tracking-button">Kode Pos</label>
                                <input
                                  inputMode="numeric"
                                  maxLength="5"
                                  value={manualPostalCode}
                                  onChange={(e) => { setManualPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5)); setRates([]); setSelectedRate(null); setError('') }}
                                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none transition-colors"
                                  placeholder="55284"
                                />
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="block text-xs text-body mb-1.5 uppercase tracking-button">Detail Pengiriman {manualNeedsDetail ? '(Wajib)' : '(Opsional)'}</label>
                            <input
                              value={manualNote}
                              onChange={(e) => setManualNote(e.target.value)}
                              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none transition-colors"
                              placeholder="Nomor rumah/unit, RT/RW, patokan, atau nama gedung"
                            />
                          </div>
                        </>
                      )}

                      {!manualAddress && (
                        <p className="text-xs text-text-muted text-center py-2">Atau <button type="button" onClick={() => { setAddressMode('select') }} className="text-accent underline">lihat alamat tersimpan</button></p>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* STEP 3: Shipping */}
              {currentStep === 3 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-button text-heading">Pilih Kurir</h3>
                    <button type="button" onClick={fetchRates} disabled={loadingRates} className="inline-flex items-center gap-2 border border-border rounded-xl px-4 py-2 text-xs uppercase tracking-button text-body hover:border-heading transition-colors disabled:opacity-50">
                      <HiRefresh className={loadingRates ? 'animate-spin' : ''} />
                      {loadingRates ? 'Mengecek' : 'Cek Ongkir'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {rates.length === 0 ? (
                      <div className="border border-dashed border-border rounded-xl p-6 text-center text-sm text-gray-400">
                        {loadingRates ? 'Memuat ongkir...' : 'Klik "Cek Ongkir" untuk melihat opsi pengiriman.'}
                      </div>
                    ) : rates.map(rate => (
                      <label
                        key={rateId(rate)}
                        className={`flex cursor-pointer items-center justify-between gap-4 border rounded-xl p-3 transition-colors ${
                          selectedRate && rateId(selectedRate) === rateId(rate)
                            ? 'border-accent bg-accent/5'
                            : 'border-border hover:border-heading'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="courier"
                            checked={selectedRate && rateId(selectedRate) === rateId(rate)}
                            onChange={() => setSelectedRate(rate)}
                            className="text-heading accent-accent"
                          />
                          <span>
                            <span className="block text-sm font-medium text-heading">{courierLabel(rate)}</span>
                            <span className="block text-xs text-gray-500">Estimasi {rate.duration || '-'} hari</span>
                          </span>
                        </span>
                        <span className="text-sm font-semibold text-heading">{formatPrice(rate.price)}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {/* STEP 4: Payment */}
              {currentStep === 4 && (
                <section>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-button text-heading">Pembayaran</h3>
                  <div className="space-y-4">
                    <div className="border border-border rounded-xl p-4 bg-footer-bg">
                      <p className="text-sm font-medium text-heading">Ringkasan Pengiriman</p>
                      <p className="text-xs text-body mt-1">{customerName} · {customerPhone}</p>
                      <p className="text-xs text-body line-clamp-2 mt-0.5">{activeAddress?.address_line}</p>
                      <p className="text-xs text-body mt-0.5">{selectedRate ? courierLabel(selectedRate) : '-'}</p>
                      <p className="text-xs text-body mt-0.5">{formatPrice(grandTotal)}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-body mb-1 uppercase tracking-button">Catatan Pesanan (opsional)</label>
                      <input
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none"
                        placeholder="Catatan tambahan untuk pesanan ini"
                      />
                    </div>
                    <p className="text-xs text-gray-400">Pembayaran via Midtrans. Shipment Biteship dibuat otomatis setelah pembayaran terverifikasi.</p>
                  </div>
                </section>
              )}
            </div>

            {/* Order summary sidebar */}
            <aside className="border border-border rounded-xl p-4 self-start sticky top-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-button text-heading">Ringkasan Order</h3>
              <div className="space-y-2 text-sm">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between gap-3 text-body">
                    <span className="min-w-0 truncate">{item.name} x{item.quantity}</span>
                    <span className="flex-shrink-0">{formatPrice(getFinalPrice(item) * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 text-body">
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-body">
                  <span>Ongkir</span><span>{selectedRate ? formatPrice(shippingPrice) : '-'}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="font-semibold text-heading">Total</span>
                  <span className="font-semibold text-heading">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="mt-5 space-y-2">
                {currentStep === 4 ? (
                  <button
                    type="button"
                    onClick={createOrder}
                    disabled={submitting || !selectedRate}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-heading text-white text-xs font-medium uppercase tracking-button hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? <HiRefresh className="animate-spin" /> : <HiCheckCircle />}
                    {submitting ? 'Memproses...' : 'Bayar Sekarang'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-heading text-white text-xs font-medium uppercase tracking-button hover:bg-gray-800 transition-colors"
                  >
                    Lanjut ke {STEPS[currentStep]?.label || 'Selanjutnya'}
                  </button>
                )}
                {currentStep > 1 && (
                  <button type="button" onClick={prevStep} className="w-full text-xs uppercase tracking-button text-body hover:text-accent transition-colors py-2">
                    ← Kembali
                  </button>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
