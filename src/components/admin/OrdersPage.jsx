import { useState, useEffect, Fragment } from 'react'
import {
 HiOutlineRefresh, HiOutlineSearch, HiOutlineExternalLink,
 HiOutlineDocumentDownload, HiOutlineTruck, HiOutlineChevronDown,
 HiOutlineChevronRight, HiOutlineTrash, HiOutlineCube,
} from 'react-icons/hi'
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

const DATE_PRESETS = [
 { label: 'Semua', value: 'all' },
 { label: 'Hari Ini', value: 'today' },
 { label: '7 Hari', value: '7d' },
 { label: '30 Hari', value: '30d' },
 { label: 'Bulan Ini', value: 'month' },
]

function getDateRange(preset) {
 const now = new Date()
 if (preset === 'all') return null
 if (preset === 'today') {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return { from: start.toISOString(), to: now.toISOString() }
 }
 if (preset === '7d') {
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: now.toISOString() }
 }
 if (preset === '30d') {
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: now.toISOString() }
 }
 if (preset === 'month') {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: start.toISOString(), to: now.toISOString() }
 }
 return null
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

function OrderDetail({ order, items }) {
 if (!items || items.length === 0) return null
 return (
  <div className="bg-gray-50 border-t border-gray-100 px-4 py-4">
   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Items */}
    <div className="md:col-span-2">
     <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Item yang dibeli</p>
     <div className="space-y-2">
      {items.map((item, idx) => (
       <div key={idx} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-gray-100">
        <div>
         <p className="text-sm font-medium text-gray-800">{item.product_name}</p>
         <p className="text-xs text-gray-400">{item.quantity}x {formatPrice(item.unit_price)}</p>
        </div>
        <p className="text-sm font-semibold text-gray-700">{formatPrice(item.subtotal_amount)}</p>
       </div>
      ))}
     </div>
     <div className="mt-3 space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
       <span>Subtotal</span>
       <span>{formatPrice(order.subtotal_amount)}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
       <span>Ongkir ({order.selected_courier?.courierCompany} {order.selected_courier?.courierService})</span>
       <span>{formatPrice(order.shipping_amount)}</span>
      </div>
      <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
       <span>Total</span>
       <span>{formatPrice(order.total_amount)}</span>
      </div>
     </div>
    </div>

    {/* Info */}
    <div className="space-y-3">
     <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Alamat Pengiriman</p>
      <p className="text-sm text-gray-700">{order.destination_address}</p>
      {order.destination_note && (
       <p className="text-xs text-gray-400 mt-1">Catatan: {order.destination_note}</p>
      )}
     </div>
     {order.order_note && (
      <div>
       <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Catatan Order</p>
       <p className="text-sm text-gray-700">{order.order_note}</p>
      </div>
     )}
     {order.biteship_waybill_id && (
      <div>
       <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Resi</p>
       <p className="text-sm font-mono text-blue-600">{order.biteship_waybill_id}</p>
      </div>
     )}
     <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Status Pengiriman</p>
      <p className="text-sm text-gray-700">{order.shipment_status || '-'}</p>
     </div>
    </div>
   </div>
  </div>
 )
}

