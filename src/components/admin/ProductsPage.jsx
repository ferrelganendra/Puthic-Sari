import { useState, useEffect } from 'react'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlinePhotograph, HiStar } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'
import ProductForm from './ProductForm'
import ConfirmDialog from './ConfirmDialog'

const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p)
const productFlagsMigrationMessage = 'Kolom Best Seller / Sold Out belum ada di Supabase. Jalankan scripts/migration-product-flags.sql di SQL Editor, lalu reload halaman admin.'

const isMissingProductFlagColumn = (error) => {
 const message = error?.message || ''
 return message.includes('is_best_seller') || message.includes('is_sold_out')
}

export default function ProductsPage({ onProductsChanged }) {
 const [products, setProducts] = useState([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState('')
 const [showForm, setShowForm] = useState(false)
 const [editProduct, setEditProduct] = useState(null)
 const [flagColumnMissing, setFlagColumnMissing] = useState(false)
 const [pageError, setPageError] = useState('')
 const [confirmDelete, setConfirmDelete] = useState(null) // {id, name}

 useEffect(() => {
  fetchProducts()
 }, [])

 const fetchProducts = async () => {
  setLoading(true)
  setPageError('')
  const { data, error } = await supabase
   .from('products')
   .select('*, categories(name)')
   .order('id', { ascending: false })

  if (error) {
   setPageError(error.message)
   setProducts([])
  } else {
   const normalized = (data || []).map(product => ({
    ...product,
    is_best_seller: product.is_best_seller ?? false,
    is_sold_out: product.is_sold_out ?? false,
   }))
   setFlagColumnMissing(data?.some(product => !('is_best_seller' in product) || !('is_sold_out' in product)) ?? false)
   setProducts(normalized)
  }
  setLoading(false)
 }

 const refreshProducts = () => {
  fetchProducts()
  onProductsChanged?.()
 }

 const handleDelete = async (id) => {
  await supabase.from('products').delete().eq('id', id)
  setConfirmDelete(null)
  refreshProducts()
 }

 const toggleActive = async (product) => {
  await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
  refreshProducts()
 }

 const toggleBestSeller = async (product) => {
  if (flagColumnMissing) {
   setPageError(productFlagsMigrationMessage)
   return
  }

  const { error } = await supabase.from('products').update({ is_best_seller: !product.is_best_seller }).eq('id', product.id)
  if (error && isMissingProductFlagColumn(error)) {
   setFlagColumnMissing(true)
   setPageError(productFlagsMigrationMessage)
   return
  }
  if (error) setPageError(error.message)
  refreshProducts()
 }

 const toggleSoldOut = async (product) => {
  if (flagColumnMissing) {
   setPageError(productFlagsMigrationMessage)
   return
  }

  const { error } = await supabase.from('products').update({ is_sold_out: !product.is_sold_out }).eq('id', product.id)
  if (error && isMissingProductFlagColumn(error)) {
   setFlagColumnMissing(true)
   setPageError(productFlagsMigrationMessage)
   return
  }
  if (error) setPageError(error.message)
  refreshProducts()
 }

 const filtered = products.filter(p =>
  p.name.toLowerCase().includes(search.toLowerCase()) ||
  (p.category || '').toLowerCase().includes(search.toLowerCase())
 )

 const openEdit = (product) => {
  setEditProduct(product)
  setShowForm(true)
 }

 const openAdd = () => {
  setEditProduct(null)
  setShowForm(true)
 }

 const handleFormClose = () => {
  setShowForm(false)
  setEditProduct(null)
 }

 return (
  <div>
   {/* Header actions */}
   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
    <div className="relative w-full sm:w-72">
     <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
     <input
      type="text"
      placeholder="Cari produk..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
     />
    </div>
    <button
     onClick={openAdd}
     className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
    >
     <HiOutlinePlus className="text-lg" />
     Tambah Produk
    </button>
   </div>

   {/* Stats */}
   {(flagColumnMissing || pageError) && (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
     <p className="text-sm font-medium text-amber-800">
      {pageError || productFlagsMigrationMessage}
     </p>
    </div>
   )}

   {/* Stats */}
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
    <div className="bg-white rounded-lg border border-gray-200 p-4">
     <p className="text-2xl font-bold text-gray-900">{products.length}</p>
     <p className="text-xs text-gray-500 mt-1">Total Produk</p>
    </div>
    <div className="bg-white rounded-lg border border-gray-200 p-4">
     <p className="text-2xl font-bold text-green-600">{products.filter(p => p.is_active).length}</p>
     <p className="text-xs text-gray-500 mt-1">Aktif</p>
    </div>
    <div className="bg-white rounded-lg border border-gray-200 p-4">
     <p className="text-2xl font-bold text-gray-400">{products.filter(p => !p.is_active).length}</p>
     <p className="text-xs text-gray-500 mt-1">Nonaktif</p>
    </div>
    <div className="bg-white rounded-lg border border-gray-200 p-4">
     <p className="text-2xl font-bold text-amber-500">{products.filter(p => p.is_best_seller).length}</p>
     <p className="text-xs text-gray-500 mt-1">Best Seller</p>
    </div>
   </div>

   {/* Product table */}
   {loading ? (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
     <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto"></div>
     <p className="text-sm text-gray-400 mt-3">Memuat produk...</p>
    </div>
   ) : filtered.length === 0 ? (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
     <HiOutlinePhotograph className="text-4xl text-gray-300 mx-auto mb-3" />
     <p className="text-sm text-gray-500">Tidak ada produk ditemukan</p>
    </div>
   ) : (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
     <div className="overflow-x-auto">
      <table className="w-full">
       <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
         <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produk</th>
         <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Kategori</th>
         <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga</th>
         <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
         <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-gray-100">
        {filtered.map(p => (
         <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
          <td className="py-3 px-4">
           <div className="flex items-center gap-3">
            {p.images?.[0] ? (
             <img src={p.images[0]} alt={p.name} className="w-11 h-11 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
            ) : (
             <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <HiOutlinePhotograph className="text-gray-400" />
             </div>
            )}
            <div className="min-w-0">
             <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
             {p.discount_percent > 0 && (
              <span className="inline-flex items-center text-[11px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded mt-0.5">
               -{p.discount_percent}%
              </span>
             )}
             <div className="flex flex-wrap gap-1 mt-1">
              {p.is_best_seller && (
               <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                <HiStar className="text-xs" /> Best Seller
               </span>
              )}
              {p.is_sold_out && (
               <span className="inline-flex items-center text-[11px] font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                Sold Out
               </span>
              )}
             </div>
            </div>
           </div>
          </td>
          <td className="py-3 px-4 hidden md:table-cell">
           <span className="text-sm text-gray-500">{p.categories?.name || p.category || '-'}</span>
          </td>
          <td className="py-3 px-4">
           <div>
            {p.discount_percent > 0 ? (
             <>
              <p className="text-sm font-semibold text-gray-900">{formatPrice(p.price * (1 - p.discount_percent / 100))}</p>
              <p className="text-xs text-gray-400 line-through">{formatPrice(p.price)}</p>
             </>
            ) : (
             <p className="text-sm font-semibold text-gray-900">{formatPrice(p.price)}</p>
            )}
           </div>
          </td>
          <td className="py-3 px-4 text-center hidden sm:table-cell">
           <button
            onClick={() => toggleActive(p)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
             p.is_active
              ? 'bg-green-50 text-green-700 hover:bg-green-100'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
           >
            <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            {p.is_active ? 'Aktif' : 'Nonaktif'}
           </button>
           <div className="mt-1.5 flex justify-center gap-1">
            <button
             onClick={() => toggleBestSeller(p)}
             disabled={flagColumnMissing}
             className={`text-[11px] font-medium px-2 py-1 rounded-full transition-colors ${
              flagColumnMissing
               ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
               : p.is_best_seller
               ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
               : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
             }`}
            >
             Best
            </button>
            <button
             onClick={() => toggleSoldOut(p)}
             disabled={flagColumnMissing}
             className={`text-[11px] font-medium px-2 py-1 rounded-full transition-colors ${
              flagColumnMissing
               ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
               : p.is_sold_out
               ? 'bg-red-50 text-red-700 hover:bg-red-100'
               : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
             }`}
            >
             Sold
            </button>
           </div>
          </td>
          <td className="py-3 px-4">
           <div className="flex items-center justify-end gap-1">
            <button
             onClick={() => openEdit(p)}
             className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
             title="Edit"
            >
             <HiOutlinePencil className="text-base" />
            </button>
            <button
             onClick={() => setConfirmDelete({ id: p.id, name: p.name })}
             className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
             title="Hapus"
            >
             <HiOutlineTrash className="text-base" />
            </button>
           </div>
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
     <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
      <p className="text-xs text-gray-400">{filtered.length} dari {products.length} produk</p>
     </div>
    </div>
   )}

   {/* Product Form Modal */}
   {showForm && (
    <ProductForm
     product={editProduct}
     onSave={refreshProducts}
     onClose={handleFormClose}
     flagColumnMissing={flagColumnMissing}
    />
   )}

    {/* Confirm Delete Modal */}
   {confirmDelete && (
    <ConfirmDialog
     message={`Hapus produk "${confirmDelete.name}"? Tindakan ini tidak bisa dibatalkan.`}
     onConfirm={() => handleDelete(confirmDelete.id)}
     onCancel={() => setConfirmDelete(null)}
    />
   )}
  </div>
 )
}
