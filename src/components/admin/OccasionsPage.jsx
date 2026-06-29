import { useState, useEffect } from 'react'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineSearch, HiOutlinePhotograph } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'
import { explainError } from '../../lib/errorMessages'
import ConfirmDialog from './ConfirmDialog'

export default function OccasionsPage() {
 const [occasions, setOccasions] = useState([])
 const [loading, setLoading] = useState(true)
 const [showForm, setShowForm] = useState(false)
 const [editOccasion, setEditOccasion] = useState(null)
 const [form, setForm] = useState({ name: '', description: '' })
 const [saving, setSaving] = useState(false)
 const [error, setError] = useState('')
 const [confirmDelete, setConfirmDelete] = useState(null)

 // Product picker state
 const [allProducts, setAllProducts] = useState([])
 const [selectedProducts, setSelectedProducts] = useState([])
 const [productSearch, setProductSearch] = useState('')

 useEffect(() => {
  fetchOccasions()
  fetchAllProducts()
 }, [])

 const fetchOccasions = async () => {
  setLoading(true)
  const { data } = await supabase
   .from('occasions')
   .select('*, product_occasions(count)')
   .order('id')
  setOccasions(data || [])
  setLoading(false)
 }

 const fetchAllProducts = async () => {
  const { data } = await supabase
   .from('products')
   .select('id, name, price, images, category')
   .order('name')
  setAllProducts(data || [])
 }

 const fetchOccasionProducts = async (occasionId) => {
  const { data } = await supabase
   .from('product_occasions')
   .select('product_id')
   .eq('occasion_id', occasionId)
  setSelectedProducts((data || []).map(po => po.product_id))
 }

 const openAdd = () => {
  setEditOccasion(null)
  setForm({ name: '', description: '' })
  setSelectedProducts([])
  setProductSearch('')
  setShowForm(true)
 }

 const openEdit = async (occ) => {
  setEditOccasion(occ)
  setForm({ name: occ.name, description: occ.description || '' })
  setProductSearch('')
  setSelectedProducts([])
  setShowForm(true)
  await fetchOccasionProducts(occ.id)
 }

 const toggleProduct = (productId) => {
  setSelectedProducts(prev =>
   prev.includes(productId)
    ? prev.filter(id => id !== productId)
    : [...prev, productId]
  )
 }

 const handleDelete = async (id) => {
  await supabase.from('occasions').delete().eq('id', id)
  fetchOccasions()
  setConfirmDelete(null)
 }

 const handleSubmit = async (e) => {
  e.preventDefault()
  setSaving(true)
  setError('')

  const data = { name: form.name, description: form.description }

  let occasionId = editOccasion?.id
  let result

  if (editOccasion?.id) {
   result = await supabase.from('occasions').update(data).eq('id', editOccasion.id)
  } else {
   result = await supabase.from('occasions').insert(data).select().single()
   occasionId = result.data?.id
  }

   if (result.error) {
    setError(explainError(result.error, 'Occasion belum bisa disimpan. Cek nama, produk pilihan, dan izin akun admin.'))
    setSaving(false)
    return
   }

  // Sync product_occasions for this occasion
  if (occasionId) {
   await supabase.from('product_occasions').delete().eq('occasion_id', occasionId)
   if (selectedProducts.length > 0) {
    const rows = selectedProducts.map(product_id => ({ product_id, occasion_id: occasionId }))
    await supabase.from('product_occasions').insert(rows)
   }
  }

  setShowForm(false)
  setEditOccasion(null)
  fetchOccasions()
  setSaving(false)
 }

 const filteredProducts = allProducts.filter(p =>
  p.name.toLowerCase().includes(productSearch.toLowerCase())
 )

 return (
  <div>
   <div className="flex items-center justify-between mb-6">
    <p className="text-sm text-gray-500">Kelola acara/momen untuk membantu pembeli menemukan buket yang tepat.</p>
    <button
     onClick={openAdd}
     className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
    >
     <HiOutlinePlus className="text-lg" />
     Tambah Acara
    </button>
   </div>

   {loading ? (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
     <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto"></div>
     <p className="text-sm text-gray-400 mt-3">Memuat acara...</p>
    </div>
   ) : occasions.length === 0 ? (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
     <p className="text-sm text-gray-500">Belum ada acara. Tambahkan acara pertama.</p>
    </div>
   ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
     {occasions.map(occ => (
      <div key={occ.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
       <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
         <h3 className="font-semibold text-gray-900 text-sm">{occ.name}</h3>
         {occ.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{occ.description}</p>
         )}
         <p className="text-xs text-gray-400 mt-2">
          {occ.product_occasions?.[0]?.count || 0} produk
         </p>
        </div>
        <div className="flex items-center gap-1 ml-2">
         <button
          onClick={() => openEdit(occ)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
         >
          <HiOutlinePencil className="text-sm" />
         </button>
          <button
           onClick={() => setConfirmDelete(occ)}
           className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
           <HiOutlineTrash className="text-sm" />
          </button>
        </div>
       </div>
      </div>
     ))}
    </div>
   )}

   <ConfirmDialog
    open={!!confirmDelete}
    title="Hapus Acara"
    message={`Yakin ingin menghapus acara "${confirmDelete?.name}"? Produk yang terkait tidak akan terhapus, hanya tag acaranya yang dilepas.`}
    confirmLabel="Hapus"
    onConfirm={() => { if (confirmDelete) handleDelete(confirmDelete.id) }}
    onCancel={() => setConfirmDelete(null)}
   />

   {showForm && (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-start justify-center overflow-y-auto p-4 py-8">
     <div className="bg-white w-full max-w-lg rounded-xl shadow-xl my-auto" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
       <h3 className="text-lg font-semibold text-gray-900">
        {editOccasion ? 'Edit Acara' : 'Tambah Acara'}
       </h3>
       <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
        <HiOutlineX className="text-xl" />
       </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Acara</label>
        <input
         type="text"
         required
         value={form.name}
         onChange={e => setForm({ ...form, name: e.target.value })}
         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all"
         placeholder="Contoh: Wisuda, Anniversary, Wedding"
        />
       </div>
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi (opsional)</label>
        <textarea
         rows={2}
         value={form.description}
         onChange={e => setForm({ ...form, description: e.target.value })}
         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all resize-none"
         placeholder="Deskripsi singkat acara..."
        />
       </div>

       {/* Product picker */}
       <div>
        <div className="flex items-center justify-between mb-1.5">
         <label className="block text-sm font-medium text-gray-700">Produk untuk Acara Ini</label>
         <span className="text-xs text-gray-400">{selectedProducts.length} dipilih</span>
        </div>
        <div className="relative mb-2">
         <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
         <input
          type="text"
          value={productSearch}
          onChange={e => setProductSearch(e.target.value)}
          placeholder="Cari produk..."
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all"
         />
        </div>
        <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-gray-100">
         {filteredProducts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Tidak ada produk</p>
         ) : (
          filteredProducts.map(p => {
           const checked = selectedProducts.includes(p.id)
           return (
            <label
             key={p.id}
             className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
            >
             <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleProduct(p.id)}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20"
             />
             {p.images?.[0] ? (
              <img src={p.images[0]} alt={p.name} className="w-9 h-9 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
             ) : (
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
               <HiOutlinePhotograph className="text-gray-400 text-sm" />
              </div>
             )}
             <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
              <p className="text-xs text-gray-400">{p.category}</p>
             </div>
            </label>
           )
          })
         )}
        </div>
       </div>

       {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
         <p className="text-sm text-red-600">{error}</p>
        </div>
       )}
       <div className="flex gap-3 pt-2">
        <button
         type="button"
         onClick={() => setShowForm(false)}
         className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
         Batal
        </button>
        <button
         type="submit"
         disabled={saving}
         className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-sm"
        >
         {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
       </div>
      </form>
     </div>
    </div>
   )}
  </div>
 )
}
