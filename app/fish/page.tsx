'use client'
import { useState } from 'react'
import BottomNav from '@/components/BottomNav'
import FishDetailSheet from '@/components/FishDetailSheet'
import { SPECIES, Species, Habitat, REGULATIONS, WATER_BODIES, isOpenOn } from '@/lib/fishing-data'
import { useStarred } from '@/hooks/useStarred'

type FilterKey = 'all' | 'river' | 'lake' | 'salt' | 'shellfish' | 'starred'

const FILTERS: { key: FilterKey; label: string; desc: string }[] = [
  { key: 'all',       label: 'All',        desc: 'All species in Washington' },
  { key: 'river',     label: 'Rivers',  desc: 'Salmon · Steelhead · Trout' },
  { key: 'lake',      label: 'Lakes',   desc: 'Bass · Panfish · Walleye' },
  { key: 'salt',      label: 'Salt',    desc: 'Rockfish · Lingcod · Halibut' },
  { key: 'shellfish', label: 'Shell',   desc: 'Crab · Clams · Shrimp' },
  { key: 'starred',   label: '⭐ Saved',   desc: 'Your starred species' },
]

// Build a map of speciesId → water body names for search
const SPECIES_WATERS: Record<string, string[]> = {}
for (const reg of REGULATIONS) {
  const water = WATER_BODIES.find(w => w.id === reg.waterBodyId)
  if (water) {
    if (!SPECIES_WATERS[reg.speciesId]) SPECIES_WATERS[reg.speciesId] = []
    if (!SPECIES_WATERS[reg.speciesId].includes(water.name)) {
      SPECIES_WATERS[reg.speciesId].push(water.name)
    }
  }
}

function isInSeasonToday(speciesId: string): boolean {
  const today = new Date()
  return REGULATIONS.filter(r => r.speciesId === speciesId).some(r => isOpenOn(r, today))
}

export default function FishPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [selectedFish, setSelectedFish] = useState<Species | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { isFishStarred, toggleFish } = useStarred()
  const today = new Date()

  // Base habitat/starred filter
  const habitatFiltered = activeFilter === 'all'
    ? SPECIES
    : activeFilter === 'starred'
    ? SPECIES.filter(s => isFishStarred(s.id))
    : SPECIES.filter(s => s.habitats.includes(activeFilter as Habitat))

  // Search filter on top
  const filtered = searchQuery.trim() === ''
    ? habitatFiltered
    : habitatFiltered.filter(fish => {
        const q = searchQuery.toLowerCase()
        if (fish.name.toLowerCase().includes(q)) return true
        if (fish.category.toLowerCase().includes(q)) return true
        const waters = SPECIES_WATERS[fish.id] ?? []
        return waters.some(w => w.toLowerCase().includes(q))
      })

  // Sort: open species first, closed species last
  const sortedFiltered = [...filtered].sort((a, b) => {
    const aOpen = isInSeasonToday(a.id)
    const bOpen = isInSeasonToday(b.id)
    if (aOpen === bOpen) return 0
    return aOpen ? -1 : 1
  })

  // const activeDesc = FILTERS.find(f => f.key === activeFilter)!.desc

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', paddingBottom: '80px' }}>
      {/* Header */}
      <header className="glass-header sticky top-0 z-30 px-4 pt-safe">
        <div className="max-w-lg mx-auto py-3">
          <h1 className="text-lg font-bold text-white">Fish</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>What do you want to catch today?</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">

        {/* Reg trust signal */}
        <p className="text-xs mb-3" style={{ color: 'var(--text-faint)' }}>
          <span className="inline-block px-2 py-0.5 rounded font-semibold"
            style={{ background: 'rgba(106,176,76,0.1)', color: '#6ab04c', border: '1px solid rgba(106,176,76,0.2)' }}>
            ✓ Regs verified July 2026
          </span>
        </p>

        {/* ── Search bar ── */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search fish, category, or water…"
            className="w-full rounded-full pl-4 pr-9 py-2.5 text-sm outline-none"
            style={{
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--border)', color: 'var(--text-faint)' }}
            >
              ×
            </button>
          )}
        </div>

        {/* Habitat filter pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-3">
          {FILTERS.map(f => {
            const active = activeFilter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className="flex-shrink-0 font-semibold transition-all active:scale-95 rounded-full"
                style={{
                  padding: '7px 16px',
                  fontSize: '13px',
                  background: active ? 'var(--accent)' : 'var(--surface)',
                  color: active ? '#fff' : 'var(--text-muted)',
                  border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  boxShadow: active ? '0 2px 10px rgba(255,120,0,0.25)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Section header above fish grid */}
        <div className="flex items-center gap-2 mb-3">
          <div style={{ width: 3, height: 18, background: 'var(--accent)', borderRadius: 2, flexShrink: 0 }} />
          <h2 className="text-sm font-black text-white">
            {activeFilter === 'starred' ? 'Saved Fish' : activeFilter === 'all' ? 'All Species' : activeFilter === 'river' ? 'River Fish' : activeFilter === 'lake' ? 'Lake Fish' : activeFilter === 'salt' ? 'Saltwater Fish' : 'Shellfish'}
          </h2>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
            {sortedFiltered.length}
          </span>
        </div>

        {/* Fish grid */}
        <div className="grid grid-cols-3 gap-4">
          {sortedFiltered.map(fish => {
            const inSeason = isInSeasonToday(fish.id)
            const isFav = isFishStarred(fish.id)
            return (
              <button
                key={fish.id}
                onClick={() => setSelectedFish(fish)}
                className="overflow-hidden text-left transition-all active:scale-95 rounded-xl relative"
                style={{
                  background: 'var(--surface)',
                  border: `1.5px solid ${selectedFish?.id === fish.id ? '#6ab04c' : inSeason ? 'rgba(106,176,76,0.55)' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: selectedFish?.id === fish.id ? '0 0 0 3px rgba(106,176,76,0.25)' : 'none',
                }}
              >
                {/* Star icon — top-right corner */}
                <button
                  onClick={e => { e.stopPropagation(); toggleFish(fish.id) }}
                  className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full"
                  style={{ background: 'rgba(0,0,0,0.45)', fontSize: '14px', lineHeight: 1 }}
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFav ? '⭐' : '☆'}
                </button>
                {/* Illuminated photo area */}
                <div className="flex items-center justify-center" style={{
                  minHeight: '120px',
                  background: 'rgb(11,13,20)',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fish.photo}
                    alt={fish.name}
                    style={{
                      width: '100%', height: '100%', objectFit: 'contain', padding: '10px',
                      filter: inSeason ? 'none' : 'grayscale(1)',
                      opacity: inSeason ? 1 : 0.6,
                      transition: 'filter 0.2s, opacity 0.2s',
                    }}
                  />
                </div>
                {/* Name bar */}
                <div className="px-3 py-2.5" style={{ background: 'transparent' }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight" style={{ color: '#ffffff' }}>{fish.name}</p>
                    {inSeason && (
                      <span className="text-[10px] flex-shrink-0" style={{ color: '#4ade80' }}>●</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
          {sortedFiltered.length === 0 && (
            <div className="col-span-2 py-12 text-center">
              <p className="text-2xl mb-2">?</p>
              <p className="text-sm font-semibold text-white">No results</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                {activeFilter === 'starred' ? 'Star some fish to see them here' : 'Try a different search or filter'}
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedFish && (
        <FishDetailSheet species={selectedFish} onClose={() => setSelectedFish(null)} />
      )}

      <BottomNav />
    </div>
  )
}
