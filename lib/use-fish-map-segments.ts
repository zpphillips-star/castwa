import { useMemo } from 'react'
import { REGULATIONS, SKAGIT_SECTIONS, WATER_BODIES, isOpenOn } from './fishing-data'
import type { Regulation, RiverSection, SeasonEntry } from './fishing-data'
import { SKAGIT_SECTION_COORDS } from './river-sections-coords'

// ─── TYPE ─────────────────────────────────────────────────────────────────────

export type FishSegment = {
  id: string            // skagitId for Skagit sections, 'wb-{id}' for other waters
  waterId: string       // water body ID
  waterName: string
  sectionName?: string  // for Skagit sections
  coords: [number, number][]
  status: 'open' | 'closed' | 'emergency'
  regulation?: Regulation    // for non-Skagit waters
  section?: RiverSection     // for Skagit sections
  relevantSeason?: SeasonEntry // the season entry that matched the selected fish
}

// ─── DATE HELPERS (mirrors WAMap.tsx logic) ───────────────────────────────────

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

// ─── SPECIES → SECTION SEASON KEYWORD MAPPING ────────────────────────────────
// Maps species IDs to substrings that appear in SKAGIT_SECTIONS season species names

export const SPECIES_SKAGIT_KEYWORDS: Record<string, string[]> = {
  chinook:    ['chinook'],
  coho:       ['coho'],
  sockeye:    ['sockeye'],
  chum:       ['chum'],
  steelhead:  ['steelhead', 'all game fish'],
  rainbow:    ['trout (other)', 'rainbow', 'all game fish'],
  cutthroat:  ['trout (other)', 'cutthroat', 'all game fish'],
  bull:       ['bull trout', 'dolly varden'],
  brook:      ['trout (other)', 'all game fish'],
  brown:      ['trout (other)', 'all game fish'],
  'lake-trout': ['trout (other)', 'all game fish'],
  whitefish:  ['whitefish', 'all game fish'],
  sturgeon:   ['sturgeon'],
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useSelectedFishSegments(fishId: string | null): FishSegment[] {
  return useMemo(() => {
    if (!fishId) return []

    const today = new Date()
    const segments: FishSegment[] = []
    const keywords = SPECIES_SKAGIT_KEYWORDS[fishId] ?? [fishId.toLowerCase()]

    // ── Skagit sections ────────────────────────────────────────────────────────
    for (const section of SKAGIT_SECTIONS) {
      const coordData = SKAGIT_SECTION_COORDS[section.id]
      if (!coordData) continue

      // Find seasons relevant to this fish
      const relevantSeasons = section.seasons.filter(s =>
        keywords.some(k => s.species.toLowerCase().includes(k))
      )
      if (relevantSeasons.length === 0) continue

      let status: 'open' | 'closed' | 'emergency' = 'closed'
      let relevantSeason: SeasonEntry | undefined

      // 1. Check emergency rule first
      if (section.emergencyRule) {
        for (const o of section.emergencyRule.overrides) {
          if (!isInRange(today, o.dates)) continue
          if (o.status === 'CLOSED') {
            status = 'emergency'
            break
          }
          if (o.status === 'OPEN') {
            const notesLower = o.notes.toLowerCase()
            const coversOurFish =
              keywords.some(k => notesLower.includes(k)) ||
              notesLower.includes('all species')
            if (coversOurFish) { status = 'open'; break }
          }
        }
        if (status !== 'closed') {
          segments.push({
            id: section.id,
            waterId: 'skagit',
            waterName: 'Skagit River',
            sectionName: section.name,
            coords: coordData.coords,
            status,
            section,
            relevantSeason: relevantSeasons[0],
          })
          continue
        }
      }

      // 2. Check base seasons
      for (const s of relevantSeasons) {
        if (s.closed) continue
        if (!s.open || s.open === '—') continue
        const ranges = s.open.split(/[/&+]/).map(r => r.trim())
        for (const r of ranges) {
          if (isInRange(today, r)) {
            status = 'open'
            relevantSeason = s
            break
          }
        }
        if (status === 'open') break
      }

      // Pick a relevant season for popup display (first closed season if no open)
      if (!relevantSeason) relevantSeason = relevantSeasons[0]

      segments.push({
        id: section.id,
        waterId: 'skagit',
        waterName: 'Skagit River',
        sectionName: section.name,
        coords: coordData.coords,
        status,
        section,
        relevantSeason,
      })
    }

    // ── Other waters via REGULATIONS ──────────────────────────────────────────
    const regs = REGULATIONS.filter(r => r.speciesId === fishId && r.waterBodyId !== 'skagit')
    for (const reg of regs) {
      const wb = WATER_BODIES.find(w => w.id === reg.waterBodyId)
      if (!wb) continue
      const open = isOpenOn(reg, today)
      segments.push({
        id: `wb-${wb.id}`,
        waterId: wb.id,
        waterName: wb.name,
        coords: [[wb.lat, wb.lng]],
        status: open ? 'open' : 'closed',
        regulation: reg,
      })
    }

    return segments
  }, [fishId])
}
