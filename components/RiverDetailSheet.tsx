'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  SPECIES, Species, SKAGIT_SECTIONS, RiverSection, SeasonEntry,
  GEAR_ICON_INFO, GearIconCode,
} from '@/lib/fishing-data'
import {
  SKAGIT_COORDS, SNOHOMISH_COORDS, NOOKSACK_COORDS,
  SAUK_COORDS, STILLAGUAMISH_COORDS,
  WA_WATERWAYS,
} from '@/lib/river-coords-generated'
import { sliceRiverBetween } from '@/lib/river-regulation-segments'
import FishDetailSheet from './FishDetailSheet'
import type { MapSegment, SegmentStatus } from './RiverDetailMapInner'
import { useSwipeBack } from '@/hooks/useSwipeBack'

// ─── Dynamic map (no SSR) ────────────────────────────────────────────────────
const RiverDetailMapInner = dynamic(
  () => import('./RiverDetailMapInner'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', background: '#08080f', color: '#6b7280', fontSize: 14,
      }}>
        Loading map…
      </div>
    ),
  }
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseGoogleMapsCoord(url: string): [number, number] | null {
  const m = url.match(/[?&]q=([\d.-]+),([\d.-]+)/)
  if (m) return [parseFloat(m[1]), parseFloat(m[2])]
  return null
}

function getSectionStatus(section: RiverSection): SegmentStatus {
  if (section.emergencyRule) return 'emergency'
  const allClosed = section.seasons.every(s => s.closed)
  return allClosed ? 'closed' : 'open'
}

// ─── Shared season-activity helpers (used by RestrictionCard + tile strip) ───

const SEASON_MONTH_MAP: Record<string, number> = {
  Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11
}
function parseSeasonMonthDay(str: string): number | null {
  const m = str.trim().match(/^([A-Za-z]+)\s*(\d+)/)
  if (!m) return null
  const mo = SEASON_MONTH_MAP[m[1]]
  if (mo === undefined) return null
  return mo * 100 + parseInt(m[2])
}
function isSeasonRangeActiveToday(rangeStr: string, todayMD: number): boolean {
  const parts = rangeStr.split(/\s*[–—-]\s*/)
  if (parts.length < 2) return false
  const start = parseSeasonMonthDay(parts[0])
  const end   = parseSeasonMonthDay(parts[parts.length - 1])
  if (start === null || end === null) return false
  if (start <= end) return todayMD >= start && todayMD <= end
  return todayMD >= start || todayMD <= end
}
function isSeasonEntryActiveToday(entry: { open?: string; closed?: boolean }): boolean {
  if (entry.closed) return false
  const open = (entry.open ?? '').trim()
  if (!open || open === '—') return false
  if (/year.round|c&r/i.test(open)) return true
  const today   = new Date()
  const todayMD = today.getMonth() * 100 + today.getDate()
  return open.split(/[&\/]/).some(r => isSeasonRangeActiveToday(r.trim(), todayMD))
}

// ─── Tile fish-status (section color coding when a species is selected) ───────

type TileFishStatus = 'green' | 'orange' | 'red' | 'blue'

/**
 * Returns the color status for a tile given the selected species:
 *  blue   = no data for this fish in this section (no matching season entries)
 *  red    = fish is explicitly closed here (all matching entries have closed:true,
 *           OR no entry is active today)
 *  orange = fish is open today but has notable restrictions (emergency rule, gear
 *           restrictions, limits)
 *  green  = fish is open today with no notable restrictions
 */
function getSpeciesStatusForTile(section: RiverSection, speciesName: string): TileFishStatus {
  const entries = section.seasons.filter(e => e.species === speciesName)
  if (entries.length === 0) return 'blue'

  const allExplicitlyClosed = entries.every(e => e.closed === true)
  if (allExplicitlyClosed) return 'red'

  const hasActiveToday = entries.some(e => isSeasonEntryActiveToday(e))
  if (!hasActiveToday) return 'red'

  // Open today — check for restrictions
  const RESTRICTION_ICONS: string[] = [
    'EMERGENCY_RULE', 'TRIBAL_CLOSURE_RISK', 'CLOSED_WATERS_SUMMER',
    'ANTI_SNAGGING', 'SINGLE_BARBLESS',
  ]
  const hasRestrictions =
    !!section.emergencyRule ||
    section.gearIcons.some(g => RESTRICTION_ICONS.includes(g)) ||
    entries.some(e => e.dailyLimit !== undefined && e.dailyLimit !== null)

  return hasRestrictions ? 'orange' : 'green'
}

const TILE_STATUS_COLORS: Record<TileFishStatus, {
  bg: string; border: string; nameColor: string
  numBg: string; numColor: string; glow: string
}> = {
  green:  { bg: 'rgba(74,222,128,0.15)',  border: 'rgba(74,222,128,0.60)',  nameColor: '#86efac', numBg: 'rgba(74,222,128,0.20)',  numColor: '#4ade80', glow: '0 0 14px rgba(74,222,128,0.18), 0 2px 8px rgba(0,0,0,0.4)'  },
  orange: { bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.60)',  nameColor: '#fdba74', numBg: 'rgba(249,115,22,0.20)',  numColor: '#f97316', glow: '0 0 14px rgba(249,115,22,0.22), 0 2px 8px rgba(0,0,0,0.4)'  },
  red:    { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.50)',   nameColor: '#fca5a5', numBg: 'rgba(239,68,68,0.20)',   numColor: '#ef4444', glow: '0 0 12px rgba(239,68,68,0.16), 0 2px 8px rgba(0,0,0,0.4)'   },
  blue:   { bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.40)',  nameColor: '#93c5fd', numBg: 'rgba(96,165,250,0.15)',  numColor: '#60a5fa', glow: '0 0 10px rgba(96,165,250,0.12), 0 2px 8px rgba(0,0,0,0.4)'  },
}

function getRiverFullCoords(riverId: string): [number, number][] {
  const direct: Record<string, [number, number][]> = {
    skagit:        SKAGIT_COORDS,
    snohomish:     SNOHOMISH_COORDS,
    nooksack:      NOOKSACK_COORDS,
    sauk:          SAUK_COORDS,
    stillaguamish: STILLAGUAMISH_COORDS,
  }
  if (direct[riverId]) return direct[riverId]
  const nameMap: Record<string, string> = {
    columbia: 'Columbia River',
    yakima:   'Yakima River',
    green:    'Green River',
    cedar:    'Cedar River',
    snake:    'Snake River',
  }
  const name = nameMap[riverId]
  if (name && WA_WATERWAYS[name]) {
    return WA_WATERWAYS[name].polylines.flat() as [number, number][]
  }
  return []
}

