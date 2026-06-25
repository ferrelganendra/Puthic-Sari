import { useState, useEffect } from 'react'
import { HiOutlinePlus, HiOutlineTrash, HiOutlineUpload, HiOutlinePhotograph } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'
import ConfirmDialog from './ConfirmDialog'

export default function BannersPage() {
 const [banners, setBanners] = useState([])
 const [loading, setLoading] = useState(true)
 const [uploading, setUploading] = useState(false)
 const [uploadError, setUploadError] = useState('')
 const [confirmDelete, setConfirmDelete] = useState(null) // {id}

 useEffect(() => {
  fetchBanners()
 }, [])

 const fetchBanners = async () => {
  setLoading(true)
  const { data } = await supabase
   .from('banners')
   .select('*')
   .order('sort_order', { ascending: true })
  setBanners(data || [])
  setLoading(false)
 }

 const uploadBanner = async (file) => {
  setUploadError('')
  const MAX_SIZE_MB = 5
  if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
   setUploadError(`File terlalu besar. Maksimal ${MAX_SIZE_MB}MB.`)
   return
  }
  if (!file.type.startsWith('image/')) {
   setUploadError('File harus berupa gambar.')
   return
  }
  setUploading(true)
  const ext = file.name.split('.').pop()
  const fileName = `banner-${Date.now()}.${ext}`
  const filePath = `banners/${fileName}`

  const { error: uploadErr } = await supabase.storage
   .from('product-images')
   .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (uploadErr) {
   setUploadError('Gagal upload: ' + uploadErr.message)
   setUploading(false)
   return
  }

  const { data: urlData } = supabase.storage
   .from('product-images')
   .getPublicUrl(filePath)

  const sortOrder = banners.length > 0 ? Math.max(...banners.map(b => b.sort_order || 0)) + 1 : 1

  await supabase.from('banners').insert({
   image_url: urlData.publicUrl,
   sort_order: sortOrder,
   is_active: true,
  })

  fetchBanners()
  setUploading(false)
 }

 const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) uploadBanner(file)
 }

 const handleDelete = async (id) => {
  await supabase.from('banners').delete().eq('id', id)
  setConfirmDelete(null)
  fetchBanners()
 }

 const toggleActive = async (banner) => {
  await supabase.from('banners').update({ is_active: !banner.is_active }).eq('id', banner.id)
  fetchBanners()
 }

 return (
  <div>
   {/* Header */}
   <div className="flex items-center justify-between mb-6">
    <p className="text-sm text-gray-500">Kelola gambar banner/poster yang tampil di hero carousel.</p>
    <label className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm cursor-pointer">
     <HiOutlinePlus className="text-lg" />
     Upload Banner
     <input
      type="file"
      accept="image/*"
      onChange={handleFileSelect}
      className="hidden"
     />
    </label>
   </div>

   {uploading && (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4 text-center">
     <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto"></div>
     <p className="text-sm text-gray-500 mt-2">Mengupload banner...</p>
    </div>
   )}

   {uploadError && (
    <div className="mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
     <p className="text-sm text-red-600">{uploadError}</p>
    </div>
   )}

   {/* Banners grid */}
   {loading ? (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
     <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto"></div>
     <p className="text-sm text-gray-400 mt-3">Memuat banner...</p>
    </div>
   ) : banners.length === 0 ? (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
     <HiOutlinePhotograph className="text-4xl text-gray-300 mx-auto mb-3" />
     <p className="text-sm text-gray-500">Belum ada banner. Upload banner pertama.</p>
     <p className="text-xs text-gray-400 mt-1">Rekomendasi ukuran: 1440 x 500 pixel</p>
    </div>
   ) : (
    <div className="space-y-4">
     {banners.map((banner, index) => (
      <div key={banner.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
       <div className="flex flex-col sm:flex-row">
        {/* Preview */}
        <div className="sm:w-80 h-40 sm:h-auto flex-shrink-0">
         <img
          src={banner.image_url}
          alt={`Banner ${index + 1}`}
          className="w-full h-full object-cover"
         />
        </div>
        {/* Info */}
        <div className="flex-1 p-4 flex flex-col justify-between">
         <div>
          <div className="flex items-center gap-2 mb-2">
           <span className="text-xs font-medium text-gray-400">Banner #{index + 1}</span>
           <button
            onClick={() => toggleActive(banner)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
             banner.is_active
              ? 'bg-green-50 text-green-700 hover:bg-green-100'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
           >
            <span className={`w-1.5 h-1.5 rounded-full ${banner.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            {banner.is_active ? 'Aktif' : 'Nonaktif'}
           </button>
          </div>
          <p className="text-xs text-gray-400 truncate">{banner.image_url}</p>
         </div>
         <div className="flex items-center gap-2 mt-3">
          <button
           onClick={() => setConfirmDelete({ id: banner.id })}
           className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
           <HiOutlineTrash className="text-sm" />
           Hapus
          </button>
         </div>
        </div>
       </div>
      </div>
     ))}
    </div>
   )}

   {confirmDelete && (
    <ConfirmDialog
     message="Hapus banner ini? Tindakan ini tidak bisa dibatalkan."
     onConfirm={() => handleDelete(confirmDelete.id)}
     onCancel={() => setConfirmDelete(null)}
    />
   )}
  </div>
 )
}
