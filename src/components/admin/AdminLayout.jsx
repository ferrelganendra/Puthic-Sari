import { useState } from 'react'
import { HiOutlineLogout, HiOutlineX, HiOutlineViewGrid, HiOutlineTag, HiOutlineCollection, HiOutlinePhotograph, HiOutlineMenu, HiOutlineGift, HiOutlineStar, HiOutlineShoppingBag } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'
import { siteAssetUrl } from '../../lib/assetUrl'

const navItems = [
 { id: 'products', label: 'Produk', icon: HiOutlineViewGrid },
 { id: 'orders', label: 'Pesanan', icon: HiOutlineShoppingBag },
 { id: 'categories', label: 'Kategori', icon: HiOutlineCollection },
 { id: 'occasions', label: 'Acara', icon: HiOutlineGift },
 { id: 'discounts', label: 'Diskon', icon: HiOutlineTag },
 { id: 'banners', label: 'Banner', icon: HiOutlinePhotograph },
 { id: 'reviews', label: 'Ulasan', icon: HiOutlineStar },
]

export default function AdminLayout({ session, onClose, activeTab, setActiveTab, children }) {
 const [sidebarOpen, setSidebarOpen] = useState(false)

 const handleLogout = async () => {
  await supabase.auth.signOut()
  onClose()
 }

 return (
  <div className="fixed inset-0 z-50 flex bg-gray-50">
   {/* Mobile overlay */}
   {sidebarOpen && (
    <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
   )}

   {/* Sidebar */}
   <aside className={`
    fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 
    flex flex-col transition-transform duration-200 ease-in-out
    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
   `}>
    {/* Brand */}
    <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
     <img src={siteAssetUrl('logo.jpeg')} alt="Puthic Sari" className="h-9 w-9 object-cover rounded-lg" />
     <div className="min-w-0">
      <h1 className="font-semibold text-gray-900 text-sm truncate">Puthic Sari</h1>
      <p className="text-[11px] text-gray-400 truncate">Admin Panel</p>
     </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
     {navItems.map(item => {
      const Icon = item.icon
      const isActive = activeTab === item.id
      return (
       <button
        key={item.id}
        onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
        className={`
         w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
         ${isActive 
          ? 'bg-gray-900 text-white shadow-sm' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
        `}
       >
        <Icon className="text-lg flex-shrink-0" />
        <span>{item.label}</span>
       </button>
      )
     })}
    </nav>

    {/* User info + logout */}
    <div className="border-t border-gray-100 px-4 py-4">
     <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
       {session.user.email?.[0]?.toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
       <p className="text-xs font-medium text-gray-700 truncate">{session.user.email}</p>
       <p className="text-[11px] text-gray-400">Administrator</p>
      </div>
     </div>
     <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
     >
      <HiOutlineLogout className="text-sm" />
      Keluar
     </button>
    </div>
   </aside>

   {/* Main content */}
   <div className="flex-1 flex flex-col min-w-0">
    {/* Top bar */}
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
     <div className="flex items-center gap-3">
      <button
       onClick={() => setSidebarOpen(true)}
       className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
      >
       <HiOutlineMenu className="text-xl" />
      </button>
      <h2 className="text-lg font-semibold text-gray-800 capitalize">
       {navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}
      </h2>
     </div>
     <button
      onClick={onClose}
      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      title="Kembali ke website"
     >
      <HiOutlineX className="text-xl" />
     </button>
    </header>

    {/* Page content */}
    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
     {children}
    </main>
   </div>
  </div>
 )
}
