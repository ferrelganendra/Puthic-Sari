import { useState } from 'react'
import { HiX, HiMinus, HiPlus, HiTrash, HiShoppingBag, HiExclamationCircle } from 'react-icons/hi'
import { useCart } from '../context/CartContext'
import { getFinalPrice, formatPrice } from '../lib/pricing'

function ConfirmModal({ message, onConfirm, onCancel }) {
 return (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
    <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-xs">
    <div className="flex items-start gap-3">
     <HiExclamationCircle className="text-red-400 text-2xl flex-shrink-0 mt-0.5" />
     <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
    </div>
    <div className="flex gap-3 mt-5">
     <button
      onClick={onCancel}
      className="flex-1 px-4 py-2 border border-border rounded-xl text-xs uppercase tracking-button font-medium text-body hover:text-heading transition-colors"
     >
      Batal
     </button>
     <button
      onClick={onConfirm}
      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-xs uppercase tracking-button font-medium hover:bg-red-700 transition-colors"
     >
      Ya, Hapus
     </button>
    </div>
   </div>
  </div>
 )
}

export default function Cart({ onCheckout }) {
 const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart()
 const [confirmClear, setConfirmClear] = useState(false)

 if (!isCartOpen) return null

 const soldOutItems = cart.filter(item => item.is_sold_out)

 return (
  <>
   {/* Overlay */}
   <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsCartOpen(false)} />

   {/* Cart Panel */}
   <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
     <div className="flex items-center gap-3">
      <HiShoppingBag className="text-2xl text-gray-900" />
      <h2 className="font-bold text-gray-800">Keranjang</h2>
      <span className="text-sm text-gray-400">({cart.length} item)</span>
     </div>
     <button
      onClick={() => setIsCartOpen(false)}
      aria-label="Tutup keranjang"
      className="flex h-10 w-10 items-center justify-center border border-transparent transition-colors hover:border-gray-200 hover:bg-gray-50"
     >
      <HiX className="text-xl" />
     </button>
    </div>

    {/* Sold-out warning */}
    {soldOutItems.length > 0 && (
      <div className="mx-6 mt-4 flex items-start gap-2 bg-red-50 border border-red-100 p-3 text-xs text-red-700">
      <HiExclamationCircle className="text-base flex-shrink-0 mt-0.5" />
      <span>
       <strong>{soldOutItems.map(i => i.name).join(', ')}</strong> sudah sold out dan tidak bisa di-checkout.
      </span>
     </div>
    )}

    {/* Cart Items */}
    <div className="flex-1 overflow-y-auto p-6">
     {cart.length === 0 ? (
      <div className="text-center py-16">
       <div className="mx-auto flex h-14 w-14 items-center justify-center border border-gray-200 text-gray-500">
        <HiShoppingBag className="text-2xl" />
       </div>
       <h3 className="text-lg font-semibold text-gray-500 mt-4">Keranjang kosong</h3>
       <p className="text-gray-400 mt-2">Tambahkan buket pilihanmu dari koleksi kami.</p>
       <button
        onClick={() => setIsCartOpen(false)}
        className="btn-primary mt-6 inline-block"
       >
        Lihat Koleksi
       </button>
      </div>
     ) : (
      <div className="space-y-4">
       {cart.map(item => (
        <div key={item.id} className={`flex gap-4 p-3 transition-colors ${item.is_sold_out ? 'bg-red-50' : 'bg-gray-50 hover:bg-gray-100'}`}>
         <div className="relative w-20 h-20 flex-shrink-0">
           <img
            src={item.image}
            alt={item.name}
            width={80}
            height={80}
            loading="lazy"
            decoding="async"
            className="w-20 h-20 object-cover"
           />
          {item.is_sold_out && (
           <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-[10px] font-medium text-red-500">Sold Out</span>
           </div>
          )}
         </div>
         <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-800 text-sm line-clamp-1">{item.name}</h4>
          <p className="text-gray-900 font-bold text-sm mt-1">{formatPrice(getFinalPrice(item))}</p>
          {!item.is_sold_out && (
           <div className="flex items-center gap-2 mt-2">
            <button
             onClick={() => updateQuantity(item.id, item.quantity - 1)}
             aria-label="Kurangi jumlah"
              className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
             >
              <HiMinus className="text-xs" />
             </button>
             <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
             <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              aria-label="Tambah jumlah"
              className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
            >
             <HiPlus className="text-xs" />
            </button>
           </div>
          )}
         </div>
         <div className="flex flex-col items-end justify-between">
          <button
           onClick={() => removeFromCart(item.id)}
           aria-label={`Hapus ${item.name} dari keranjang`}
           className="text-gray-400 hover:text-red-500 transition-colors"
          >
           <HiTrash className="text-lg" />
          </button>
          {!item.is_sold_out && (
           <span className="font-bold text-sm text-gray-700">
            {formatPrice(getFinalPrice(item) * item.quantity)}
           </span>
          )}
         </div>
        </div>
       ))}
      </div>
     )}
    </div>

    {/* Footer */}
    {cart.length > 0 && (
     <div className="flex-shrink-0 p-6 bg-white border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
       <span className="text-gray-600">Total</span>
       <span className="text-2xl font-bold text-gray-900">{formatPrice(totalPrice)}</span>
      </div>
      {/* Account upsell hint */}
      <p className="text-xs text-gray-400 text-center mb-3">
       Checkout tanpa akun? <button onClick={() => { setIsCartOpen(false); window.dispatchEvent(new CustomEvent('open-auth')) }} className="underline hover:text-gray-600">Buat akun</button> untuk tracking pesanan.
      </p>
      <button
       onClick={() => { setIsCartOpen(false); onCheckout?.() }}
       disabled={soldOutItems.length === cart.length}
       className="w-full btn-primary text-center text-lg py-4 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
       Checkout Sekarang
      </button>
      <button
       onClick={() => setConfirmClear(true)}
       className="w-full text-center text-sm text-gray-400 hover:text-red-500 mt-3 transition-colors"
      >
       Kosongkan Keranjang
      </button>
     </div>
    )}
   </div>

   {/* Confirm modal untuk kosongkan keranjang */}
   {confirmClear && (
    <ConfirmModal
     message="Yakin ingin mengosongkan semua item dari keranjang?"
     onConfirm={() => { clearCart(); setConfirmClear(false) }}
     onCancel={() => setConfirmClear(false)}
    />
   )}
  </>
 )
}