function buildSkagitSegments(): MapSegment[] {
  return SKAGIT_SECTIONS.map((section, idx) => {
    const startCoord = parseGoogleMapsCoord(section.mapsLinkDownstream)
    const endCoord   = parseGoogleMapsCoord(section.mapsLinkUpstream)
    let coords: [number, number][]
    if (startCoord && endCoord) {
      const sliced = sliceRiverBetween(SKAGIT_COORDS, startCoord, endCoord)
      coords = sliced.length > 1 ? sliced : [startCoord, endCoord]
    } else {
      coords = [[48.42, -121.75], [48.5, -121.5]]
    }
    return { idx, coords, status: getSectionStatus(section), label: section.name }
  })
}

function buildFullRiverSegment(riverId: string): MapSegment[] {
  const coords = getRiverFullCoords(riverId)
  if (coords.length === 0) return []
  return [{ idx: 0, coords, status: 'open', label: 'Full River' }]
}

// ─── Verified fishing tips ────────────────────────────────────────────────────
export const FISH_TIPS: Record<string, { howToSpot: string[]; howToCatch: string[]; whatToLookFor: string }> = {
  chinook:    { whatToLookFor: 'Chinook (King) have a black gum line, small irregular black spots on back and both tail lobes, and are the largest Pacific salmon — often 20–60 lbs. Hatchery fish have a clipped adipose fin.', howToSpot: ['Black gum line (unique among WA salmon)', 'Spots on both tail lobes', 'Deep body, large head', 'Adipose fin clipped = hatchery fish (legal to keep in most fisheries)'], howToCatch: ['Fish deep holes and seams in rivers — Chinook hold in slow water near fast', 'Troll herring or anchovy at 30–80 ft in salt water', 'Back-troll with kwikfish or plugs in rivers', 'Drift eggs/corkies near bottom in rivers', 'Typically bite early morning and evening'] },
  coho:       { whatToLookFor: 'Coho (Silver) have white gums with black tongue, small spots only on upper tail lobe, and bright silver sides. Hatchery fish have clipped adipose fin.', howToSpot: ['White gums, black tongue', 'Spots on upper lobe of tail only', 'More slender than Chinook', 'Hooked nose in males when spawning'], howToCatch: ['Cast spinners or spoons near river mouths in fall (Aug–Nov)', 'Troll hoochies or herring near surface (15–30 ft) in salt water', 'Work tidal flats and river estuaries at high tide', 'Coho are aggressive biters — flashy lures work well'] },
  steelhead:  { whatToLookFor: 'Steelhead are sea-run rainbow trout — silvery in salt water, developing pink lateral stripe after time in fresh water. Hatchery fish have a clipped adipose fin.', howToSpot: ['Pink/red lateral stripe (more visible the longer in freshwater)', 'Spots on body and tail', 'More slender than salmon', 'Adipose fin: intact = wild (must release in most rivers), clipped = hatchery (keep)'], howToCatch: ['Drift fish jigs, eggs, or sand shrimp near bottom in runs', 'Swing wet flies or spey flies through runs — let fly drift across current', 'Focus on seams between fast and slow water', 'Wade carefully — fish lie in predictable spots: tail-outs, slots behind boulders', 'Skagit: fish from Oct through March for winter steelhead'] },
  rainbow:    { whatToLookFor: 'Rainbow trout have a pink lateral stripe, black spots on body and fins, and white-tipped fins. Hatchery fish often have worn fins.', howToSpot: ['Pink stripe along lateral line', 'Black spots on back, sides, and fins', 'No red slash marks under jaw (that\'s cutthroat)'], howToCatch: ['Drift worms or Power Bait under a float in lakes', 'Cast Kastmaster or Rooster Tail spinners in rivers', 'Fly fish with dry flies on calm evenings (hatches at dusk)', 'Troll wedding rings or gang trolls in lakes', 'Fish near inlets where fresh water enters a lake'] },
  cutthroat:  { whatToLookFor: 'Cutthroat trout are identified by red/orange slash marks under the jaw — hence the name. Found in streams and coastal waters.', howToSpot: ['Red or orange slash marks under jaw — unmistakable', 'Heavier spotting than rainbow', 'Spotted at base of tail'], howToCatch: ['Small spinners and spoons in coastal rivers (Sept–Feb)', 'Fly fish with streamers or nymphs in streams', 'Sea-run cutthroat hit hard in estuaries at high tide', 'Small presentation — these are not large fish; 8–14" typical'] },
  sockeye:    { whatToLookFor: 'Sockeye are the only salmon with no spots on back or tail. Brilliant red body with green head when spawning. In salt water they are bright silver-blue.', howToSpot: ['No spots — clean back and tail (unique among WA salmon)', 'Bright silver in ocean, vivid red body in freshwater', 'Smaller than Chinook or Coho'], howToCatch: ['Sockeye don\'t feed in freshwater — snagging is illegal', 'In salt water: troll small red/pink hoochies near surface', 'Lake sockeye: troll at specific depths with downrigger', 'Very limited open fisheries in WA — check regulations carefully'] },
  walleye:    { whatToLookFor: 'Walleye have distinctive glassy, opaque eyes (tapetum lucidum reflects light — visible at night), olive-gold body, and white tip on lower tail lobe.', howToSpot: ['Glassy white/opaque eyes — reflective in light', 'White tip on bottom lobe of tail — definitive ID', 'Olive to golden body color', 'Serrated dorsal spines'], howToCatch: ['Jig or troll at dusk/dawn — walleye are most active in low light', 'Jigging with live minnow or paddle-tail swimbait along bottom', 'Troll crankbaits at 2–3 mph along breaks and ledges', 'Columbia and Snake Rivers are top WA walleye waters'] },
  sturgeon:   { whatToLookFor: 'White sturgeon are prehistoric-looking with bony scutes (plates) instead of scales, elongated snout, and whisker-like barbels. Can exceed 10 feet.', howToSpot: ['Rows of bony plates along sides and back', 'Elongated pointed snout with barbels underneath', 'No scales — smooth skin with bony scutes', 'Legal to keep: 38–54" on Columbia (check current regs)'], howToCatch: ['Fish with smelt, shrimp, or sand shrimp on bottom', 'Heavy gear required — 20–50 lb line minimum', 'Columbia River: most productive below Bonneville Dam', 'Sturgeon season has strict slot limits — measure before keeping'] },
  smallmouth: { whatToLookFor: 'Smallmouth bass have vertical bars on sides (not horizontal stripe), bronze-green color, and jaw that does NOT extend past the eye.', howToSpot: ['Vertical bars on sides (vs largemouth\'s horizontal stripe)', 'Bronze or brownish-green color', 'Red eyes common', 'Jaw stops at rear of eye'], howToCatch: ['Drop shot rigs on rocky bottoms and gravel bars', 'Tubes and crayfish imitations work well — smallmouth love crayfish', 'Swim jigs along current seams in rivers', 'Best in rivers with rocky bottoms: Snake, Columbia, Yakima'] },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GearBadge({ code }: { code: GearIconCode }) {
  const info = GEAR_ICON_INFO[code]
  const isAlert = ['EMERGENCY_RULE','TRIBAL_CLOSURE_RISK','CLOSED_WATERS_SUMMER','NO_MOTORS'].includes(code)
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{
        background: isAlert ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${isAlert ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.12)'}`,
        color: isAlert ? '#ef4444' : 'var(--text-muted)',
      }}>
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </div>
  )
}

