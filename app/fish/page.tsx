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
  { key: 'starred',   label: 'Saved',   desc: 'Your starred species' },
]

type CategoryKey = 'Salmon' | 'Trout' | 'Steelhead' | 'Bass' | 'Panfish' | 'Marine'

const CATEGORY_ORDER: CategoryKey[] = ['Salmon', 'Trout', 'Steelhead', 'Bass', 'Panfish', 'Marine']

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

function getSeasonStatus(speciesId: string): 'open' | 'restricted' | 'closed' {
  const today = new Date()
  const openRegs = REGULATIONS.filter(r => r.speciesId === speciesId && isOpenOn(r, today))
  if (openRegs.length === 0) return 'closed'
  const hasRestriction = openRegs.some(r => r.hatcheryOnly || r.gearRestriction)
  return hasRestriction ? 'restricted' : 'open'
}

function isInSeasonToday(speciesId: string): boolean {
  return getSeasonStatus(speciesId) !== 'closed'
}

function statusOrder(status: 'open' | 'restricted' | 'closed'): number {
  return status === 'open' ? 0 : status === 'restricted' ? 1 : 2
}

// ── Shared SVG star button ──────────────────────────────────────────────────
function StarButton({
  isFav,
  onToggle,
  size = 'md',
}: {
  isFav: boolean
  onToggle: (e: React.MouseEvent) => void
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? { outer: 24, icon: 12 } : { outer: 28, icon: 14 }
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-center rounded-full"
      style={{ width: dim.outer, height: dim.outer, background: 'rgba(0,0,0,0.50)' }}
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFav ? (
        <svg width={dim.icon} height={dim.icon} fill="#f59e0b" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ) : (
        <svg width={dim.icon} height={dim.icon} fill="none" stroke="rgba(255,255,255,0.6)" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.499z" />
        </svg>
      )}
    </button>
  )
}

// ── Section divider ─────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 16px 12px' }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
      <span style={{
        fontSize: '11px', fontWeight: 800, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: '#6b7280', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
    </div>
  )
}

// ── Hero card (168×224, featured look) ──────────────────────────────────────
function HeroCard({
  fish,
  status,
  isFav,
  onSelect,
  onToggleStar,
}: {
  fish: Species
  status: 'open' | 'restricted'
  isFav: boolean
  onSelect: () => void
  onToggleStar: (e: React.MouseEvent) => void
}) {
  const accentColor = status === 'open' ? '#6ab04c' : '#f26522'
  return (
    <button
      onClick={onSelect}
      className="transition-all active:scale-[0.98]"
      style={{
        width: 168, height: 224, flexShrink: 0,
        borderRadius: 20, overflow: 'hidden', position: 'relative',
        border: `1.5px solid ${accentColor}55`,
        boxShadow: `0 4px 24px ${accentColor}22`,
        background: 'rgb(11,13,20)',
      }}
    >
      {/* Accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentColor, zIndex: 2 }} />

      {/* Photo area */}
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fish.photo}
          alt={fish.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20px 12px 56px' }}
        />
      </div>

      {/* Bottom gradient overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
        background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Name + category */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 13px 13px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accentColor, marginBottom: 3 }}>
          {fish.category}
        </p>
        <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1.15 }}>
          {fish.name}
        </p>
      </div>

      {/* PEAK badge */}
      <div style={{
        position: 'absolute', top: 12, right: 10, zIndex: 3,
        background: accentColor,
        color: '#fff',
        fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em',
        padding: '4px 8px', borderRadius: 20,
      }}>
        PEAK
      </div>

      {/* Star button */}
      <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 3 }}>
        <StarButton isFav={isFav} onToggle={onToggleStar} size="sm" />
      </div>
    </button>
  )
}

