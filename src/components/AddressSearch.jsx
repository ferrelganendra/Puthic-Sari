import { useEffect, useState } from 'react'
import { HiOutlineLocationMarker, HiOutlineSearch, HiX } from 'react-icons/hi'
import { supabase } from '../lib/supabase'

export default function AddressSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedName, setSelectedName] = useState('')

  useEffect(() => {
    const input = query.trim()
    if (input.length < 3 || input === selectedName) {
      setAreas([])
      return
    }

    const timeout = setTimeout(async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.functions.invoke('biteship-areas', { body: { input } })
        if (error || !data?.success) throw error || new Error(data?.error || 'Gagal mencari area.')
        setAreas(data.areas || [])
      } catch {
        setAreas([])
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [query, selectedName])

  const selectArea = (area) => {
    setSelectedName(area.name)
    setQuery(area.name)
    setAreas([])
    onSelect({
      address: area.name,
      city: area.city,
      postalCode: area.postalCode,
      areaId: area.id,
      areaName: area.name,
    })
  }

  const clearSearch = () => {
    setQuery('')
    setSelectedName('')
    setAreas([])
  }

  return (
    <div className="relative">
      <label className="block text-xs text-body mb-1.5 uppercase tracking-button">Cari Kecamatan / Area Biteship</label>
      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-base pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedName('') }}
          placeholder="Contoh: Depok Sleman, Pesanggrahan..."
          className="w-full border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-heading focus:border-accent focus:outline-none transition-colors bg-white placeholder:text-text-muted"
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-heading transition-colors p-0.5">
            <HiX className="text-sm" />
          </button>
        )}
      </div>
      <p className="text-[10px] text-text-muted mt-1.5">Pilih area dari database Biteship untuk ongkir lebih akurat.</p>

      {(loading || areas.length > 0) && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-white shadow-soft">
          {loading ? (
            <div className="px-3 py-2 text-xs text-text-muted">Mencari area...</div>
          ) : areas.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => selectArea(area)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-footer-bg"
            >
              <HiOutlineLocationMarker className="mt-0.5 flex-shrink-0 text-accent" />
              <span>
                <span className="block text-heading">{area.name}</span>
                <span className="block text-xs text-text-muted">Kode pos {area.postalCode || '-'}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
