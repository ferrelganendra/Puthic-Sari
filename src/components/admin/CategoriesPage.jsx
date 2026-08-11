import { useState, useEffect } from 'react'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'
import { explainError } from '../../lib/errorMessages'
import ConfirmDialog from './ConfirmDialog'

export default function CategoriesPage() {
 const [categories, setCategories] = useState([])
 const [loading, setLoading] = useState(true)
 const [showForm, setShowForm] = useState(false)
 const [editCategory, setEditCategory] = useState(null)
 const [form, setForm] = useState({ name: '', description: '' })
 const [saving, setSaving] = useState(false)
 const [error, setError] = useState('')
 const [confirmDelete, setConfirmDelete] = useState(null)

 useEffect(() => {
  fetchCategories()
 }, [])

 const fetchCategories = async () => {
  setLoading(true)
  const { data } = await supabase
   .from('categories')
   .select('*, products(count)')
   .order('name')
  setCategories(data || [])
  setLoading(false)
 }

 const openAdd = () => {
  setEditCategory(null)
  setForm({ name: '', description: '' })
  setShowForm(true)
 }

 const openEdit = (cat) => {
  setEditCategory(cat)
  setForm({ name: cat.name, description: cat.description || '' })
  setShowForm(true)
 }

 const handleDelete = async (id) => {
  await supabase.from('categories').delete().eq('id', id)
  fetchCategories()
  setConfirmDelete(null)
 }

 const handleSubmit = async (e) => {
  e.preventDefault()
  setSaving(true)
  setError('')

  const data = { name: form.name, description: form.description }

  let result
  if (editCategory?.id) {
   result = await supabase.from('categories').update(data).eq('id', editCategory.id)
  } else {
   result = await supabase.from('categories').insert(data)
  }

   if (result.error) {
    setError(explainError(result.error, 'Kategori belum bisa disimpan. Cek nama kategori dan izin akun admin.'))
   } else {
   setShowForm(false)
   setEditCategory(null)
   fetchCategories()
  }
  setSaving(false)
 }

 return (
  <div>
      <div className="flex items-center justify-between mb-6">
    <div>
     <p className="text-sm text-gray-500">Kelola kategori produk untuk mengorganisir katalog toko.</p>
    </div>
    <button
     onClick={openAdd}
     className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
    >
     <HiOutlinePlus className="text-lg" />
     Tambah Kategori
    </button>
   </div>

      {loading ? (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
     <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto"></div>
     <p className="text-sm text-gray-400 mt-3">Memuat kategori...</p>
    </div>
   ) : categories.length === 0 ? (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
     <p className="text-sm text-gray-500">Belum ada kategori. Tambahkan kategori pertama.</p>
    </div>
   ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
     {categories.map(cat => (
      <div key={cat.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
       <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
         <h3 className="font-semibold text-gray-900 text-sm">{cat.name}</h3>
         {cat.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
         )}
         <p className="text-xs text-gray-400 mt-2">
          {cat.products?.[0]?.count || 0} produk
         </p>
        </div>
        <div className="flex items-center gap-1 ml-2">
         <button
          onClick={() => openEdit(cat)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
         >
          <HiOutlinePencil className="text-sm" />
         </button>
         <button
           onClick={() => setConfirmDelete(cat)}
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
    title="Hapus Kategori"
    message={`Yakin ingin menghapus kategori "${confirmDelete?.name}"? Produk yang terkait tidak akan terhapus.`}
    confirmLabel="Hapus"
    onConfirm={() => { if (confirmDelete) handleDelete(confirmDelete.id) }}
    onCancel={() => setConfirmDelete(null)}
   />

      {showForm && (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
     <div className="bg-white w-full max-w-md rounded-xl shadow-xl" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
       <h3 className="text-lg font-semibold text-gray-900">
        {editCategory ? 'Edit Kategori' : 'Tambah Kategori'}
       </h3>
       <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
        <HiOutlineX className="text-xl" />
       </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Kategori</label>
        <input
         type="text"
         required
         value={form.name}
         onChange={e => setForm({ ...form, name: e.target.value })}
         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all"
         placeholder="Contoh: Wisuda, Birthday, Anniversary"
        />
       </div>
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi (opsional)</label>
        <textarea
         rows={3}
         value={form.description}
         onChange={e => setForm({ ...form, description: e.target.value })}
         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all resize-none"
         placeholder="Deskripsi singkat kategori..."
        />
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
