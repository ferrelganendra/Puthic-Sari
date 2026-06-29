import { useState, useEffect, Fragment } from 'react'
import { HiOutlineRefresh, HiOutlineSearch, HiOutlineChevronRight } from 'react-icons/hi'
import { FaWhatsapp, FaBox, FaFileDownload, FaTruck, FaBan, FaTrashAlt } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../lib/pricing'
import { explainError } from '../../lib/errorMessages'

const STATUS_LABEL = {
 pending_payment: 'Menunggu Bayar',
 paid: 'Dibayar',
 processing: 'Diproses',
 shipped: 'Dikirim',
 completed: 'Selesai',
 cancelled: 'Dibatalkan',
 payment_failed: 'Pembayaran Gagal',
 refunded: 'Refunded',
}

const STATUS_FILTER_OPTIONS = [
 'all', 'pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled',
]

const STATUS_COLOR = {
 pending_payment: 'bg-amber-50 text-amber-700 border border-amber-200',
 payment_failed: 'bg-red-50 text-red-700 border border-red-200',
 paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
 processing: 'bg-blue-50 text-blue-700 border border-blue-200',
 shipped: 'bg-violet-50 text-violet-700 border border-violet-200',
 completed: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
 cancelled: 'bg-gray-100 text-gray-500 border border-gray-200',
 refunded: 'bg-gray-100 text-gray-500 border border-gray-200',
}

const SHIPMENT_STATUS_LABEL = {
 created: 'Shipment Dibuat', confirmed: 'Dikonfirmasi', scheduled: 'Dijadwalkan',
 allocated: 'Kurir Ditugaskan', picking_up: 'Kurir Menuju', picked: 'Paket Diambil',
 in_transit: 'Dalam Perjalanan', dropping_off: 'Sedang Diantar', delivered: 'Terkirim',
 cancelled: 'Dibatalkan',
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
  return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(), to: now.toISOString() }
 }
 if (preset === '7d') {
  return { from: new Date(now.getTime() - 7 * 86400000).toISOString(), to: now.toISOString() }
 }
 if (preset === '30d') {
  return { from: new Date(now.getTime() - 30 * 86400000).toISOString(), to: now.toISOString() }
 }
 if (preset === 'month') {
  return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to: now.toISOString() }
 }
 return null
}

function StatusBadge({ status }) {
 return (
  <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
   {STATUS_LABEL[status] || status || '-'}
  </span>
 )
}

function ShipmentBadge({ status }) {
 if (!status || status === 'not_created') return null
 return (
  <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
   📦 {SHIPMENT_STATUS_LABEL[status] || status}
  </span>
 )
}

