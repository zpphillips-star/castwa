'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Species } from '@/types'

interface Props {
  allSpecies: Species[]
}

export default function SearchBar({ allSpecies }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Species[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    const q = query.toLowerCase()
    const matches = allSpecies
      .filter(
        (s) =>
          s.common_name.toLowerCase().includes(q) ||
          (s.scientific_name?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 8)
    setSuggestions(matches)
    setOpen(matches.length > 0)
  }, [query, allSpecies])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(species: Species) {
    router.push(`/species/${species.id}`)
    setOpen(false)
    setQuery('')
  }

  const categoryEmoji: Record<string, string> = {
    salmon: '🐟', trout: '🎣', steelhead: '🐠', bass: '🐟',
    panfish: '🐠', marine: '🦀', other: '🐟',
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <svg className="h-5 w-5 text-water-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search by fish species... (e.g. Steelhead, Rainbow Trout)"
          className="w-full rounded-xl border border-water-600/40 bg-water-900/60 pl-12 pr-4 py-4 text-white placeholder:text-water-400/60 focus:border-water-400 focus:outline-none focus:ring-2 focus:ring-water-400/20 backdrop-blur-sm text-sm sm:text-base"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-water-600/40 bg-[#0c2a3e] shadow-xl z-50 overflow-hidden">
          {suggestions.map((species, i) => (
            <button
              key={species.id}
              onClick={() => handleSelect(species)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-water-800/60 transition-colors ${i > 0 ? 'border-t border-water-700/20' : ''}`}
            >
              <span className="text-lg">{categoryEmoji[species.category] ?? '🐟'}</span>
              <div>
                <p className="text-sm font-medium text-white">{species.common_name}</p>
                {species.scientific_name && (
                  <p className="text-xs text-water-400 italic">{species.scientific_name}</p>
                )}
              </div>
              <span className="ml-auto text-xs text-water-500 capitalize">{species.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
