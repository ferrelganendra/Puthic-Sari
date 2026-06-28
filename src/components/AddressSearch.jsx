import { useEffect, useState } from 'react'
import { HiOutlineLocationMarker, HiOutlineSearch, HiX } from 'react-icons/hi'
import { supabase } from '../lib/supabase'

const addressPart = (address, keys) => keys.map(key => address?.[key]).find(Boolean) || ''

const getPostalCode = (place) => addressPart(place.address, ['postcode'])

const getCity = (place) => addressPart(place.address, ['city', 'town', 'county', 'state_district', 'state'])

const cleanAddressQuery = (input) => input
  .replace(/\b(no\.?|nomor)\s*\d+[a-z]?\b/gi, ' ')
  .replace(/\b(rt|rw)\s*\d+\b/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const addressQueries = (input) => {
  const cleaned = cleanAddressQuery(input)
  return [...new Set([input.trim(), cleaned, cleaned.replace(/\bpurwosari\b/gi, '').replace(/\s+/g, ' ').trim()].filter(q => q.length >= 5))]
}

const fetchOsmAddresses = async (input) => {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'id')
  url.searchParams.set('limit', '5')
  url.searchParams.set('q', input)

  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Gagal mencari alamat.')
  return response.json()
}

const searchVerifiedAddresses = async (input) => {
  for (const query of addressQueries(input)) {
    const results = await fetchOsmAddresses(query)
    if (results?.length) return results
  }
  return []
}

const searchBiteshipArea = async (input) => {
  const { data, error } = await supabase.functions.invoke('biteship-areas', { body: { input } })
  if (error || !data?.success) return null
  return data.areas?.[0] || null
}

export default function AddressSearch({ onSelect, onClear }) {
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedName, setSelectedName] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const input = query.trim()
    if (input.length < 5 || input === selectedName) {
      setPlaces([])
      setFailed(false)
      return
    }

    const timeout = setTimeout(async () => {
      setLoading(true)
      setFailed(false)
      try {
        const results = await searchVerifiedAddresses(input)
        setPlaces(results || [])
        setFailed(!results?.length)
      } catch {
        setPlaces([])
        setFailed(true)
      } finally {
        setLoading(false)
      }
    }, 600)

    return () => clearTimeout(timeout)
  }, [query, selectedName])

  const selectAddress = async ({ address, city = '', postalCode = '', latitude = 0, longitude = 0, needsDetail = false }) => {
    const area = needsDetail ? null : await searchBiteshipArea(address)
    setSelectedName(address)
    setQuery(address)
    setPlaces([])
    setFailed(false)
    onSelect({
      address,
      city: area?.city || city,
      postalCode: area?.postalCode || postalCode,
      areaId: area?.id || '',
      areaName: area?.name || '',
      latitude,
      longitude,
      needsDetail,
    })
  }

  const selectPlace = (place) => selectAddress({
    address: place.display_name,
    city: getCity(place),
    postalCode: getPostalCode(place),
    latitude: Number(place.lat) || 0,
    longitude: Number(place.lon) || 0,
  })

  const selectTypedAddress = () => selectAddress({
    address: query.trim(),
    needsDetail: true,
  })

  const clearSearch = () => {
    setQuery('')
    setSelectedName('')
    setPlaces([])
    setFailed(false)
    onClear?.()
  }

  return (
    <div className="relative">
      <label className="block text-xs text-body mb-1.5 uppercase tracking-button">Cari Alamat Pengiriman</label>
      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-base pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedName(''); onClear?.() }}
          placeholder="Ketik alamat lengkap, lalu pilih dari hasil pencarian"
          className="w-full border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-heading focus:border-accent focus:outline-none transition-colors bg-white placeholder:text-text-muted"
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-heading transition-colors p-0.5">
            <HiX className="text-sm" />
          </button>
        )}
      </div>
      <p className="text-[10px] text-text-muted mt-1.5">Wajib pilih alamat dari hasil pencarian agar alamat terverifikasi dan ongkir bisa dihitung.</p>

      {(loading || places.length > 0 || failed) && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-white shadow-soft">
          {loading ? (
            <div className="px-3 py-2 text-xs text-text-muted">Mencari alamat...</div>
          ) : places.length > 0 ? places.map((place) => (
            <button
              key={place.place_id}
              type="button"
              onClick={() => selectPlace(place)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-footer-bg"
            >
              <HiOutlineLocationMarker className="mt-0.5 flex-shrink-0 text-accent" />
              <span className="block text-heading">{place.display_name}</span>
            </button>
          )) : (
            <div className="space-y-2 px-3 py-3 text-xs text-text-muted">
              <p>Alamat tidak ditemukan di peta. Gunakan alamat yang diketik, lalu lengkapi kode pos dan detail pengiriman.</p>
              <button type="button" onClick={selectTypedAddress} className="w-full rounded-lg border border-accent/40 px-3 py-2 text-left text-sm font-medium text-heading hover:bg-accent/5">
                Gunakan alamat ini: {query.trim()}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
