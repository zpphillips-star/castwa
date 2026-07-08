'use client'
import Image from 'next/image'
import { useMemo } from 'react'
import { SPECIES, REGULATIONS, SKAGIT_SECTIONS, isOpenOn } from '@/lib/fishing-data'
import { SPECIES_SKAGIT_KEYWORDS } from '@/lib/use-fish-map-segments'

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
const MONTH_MAP: Record<string, number> = {
  jan:0, feb:1, mar:2, apr:3, may:4, jun:5,
  jul:6, aug:7, sep:8, oct:9, nov:10, dec:11,
}
function parseMonDay(s: string): { m: number; d: number } | null {
  const m = s.trim().match(/^(\w{3})\.?\s+(\d+)/i)
  if (!m) return null
  const mon = MONTH_MAP[m[1].toLowerCase()]
  return mon !== undefined ? { m: mon, d: parseInt(m[2]) } : null
}
function isInRange(today: Date, rangeStr: string): boolean {
  const yr = today.getFullYear()
  const s = rangeStr.trim()
  if (s.toLowerCase().startsWith('year')) return true
  if (s.toLowerCase().startsWith('all other') || s === '—') return false
  if (s.toLowerCase().startsWith('immediately') || s.toLowerCase().startsWith('now')) {
    const endPart = s.match(/–\s*(.+)/)
    if (!endPart) return true
    const ep = parseMonDay(endPart[1])
    if (!ep) return true
    return today <= new Date(yr, ep.m, ep.d, 23, 59, 59)
  }
  const parts = s.split(/\s*–\s*/)
  if (parts.length !== 2) return false
  const a = parseMonDay(parts[0])
  const b = parseMonDay(parts[1])
  if (!a || !b) return false
  const start = new Date(yr, a.m, a.d)
  const end   = new Date(b.m < a.m ? yr + 1 : yr, b.m, b.d, 23, 59, 59)
  return today >= start && today <= end
}

// ─── SHORT DISPLAY NAMES ──────────────────────────────────────────────────────
// Override for names that truncate poorly at 2 words
const SHORT_NAMES: Record<string, string> = {
  flounder:  'Flounder',
  razorclam: 'Razor Clam',
  'lake-trout': 'Lake Trout',
}

// ─── PROPS ────────────────────────────────────────────────────────────────────
interface Props {
  selected: string | null
  onSelect: (fishId: string | null) => void
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function MapFishSelector({ selected, onSelect }: Props) {
  const today = useMemo(() => new Date(), [])

  const inSeasonSpecies = useMemo(() => {
    const openIds = new Set<string>()

    // From REGULATIONS
    for (const reg of REGULATIONS) {
      if (isOpenOn(reg, today)) openIds.add(reg.speciesId)
    }

    // From SKAGIT_SECTIONS base seasons
    for (const section of SKAGIT_SECTIONS) {
      for (const [speciesId, keywords] of Object.entries(SPECIES_SKAGIT_KEYWORDS)) {
        if (openIds.has(speciesId)) continue
        const match = section.seasons.find(s =>
          !s.closed &&
          s.open && s.open !== '—' &&
          keywords.some(k => s.species.toLowerCase().includes(k))
        )
        if (match) {
          const ranges = match.open!.split(/[/&+]/).map(r => r.trim())
          if (ranges.some(r => isInRange(today, r))) openIds.add(speciesId)
        }
      }
      // Also from emergency rules
      if (section.emergencyRule) {
        for (const o of section.emergencyRule.overrides) {
          if (o.status === 'OPEN' && isInRange(today, o.dates)) {
            const notes = o.notes.toLowerCase()
            for (const [speciesId, keywords] of Object.entries(SPECIES_SKAGIT_KEYWORDS)) {
              if (keywords.some(k => notes.includes(k))) openIds.add(speciesId)
            }
          }
        }
      }
    }

    return SPECIES.filter(s => openIds.has(s.id))
  }, [today])

  return (
    <div
      className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none"
      style={{ isolation: 'isolate' }}
    >
      <div
        className="overflow-x-auto pointer-events-auto"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', background: 'transparent' }}
      >
        <div className="flex gap-3 px-3 py-2 w-max">
          {/* All pill */}
          <button
            onClick={() => onSelect(null)}
            className={`flex-shrink-0 self-center px-3 py-2 rounded text-sm border transition-colors ${
              selected === null
                ? 'bg-green-600 border-green-500 text-white'
                : 'bg-transparent border-transparent text-gray-400'
            }`}
          >
            All
          </button>

          {/* Fish photo cards */}
          {inSeasonSpecies.map(sp => {
            const isSelected = selected === sp.id
            const shortName = SHORT_NAMES[sp.id] ?? sp.name.split(' ').slice(0, 2).join(' ')
            return (
              <button
                key={sp.id}
                onClick={() => onSelect(isSelected ? null : sp.id)}
                className={`flex flex-col items-center cursor-pointer shrink-0 active:scale-95 w-16 rounded-lg px-1 py-1 transition-colors ${
                  isSelected ? 'bg-gray-700/80 shadow-lg shadow-green-900/50' : ''
                }`}
              >
                <div className={`transition-transform duration-150 ${isSelected ? 'scale-115' : 'scale-100'}`}>
                  <Image
                    src={sp.photo}
                    alt={sp.name}
                    width={64}
                    height={48}
                    className="w-16 h-12 object-contain"
                  />
                </div>
                <span className={`text-xs text-center leading-tight mt-1 ${isSelected ? 'text-green-400 font-semibold' : 'text-gray-400'}`}>
                  {shortName}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