function ActionButton({ icon: Icon, label, onClick, loading, color = 'gray', disabled = false }) {
 const colors = {
  blue: 'text-blue-500 hover:bg-blue-50',
  orange: 'text-orange-500 hover:bg-orange-50',
  indigo: 'text-indigo-500 hover:bg-indigo-50',
  green: 'text-green-500 hover:bg-green-50',
  red: 'text-red-400 hover:bg-red-50 hover:text-red-600',
 }
 return (
  <button
   onClick={onClick}
   disabled={disabled || loading}
   className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${colors[color]}`}
   title={label}
  >
   <Icon className={`text-base ${loading ? 'animate-pulse' : ''}`} />
  </button>
 )
}

function OrderDetail({ order, items }) {
 return (
  <div className="bg-gray-50/80 border-t border-gray-100 px-6 py-5">
   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="md:col-span-2">
     <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Item yang dibeli</p>
     {items && items.length > 0 ? (
      <div className="space-y-1.5">
       {items.map((item, idx) => (
        <div key={idx} className="flex justify-between items-center bg-white rounded-lg px-3 py-2.5 border border-gray-100">
         <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
          <p className="text-xs text-gray-400">{item.quantity}x {formatPrice(item.unit_price)}</p>
         </div>
         <p className="text-sm font-semibold text-gray-700 ml-4">{formatPrice(item.subtotal_amount)}</p>
        </div>
       ))}
      </div>
     ) : (
      <p className="text-sm text-gray-400">Memuat item...</p>
     )}
     <div className="mt-3 bg-white rounded-lg border border-gray-100 px-3 py-2.5 space-y-1.5">
      <div className="flex justify-between text-xs text-gray-500">
       <span>Subtotal</span><span>{formatPrice(order.subtotal_amount)}</span>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
       <span>Ongkir ({order.selected_courier?.courierCompany} {order.selected_courier?.courierService})</span>
       <span>{formatPrice(order.shipping_amount)}</span>
      </div>
      <div className="flex justify-between text-sm font-bold text-gray-900 pt-1.5 border-t border-gray-100">
       <span>Total</span><span>{formatPrice(order.total_amount)}</span>
      </div>
     </div>
    </div>
    <div className="space-y-4">
     <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Alamat Pengiriman</p>
      <p className="text-sm text-gray-700 leading-relaxed">{order.destination_address}</p>
      {order.destination_note && <p className="text-xs text-gray-400 mt-1 italic">Catatan: {order.destination_note}</p>}
     </div>
     {order.order_note && (
      <div>
       <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Catatan Order</p>
       <p className="text-sm text-gray-700">{order.order_note}</p>
      </div>
     )}
     {order.biteship_waybill_id && (
      <div>
       <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Resi</p>
       <p className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">{order.biteship_waybill_id}</p>
      </div>
     )}
     <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Status Pengiriman</p>
      <ShipmentBadge status={order.shipment_status} />
      {(!order.shipment_status || order.shipment_status === 'not_created') && <p className="text-sm text-gray-400">-</p>}
     </div>
     {order.paid_at && (
      <div>
       <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Dibayar Pada</p>
       <p className="text-sm text-gray-700">{new Date(order.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
     )}
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
 const [customDateFrom, setCustomDateFrom] = useState('')
 const [customDateTo, setCustomDateTo] = useState('')
 const [useCustomDate, setUseCustomDate] = useState(false)
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

  if (useCustomDate && customDateFrom) {
   const from = new Date(customDateFrom).toISOString()
   const to = customDateTo ? new Date(customDateTo + 'T23:59:59').toISOString() : new Date().toISOString()
   query = query.gte('created_at', from).lte('created_at', to)
  } else {
   const dateRange = getDateRange(datePreset)
   if (dateRange) {
    query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to)
   }
  }

  const { data, error: fetchErr } = await query
  if (fetchErr) {
    setError(explainError(fetchErr, 'Data pesanan belum bisa dimuat. Cek koneksi Supabase dan izin akun admin.'))

   setOrders([])
  } else {
   setOrders(data || [])
  }
  setLoading(false)
 }

 const fetchOrderItems = async (orderId) => {
  if (orderItems[orderId]) return
  const { data } = await supabase.from('checkout_order_items').select('*').eq('order_id', orderId)
  if (data) setOrderItems(prev => ({ ...prev, [orderId]: data }))
 }

 useEffect(() => { fetchOrders() }, [statusFilter, datePreset, useCustomDate, customDateFrom, customDateTo])

 const filtered = orders.filter(o => {
  if (!search) return true
  const q = search.toLowerCase()
  return (
   (o.order_number || '').toLowerCase().includes(q) ||
   (o.customer_name || '').toLowerCase().includes(q) ||
   (o.customer_email || '').toLowerCase().includes(q) ||
   (o.customer_phone || '').toLowerCase().includes(q)
  )
 })

 const toggleExpand = async (orderId) => {
  if (expandedOrder === orderId) { setExpandedOrder(null) }
  else { setExpandedOrder(orderId); await fetchOrderItems(orderId) }
 }

 const handleCreateShipment = async (orderId) => {
  if (!window.confirm('Buat shipment untuk order ini?')) return
  setActionLoading(`shipment-${orderId}`)
  try {
   const { data, error: fnErr } = await supabase.functions.invoke('manual-shipment', { body: { orderId } })
   if (fnErr) throw new Error(data?.error || fnErr.message || 'Gagal membuat shipment.')
   if (!data.success) throw new Error(data.error)
   alert('Shipment berhasil dibuat! Waybill: ' + (data.shipment?.waybillId || '-'))
   fetchOrders()
   } catch (err) { alert(explainError(err, 'Shipment belum bisa dibuat. Cek status order, alamat, kurir, dan saldo Biteship.')) }

  finally { setActionLoading(null) }
 }

 const handlePrintLabel = async (orderId) => {
  setActionLoading(`label-${orderId}`)
  try {
   const { data, error: fnErr } = await supabase.functions.invoke('print-label', { body: { orderId } })
   if (fnErr) throw fnErr
    if (!data.success) throw new Error(data.error)
    const label = data.label || {}
    if (label.dashboardUrl) {
     window.open(label.dashboardUrl, '_blank')
     alert(`${label.message}\n\nResi: ${data.waybillId || '-'}\nOrder Biteship: ${data.biteshipOrderId || '-'}\nOrder Website: ${data.orderNumber || '-'}`)
    } else if (label.url) window.open(label.url, '_blank')
    else alert('Label resmi hanya tersedia dari dashboard Biteship. Buka dashboard Biteship, pilih pesanan, lalu klik Print Orders atau Download Label.')
   } catch (err) { alert(explainError(err, 'Label belum bisa diambil. Pastikan shipment sudah dibuat, lalu coba lagi.')) }

  finally { setActionLoading(null) }
 }

 const handleSchedulePickup = async (orderId) => {
  setActionLoading(`pickup-${orderId}`)
  try {
   const { data, error: fnErr } = await supabase.functions.invoke('schedule-pickup', { body: { orderId } })
   if (fnErr) throw fnErr
   if (!data.success) throw new Error(data.error)
   alert(data.pickup?.test_mode ? (data.pickup.message || 'Mode test.') : 'Pickup berhasil dijadwalkan!')
   } catch (err) { alert(explainError(err, 'Pickup belum bisa dijadwalkan. Cek shipment dan jadwal pickup di Biteship.')) }

  finally { setActionLoading(null) }
 }

 const handleCancelOrder = async (orderId) => {
  if (!window.confirm('Batalkan order ini?')) return
  setActionLoading(`cancel-${orderId}`)
  try {
   const { error: updateErr } = await supabase.from('checkout_orders').update({ status: 'cancelled' }).eq('id', orderId)
   if (updateErr) throw updateErr
   setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
   } catch (err) { setError(explainError(err, 'Order belum bisa dibatalkan. Cek koneksi Supabase dan izin akun admin.')) }

  finally { setActionLoading(null) }
 }

 const handleDeleteOrder = async (orderId) => {
  if (!window.confirm('HAPUS order ini secara permanen? Data tidak bisa dikembalikan.')) return
  setActionLoading(`delete-${orderId}`)
  try {
   const { error: delItemsErr } = await supabase.from('checkout_order_items').delete().eq('order_id', orderId)
   if (delItemsErr) throw delItemsErr
   const { error: delOrderErr } = await supabase.from('checkout_orders').delete().eq('id', orderId)
   if (delOrderErr) throw delOrderErr
   setOrders(prev => prev.filter(o => o.id !== orderId))
   } catch (err) { setError(explainError(err, 'Order belum bisa dihapus. Cek item pesanan terkait dan izin akun admin.')) }

  finally { setActionLoading(null) }
 }

 const formatDate = (iso) => new Date(iso).toLocaleDateString('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
 })

 const totalRevenue = filtered
  .filter(o => ['paid', 'processing', 'shipped', 'completed'].includes(o.status))
  .reduce((sum, o) => sum + (o.total_amount || 0), 0)

 const handlePresetClick = (value) => {
  setDatePreset(value)
  setUseCustomDate(false)
  setCustomDateFrom('')
  setCustomDateTo('')
 }

 return (
  <div className="space-y-4">
   {/* Search + Filter bar */}
   <div className="flex flex-col sm:flex-row gap-3">
    <div className="relative flex-1 max-w-sm">
     <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
     <input
      type="text" placeholder="Cari order, nama, email..." value={search} onChange={e => setSearch(e.target.value)}
      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
     />
    </div>
    <div className="flex items-center gap-1.5 flex-wrap">
     {STATUS_FILTER_OPTIONS.map(s => (
      <button key={s} onClick={() => setStatusFilter(s)}
       className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition-all ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
      >
       {s === 'all' ? 'Semua' : STATUS_LABEL[s]}
      </button>
     ))}
    </div>
    <button onClick={fetchOrders} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors border border-gray-200 self-start" title="Refresh">
     <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
    </button>
   </div>

   {/* Date filter */}
   <div className="flex items-center gap-3 flex-wrap">
    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Periode</span>
    <div className="flex gap-1">
     {DATE_PRESETS.map(p => (
      <button key={p.value} onClick={() => handlePresetClick(p.value)}
       className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${datePreset === p.value && !useCustomDate ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
      >
       {p.label}
      </button>
     ))}
    </div>
    <div className="flex items-center gap-1.5 ml-2">
     <input type="date" value={customDateFrom} onChange={e => { setCustomDateFrom(e.target.value); setUseCustomDate(true); setDatePreset('all') }}
      className="text-[11px] border border-gray-200 rounded-md px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300" />
     <span className="text-gray-300 text-xs">—</span>
     <input type="date" value={customDateTo} onChange={e => { setCustomDateTo(e.target.value); setUseCustomDate(true); setDatePreset('all') }}
      className="text-[11px] border border-gray-200 rounded-md px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300" />
    </div>
    {useCustomDate && (
     <button onClick={() => { setUseCustomDate(false); setCustomDateFrom(''); setCustomDateTo(''); setDatePreset('all') }}
      className="text-[11px] text-gray-400 hover:text-gray-600 underline">
      Reset
     </button>
    )}
   </div>

   {/* Stats */}
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div className="bg-white rounded-xl border border-gray-200 p-4">
     <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
     <p className="text-xs text-gray-400 mt-0.5">Total Order</p>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-4">
     <p className="text-2xl font-bold text-amber-500">{filtered.filter(o => o.status === 'pending_payment').length}</p>
     <p className="text-xs text-gray-400 mt-0.5">Menunggu Bayar</p>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-4">
     <p className="text-2xl font-bold text-blue-500">{filtered.filter(o => o.status === 'processing' || o.status === 'paid').length}</p>
     <p className="text-xs text-gray-400 mt-0.5">Perlu Dikirim</p>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-4">
     <p className="text-2xl font-bold text-emerald-500">{formatPrice(totalRevenue)}</p>
     <p className="text-xs text-gray-400 mt-0.5">Total Pendapatan</p>
    </div>
   </div>

   {error && <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3"><p className="text-sm text-red-600">{error}</p></div>}

   {/* Table */}
   {loading ? (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
     <div className="animate-spin w-7 h-7 border-2 border-gray-200 border-t-gray-700 rounded-full mx-auto" />
     <p className="text-sm text-gray-400 mt-3">Memuat pesanan...</p>
    </div>
   ) : filtered.length === 0 ? (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
     <p className="text-sm text-gray-400">Tidak ada pesanan ditemukan.</p>
    </div>
   ) : (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
     <div className="overflow-x-auto">
      <table className="w-full">
       <thead>
        <tr className="border-b border-gray-100">
         <th className="w-10 py-3 px-2"></th>
         <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Order</th>
         <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Pelanggan</th>
         <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total</th>
         <th className="text-center py-3 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
         <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Waktu</th>
         <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Aksi</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-gray-50">
        {filtered.map(order => (
         <Fragment key={order.id}>
          <tr className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => toggleExpand(order.id)}>
           <td className="py-3 px-2 text-center">
            <HiOutlineChevronRight className={`w-4 h-4 text-gray-300 inline transition-transform ${expandedOrder === order.id ? 'rotate-90' : ''}`} />
           </td>
           <td className="py-3 px-4">
            <p className="font-mono text-xs font-semibold text-gray-800">{order.order_number || `#${order.id.slice(0, 8)}`}</p>
            {order.biteship_waybill_id && <p className="text-[10px] text-blue-500 mt-0.5 font-mono">Resi: {order.biteship_waybill_id}</p>}
           </td>
           <td className="py-3 px-4 hidden md:table-cell">
            <p className="text-sm text-gray-700 font-medium">{order.customer_name || '-'}</p>
            <p className="text-[11px] text-gray-400">{order.customer_phone || order.customer_email || ''}</p>
           </td>
           <td className="py-3 px-4 text-right">
            <p className="text-sm font-semibold text-gray-900">{formatPrice(order.total_amount)}</p>
           </td>
           <td className="py-3 px-4 text-center">
            <StatusBadge status={order.status} />
           </td>
           <td className="py-3 px-4 hidden lg:table-cell">
            <p className="text-[11px] text-gray-400">{formatDate(order.created_at)}</p>
           </td>
           <td className="py-3 px-4">
            <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
             {/* Buat Shipment — order paid tanpa shipment */}
             {!order.biteship_order_id && ['paid', 'pending_payment'].includes(order.status) && (
              <ActionButton icon={FaBox} label="Buat Shipment — klik untuk membuat pengiriman ke kurir"
               onClick={() => handleCreateShipment(order.id)} loading={actionLoading === `shipment-${order.id}`} color="indigo" />
             )}
             {/* Cetak Label */}
             {order.biteship_order_id && ['processing', 'shipped'].includes(order.status) && (
              <ActionButton icon={FaFileDownload} label="Cetak Label Pengiriman"
               onClick={() => handlePrintLabel(order.id)} loading={actionLoading === `label-${order.id}`} color="blue" />
             )}
             {/* Atur Pickup */}
             {order.biteship_order_id && order.status === 'processing' && !['picking_up', 'picked', 'in_transit', 'dropping_off', 'delivered'].includes(order.shipment_status) && (
              <ActionButton icon={FaTruck} label="Jadwalkan Kurir Jemput Paket"
               onClick={() => handleSchedulePickup(order.id)} loading={actionLoading === `pickup-${order.id}`} color="orange" />
             )}
             {/* WhatsApp */}
             {order.customer_phone && (
              <a href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${order.customer_name || ''}, update pesanan ${order.order_number || ''} Puthic Sari:`)}`}
               target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md transition-colors" title="Hubungi WhatsApp">
               <FaWhatsapp className="text-sm" />
               <span>WA</span>
              </a>
             )}
             {/* Batalkan — hanya untuk order aktif */}
             {['pending_payment', 'paid', 'processing'].includes(order.status) && (
              <ActionButton icon={FaBan} label="Batalkan Order"
               onClick={() => handleCancelOrder(order.id)} loading={actionLoading === `cancel-${order.id}`} color="red" />
             )}
             {/* Hapus permanen — semua order */}
             <ActionButton icon={FaTrashAlt} label="Hapus Permanen"
              onClick={() => handleDeleteOrder(order.id)} loading={actionLoading === `delete-${order.id}`} color="red" />
            </div>
           </td>
          </tr>
          {expandedOrder === order.id && (
           <tr><td colSpan={7} className="p-0"><OrderDetail order={order} items={orderItems[order.id]} /></td></tr>
          )}
         </Fragment>
        ))}
       </tbody>
      </table>
     </div>
     <div className="px-4 py-2.5 border-t border-gray-100">
      <p className="text-[11px] text-gray-400">{filtered.length} dari {orders.length} pesanan</p>
     </div>
    </div>
   )}
  </div>
 )
}
