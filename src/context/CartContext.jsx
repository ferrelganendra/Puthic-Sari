import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getFinalPrice } from '../lib/pricing'

const CartContext = createContext()

export function CartProvider({ children }) {
 const [cart, setCart] = useState(() => {
  try {
   const saved = localStorage.getItem('puthicsari-cart')
   return saved ? JSON.parse(saved) : []
  } catch {
   return []
  }
 })
 const [isCartOpen, setIsCartOpen] = useState(false)
 const [toast, setToast] = useState(null)

 // Sinkronisasi cart dengan status sold-out terbaru dari produk yang di-pass
 const syncCartWithProducts = useCallback((latestProducts) => {
  if (!latestProducts || latestProducts.length === 0) return
  setCart(prev => {
   const updated = prev.map(item => {
    const live = latestProducts.find(p => p.id === item.id)
    if (!live) return item
    return { ...item, is_sold_out: live.is_sold_out ?? false, price: live.price, discount_percent: live.discount_percent }
   })
   // Bandingkan supaya tidak re-render jika tidak ada perubahan
   const changed = updated.some((item, i) =>
    item.is_sold_out !== prev[i].is_sold_out ||
    item.price !== prev[i].price ||
    item.discount_percent !== prev[i].discount_percent
   )
   return changed ? updated : prev
  })
 }, [])

 useEffect(() => {
  localStorage.setItem('puthicsari-cart', JSON.stringify(cart))
 }, [cart])

 const showToast = (message) => {
  setToast(message)
  setTimeout(() => setToast(null), 2500)
 }

 const addToCart = (product, quantity = 1) => {
  if (product.is_sold_out) {
   showToast(`${product.name} sedang sold out.`)
   return false
  }

  setCart(prev => {
   const existing = prev.find(item => item.id === product.id)
   if (existing) {
    return prev.map(item =>
     item.id === product.id
      ? { ...item, quantity: item.quantity + quantity }
      : item
    )
   }
   return [...prev, { ...product, quantity }]
  })
  showToast(`${product.name} ditambahkan ke keranjang!`)
  return true
 }

 const removeFromCart = (productId) => {
  setCart(prev => prev.filter(item => item.id !== productId))
 }

 const updateQuantity = (productId, quantity) => {
  if (quantity <= 0) {
   removeFromCart(productId)
   return
  }
  setCart(prev =>
   prev.map(item =>
    item.id === productId ? { ...item, quantity } : item
   )
  )
 }

 const clearCart = () => setCart([])

 const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
 const totalPrice = cart.reduce((sum, item) => sum + getFinalPrice(item) * item.quantity, 0)

 return (
  <CartContext.Provider value={{
   cart,
   isCartOpen,
   setIsCartOpen,
   addToCart,
   removeFromCart,
   updateQuantity,
   clearCart,
   syncCartWithProducts,
   totalItems,
   totalPrice,
   toast,
  }}>
   {children}
  </CartContext.Provider>
 )
}

export function useCart() {
 const context = useContext(CartContext)
 if (!context) {
  throw new Error('useCart must be used within a CartProvider')
 }
 return context
}
