import { useState, useRef, useEffect, useCallback } from 'react'
import { HiOutlineSearch, HiOutlineLocationMarker, HiX } from 'react-icons/hi'

/**
 * AddressSearch — Google Places Autocomplete address search.
 * - Real-time suggestions as user types
 * - Auto-fills: address, city, postal code
 * - User can override any field after selection
 *
 * Requires VITE_GOOGLE_MAPS_API_KEY in .env
 * If no key: falls back to a simple manual input.
 */

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export default function AddressSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [ready, setReady] = useState(false)
  const [noKey, setNoKey] = useState(false)
  const inputRef = useRef(null)
  const acRef = useRef(null)

  // Load Google Maps JS API
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) { setNoKey(true); return }
    if (window.google?.maps?.places) { initAutocomplete(); return }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&language=id&region=ID`
    script.async = true
    script.onload = () => { initAutocomplete() }
    script.onerror = () => { setNoKey(true) }
    document.head.appendChild(script)
  }, [])

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: ['id'] },
      fields: ['address_components', 'formatted_address', 'geometry'],
    })
    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place?.address_components) return

      const comps = place.address_components
      const get = (type) => comps.find(c => c.types.includes(type))?.long_name || ''
      const getShort = (type) => comps.find(c => c.types.includes(type))?.short_name || ''

      // Build street line
      const streetNum = get('street_number')
      const street = get('route')
      const streetLine = streetNum ? `${street} ${streetNum}` : street

      // Sub-district / neighbourhood
      const sub = get('sublocality_level_1') || get('sublocality') || get('neighborhood') || get('administrative_area_level_3') || ''

      // City
      const city = get('locality') || get('administrative_area_level_2') || ''

      // Province
      const province = get('administrative_area_level_1') || ''

      // Postal code
      const postal = get('postal_code') || ''

      const address = [streetLine, sub, city, province].filter(Boolean).join(', ')
      setQuery(address)

      onSelect({
        address: place.formatted_address || address,
        city,
        postalCode: postal,
      })
    })
    acRef.current = ac
    setReady(true)
  }, [onSelect])

  const clearSearch = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  // Fallback: simple input when no Google API key
  if (noKey) {
    return (
      <div>
        <label className="block text-xs text-body mb-1.5 uppercase tracking-button">Alamat Lengkap</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => { if (query.trim()) onSelect({ address: query.trim(), city: '', postalCode: '' }) }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (query.trim()) onSelect({ address: query.trim(), city: '', postalCode: '' }) } }}
          placeholder="Jalan, nomor, RT/RW, kelurahan, kecamatan"
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-heading focus:border-accent focus:outline-none transition-colors bg-white placeholder:text-text-muted"
        />
        <p className="text-[10px] text-text-muted mt-1.5">Atau isi kota & kode pos di kolom di bawah.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <label className="block text-xs text-body mb-1.5 uppercase tracking-button">Cari Alamat</label>
      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-base pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ketik nama jalan atau alamat lengkap..."
          className="w-full border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-heading focus:border-accent focus:outline-none transition-colors bg-white placeholder:text-text-muted"
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-heading transition-colors p-0.5">
            <HiX className="text-sm" />
          </button>
        )}
      </div>
      {ready && (
        <p className="text-[10px] text-text-muted mt-1.5">Pilih dari suggestion untuk auto-fill alamat, kota, & kode pos.</p>
      )}
    </div>
  )
}