function SectionStatusChip({ status }: { status: SegmentStatus }) {
  const cfg = {
    open:       { label: '● OPEN',       color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
    closed:     { label: '○ CLOSED',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
    emergency:  { label: '🚨 EMERGENCY', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    restricted: { label: '⚠️ RESTRICTED', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    neutral:    { label: '● WATERWAY',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  }[status]
  return (
    <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

function FlowBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    ideal:   { label: 'IDEAL',   color: '#6ab04c', bg: 'rgba(106,176,76,0.15)'  },
    low:     { label: 'LOW',     color: '#f26522', bg: 'rgba(242,101,34,0.15)'  },
    high:    { label: 'HIGH',    color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
    loading: { label: '…',       color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
    error:   { label: 'N/A',     color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
  }
  const c = cfg[status] ?? cfg.loading
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

function formatCfs(cfs: number): string {
  if (cfs >= 10000) return `${(cfs / 1000).toFixed(0)}k`
  return cfs.toLocaleString()
}

// ─── Restriction card (full section detail) ───────────────────────────────────

function RestrictionCard({
  section,
  sectionIdx,
  totalSections,
  onClose,
  onPrev,
  onNext,
  selectedSpecies,
  setSelectedSpecies,
  onSelectFish,
}: {
  section: RiverSection
  sectionIdx: number
  totalSections: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  selectedSpecies: string | null
  setSelectedSpecies: (s: string | null) => void
  onSelectFish?: (sp: Species) => void
}) {
  // No longer managing selectedSpecies locally — it lives in parent so swipes preserve it
  const [showFutureSeasons, setShowFutureSeasons] = useState(false)

  // Reset future toggle when species or section changes
  useEffect(() => { setShowFutureSeasons(false) }, [selectedSpecies, sectionIdx])

  const statusColor = {
    open:       '#4ade80',
    closed:     '#ef4444',
    emergency:  '#f97316',
    restricted: '#fbbf24',
    neutral:    '#60a5fa',
  }[getSectionStatus(section)]

  // ── Today-aware season helpers (using shared module-level functions) ──────────
  function isSeasonActiveToday(entry: { open?: string; closed?: boolean }): boolean {
    return isSeasonEntryActiveToday(entry)
  }

  // ── Deduplicate seasons by species name — one card per fish, pick best entry ──
  // "best" = open today → else any open entry → else first entry
  const speciesNames = Array.from(new Set(section.seasons.map(s => s.species)))
  const fishItems = speciesNames.map(name => {
    const entries = section.seasons.filter(s => s.species === name)
    const activeToday = entries.find(e => isSeasonActiveToday(e))
    const anyOpen = entries.find(e => !e.closed)
    const best = activeToday ?? anyOpen ?? entries[0]
    const sp = SPECIES.find(x =>
      x.name.toLowerCase() === name.toLowerCase() ||
      x.name.toLowerCase().includes(name.toLowerCase().split(' ')[0]) ||
      name.toLowerCase().includes(x.name.toLowerCase().split(' ')[0])
    )
    return {
      species: name,
      openToday: !!activeToday,
      season: best,
      allEntries: entries,
      speciesRecord: sp,
      isFallback: false,
    }
  })

  // ── Fallback: when this section has no seasons data, show all river-wide ──────
  // species as CLOSED — absence of data = not authorised = closed.
  const isSectionEmpty = fishItems.length === 0
  const effectiveFishItems = isSectionEmpty
    ? Array.from(new Set(SKAGIT_SECTIONS.flatMap(s => s.seasons.map(e => e.species))))
        .map(name => {
          const sp = SPECIES.find(x =>
            x.name.toLowerCase() === name.toLowerCase() ||
            x.name.toLowerCase().includes(name.toLowerCase().split(' ')[0]) ||
            name.toLowerCase().includes(x.name.toLowerCase().split(' ')[0])
          )
          const fallbackEntry: SeasonEntry = {
            species: name,
            open: '—',
            closed: true,
            notes: 'No specific regulations found for this section — species is presumed closed. Check WDFW for details.',
          }
          return {
            species: name,
            openToday: false,
            season: fallbackEntry,
            allEntries: [fallbackEntry],
            speciesRecord: sp,
            isFallback: true,
          }
        })
    : fishItems

  const selectedItem = selectedSpecies
    ? effectiveFishItems.find(f => f.species === selectedSpecies)
    : null
  // for the drill-down, show the today-active entry or the "best" one
  const selectedSeason = selectedItem
    ? { season: selectedItem.season, species: selectedItem.speciesRecord }
    : null

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0f1a' }}>
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: `1.5px solid ${statusColor}30`, background: `${statusColor}08` }}>
        <div className="flex-1 min-w-0">
          {selectedSpecies ? (
            // Fish drill-down header — back button + fish name + section swipe hint
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedSpecies(null)}
                className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-base font-black text-white leading-tight">{selectedSpecies}</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <SectionStatusChip status={getSectionStatus(section)} />
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>CRC #{section.crc}</span>
              </div>
              <p className="text-sm font-bold text-white leading-tight">{section.name}</p>
            </div>
          )}
        </div>
        {/* Prev / Next / Close — show in both modes */}
        <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
          <button onClick={onPrev} disabled={sectionIdx === 0}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            ‹
          </button>
          <span className="text-[10px] font-semibold" style={{ color: 'var(--text-faint)' }}>
            {sectionIdx + 1}/{totalSections}
          </span>
          <button onClick={onNext} disabled={sectionIdx === totalSections - 1}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            ›
          </button>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center ml-1"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">

        {/* ── Fish picker grid (no species selected) ── */}
        {!selectedSpecies && (
          <div className="p-4 space-y-4">
            {/* Fallback notice: section has no data so we're showing river-wide species as CLOSED */}
            {isSectionEmpty && (
              <div className="rounded-xl p-3 flex gap-2.5 items-start"
                style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)' }}>
                <span className="text-base flex-shrink-0">ℹ️</span>
                <div>
                  <p className="text-xs font-bold mb-0.5" style={{ color: '#93c5fd' }}>No section-specific data</p>
                  <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    No regulations were found for this section. All species are shown from the rest of the river and are presumed <span style={{ color: '#fca5a5', fontWeight: 700 }}>CLOSED</span> here. Verify with WDFW before fishing.
                  </p>
                </div>
              </div>
            )}
            {/* Fish photo grid — 3 per row, one card per species, today-aware */}
            <div className="grid grid-cols-3 gap-2.5">
              {effectiveFishItems.map(({ species: name, openToday, season: s, speciesRecord: sp }) => {
                return (
                  <button key={name}
                    onClick={() => {
                      if (sp && onSelectFish) { onSelectFish(sp) }
                      else { setSelectedSpecies(name) }
                    }}
                    className="flex flex-col items-center rounded-xl overflow-hidden transition-all active:scale-95"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1.5px solid rgba(255,255,255,0.10)',
                    }}>
                    {/* Fish photo */}
                    <div className="w-full aspect-square relative" style={{ background: '#0a0c14' }}>
                      {sp?.photo ? (
                        <img src={sp.photo} alt={name}
                          className="w-full h-full object-contain"
                          style={{ opacity: openToday ? 1 : 0.45 }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🐟</div>
                      )}
                      {/* Today status badge */}
                      {openToday ? (
                        <div className="absolute top-1 right-1 px-1 py-0.5 rounded text-[9px] font-bold"
                          style={{ background: 'rgba(74,222,128,0.9)', color: '#0d1a0d' }}>
                          OPEN
                        </div>
                      ) : (
                        <div className="absolute top-1 right-1 px-1 py-0.5 rounded text-[9px] font-bold"
                          style={{ background: 'rgba(239,68,68,0.85)', color: 'white' }}>
                          CLOSED
                        </div>
                      )}
                    </div>
                    {/* Fish name */}
                    <p className="w-full text-center text-[10px] font-semibold px-1 py-1.5 leading-tight"
                      style={{ color: openToday ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)' }}>
                      {name}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Gear rules */}
            {section.gearIcons.length > 0 && (
              <div>
                <p className="text-[10px] font-bold mb-2" style={{ color: 'var(--text-faint)' }}>GEAR RULES</p>
                <div className="flex flex-wrap gap-1.5">
                  {section.gearIcons.map(code => <GearBadge key={code} code={code} />)}
                </div>
              </div>
            )}

            {/* Emergency rule banner */}
            {section.emergencyRule && (
              <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#ef4444' }}>🚨 Emergency Rule Active</p>
                <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{section.emergencyRule.effective}</p>
              </div>
            )}

            {/* Map links */}
            <div className="flex gap-2 pb-2">
              <a href={section.mapsLinkDownstream} target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg active:opacity-70"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none' }}>
                📍 Downstream
              </a>
              <a href={section.mapsLinkUpstream} target="_blank" rel="noopener noreferrer"
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg active:opacity-70"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'none' }}>
                📍 Upstream
              </a>
            </div>
          </div>
        )}

        {/* ── Single fish drill-down ── */}
        {selectedSpecies && selectedSeason && (() => {
          const er = section.emergencyRule
          const today = new Date().toISOString().slice(0, 10)
          const todayOverride = er?.overrides.find(o =>
            o.startDate && o.endDate && today >= o.startDate && today <= o.endDate
          ) ?? null
          const currentItem = effectiveFishItems.find(f => f.species === selectedSpecies)!
          const isFallbackItem = currentItem?.isFallback ?? false

          return (
            <div className="p-4 space-y-4">

              {/* ── Fallback notice for sections without data ── */}
              {isFallbackItem && (
                <div className="rounded-xl p-3 flex gap-2.5 items-start"
                  style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.3)' }}>
                  <span className="text-base flex-shrink-0">🔵</span>
                  <div>
                    <p className="text-xs font-bold mb-0.5" style={{ color: '#93c5fd' }}>No data for this section</p>
                    <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      No specific regulations were found for <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{selectedSpecies}</strong> in this section. Absence of data means this species is <strong style={{ color: '#fca5a5' }}>presumed closed</strong> here. Always verify with WDFW before fishing.
                    </p>
                  </div>
                </div>
              )}
              {er && (
                <div className="rounded-xl overflow-hidden"
                  style={{ border: `2px solid ${todayOverride?.status === 'CLOSED' ? '#ef4444' : todayOverride?.status === 'OPEN' ? '#4ade80' : '#f97316'}` }}>

                  {/* Header stripe */}
                  <div className="px-4 py-2.5 flex items-center justify-between"
                    style={{ background: todayOverride?.status === 'CLOSED' ? 'rgba(239,68,68,0.2)' : todayOverride?.status === 'OPEN' ? 'rgba(74,222,128,0.15)' : 'rgba(249,115,22,0.15)' }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>RIGHT NOW — {section.name}</p>
                      <p className="text-lg font-black leading-tight"
                        style={{ color: todayOverride?.status === 'CLOSED' ? '#f87171' : todayOverride?.status === 'OPEN' ? '#4ade80' : '#fb923c' }}>
                        {todayOverride?.status === 'CLOSED' ? '⛔ CLOSED TODAY' : todayOverride?.status === 'OPEN' ? '✅ OPEN TODAY' : '⚠️ EMERGENCY RULE IN EFFECT'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{er.effective}</p>
                    </div>
                  </div>

                  {/* Today's specific rule */}
                  {todayOverride && (
                    <div className="px-4 py-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <p className="text-sm leading-relaxed text-white">{todayOverride.notes}</p>
                    </div>
                  )}

                  {/* What is an emergency rule? */}
                  <div className="px-4 py-2.5" style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>WHAT IS AN EMERGENCY RULE?</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      WDFW can issue emergency rules mid-season to protect fish runs, avoid conflicts with tribal nets, or respond to low returns. They override the printed pamphlet immediately. This section is currently under one — always check this before you fish.
                    </p>
                  </div>

                  {/* Full schedule */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest px-4 pt-3 pb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>FULL SCHEDULE FOR THIS SECTION</p>
                    {er.overrides.map((o, i) => {
                      const isNow = o.startDate && o.endDate && today >= o.startDate && today <= o.endDate
                      return (
                        <div key={i} className="px-4 py-2.5 flex gap-3"
                          style={{
                            borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                            background: isNow ? (o.status === 'CLOSED' ? 'rgba(239,68,68,0.12)' : 'rgba(74,222,128,0.08)') : 'transparent',
                          }}>
                          <div className="flex-shrink-0 w-24">
                            {isNow && (
                              <span className="inline-block text-[9px] font-black px-1.5 py-0.5 rounded mb-1"
                                style={{ background: o.status === 'CLOSED' ? '#ef4444' : '#22c55e', color: 'white' }}>
                                TODAY
                              </span>
                            )}
                            <p className="text-xs font-bold" style={{ color: o.status === 'CLOSED' ? '#f87171' : o.status === 'OPEN' ? '#4ade80' : 'rgba(255,255,255,0.7)' }}>
                              {o.status === 'CLOSED' ? '⛔' : o.status === 'OPEN' ? '✅' : '—'} {o.dates}
                            </p>
                          </div>
                          <p className="text-xs leading-relaxed flex-1" style={{ color: isNow ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)' }}>{o.notes}</p>
                        </div>
                      )
                    })}
                    <a href={er.url} target="_blank" rel="noopener noreferrer"
                      className="block text-xs font-semibold px-4 py-3 active:opacity-70"
                      style={{ color: '#f97316', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      Official rule source at WDFW.wa.gov →
                    </a>
                  </div>
                </div>
              )}

              {/* ── Pamphlet season — today's windows only, future hidden ── */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {er ? 'PAMPHLET SEASON (may be overridden above)' : 'SEASON RULES'}
                </p>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  {(() => {
                    const todayEntries = currentItem.allEntries.filter(e => isSeasonActiveToday(e))
                    const futureEntries = currentItem.allEntries.filter(e => !isSeasonActiveToday(e))
                    const hasToday = todayEntries.length > 0
                    const hasFuture = futureEntries.length > 0
                    const visibleEntries = hasToday ? todayEntries : currentItem.allEntries.slice(0, 1)

                    return (
                      <>
                        {/* Today's entries (or "closed" notice) */}
                        {hasToday ? visibleEntries.map((entry, i) => (
                          <div key={i} className="px-4 py-3"
                            style={{
                              borderBottom: (hasFuture) ? '1px solid rgba(255,255,255,0.07)' : 'none',
                              background: 'rgba(74,222,128,0.05)',
                            }}>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                                style={{ background: '#22c55e', color: 'white' }}>TODAY</span>
                              <span className="text-sm font-bold" style={{ color: '#4ade80' }}>✅ Open now</span>
                              {entry.dailyLimit && (
                                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                  · Limit: <span style={{ color: 'rgba(255,255,255,0.8)' }}>{entry.dailyLimit}</span>
                                </span>
                              )}
                            </div>
                            {entry.open && (
                              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{entry.open}</p>
                            )}
                            {entry.notes && (
                              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{entry.notes}</p>
                            )}
                          </div>
                        )) : (
                          <div className="px-4 py-3" style={{ borderBottom: hasFuture ? '1px solid rgba(255,255,255,0.07)' : 'none', background: 'var(--bg)' }}>
                            <span className="text-sm font-bold" style={{ color: '#f87171' }}>⛔ Closed today</span>
                            {currentItem.allEntries[0]?.notes && (
                              <p className="text-sm mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                {currentItem.allEntries[0].notes}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Future seasons toggle */}
                        {hasFuture && (
                          <>
                            <button
                              onClick={() => setShowFutureSeasons(v => !v)}
                              className="w-full px-4 py-2.5 flex items-center justify-between active:opacity-70"
                              style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {showFutureSeasons ? 'Hide future seasons' : `View future seasons (${futureEntries.length})`}
                              </span>
                              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                                {showFutureSeasons ? '▲' : '▼'}
                              </span>
                            </button>

                            {showFutureSeasons && futureEntries.map((entry, i) => (
                              <div key={i} className="px-4 py-3"
                                style={{
                                  borderTop: '1px solid rgba(255,255,255,0.06)',
                                  background: 'var(--bg)',
                                }}>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-sm font-bold" style={{ color: entry.closed ? '#f87171' : 'rgba(255,255,255,0.45)' }}>
                                    {entry.closed ? '⛔ Closed' : '🗓 ' + (entry.open || '—')}
                                  </span>
                                  {!entry.closed && entry.dailyLimit && (
                                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                      · Limit: {entry.dailyLimit}
                                    </span>
                                  )}
                                </div>
                                {entry.notes && (
                                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{entry.notes}</p>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Gear rules */}
              {section.gearIcons.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>GEAR RULES</p>
                  <div className="flex flex-wrap gap-1.5">
                    {section.gearIcons.map(code => <GearBadge key={code} code={code} />)}
                  </div>
                </div>
              )}

              {/* Gear periods */}
              {section.gearPeriods.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>GEAR CALENDAR</p>
                  <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {section.gearPeriods.map((p, i) => (
                      <div key={i} className="px-3 py-2.5 flex gap-3 items-baseline"
                        style={{ borderBottom: i < section.gearPeriods.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg)' }}>
                        <span className="text-sm font-semibold flex-shrink-0 w-28 text-white">{p.dates}</span>
                        <span className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>{p.rules}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Boundary */}
              <p className="text-xs leading-relaxed pb-2" style={{ color: 'var(--text-faint)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>Boundary: </span>
                {section.boundary}
              </p>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ─── River detail data ────────────────────────────────────────────────────────

const RIVER_DETAILS: Record<string, { description: string; access: string[]; fishingTips: string[] }> = {
  skagit:    { description: 'One of Washington\'s premier salmon and steelhead rivers, flowing from the Cascade mountains to Puget Sound near Burlington.', access: ['Rasar State Park (river left, good bank access)', 'Howard Miller Steelhead Park in Rockport', 'Marblemount boat launch', 'Various county road pullouts on Hwy 20'], fishingTips: ['Best steelhead Nov–March; Chinook in late summer/fall', 'Wade near seams and tailouts — fish rest in slower water', 'Check Skagit River above Concrete for wild steelhead rules — adipose must be intact = release', 'Watch for tribal net closures — check WDFW before each trip'] },
  snohomish: { description: 'The Snohomish River drains the Skykomish and Snoqualmie rivers near Monroe, offering fall Coho and Chinook runs.', access: ['Ebey Waterfront Park in Everett', 'Spencer Island natural area', 'Langus Riverfront Park', 'Boat launch at Lake Stevens'], fishingTips: ['Fall Coho arrive Oct–Nov — fish tidal flats and river mouth', 'Best bank fishing near river mouth at high tide', 'Chinook in Aug–Sept; Coho Oct–Nov', 'Troll herring or hootchies from boat in lower river'] },
  columbia:  { description: 'The Columbia River forms Washington\'s southern border and supports world-class Chinook salmon, steelhead, and walleye fisheries.', access: ['Hood Park in Pasco', 'Columbia Park in Kennewick', 'Crow Butte State Park', 'McNary Wildlife Refuge'], fishingTips: ['Walleye are the most reliable year-round bite — especially around Tri-Cities', 'Troll crankbaits for walleye along channel edges at dusk', 'Chinook season typically May–June (check yearly)', 'Sturgeon fishing below McNary Dam is excellent'] },
  yakima:    { description: 'One of WA\'s top trout streams — the Yakima is a blue-ribbon fly fishery for rainbow and brown trout flowing through wine country.', access: ['Umtanum Recreation Area', 'Roza Recreation Site', 'Various pullouts on Hwy 821 (Canyon Road)', 'Ellensburg city access'], fishingTips: ['Selective gear rules apply most of the river — artificial lures and flies only', 'Dry fly fishing excellent July–September (caddis, PMD hatches)', 'Nymph fish in deeper runs during winter and early spring', 'Best access via Canyon Rd (Hwy 821) through the canyon', 'Mostly catch-and-release — wild rainbows are beautiful'] },
  green:     { description: 'The Green River flows from the Cascades through Kent and Auburn, supporting fall salmon runs and a year-round trout fishery.', access: ['Flaming Geyser State Park', 'Auburn Narrows', 'Various access points along Auburn-Black Diamond Rd'], fishingTips: ['Coho run Oct–Nov through Auburn', 'Steelhead Dec–March in lower river', 'Check tribal fishing closures — Green River has co-management', 'Foot access mostly; some drift boat use'] },
  cedar:     { description: 'The Cedar River through Renton supports Lake Washington\'s massive sockeye run — one of the largest in the lower 48.', access: ['Cedar River Park in Renton (main access)', 'Landsburg Park (upper river)', 'Maplewood Golf Course area'], fishingTips: ['Sockeye season is closely managed — check WDFW for exact open dates in Aug–Sept', 'Cedar River can close with very little notice — watch emergency rules', 'Cutthroat fishing good in upper river near Landsburg', 'River in Renton: watch bald eagles during sockeye run'] },
  snake:          { description: 'The Snake River along WA\'s southeastern border offers steelhead, walleye, smallmouth bass, and Chinook salmon.', access: ['Clarkston boat launch', 'Chief Looking Glass Park', 'Asotin boat ramp', 'Hells Canyon NRA launch points'], fishingTips: ['Walleye and smallmouth bass are excellent and less regulated than salmon', 'Steelhead run Aug–Dec; fish near tributary mouths', 'Lower Snake has strong walleye fishery near Ice Harbor Dam', 'Jet boat or drift boat strongly recommended — limited bank access in canyon'] },
  sauk:           { description: 'The Sauk River is a major tributary of the Skagit, draining the Glacier Peak Wilderness. It supports wild steelhead and salmon runs in a stunning mountain setting.', access: ['Howard Miller Steelhead Park (at Skagit confluence)', 'Sauk Prairie pull-outs on Mountain Loop Hwy', 'Bedal Campground (upper river)', 'Various county road pull-outs'], fishingTips: ['Winter steelhead Dec–March; wild fish must be released — hatchery fish only', 'High gradient river — flows rise and drop quickly after rain', 'Excellent salmon habitat — Chinook and Coho in fall', 'Check WDFW for emergency closures — Sauk is sensitive to low returns'] },
  nooksack:       { description: 'The Nooksack River drains the north Cascades near Mount Baker, flowing through Bellingham to Bellingham Bay. Supports Chinook, Coho, chum, and steelhead.', access: ['Maple Falls area pull-outs (upper river)', 'Bertrand Creek confluence area', 'Bay Road near Ferndale (lower river)', 'Hovander Homestead Park in Ferndale'], fishingTips: ['Three forks: North, Middle, and South Fork have different regulations — check carefully', 'North Fork has some of the best steelhead habitat', 'Chinook fall run Aug–Oct; Coho Oct–Nov', 'Clear water river — light leaders and natural presentations work best'] },
  stillaguamish:  { description: 'The Stillaguamish (Stilly) flows through Arlington to Port Susan Bay, with a North and South Fork. Known for steelhead and salmon, with excellent native trout fishing in upper reaches.', access: ['Jordan Road accesses (upper North Fork)', 'Hazel boat launch (North Fork)', 'Arlington city park (lower river)', 'Various WDFW access sites along Hwy 530'], fishingTips: ['North Fork steelhead Nov–March; wild steelhead must be released', 'South Fork: check tribal closures carefully — shared management', 'Coho run strong Oct–Nov in lower river', 'Watch for log jams after high water — river changes rapidly'] },
}

// ─── Main types ───────────────────────────────────────────────────────────────

type RiverData = {
  id: string
  name: string
  region: string
  usgsId: string
  targetSpecies: string[]
  idealCfs: { min: number; max: number }
}

type FlowData = {
  cfs: number | null
  status: 'ideal' | 'low' | 'high' | 'loading' | 'error'
  trend: 'rising' | 'falling' | 'stable' | null
  fetchedAt: string
}

interface Props {
  river: RiverData
  flow: FlowData
  onClose: () => void
  zIndex?: number
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RiverDetailSheet({ river, flow: initialFlow, onClose, zIndex = 50 }: Props) {
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number>(0)
  const [cardOpen, setCardOpen] = useState(false)
  const [touchStartX, setTouchStartX] = useState(0)
  const [selectedFish, setSelectedFish] = useState<Species | null>(null)
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null)
  const [flow, setFlow] = useState<FlowData>(initialFlow)

  // Self-fetch USGS data when opened without live flow (e.g. from fish page)
  useEffect(() => {
    if (initialFlow.cfs !== null) return
    async function fetchFlow() {
      try {
        const url = `https://waterservices.usgs.gov/nwis/iv/?sites=${river.usgsId}&parameterCd=00060&format=json&period=PT2H`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const values = data?.value?.timeSeries?.[0]?.values?.[0]?.value
        if (!values?.length) throw new Error('no data')
        const latest = parseFloat(values[values.length - 1]?.value)
        const prev   = values.length > 1 ? parseFloat(values[values.length - 2]?.value) : latest
        const trend: FlowData['trend'] = latest > prev * 1.05 ? 'rising' : latest < prev * 0.95 ? 'falling' : 'stable'
        const cfs = latest
        const min = river.idealCfs.min, max = river.idealCfs.max
        const status: FlowData['status'] = cfs < min * 0.5 ? 'low' : cfs > max * 1.5 ? 'high' : cfs >= min && cfs <= max ? 'ideal' : 'low'
        setFlow({ cfs, status, trend, fetchedAt: new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) })
      } catch {
        setFlow(f => ({ ...f, status: 'error' }))
      }
    }
    fetchFlow()
  }, [river.usgsId, initialFlow.cfs, river.idealCfs.min, river.idealCfs.max])

  const hasSections = river.id === 'skagit' && SKAGIT_SECTIONS.length > 0
  const sections = hasSections ? SKAGIT_SECTIONS : null

  const segments = useMemo<MapSegment[]>(() => {
    if (river.id === 'skagit') return buildSkagitSegments()
    return buildFullRiverSegment(river.id)
  }, [river.id])

  const details = RIVER_DETAILS[river.id]

  const handleTileClick = (idx: number) => {
    setSelectedSectionIdx(idx)
    setSelectedSpecies(null)
    setCardOpen(true)
  }

  const goPrev = () => {
    if (!sections) return
    setSelectedSectionIdx(i => Math.max(i - 1, 0))
    // species stays set — swipe navigates sections for same fish
  }
  const goNext = () => {
    if (!sections) return
    setSelectedSectionIdx(i => Math.min(i + 1, sections.length - 1))
    // species stays set — swipe navigates sections for same fish
  }
  const closeCard = () => {
    setCardOpen(false)
    setSelectedSpecies(null)
  }

  // Swipe right = pop innermost layer: fish drill-down → section card → close sheet
  // The restriction card div intercepts its own swipes (stopPropagation), so this
  // handler only fires when the card is NOT intercepting (header/map area, or card closed)
  const handleBack = useCallback(() => {
    if (selectedSpecies) setSelectedSpecies(null)
    else if (cardOpen) closeCard()
    else onClose()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpecies, cardOpen, onClose])
  const swipeBack = useSwipeBack(handleBack)

  const currentSection = sections?.[selectedSectionIdx] ?? null

  return (
    <>
      <div
        className="fixed inset-0 flex flex-col justify-end"
        style={{ zIndex, background: 'rgba(0,0,0,0.75)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          className="animate-slide-up rounded-t-2xl flex flex-col overflow-hidden"
          style={{ background: '#0d0f1a', height: '92dvh', position: 'relative' }}
          {...swipeBack}
        >

          {/* ── Header ── */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-base font-bold text-white">{river.name}</h2>
                <FlowBadge status={flow.status} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {flow.cfs !== null ? `${formatCfs(flow.cfs)} cfs` : 'No data'}{flow.trend ? ` · ${flow.trend === 'rising' ? '↑' : flow.trend === 'falling' ? '↓' : '→'} ${flow.trend}` : ''} · {river.region}
              </p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-2"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* ── Map — tap to close card if open ── */}
          <div style={{ height: 200, flexShrink: 0 }}
            onClick={() => { if (cardOpen) closeCard() }}>
            <RiverDetailMapInner
              segments={segments}
              selectedIdx={cardOpen ? selectedSectionIdx : -1}
              onSegmentClick={idx => { setSelectedSectionIdx(idx); setSelectedSpecies(null); setCardOpen(true) }}
            />
          </div>

          {/* ── Section tile strip ── */}
          {hasSections && sections && (
            <div className="flex-shrink-0 relative"
              style={{
                background: 'rgba(0,0,0,0.35)',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}>
              {/* right-edge scroll hint fade */}
              <div className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none z-10"
                style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.7))' }} />
              <div className="overflow-x-auto no-scrollbar px-3 py-3"
                style={{ scrollSnapType: 'x mandatory' }}
                onTouchStart={e => e.stopPropagation()}
                onTouchEnd={e => e.stopPropagation()}>
                <div className="flex gap-2" style={{ paddingRight: 40 }}>
                  {sections.map((section, i) => {
                    const selected = selectedSectionIdx === i && cardOpen
                    // When a fish is selected, compute its status for THIS tile's section
                    const tileFishStatus: TileFishStatus | null = selectedSpecies
                      ? getSpeciesStatusForTile(section, selectedSpecies)
                      : null
                    const tc = tileFishStatus ? TILE_STATUS_COLORS[tileFishStatus] : null

                    // Background & border: fish-status-aware when a species is selected,
                    // else fall back to the classic orange-selected / neutral-unselected style
                    const tileBg     = tc ? tc.bg : selected
                      ? 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.10))'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))'
                    const tileBorder = tc
                      ? `${selected ? '2px' : '1.5px'} solid ${tc.border}`
                      : selected
                        ? '1.5px solid rgba(249,115,22,0.7)'
                        : '1.5px solid rgba(255,255,255,0.18)'
                    const tileShadow = tc ? tc.glow : selected
                      ? '0 0 14px rgba(249,115,22,0.25), 0 2px 8px rgba(0,0,0,0.4)'
                      : '0 2px 8px rgba(0,0,0,0.4)'
                    const numBg    = tc ? tc.numBg    : selected ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.1)'
                    const numColor = tc ? tc.numColor : selected ? '#f97316' : 'rgba(255,255,255,0.5)'
                    const nameColor = tc ? tc.nameColor : selected ? '#fdba74' : 'rgba(255,255,255,0.9)'
                    const hintColor = tc ? tc.numColor : selected ? '#f97316' : 'rgba(255,255,255,0.3)'

                    return (
                      <button key={section.id}
                        onClick={() => handleTileClick(i)}
                        className="flex-shrink-0 text-left transition-all active:scale-[0.95]"
                        style={{
                          scrollSnapAlign: 'start',
                          minWidth: 160,
                          maxWidth: 200,
                          borderRadius: 14,
                          padding: '10px 12px',
                          background: tileBg,
                          border: tileBorder,
                          boxShadow: tileShadow,
                          transform: selected ? 'translateY(-1px)' : 'none',
                        }}>
                        {/* Top row: pin icon + section number */}
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontSize: 13 }}>📍</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: numBg, color: numColor }}>
                            {i + 1}/{sections.length}
                          </span>
                        </div>
                        {/* Section name */}
                        <p className="text-sm font-bold leading-snug"
                          style={{
                            color: nameColor,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                          {section.name}
                        </p>
                        {/* Status hint row */}
                        <p className="text-[10px] mt-0.5 font-semibold"
                          style={{ color: hintColor }}>
                          {selected ? 'Viewing ›' : tileFishStatus
                            ? tileFishStatus === 'green'  ? '● Open ›'
                            : tileFishStatus === 'orange' ? '⚠ Open / restricted ›'
                            : tileFishStatus === 'red'    ? '○ Closed ›'
                            :                               '? No data ›'
                            : 'Tap to view ›'}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Content area ── */}
          <div className="flex-1 overflow-y-auto no-scrollbar" style={{ position: 'relative', minHeight: 0 }}>

            {/* Default content (always rendered, hidden behind card when open) */}
            <div className="p-4 space-y-4"
              style={{ visibility: cardOpen ? 'hidden' : 'visible' }}>

              {hasSections && (
                <div />
              )}

              {/* River about */}
              {details && (
                <div>
                  <p className="text-[10px] font-bold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>About this River</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{details.description}</p>
                </div>
              )}

              {/* Fish grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {river.targetSpecies.map(name => {
                  const sp = SPECIES.find(s => s.name === name || s.name.includes(name) || name.includes(s.name.split(' ')[0]))
                  return (
                    <button key={name}
                      onClick={() => sp ? setSelectedFish(sp) : undefined}
                      className="flex flex-col items-center rounded-xl overflow-hidden transition-all active:scale-95"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1.5px solid rgba(242,101,34,0.4)',
                      }}>
                      <div className="w-full aspect-square relative" style={{ background: '#0a0c14' }}>
                        {sp?.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sp.photo} alt={name} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🐟</div>
                        )}
                        <div className="absolute top-1 left-1 px-1 py-0.5 rounded text-[9px] font-black"
                          style={{ background: 'rgba(242,101,34,0.85)', color: 'white', letterSpacing: '0.02em' }}>
                          ★
                        </div>
                      </div>
                      <p className="w-full text-center text-[10px] font-semibold px-1 py-1.5 leading-tight"
                        style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {name}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* Access points */}
              {details?.access && (
                <div>
                  <p className="text-[10px] font-bold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Access Points</p>
                  <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {details.access.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2.5 px-3 py-2.5"
                        style={{ borderBottom: i < details.access.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg)' }}>
                        <span className="text-sm flex-shrink-0 mt-0.5">📍</span>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fishing tips */}
              {details?.fishingTips && (
                <div>
                  <p className="text-[10px] font-bold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>River Tips</p>
                  <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {details.fishingTips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2.5 px-3 py-2.5"
                        style={{ borderBottom: i < details.fishingTips.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg)' }}>
                        <span className="flex-shrink-0 font-bold mt-0.5" style={{ color: '#f26522', fontSize: 14 }}>›</span>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WDFW warning */}
              <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#ef4444' }}>⚠️ VERIFY BEFORE YOU FISH</p>
                <a href="https://wdfw.wa.gov/fishing/regulations" target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold underline" style={{ color: '#f26522' }}>
                  Check current regulations at WDFW.wa.gov →
                </a>
              </div>
            </div>

            {/* Restriction card — slides up over default content */}
            <div
              style={{
                position: 'absolute', inset: 0,
                transform: cardOpen ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.28s ease',
                background: '#0d0f1a',
                overflow: 'hidden',
              }}
              onTouchStart={e => { e.stopPropagation(); setTouchStartX(e.touches[0].clientX) }}
              onTouchEnd={e => {
                e.stopPropagation()
                const dx = e.changedTouches[0].clientX - touchStartX
                if (Math.abs(dx) > 50) {
                  if (dx < 0) goNext()
                  else if (selectedSpecies) setSelectedSpecies(null)  // back: fish drill-down → section
                  else closeCard()                                     // back: section card → river view
                }
              }}
            >
              {currentSection && (
                <RestrictionCard
                  section={currentSection}
                  sectionIdx={selectedSectionIdx}
                  totalSections={sections!.length}
                  onClose={closeCard}
                  onPrev={goPrev}
                  onNext={goNext}
                  selectedSpecies={selectedSpecies}
                  setSelectedSpecies={setSelectedSpecies}
                  onSelectFish={setSelectedFish}
                />
              )}
              {!currentSection && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Tap a section tile to see details</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {selectedFish && (
        <FishDetailSheet species={selectedFish} onClose={() => setSelectedFish(null)} showTips zIndex={zIndex + 30} />
      )}
    </>
  )
}
