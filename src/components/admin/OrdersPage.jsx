import { useState, useEffect } from 'react'
import { HiOutlineRefresh, HiOutlineSearch, HiOutlineExternalLink } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/pricing'

const CHECKOUT_ORDER_STATUSES = [
 'pending_payment',
 'paid',
 'processing',
 'shipped',
 'completed',
 'cancelled',
 'payment_failed',
 'refunded',
]
const STATUS_OPTIONS = ['all', ...CHECKOUT_ORDER_STATUSES]

const STATUS_LABEL = {
 all: 'Semua',
 pending_payment: 'Menunggu Bayar',
 paid: 'Dibayar',
 processing: 'Diproses',
 shipped: 'Dikirim',
 completed: 'Selesai',
 cancelled: 'Dibatalkan',
 payment_failed: 'Pembayaran Gagal',
 refunded: 'Refunded',
}

const STATUS_COLOR = {
 pending_payment: 'bg-yellow-50 text-yellow-700',
 payment_failed: 'bg-red-50 text-red-700',
 paid: 'bg-green-50 text-green-700',
 processing: 'bg-blue-50 text-blue-700',
 shipped: 'bg-purple-50 text-purple-700',
 completed: 'bg-green-50 text-green-800',
 cancelled: 'bg-red-50 text-red-700',
 refunded: 'bg-gray-100 text-gray-700',
}

function StatusBadge({ status }) {
 const color = STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'
 const label = STATUS_LABEL[status] || status || '-'
 return (
  <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
   {label}
  </span>
 )
}

export default function OrdersPage() {
 const [orders, setOrders] = useState([])
 const [loading, setLoading] = useState(true)
 const [statusFilter, setStatusFilter] = useState('all')
 const [search, setSearch] = useState('')
 const [error, setError] = useState('')

 const fetchOrders = async () => {
  setLoading(true)
  setError('')
   let query = supabase
    .from('checkout_orders')
    .select('*')
    .order('created_at', { ascending: false })


  if (statusFilter !== 'all') {
   query = query.eq('status', statusFilter)
  }

  const { data, error: fetchErr } = await query

  if (fetchErr) {
   setError(fetchErr.message)
   setOrders([])
  } else {
   setOrders(data || [])
  }
  setLoading(false)
 }

 useEffect(() => { fetchOrders() }, [statusFilter])

 const filtered = orders.filter(o => {
  if (!search) return true
  const q = search.toLowerCase()
  return (
   (o.order_number || o.orderNumber || '').toLowerCase().includes(q) ||
   (o.customer_name || '').toLowerCase().includes(q) ||
   (o.customer_email || '').toLowerCase().includes(q) ||
   (o.customer_phone || '').toLowerCase().includes(q)
  )
 })

  const updateStatus = async (id, newStatus) => {
   const { error: updateErr } = await supabase.from('checkout_orders').update({ status: newStatus }).eq('id', id)

  if (updateErr) {
   setError(updateErr.message)
  } else {
   setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
  }
 }

 const formatDate = (iso) => new Date(iso).toLocaleDateString('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
 })

 return (
  <div>
   {/* Controls */}
   <div className="flex flex-col sm:flex-row gap-3 mb-4">
    <div className="relative flex-1 max-w-xs">
     <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
     <input
      type="text"
      placeholder="Cari order, nama, email..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
     />
    </div>
    <div className="flex gap-2 flex-wrap">
     {STATUS_OPTIONS.map(s => (
      <button
       key={s}
       onClick={() => setStatusFilter(s)}
       className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
        statusFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
       }`}
      >
       {STATUS_LABEL[s]}
      </button>
     ))}
    </div>
    <button
     onClick={fetchOrders}
     className="ml-auto p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
     title="Refresh"
    >
     <HiOutlineRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
    </button>
   </div>

   {/* Stats */}
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
     <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
      <p className="text-xs text-gray-500 mt-1">Total Order</p>
     </div>
     <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-2xl font-bold text-yellow-500">{orders.filter(o => o.status === 'pending_payment').length}</p>
      <p className="text-xs text-gray-500 mt-1">Menunggu Bayar</p>
     </div>
     <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-2xl font-bold text-blue-500">{orders.filter(o => o.status === 'processing' || o.status === 'paid').length}</p>
      <p className="text-xs text-gray-500 mt-1">Diproses</p>
     </div>
     <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-2xl font-bold text-green-500">{orders.filter(o => o.status === 'completed').length}</p>
      <p className="text-xs text-gray-500 mt-1">Selesai</p>
     </div>

   </div>

   {error && (
    <div className="mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
     <p className="text-sm text-red-600">{error}</p>
    </div>
   )}

   {/* Table */}
   {loading ? (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
     <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto" />
     <p className="text-sm text-gray-400 mt-3">Memuat pesanan...</p>
    </div>
   ) : filtered.length === 0 ? (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
     <p className="text-sm text-gray-500">Tidak ada pesanan ditemukan.</p>
    </div>
   ) : (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
     <div className="overflow-x-auto">
      <table className="w-full">
       <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
         <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
         <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Pelanggan</th>
         <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
         <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
         <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Waktu</th>
         <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-gray-100">
        {filtered.map(order => (
         <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
          <td className="py-3 px-4">
           <p className="font-mono text-xs font-semibold text-gray-800">{order.order_number || order.orderNumber || `#${order.id}`}</p>
            {order.biteship_waybill_id && (
             <p className="text-[11px] text-blue-500 mt-0.5">Resi: {order.biteship_waybill_id}</p>
            )}

          </td>
          <td className="py-3 px-4 hidden md:table-cell">
           <p className="text-sm text-gray-700">{order.customer_name || '-'}</p>
           <p className="text-xs text-gray-400">{order.customer_phone || order.customer_email || ''}</p>
          </td>
          <td className="py-3 px-4">
            <p className="text-sm font-semibold text-gray-900">{formatPrice(order.total_amount)}</p>

          </td>
          <td className="py-3 px-4 text-center">
           <StatusBadge status={order.status} />
          </td>
          <td className="py-3 px-4 hidden lg:table-cell">
           <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
          </td>
          <td className="py-3 px-4">
           <div className="flex items-center justify-end gap-2">
            <select
             value={order.status || ''}
             onChange={e => updateStatus(order.id, e.target.value)}
             className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white text-gray-700"
            >
             {STATUS_OPTIONS.filter(s => s !== 'all').map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
             ))}
            </select>
            {order.customer_phone && (
             <a
              href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${order.customer_name || ''}, update pesanan ${order.order_number || ''} Puthic Sari:`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
              title="Hubungi via WhatsApp"
             >
              <HiOutlineExternalLink />
             </a>
            )}
           </div>
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
     <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
      <p className="text-xs text-gray-400">{filtered.length} dari {orders.length} pesanan</p>
     </div>
    </div>
   )}
  </div>
 )
}
