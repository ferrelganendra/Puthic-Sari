import { HiSearch } from 'react-icons/hi'

export default function NotFound({ onHome }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-border-soft">404</p>
        <h1 className="mt-3 text-xl font-semibold text-heading">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-text-muted">
          Sepertinya halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <button
          onClick={() => onHome?.()}
          className="mt-6 inline-flex items-center gap-2 bg-heading text-white px-6 py-3 text-sm font-medium uppercase tracking-button hover:bg-gray-800 transition-colors"
        >
          <HiSearch className="text-base" />
          Kembali ke Beranda
        </button>
      </div>
    </div>
  )
}
