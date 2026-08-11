import { useState, useEffect } from 'react'
import { HiOutlineTag, HiOutlineSearch } from 'react-icons/hi'
import { supabase } from '../../lib/supabase'

const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p)

export default function DiscountsPage() {
 const [products, setProducts] = useState([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState('')
 const [saving, setSaving] = useState(null)

 useEffect(() => {
  fetchProducts()
 }, [])

 const fetchProducts = async () => {
  setLoading(true)
  const { data } = await supabase
   .from('products')
   .select('id, name, price, discount_percent, images, is_active')
   .order('name')
  setProducts(data || [])
  setLoading(false)
 }

 const updateDiscount = async (id, discount_percent) => {
  setSaving(id)
  await supabase.from('products').update({ discount_percent: parseInt(discount_percent) || 0 }).eq('id', id)
  setSaving(null)
 }

 const filtered = products.filter(p =>
  p.name.toLowerCase().includes(search.toLowerCase())
 )

 const discountedCount = products.filter(p => p.discount_percent > 0).length

 return (
  <div>

   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
    <p className="text-sm text-gray-500">Atur diskon persentase untuk setiap produk.</p>
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
   </div>


   <div className="grid grid-cols-2 gap-3 mb-6">
    <div className="bg-white rounded-lg border border-gray-200 p-4">
     <p className="text-2xl font-bold text-orange-500">{discountedCount}</p>
     <p className="text-xs text-gray-500 mt-1">Produk dengan diskon</p>
    </div>
    <div className="bg-white rounded-lg border border-gray-200 p-4">
     <p className="text-2xl font-bold text-gray-900">{products.length - discountedCount}</p>
     <p className="text-xs text-gray-500 mt-1">Tanpa diskon</p>
    </div>
   </div>


   {loading ? (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
     <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto"></div>
     <p className="text-sm text-gray-400 mt-3">Memuat...</p>
    </div>
   ) : (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
     <div className="overflow-x-auto">
      <table className="w-full">
       <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
         <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produk</th>
         <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga Asli</th>
         <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Diskon (%)</th>
         <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga Final</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-gray-100">
        {filtered.map(p => (
         <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
          <td className="py-3 px-4">
           <div className="flex items-center gap-3">
            {p.images?.[0] ? (
             <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
            ) : (
             <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <HiOutlineTag className="text-gray-400" />
             </div>
            )}
            <span className="font-medium text-gray-900 text-sm truncate">{p.name}</span>
           </div>
          </td>
          <td className="py-3 px-4 text-sm text-gray-600">{formatPrice(p.price)}</td>
          <td className="py-3 px-4">
           <div className="flex items-center justify-center">
            <input
             type="number"
             min="0"
             max="100"
             value={p.discount_percent || 0}
             onChange={e => {
              const val = e.target.value
              setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, discount_percent: val } : prod))
             }}
             onBlur={e => updateDiscount(p.id, e.target.value)}
             className={`w-16 text-center px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all ${
              saving === p.id ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
             }`}
            />
            <span className="text-sm text-gray-400 ml-1">%</span>
           </div>
          </td>
          <td className="py-3 px-4">
           <span className={`text-sm font-semibold ${p.discount_percent > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
            {formatPrice(p.price * (1 - (p.discount_percent || 0) / 100))}
           </span>
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
     <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
      <p className="text-xs text-gray-400">Diskon otomatis tersimpan saat kamu pindah field.</p>
     </div>
    </div>
   )}
  </div>
 )
}