export default function OrdersPage() {
 const [orders, setOrders] = useState([])
 const [orderItems, setOrderItems] = useState({})
 const [loading, setLoading] = useState(true)
 const [statusFilter, setStatusFilter] = useState('all')
 const [datePreset, setDatePreset] = useState('all')
 const [search, setSearch] = useState('')
 const [error, setError] = useState('')
 const [expandedOrder, setExpandedOrder] = useState(null)
 const [actionLoading, setActionLoading] = useState(null)

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

  const dateRange = getDateRange(datePreset)
  if (dateRange) {
   query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to)
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

 const fetchOrderItems = async (orderId) => {
  if (orderItems[orderId]) return
  const { data } = await supabase
   .from('checkout_order_items')
   .select('*')
   .eq('order_id', orderId)
  if (data) setOrderItems(prev => ({ ...prev, [orderId]: data }))
 }

 useEffect(() => { fetchOrders() }, [statusFilter, datePreset])

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

 const toggleExpand = async (orderId) => {
  if (expandedOrder === orderId) {
   setExpandedOrder(null)
  } else {
   setExpandedOrder(orderId)
   await fetchOrderItems(orderId)
  }
 }

  const updateStatus = async (id, newStatus) => {
   const { error: updateErr } = await supabase.from('checkout_orders').update({ status: newStatus }).eq('id', id)

  if (updateErr) {
   setError(updateErr.message)
  } else {
   setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
  }
 }

 const handleCreateShipment = async (orderId) => {
  if (!window.confirm('Buat shipment untuk order ini?')) return
  setActionLoading(`shipment-${orderId}`)
  try {
   const { data, error: fnErr } = await supabase.functions.invoke('manual-shipment', { body: { orderId } })
   if (fnErr) throw fnErr
   if (!data.success) throw new Error(data.error)
   alert('Shipment berhasil dibuat! Waybill: ' + (data.shipment?.waybillId || '-'))
   fetchOrders()
  } catch (err) {
   alert(err.message || 'Gagal membuat shipment.')
  } finally {
   setActionLoading(null)
  }
 }

 const handlePrintLabel = async (orderId) => {
  setActionLoading(`label-${orderId}`)
  try {
   const { data, error: fnErr } = await supabase.functions.invoke('print-label', { body: { orderId } })
   if (fnErr) throw fnErr
   if (!data.success) throw new Error(data.error)

   if (data.label?.url) {
    window.open(data.label.url, '_blank')
   } else if (data.label?.test_mode) {
    alert(data.label.message || 'Mode test — label tidak tersedia.')
   } else {
    alert('Label tidak tersedia. Cek dashboard Biteship.')
   }
  } catch (err) {
   alert(err.message || 'Gagal mengambil label.')
  } finally {
   setActionLoading(null)
  }
 }

 const handleSchedulePickup = async (orderId) => {
  setActionLoading(`pickup-${orderId}`)
  try {
   const { data, error: fnErr } = await supabase.functions.invoke('schedule-pickup', { body: { orderId } })
   if (fnErr) throw fnErr
   if (!data.success) throw new Error(data.error)

   if (data.pickup?.test_mode) {
    alert(data.pickup.message || 'Mode test — pickup tidak dijadwalkan.')
   } else {
    alert('Pickup berhasil dijadwalkan!')
   }
  } catch (err) {
   alert(err.message || 'Gagal menjadwalkan pickup.')
  } finally {
   setActionLoading(null)
  }
 }

 const handleDeleteOrder = async (orderId) => {
  if (!window.confirm('Yakin ingin menghapus order ini? Status akan diubah ke Dibatalkan.')) return
  setActionLoading(`delete-${orderId}`)
  try {
   const { error: updateErr } = await supabase
    .from('checkout_orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
   if (updateErr) throw updateErr
   setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
  } catch (err) {
   setError(err.message || 'Gagal menghapus order.')
  } finally {
   setActionLoading(null)
  }
 }

 const formatDate = (iso) => new Date(iso).toLocaleDateString('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
 })

 const totalRevenue = filtered
  .filter(o => ['paid', 'processing', 'shipped', 'completed'].includes(o.status))
  .reduce((sum, o) => sum + (o.total_amount || 0), 0)

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

   {/* Date filter */}
   <div className="flex gap-2 mb-4">
    {DATE_PRESETS.map(p => (
     <button
      key={p.value}
      onClick={() => setDatePreset(p.value)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
       datePreset === p.value
        ? 'bg-white border-gray-900 text-gray-900'
        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
      }`}
     >
      {p.label}
     </button>
    ))}
   </div>

   {/* Stats */}
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
     <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
      <p className="text-xs text-gray-500 mt-1">Total Order</p>
     </div>
     <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-2xl font-bold text-yellow-500">{filtered.filter(o => o.status === 'pending_payment').length}</p>
      <p className="text-xs text-gray-500 mt-1">Menunggu Bayar</p>
     </div>
     <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-2xl font-bold text-blue-500">{filtered.filter(o => o.status === 'processing' || o.status === 'paid').length}</p>
      <p className="text-xs text-gray-500 mt-1">Perlu Dikirim</p>
     </div>
     <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-2xl font-bold text-green-500">{formatPrice(totalRevenue)}</p>
      <p className="text-xs text-gray-500 mt-1">Total Pendapatan</p>
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
         <th className="w-8 py-3 px-2"></th>
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
         <Fragment key={order.id}>
          <tr
           className="hover:bg-gray-50/50 transition-colors cursor-pointer"
           onClick={() => toggleExpand(order.id)}
          >
           <td className="py-3 px-2 text-center">
            {expandedOrder === order.id
             ? <HiOutlineChevronDown className="w-4 h-4 text-gray-400 inline" />
             : <HiOutlineChevronRight className="w-4 h-4 text-gray-400 inline" />
            }
           </td>
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
            <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
             {/* Buat Shipment — paid tanpa shipment */}
             {!order.biteship_order_id && (order.status === 'paid' || order.status === 'pending_payment') && (
              <button
               onClick={() => handleCreateShipment(order.id)}
               disabled={actionLoading === `shipment-${order.id}`}
               className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
               title="Buat Shipment"
              >
               <HiOutlineCube className={`text-base ${actionLoading === `shipment-${order.id}` ? 'animate-pulse' : ''}`} />
              </button>
             )}

             {/* Cetak Label — ada shipment, status processing/shipped */}
             {order.biteship_order_id && (order.status === 'processing' || order.status === 'shipped') && (
              <button
               onClick={() => handlePrintLabel(order.id)}
               disabled={actionLoading === `label-${order.id}`}
               className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
               title="Cetak Label"
              >
               <HiOutlineDocumentDownload className={`text-base ${actionLoading === `label-${order.id}` ? 'animate-pulse' : ''}`} />
              </button>
             )}

             {/* Atur Pickup — ada shipment, status processing, belum dipickup */}
             {order.biteship_order_id && order.status === 'processing' && !['picking_up', 'picked', 'in_transit', 'dropping_off', 'delivered'].includes(order.shipment_status) && (
              <button
               onClick={() => handleSchedulePickup(order.id)}
               disabled={actionLoading === `pickup-${order.id}`}
               className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
               title="Atur Pickup"
              >
               <HiOutlineTruck className={`text-base ${actionLoading === `pickup-${order.id}` ? 'animate-pulse' : ''}`} />
              </button>
             )}

             {/* Status dropdown */}
             <select
              value={order.status || ''}
              onChange={e => updateStatus(order.id, e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white text-gray-700"
             >
              {STATUS_OPTIONS.filter(s => s !== 'all').map(s => (
               <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
             </select>

             {/* WhatsApp */}
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

             {/* Hapus */}
             {order.status !== 'cancelled' && (
              <button
               onClick={() => handleDeleteOrder(order.id)}
               disabled={actionLoading === `delete-${order.id}`}
               className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
               title="Hapus Order"
              >
               <HiOutlineTrash className={`text-base ${actionLoading === `delete-${order.id}` ? 'animate-pulse' : ''}`} />
              </button>
             )}
            </div>
           </td>
          </tr>
          {expandedOrder === order.id && (
           <tr>
            <td colSpan={7} className="p-0">
             <OrderDetail order={order} items={orderItems[order.id]} />
            </td>
           </tr>
          )}
         </Fragment>
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
