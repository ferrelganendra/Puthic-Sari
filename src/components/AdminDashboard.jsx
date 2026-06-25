import { Suspense, lazy, useState, useEffect } from 'react'
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'
import { supabase } from '../lib/supabase'
import { ensureProfile, isAdmin } from '../lib/auth'
import { siteAssetUrl } from '../lib/assetUrl'
import AdminLayout from './admin/AdminLayout'

const ProductsPage = lazy(() => import('./admin/ProductsPage'))
const CategoriesPage = lazy(() => import('./admin/CategoriesPage'))
const OccasionsPage = lazy(() => import('./admin/OccasionsPage'))
const DiscountsPage = lazy(() => import('./admin/DiscountsPage'))
const BannersPage = lazy(() => import('./admin/BannersPage'))
const ReviewsPage = lazy(() => import('./admin/ReviewsPage'))
const OrdersPage = lazy(() => import('./admin/OrdersPage'))

// Login Form
function LoginForm({ onLogin, onClose }) {
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [showPass, setShowPass] = useState(false)
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState('')

 const handleLogin = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

  if (authError) {
   setError('Email atau password salah.')
   setLoading(false)
   return
  }

  // Ensure profile exists, then check role
  const profile = await ensureProfile(authData.user)

  if (!profile || profile.role !== 'admin') {
   setError('Akun ini tidak memiliki akses admin.')
   await supabase.auth.signOut()
   setLoading(false)
   return
  }

  onLogin()
  setLoading(false)
 }

 return (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
   <div className="bg-white w-full max-w-sm rounded-xl p-8 shadow-xl">
    <div className="flex items-center gap-3 mb-8">
     <img src={siteAssetUrl('logo.jpeg')} alt="Puthic Sari" className="h-10 w-10 object-cover rounded-lg" />
     <div>
      <h2 className="text-lg font-semibold text-gray-900">Admin Login</h2>
      <p className="text-xs text-gray-400">Masuk untuk mengelola toko</p>
     </div>
    </div>
    <form onSubmit={handleLogin} className="space-y-4">
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
      <input
       type="email"
       value={email}
       onChange={e => setEmail(e.target.value)}
       required
       className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all"
       placeholder="admin@email.com"
      />
     </div>
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
      <div className="relative">
       <input
        type={showPass ? 'text' : 'password'}
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all pr-10"
        placeholder="••••••••"
       />
       <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {showPass ? <HiOutlineEyeOff /> : <HiOutlineEye />}
       </button>
      </div>
     </div>
     {error && (
      <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
       <p className="text-sm text-red-600">{error}</p>
      </div>
     )}
     <button
      type="submit"
      disabled={loading}
      className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-sm"
     >
      {loading ? 'Masuk...' : 'Masuk'}
     </button>
    </form>
    <button
     onClick={onClose}
     className="w-full mt-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
    >
     Kembali ke website
    </button>
   </div>
  </div>
 )
}

// Main Admin Dashboard
export default function AdminDashboard({ onClose, onProductsChanged }) {
 const [session, setSession] = useState(null)
 const [checkingAuth, setCheckingAuth] = useState(true)
 const [activeTab, setActiveTab] = useState('products')

 useEffect(() => {
  supabase.auth.getSession().then(async ({ data: { session } }) => {
   if (session) {
    // Verify admin role
    const adminCheck = await isAdmin(session.user.id)
    if (adminCheck) {
     setSession(session)
    } else {
     await supabase.auth.signOut()
    }
   }
   setCheckingAuth(false)
  })

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
   if (!session) setSession(null)
  })
  return () => subscription.unsubscribe()
 }, [])

 if (checkingAuth) {
  return (
   <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full"></div>
   </div>
  )
 }

 if (!session) {
  return <LoginForm onLogin={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} onClose={onClose} />
 }

 return (
  <AdminLayout
   session={session}
   onClose={onClose}
   activeTab={activeTab}
   setActiveTab={setActiveTab}
   >
    <Suspense fallback={<div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">Memuat modul admin...</div>}>
     {activeTab === 'products' && <ProductsPage onProductsChanged={onProductsChanged} />}
     {activeTab === 'categories' && <CategoriesPage />}
     {activeTab === 'occasions' && <OccasionsPage />}
     {activeTab === 'discounts' && <DiscountsPage />}
     {activeTab === 'banners' && <BannersPage />}
     {activeTab === 'reviews' && <ReviewsPage />}
     {activeTab === 'orders' && <OrdersPage />}
    </Suspense>
   </AdminLayout>
 )
}
