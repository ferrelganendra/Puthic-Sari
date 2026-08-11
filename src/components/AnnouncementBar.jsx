import { useState } from 'react'
import { HiX } from 'react-icons/hi'

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div className="bg-heading text-white relative z-50">
      <div className="mx-auto flex items-center justify-center gap-3 px-4 py-2.5 text-center">
        <p className="text-xs sm:text-sm font-medium tracking-wide">
          🌷 Gratis ongkir untuk pembelian di atas Rp300.000 · Pesan sekarang!
        </p>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white"
          aria-label="Tutup banner"
        >
          <HiX className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
