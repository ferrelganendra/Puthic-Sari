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

  const response = await fetch(url.toString(), { headers: NOMINATIM_HEADERS })
  if (!response.ok) throw new Error('Gagal mencari alamat.')
  return response.json()
}

const NOMINATIM_HEADERS = {
  'Accept': 'application/json',
}

const reverseGeocode = async (lat, lon) => {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('zoom', '18')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lon))

  const response = await fetch(url.toString(), { headers: NOMINATIM_HEADERS })
  if (!response.ok) throw new Error('Gagal reverse geocode.')
  return response.json()
}

const searchNearbyStreets = async (lat, lon) => {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '5')
  url.searchParams.set('q', `${lat}, ${lon}`)

  const response = await fetch(url.toString(), { headers: NOMINATIM_HEADERS })
  if (!response.ok) return []
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
  const [geoLoading, setGeoLoading] = useState(false)
  const [selectedName, setSelectedName] = useState('')
  const [failed, setFailed] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [geoCoords, setGeoCoords] = useState(null) // { latitude, longitude, city, postalCode }

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
    // Merge GPS coordinates if available (user typed address manually)
    const finalLat = latitude || geoCoords?.latitude || 0
    const finalLon = longitude || geoCoords?.longitude || 0
    const finalCity = city || geoCoords?.city || ''
    const finalPostal = postalCode || geoCoords?.postalCode || ''

    const area = needsDetail ? null : await searchBiteshipArea(address)
    setSelectedName(address)
    setQuery(address)
    setPlaces([])
    setFailed(false)
    setGeoError('')
    onSelect({
      address,
      city: area?.city || finalCity,
      postalCode: area?.postalCode || finalPostal,
      areaId: area?.id || '',
      areaName: area?.name || '',
      latitude: finalLat,
      longitude: finalLon,
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
    setGeoError('')
    setGeoCoords(null)
    onClear?.()
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Browser tidak mendukung geolocation.')
      return
    }

    setGeoLoading(true)
    setGeoError('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const place = await reverseGeocode(latitude, longitude)

          if (!place?.display_name) {
            console.error('Reverse geocode returned empty:', place)
            setGeoError('Gagal mendapatkan alamat dari lokasi.')
            setGeoLoading(false)
            return
          }

          // Save coordinates only — user types street address manually
          setGeoCoords({ latitude, longitude, city: getCity(place), postalCode: getPostalCode(place) })
          setGeoError('')
        } catch (err) {
          console.error('Geolocation error:', err)
          setGeoError('Gagal memproses lokasi. Coba lagi.')
        } finally {
          setGeoLoading(false)
        }
      },
      (err) => {
        setGeoLoading(false)
        if (err.code === 1) {
          setGeoError('Izin lokasi ditolak. Aktifkan izin lokasi di browser.')
        } else if (err.code === 2) {
          setGeoError('Lokasi tidak tersedia. Coba lagi.')
        } else if (err.code === 3) {
          setGeoError('Timeout mendapatkan lokasi. Coba lagi.')
        } else {
          setGeoError('Gagal mendapatkan lokasi.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  return (
    <div className="relative">
      <label className="block text-xs text-body mb-1.5 uppercase tracking-button">Cari Alamat Pengiriman</label>

      {/* Gunakan Lokasi Saya button */}
      <button
        type="button"
        onClick={useMyLocation}
        disabled={geoLoading}
        className="w-full flex items-center justify-center gap-2 mb-3 px-4 py-2.5 rounded-xl border border-dashed border-accent/40 text-sm font-medium text-accent hover:bg-accent/5 transition-colors disabled:opacity-50"
      >
        {geoLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span>Mendapatkan lokasi...</span>
          </>
        ) : (
          <>
            <HiOutlineLocationMarker className="text-base" />
            <span>Gunakan Lokasi Saya</span>
          </>
        )}
      </button>

      {geoError && (
        <p className="text-[11px] text-red-500 mb-2">{geoError}</p>
      )}

      {geoCoords && !selectedName && (
        <div className="flex items-center gap-2 mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          <span className="text-sm">📍</span>
          <div>
            <p className="font-medium">Koordinat tersimpan!</p>
            {geoCoords.city && <p className="text-green-600">{geoCoords.city} {geoCoords.postalCode ? `· ${geoCoords.postalCode}` : ''}</p>}
          </div>
          <button type="button" onClick={() => { setGeoCoords(null); clearSearch() }} className="ml-auto text-green-500 hover:text-green-700 underline text-[11px]">Hapus</button>
        </div>
      )}

      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-base pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedName(''); onClear?.() }}
          placeholder="Ketik nama jalan, nomor rumah, RT/RW..."
          className="w-full border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-heading focus:border-accent focus:outline-none transition-colors bg-white placeholder:text-text-muted"
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-heading transition-colors p-0.5">
            <HiX className="text-sm" />
          </button>
        )}
      </div>
      <p className="text-[10px] text-text-muted mt-1.5">
        {geoCoords
          ? '✅ Koordinat GPS sudah tersimpan. Sekarang ketik alamat lengkap (nama jalan, nomor rumah) di atas.'
          : 'Klik "Gunakan Lokasi Saya" dulu untuk menyimpan koordinat, lalu ketik alamat lengkap.'}
      </p>

      {(loading || places.length > 0) && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-white shadow-soft max-h-48 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-xs text-text-muted">Mencari alamat...</div>
          ) : places.map((place) => (
            <button
              key={place.place_id}
              type="button"
              onClick={() => selectPlace(place)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-footer-bg"
            >
              <HiOutlineLocationMarker className="mt-0.5 flex-shrink-0 text-accent" />
              <span className="block text-heading">{place.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {failed && query.trim().length >= 5 && (
        <div className="mt-2 space-y-2">
          <p className="text-[11px] text-text-muted">Alamat tidak ditemukan di peta. Ketik alamat lengkap lalu klik tombol di bawah.</p>
          <button type="button" onClick={selectTypedAddress} className="w-full rounded-xl border-2 border-accent/40 px-4 py-3 text-left text-sm font-semibold text-heading hover:bg-accent/5 transition-colors">
            ✅ Gunakan: {query.trim()}
          </button>
        </div>
      )}
    </div>
  )
}
