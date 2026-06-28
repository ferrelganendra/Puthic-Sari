import { useState, useEffect, useCallback, useRef } from 'react'
import { HiOutlineX, HiOutlinePhotograph, HiOutlineTrash, HiOutlineUpload } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'

const productFlagsMigrationMessage = 'Kolom Best Seller / Sold Out belum ada di Supabase. Jalankan scripts/migration-product-flags.sql di SQL Editor, lalu reload halaman admin.'
const categoryLabel = {
 'Artificial Flowers': 'Buket Artificial',
 'Fresh Flowers': 'Buket Segar',
 Giftbox: 'Giftbox',
 Pria: 'Untuk Pria',
 Wanita: 'Untuk Wanita',
}

const isMissingProductFlagColumn = (error) => {
 const message = error?.message || ''
 return message.includes('is_best_seller') || message.includes('is_sold_out')
}

export default function ProductForm({ product, onSave, onClose, flagColumnMissing = false }) {
 const [form, setForm] = useState({
  name: product?.name || '',
  description: product?.description || '',
  price: product?.price || '',
  category_id: product?.category_id || '',
  discount_percent: product?.discount_percent || 0,
  images: product?.images || [],
  is_active: product?.is_active ?? true,
  is_best_seller: product?.is_best_seller ?? false,
  is_sold_out: product?.is_sold_out ?? false,
  is_new_arrival: product?.is_new_arrival ?? false,
 })
 const [categories, setCategories] = useState([])
 const [occasions, setOccasions] = useState([])
 const [selectedOccasions, setSelectedOccasions] = useState([])
 const [uploading, setUploading] = useState(false)
 const [saving, setSaving] = useState(false)
 const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

 useEffect(() => {
  fetchCategories()
  fetchOccasions()
  if (product?.id) fetchProductOccasions(product.id)
 }, [])

 const fetchCategories = async () => {
  const { data } = await supabase.from('categories').select('*').order('name')
  setCategories(data || [])
 }

 const fetchOccasions = async () => {
  const { data } = await supabase.from('occasions').select('*').order('id')
  setOccasions(data || [])
 }

 const fetchProductOccasions = async (productId) => {
  const { data } = await supabase
   .from('product_occasions')
   .select('occasion_id')
   .eq('product_id', productId)
  setSelectedOccasions((data || []).map(po => po.occasion_id))
 }

 const toggleOccasion = (occasionId) => {
  setSelectedOccasions(prev =>
   prev.includes(occasionId)
    ? prev.filter(id => id !== occasionId)
    : [...prev, occasionId]
  )
 }

 const MAX_FILE_SIZE_MB = 5

 const uploadImages = async (files) => {
  // Validasi ukuran dan tipe file
  const invalidFiles = files.filter(f => {
   const sizeMb = f.size / 1024 / 1024
   return sizeMb > MAX_FILE_SIZE_MB || !f.type.startsWith('image/')
  })

  if (invalidFiles.length > 0) {
   const names = invalidFiles.map(f => {
    const sizeMb = (f.size / 1024 / 1024).toFixed(1)
    return `${f.name} (${sizeMb} MB)`
   }).join(', ')
   setError(`File berikut melebihi batas ${MAX_FILE_SIZE_MB}MB atau bukan gambar: ${names}`)
   return
  }

  setUploading(true)
  const uploaded = []

  for (const file of files) {
   const ext = file.name.split('.').pop()
   const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
   const filePath = `products/${fileName}`

   const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

   if (!error) {
    const { data: urlData } = supabase.storage
     .from('product-images')
     .getPublicUrl(filePath)
    uploaded.push(urlData.publicUrl)
   } else {
    setError(`Gagal upload ${file.name}: ${error.message}`)
   }
  }

  setForm(prev => ({ ...prev, images: [...prev.images, ...uploaded] }))
  setUploading(false)
 }

 const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  if (files.length > 0) uploadImages(files)
 }

 const handleDrop = useCallback((e) => {
  e.preventDefault()
  setDragOver(false)
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
  if (files.length > 0) uploadImages(files)
 }, [])

 const handleDragOver = (e) => {
  e.preventDefault()
  setDragOver(true)
 }

 const handleDragLeave = () => setDragOver(false)

 const removeImage = (index) => {
  setForm(prev => ({
   ...prev,
   images: prev.images.filter((_, i) => i !== index)
  }))
 }

 const handleSubmit = async (e) => {
  e.preventDefault()
  setSaving(true)
  setError('')

  const baseData = {
   name: form.name,
   description: form.description,
   price: parseInt(form.price),
   category_id: form.category_id || null,
   category: categories.find(c => c.id == form.category_id)?.name || '',
   discount_percent: parseInt(form.discount_percent) || 0,
   images: form.images,
   is_active: form.is_active,
  }

  const flagData = {
   is_best_seller: form.is_best_seller,
   is_sold_out: form.is_sold_out,
   is_new_arrival: form.is_new_arrival,
  }

  const data = { ...baseData, ...flagData }

  let productId = product?.id
  let result
  let missingFlagColumns = false

  if (product?.id) {
   result = await supabase.from('products').update(data).eq('id', product.id)
  } else {
   result = await supabase.from('products').insert(data).select().single()
   productId = result.data?.id
  }

  if (result.error) {
   if (!isMissingProductFlagColumn(result.error)) {
    setError(result.error.message)
    setSaving(false)
    return
   }

   missingFlagColumns = true

   if (product?.id) {
    result = await supabase.from('products').update(baseData).eq('id', product.id)
   } else {
    result = await supabase.from('products').insert(baseData).select().single()
    productId = result.data?.id
   }

   if (result.error) {
    setError(result.error.message)
    setSaving(false)
    return
   }

   setError(productFlagsMigrationMessage)
  }

  // Sync product_occasions
  if (productId) {
   // Remove existing links, then insert selected ones
   await supabase.from('product_occasions').delete().eq('product_id', productId)
   if (selectedOccasions.length > 0) {
    const rows = selectedOccasions.map(occasion_id => ({ product_id: productId, occasion_id }))
    await supabase.from('product_occasions').insert(rows)
   }
  }

  onSave()
  if (!missingFlagColumns) onClose()
  setSaving(false)
 }

 return (
  <div className="fixed inset-0 bg-black/50 z-[60] flex items-start justify-center overflow-y-auto p-4 py-8">
   <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl my-auto" onClick={e => e.stopPropagation()}>
    {/* Header */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
     <h3 className="text-lg font-semibold text-gray-900">
      {product?.id ? 'Edit Produk' : 'Tambah Produk Baru'}
     </h3>
     <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
      <HiOutlineX className="text-xl" />
     </button>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
     {/* Nama */}
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Produk</label>
      <input
       type="text"
       required
       value={form.name}
       onChange={e => setForm({ ...form, name: e.target.value })}
       className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all"
       placeholder="Contoh: Buket Mawar Pink"
      />
     </div>

     {/* Deskripsi */}
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
      <textarea
       rows={3}
       value={form.description}
       onChange={e => setForm({ ...form, description: e.target.value })}
       className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all resize-none"
       placeholder="Deskripsi singkat produk..."
      />
     </div>

     {/* Harga + Jenis Produk + Diskon */}
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1.5">Harga (Rp)</label>
       <input
        type="number"
        required
        value={form.price}
        onChange={e => setForm({ ...form, price: e.target.value })}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all"
        placeholder="150000"
       />
      </div>
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Produk</label>
       <select
        value={form.category_id}
        onChange={e => setForm({ ...form, category_id: e.target.value })}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all"
       >
        <option value="">Pilih jenis produk</option>
        {categories.map(c => (
         <option key={c.id} value={c.id}>{categoryLabel[c.name] || c.name}</option>
        ))}
       </select>
      </div>
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-1.5">Diskon (%)</label>
       <input
        type="number"
        min="0"
        max="100"
        value={form.discount_percent}
        onChange={e => setForm({ ...form, discount_percent: e.target.value })}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white transition-all"
        placeholder="0"
       />
      </div>
     </div>

     {/* Preview harga diskon */}
     {form.price && form.discount_percent > 0 && (
      <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-3">
       <p className="text-xs text-orange-600 font-medium">
        Harga setelah diskon: <span className="text-base font-bold">
         {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(form.price * (1 - form.discount_percent / 100))}
        </span>
       </p>
      </div>
     )}

     {/* Momen / Occasions */}
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Cocok untuk Momen</label>
      <p className="text-xs text-gray-400 mb-2">Pilih satu atau lebih momen yang sesuai dengan buket ini.</p>
      <div className="flex flex-wrap gap-2">
       {occasions.map(occ => {
        const active = selectedOccasions.includes(occ.id)
        return (
         <button
          key={occ.id}
          type="button"
          onClick={() => toggleOccasion(occ.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
           active
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
         >
          {occ.name}
         </button>
        )
       })}
       {occasions.length === 0 && (
        <p className="text-xs text-gray-400">Belum ada momen. Tambahkan di tab Momen.</p>
       )}
      </div>
     </div>

     {/* Upload Foto */}
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto Produk</label>
      <div
       onDrop={handleDrop}
       onDragOver={handleDragOver}
       onDragLeave={handleDragLeave}
       className={`
        border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
        ${dragOver ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}
       `}
       onClick={() => fileInputRef.current?.click()}
      >
       <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
       />
       {uploading ? (
        <div className="flex flex-col items-center gap-2">
         <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full"></div>
         <p className="text-sm text-gray-500">Mengupload...</p>
        </div>
       ) : (
        <div className="flex flex-col items-center gap-2">
         <HiOutlineUpload className="text-2xl text-gray-400" />
         <p className="text-sm text-gray-500">Drag & drop foto di sini, atau <span className="text-gray-900 font-medium">klik untuk pilih</span></p>
         <p className="text-xs text-gray-400">PNG, JPG, JPEG (maks. 5MB per file)</p>
        </div>
       )}
      </div>

      {/* Image previews */}
      {form.images.length > 0 && (
       <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
        {form.images.map((url, i) => (
         <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button
           type="button"
           onClick={() => removeImage(i)}
           className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
           <HiOutlineTrash className="text-white text-lg" />
          </button>
          {i === 0 && (
           <span className="absolute top-1 left-1 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
            Utama
           </span>
          )}
         </div>
        ))}
       </div>
      )}
     </div>

     {/* Status */}
     {flagColumnMissing && (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
       <p className="text-sm font-medium text-amber-800">{productFlagsMigrationMessage}</p>
      </div>
     )}
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50">
       <span className="relative inline-flex items-center">
        <input
         type="checkbox"
         checked={form.is_active}
         onChange={e => setForm({ ...form, is_active: e.target.checked })}
         className="sr-only peer"
        />
        <span className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></span>
       </span>
       <span className="text-sm text-gray-600">Aktif</span>
      </label>
      <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50">
       <span className="relative inline-flex items-center">
        <input
         type="checkbox"
         checked={form.is_best_seller}
         disabled={flagColumnMissing}
         onChange={e => setForm({ ...form, is_best_seller: e.target.checked })}
         className="sr-only peer"
        />
        <span className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></span>
       </span>
       <span className="text-sm text-gray-600">Best Seller</span>
      </label>
      <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50">
       <span className="relative inline-flex items-center">
        <input
         type="checkbox"
         checked={form.is_sold_out}
         disabled={flagColumnMissing}
         onChange={e => setForm({ ...form, is_sold_out: e.target.checked })}
         className="sr-only peer"
        />
        <span className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></span>
       </span>
       <span className="text-sm text-gray-600">Sold Out</span>
      </label>
      <label className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50">
       <span className="relative inline-flex items-center">
        <input
         type="checkbox"
         checked={form.is_new_arrival}
         onChange={e => setForm({ ...form, is_new_arrival: e.target.checked })}
         className="sr-only peer"
        />
        <span className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></span>
       </span>
       <span className="text-sm text-gray-600">New Arrival</span>
      </label>
     </div>

     {/* Error */}
     {error && (
      <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
       <p className="text-sm text-red-600">{error}</p>
      </div>
     )}

     {/* Actions */}
     <div className="flex gap-3 pt-2">
      <button
       type="button"
       onClick={onClose}
       className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
       Batal
      </button>
      <button
       type="submit"
       disabled={saving}
       className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-sm"
      >
       {saving ? 'Menyimpan...' : (product?.id ? 'Simpan Perubahan' : 'Tambah Produk')}
      </button>
     </div>
    </form>
   </div>
  </div>
 )
}
