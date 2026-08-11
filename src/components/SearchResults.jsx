import { useState, useMemo, useEffect, useRef } from 'react'
import { HiSearch, HiX, HiArrowLeft } from 'react-icons/hi'
import ProductCard from './ProductCard'

export default function SearchResults({ products, onViewDetail, onSearch, onHome, initialQuery = '' }) {
 const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    const lowerQuery = query.toLowerCase()
    const matches = products
      .filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category?.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 6)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        image: p.thumbnail || p.image,
        price: p.price,
      }))

    setSuggestions(matches)
    setSelectedSuggestion(-1)
  }, [query, products])

  const results = useMemo(() => {
    if (query.length < 2) return []
    const lowerQuery = query.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.category?.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery)
    )
  }, [query, products])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestion(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestion(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        setQuery(suggestions[selectedSuggestion].name)
        setShowSuggestions(false)
        onSearch(suggestions[selectedSuggestion].name)
      } else {
        setShowSuggestions(false)
        onSearch(query)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => onHome?.()}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-eyebrow text-text-muted hover:text-heading transition-colors mb-3"
          >
            <HiArrowLeft className="text-base" />
            Kembali ke Beranda
          </button>
          <div className="relative" ref={suggestionsRef}>
            <div className="flex items-center gap-3 border border-gray-200 px-4 py-3 focus-within:border-gray-900 transition-colors">
              <HiSearch className="text-gray-400 text-lg flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="Cari produk, kategori, atau kata kunci..."
                className="flex-1 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); inputRef.current?.focus() }}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <HiX className="text-lg" />
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg z-50 max-h-80 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => {
                      setQuery(suggestion.name)
                      setShowSuggestions(false)
                      onSearch(suggestion.name)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      index === selectedSuggestion ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <img
                      src={suggestion.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-10 h-10 object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{suggestion.name}</p>
                      <p className="text-xs text-gray-500">{suggestion.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      {formatPrice(suggestion.price)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {query.length < 2 ? (
          <div className="text-center py-16">
            <HiSearch className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-sm">Ketik minimal 2 karakter untuk mulai mencari.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm">Tidak ada hasil untuk "{query}"</p>
            <p className="text-gray-400 text-xs mt-2">Coba kata kunci lain atau periksa ejaan.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {results.length} hasil untuk "<span className="font-medium text-gray-900">{query}</span>"
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
              {results.map((product, index) => (
                    <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetail={onViewDetail}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
