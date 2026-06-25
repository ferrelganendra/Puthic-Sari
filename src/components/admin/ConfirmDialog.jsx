import { HiExclamationCircle } from 'react-icons/hi'

/**
 * Modal konfirmasi custom — menggantikan window.confirm() native.
 * Props:
 *   message   — teks pertanyaan
 *   onConfirm — callback jika user klik Ya
 *   onCancel  — callback jika user klik Batal
 *   open — jika false/null modal tidak ditampilkan
 *   confirmLabel — label tombol konfirmasi (default: "Ya, Hapus")
 *   isDanger  — jika true tombol konfirmasi merah (default: true)
 */
export default function ConfirmDialog({ open = true, message, onConfirm, onCancel, confirmLabel = 'Ya, Hapus', isDanger = true }) {
 if (!open) return null

 return (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
   <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
    <div className="flex items-start gap-3 mb-5">
     <HiExclamationCircle className="text-red-400 text-2xl flex-shrink-0 mt-0.5" />
     <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
    </div>
    <div className="flex gap-3">
     <button
      onClick={onCancel}
      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
     >
      Batal
     </button>
     <button
      onClick={onConfirm}
      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
       isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'
      }`}
     >
      {confirmLabel}
     </button>
    </div>
   </div>
  </div>
 )
}