// ── Lane card (108×148, contain photo) ──────────────────────────────────────
function LaneCard({
  fish,
  status,
  isFav,
  onSelect,
  onToggleStar,
}: {
  fish: Species
  status: 'open' | 'restricted' | 'closed'
  isFav: boolean
  onSelect: () => void
  onToggleStar: (e: React.MouseEvent) => void
}) {
  const isClosed = status === 'closed'
  return (
    <button
      onClick={onSelect}
      style={{
        width: 108, height: 148, flexShrink: 0,
        borderRadius: 14, overflow: 'hidden', position: 'relative',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'var(--surface)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Photo area — top 2/3 */}
      <div style={{ height: 96, background: 'rgb(11,13,20)', flexShrink: 0, position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fish.photo}
          alt={fish.name}
          style={{
            width: '100%', height: '100%', objectFit: 'contain', padding: 6,
            filter: isClosed ? 'grayscale(1)' : 'none',
            opacity: isClosed ? 0.5 : 1,
          }}
        />
        {/* Star button */}
        <div style={{ position: 'absolute', top: 6, right: 6 }}>
          <StarButton isFav={isFav} onToggle={onToggleStar} size="sm" />
        </div>
      </div>
      {/* Name bar — bottom 1/3 */}
      <div style={{ flex: 1, padding: '6px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: 0 }}>{fish.name}</p>
        <p style={{
          fontSize: 9, fontWeight: 700, marginTop: 3,
          color: status === 'open' ? '#6ab04c' : status === 'restricted' ? '#f26522' : 'var(--text-faint)',
        }}>
          {status === 'open' ? 'Open' : status === 'restricted' ? 'Restricted' : 'Closed'}
        </p>
      </div>
    </button>
  )
}

export default function FishPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [selectedFish, setSelectedFish] = useState<Species | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { isFishStarred, toggleFish } = useStarred()

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

  // ── Browse mode data (hero + lanes) ──────────────────────────────────────
  const isBrowseMode = activeFilter === 'all' && searchQuery.trim() === ''
  const currentMonth = new Date().getMonth() + 1

  const heroFish = isBrowseMode
    ? SPECIES
        .filter(s => {
          const st = getSeasonStatus(s.id)
          return s.peakMonths.includes(currentMonth) && st !== 'closed'
        })
        .sort((a, b) => statusOrder(getSeasonStatus(a.id)) - statusOrder(getSeasonStatus(b.id)))
        .slice(0, 8)
    : []

  const categoryLanes = isBrowseMode
    ? CATEGORY_ORDER
        .map(cat => {
          const species = SPECIES
            .filter(s => s.category === cat)
            .sort((a, b) => statusOrder(getSeasonStatus(a.id)) - statusOrder(getSeasonStatus(b.id)))
          return { cat, species }
        })
        .filter(lane => lane.species.length > 0)
    : []

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', paddingBottom: '100px' }}>
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
            Regs verified July 2026
          </span>
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BROWSE MODE: Hero + Category Lanes
      ══════════════════════════════════════════════════════════════ */}
      {isBrowseMode ? (
        <div style={{ paddingBottom: 8 }}>

          {/* What's Running Now hero */}
          {heroFish.length > 0 && (
            <>
              {/* Featured section header — orange, not gray */}
              <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 3, height: 18, borderRadius: 2, background: '#f26522', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f26522' }}>
                  What&apos;s Running Now
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)' }}>
                  · {heroFish.length} species at peak
                </span>
              </div>
              <div
                className="no-scrollbar"
                style={{ overflowX: 'auto', display: 'flex', gap: 12, padding: '0 16px 16px', WebkitOverflowScrolling: 'touch' }}
              >
                {heroFish.map(fish => {
                  const status = getSeasonStatus(fish.id) as 'open' | 'restricted'
                  return (
                    <HeroCard
                      key={fish.id}
                      fish={fish}
                      status={status}
                      isFav={isFishStarred(fish.id)}
                      onSelect={() => setSelectedFish(fish)}
                      onToggleStar={e => { e.stopPropagation(); toggleFish(fish.id) }}
                    />
                  )
                })}
              </div>
            </>
          )}

          {/* ── Search + Filter — below hero ── */}
          <div className="max-w-lg mx-auto px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {FILTERS.map(f => {
                const active = activeFilter === f.key
                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className="flex-shrink-0 font-semibold transition-all active:scale-[0.99] rounded-full"
                    style={{
                      padding: '7px 16px', fontSize: '13px',
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
            <div className="relative mt-5">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-faint)', width: 18, height: 18 }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search fish, category, or water…"
                className="w-full rounded-2xl text-sm outline-none"
                style={{
                  paddingTop: 14, paddingBottom: 14, paddingLeft: 44,
                  paddingRight: searchQuery ? 40 : 16,
                  background: 'var(--surface)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: '15px',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--text-faint)' }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Category lanes */}
          {categoryLanes.map(({ cat, species }) => (
            <div key={cat}>
              <SectionDivider label={`${cat} · ${species.length}`} />
              <div
                className="no-scrollbar"
                style={{ overflowX: 'auto', display: 'flex', gap: 12, padding: '0 16px 4px', WebkitOverflowScrolling: 'touch' }}
              >
                {species.map(fish => {
                  const status = getSeasonStatus(fish.id)
                  return (
                    <LaneCard
                      key={fish.id}
                      fish={fish}
                      status={status}
                      isFav={isFishStarred(fish.id)}
                      onSelect={() => setSelectedFish(fish)}
                      onToggleStar={e => { e.stopPropagation(); toggleFish(fish.id) }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════
            SEARCH / FILTER MODE: 3-column grid (unchanged)
        ══════════════════════════════════════════════════════════════ */
        <div className="max-w-lg mx-auto px-4">
          {/* Search bar + filter pills — persistent in search/filter mode */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mt-2">
            {FILTERS.map(f => {
              const active = activeFilter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className="flex-shrink-0 font-semibold transition-all active:scale-[0.99] rounded-full"
                  style={{
                    padding: '7px 16px', fontSize: '13px',
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
          <div className="relative mt-5 mb-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-faint)', width: 18, height: 18 }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search fish, category, or water…"
              className="w-full rounded-2xl text-sm outline-none"
              style={{
                paddingTop: 14, paddingBottom: 14, paddingLeft: 44,
                paddingRight: searchQuery ? 40 : 16,
                background: 'var(--surface)',
                border: '1.5px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: '15px',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--text-faint)' }}
              >
                ×
              </button>
            )}
          </div>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', marginTop: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', whiteSpace: 'nowrap' }}>
              {activeFilter === 'starred' ? 'Saved Fish'
                : activeFilter === 'river' ? 'River Fish'
                : activeFilter === 'lake' ? 'Lake Fish'
                : activeFilter === 'salt' ? 'Saltwater Fish'
                : activeFilter === 'shellfish' ? 'Shellfish'
                : 'Results'} · {sortedFiltered.length}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Fish grid */}
          <div className="grid grid-cols-3 gap-4">
            {sortedFiltered.map(fish => {
              const status = getSeasonStatus(fish.id)
              const inSeason = status !== 'closed'
              const isFav = isFishStarred(fish.id)
              return (
                <button
                  key={fish.id}
                  onClick={() => setSelectedFish(fish)}
                  className="overflow-hidden text-left transition-all active:scale-[0.99] rounded-2xl relative"
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${selectedFish?.id === fish.id ? '#6ab04c' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {/* Star icon — top-right corner */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleFish(fish.id) }}
                    className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full"
                    style={{ background: 'rgba(0,0,0,0.45)' }}
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFav ? (
                      <svg className="w-3.5 h-3.5" fill="#f59e0b" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.6)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.499z"/></svg>
                    )}
                  </button>
                  {/* Photo area */}
                  <div className="flex items-center justify-center" style={{ minHeight: '120px', background: 'rgb(11,13,20)' }}>
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
                  <div className="px-3 py-2.5 text-center">
                    <p className="text-sm font-semibold leading-tight text-white">{fish.name}</p>
                    <p className="text-[10px] font-semibold mt-1" style={{
                      color: status === 'open' ? '#6ab04c' : status === 'restricted' ? '#f97316' : 'var(--text-faint)'
                    }}>
                      {status === 'open' ? 'In Season' : status === 'restricted' ? 'w/ Restrictions' : 'Closed'}
                    </p>
                  </div>
                </button>
              )
            })}
            {sortedFiltered.length === 0 && (
              <div className="col-span-3 py-12 text-center">
                <p className="text-2xl mb-2">?</p>
                <p className="text-sm font-semibold text-white">No results</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                  {activeFilter === 'starred' ? 'Star some fish to see them here' : 'Try a different search or filter'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedFish && (
        <FishDetailSheet species={selectedFish} onClose={() => setSelectedFish(null)} />
      )}

      <BottomNav />
    </div>
  )
}
