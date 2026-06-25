import { useState, useEffect } from 'react'
import { HiCheck, HiX, HiTrash, HiRefresh, HiStar } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'
import ConfirmDialog from './ConfirmDialog'

function StarDisplay({ rating }) {
 return (
  <div className="flex gap-0.5">
   {[1, 2, 3, 4, 5].map(s => (
    <span key={s} className={`text-sm ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
   ))}
  </div>
 )
}

export default function ReviewsPage() {
 const [reviews, setReviews] = useState([])
 const [loading, setLoading] = useState(true)
 const [filter, setFilter] = useState('pending') // 'pending' | 'approved' | 'all'
 const [actionLoading, setActionLoading] = useState(null)
 const [confirmDelete, setConfirmDelete] = useState(null)

 const fetchReviews = async () => {
  setLoading(true)
  let query = supabase
   .from('reviews')
   .select('*')
   .order('created_at', { ascending: false })

  if (filter === 'pending') query = query.eq('is_approved', false)
  else if (filter === 'approved') query = query.eq('is_approved', true)

  const { data } = await query
  setReviews(data || [])
  setLoading(false)
 }

 useEffect(() => { fetchReviews() }, [filter])

 const approve = async (id) => {
  setActionLoading(id + '_approve')
  await supabase.from('reviews').update({ is_approved: true }).eq('id', id)
  setActionLoading(null)
  fetchReviews()
 }

 const reject = async (id) => {
  setActionLoading(id + '_reject')
  await supabase.from('reviews').delete().eq('id', id)
  setActionLoading(null)
  setConfirmDelete(null)
  fetchReviews()
 }

 const formatDate = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
 }

 return (
  <div>
   {/* Filter tabs */}
   <div className="flex items-center gap-2 mb-6">
    {[
     { key: 'pending', label: 'Menunggu Persetujuan' },
     { key: 'approved', label: 'Disetujui' },
     { key: 'all', label: 'Semua' },
    ].map(tab => (
     <button
      key={tab.key}
      onClick={() => setFilter(tab.key)}
      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${filter === tab.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
     >
      {tab.label}
     </button>
    ))}
    <button
     onClick={fetchReviews}
     className="ml-auto p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
     title="Refresh"
    >
     <HiRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
    </button>
   </div>

   {loading ? (
    <div className="flex justify-center py-16">
     <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
    </div>
   ) : reviews.length === 0 ? (
    <div className="text-center py-16 text-gray-400">
     <HiStar className="mx-auto mb-3 text-3xl" />
     <p className="text-sm">Tidak ada ulasan di kategori ini.</p>
    </div>
   ) : (
    <div className="space-y-3">
     {reviews.map(r => (
      <div
       key={r.id}
       className={`bg-white border rounded-xl p-5 flex flex-col sm:flex-row sm:items-start gap-4 ${r.is_approved ? 'border-green-100' : 'border-amber-100'}`}
      >
       {/* Avatar */}
       <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-sm flex-shrink-0">
        {r.name.charAt(0).toUpperCase()}
       </div>

       {/* Content */}
       <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
         <span className="font-semibold text-gray-800 text-sm">{r.name}</span>
         {r.email && <span className="text-gray-400 text-xs">· {r.email}</span>}
         <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${r.is_approved ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
          {r.is_approved ? 'Disetujui' : 'Pending'}
         </span>
        </div>
        <StarDisplay rating={r.rating} />
        <p className="text-gray-600 text-sm mt-2 leading-relaxed">{r.comment}</p>
        <p className="text-gray-400 text-xs mt-2">{formatDate(r.created_at)}</p>
       </div>

       {/* Actions */}
       <div className="flex gap-2 flex-shrink-0">
        {!r.is_approved && (
         <button
          onClick={() => approve(r.id)}
          disabled={actionLoading === r.id + '_approve'}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
         >
          <HiCheck />
          Setujui
         </button>
        )}
        <button
         onClick={() => setConfirmDelete(r)}
         disabled={actionLoading === r.id + '_reject'}
         className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
        >
         <HiTrash />
         Hapus
        </button>
       </div>
      </div>
     ))}
    </div>
   )}

   <ConfirmDialog
    open={!!confirmDelete}
    title="Hapus Ulasan"
    message={`Yakin ingin menghapus ulasan dari "${confirmDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
    confirmLabel="Hapus"
     onConfirm={() => { if (confirmDelete) reject(confirmDelete.id) }}
    onCancel={() => setConfirmDelete(null)}
   />
  </div>
 )
}
