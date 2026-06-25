import { useCart } from '../context/CartContext'
import { HiCheckCircle } from 'react-icons/hi'

export default function Toast() {
 const { toast } = useCart()

 if (!toast) return null

 return (
  <div
   role="status"
   aria-live="polite"
   aria-atomic="true"
   className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fadeInUp"
  >
   <div className="flex items-center gap-2 bg-gray-900 px-6 py-3 text-white shadow-xl rounded-lg">
    <HiCheckCircle className="text-green-400 text-xl flex-shrink-0" />
    <span className="text-sm font-medium">{toast}</span>
   </div>
  </div>
 )
}
