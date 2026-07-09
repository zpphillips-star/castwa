'use client'
import { useState, useEffect, useCallback } from 'react'
import BottomNav from '@/components/BottomNav'
import WaterDetailSheet from '@/components/WaterDetailSheet'
import RiverDetailSheet from '@/components/RiverDetailSheet'
import { WATER_BODIES, REGULATIONS, isOpenOn } from '@/lib/fishing-data'
import type { WaterBody } from '@/lib/fishing-data'

// ─── Canonical river list (matches RiverDetailSheet / FishDetailSheet) ────────
// Every river water body must open RiverDetailSheet — this is the single source of
// truth for which water bodies are "rivers" that get the river detail view.
type RiverEntry = {
  id: string
  name: string
  region: string
  usgsId: string
  targetSpecies: string[]
  idealCfs: { min: number; max: number }
}

const ALL_RIVERS: RiverEntry[] = [
  { id: 'skagit',        name: 'Skagit River',        region: 'Northwest',   usgsId: '12200500', targetSpecies: ['Chinook Salmon','Coho Salmon','Steelhead'],              idealCfs: { min: 3000,  max: 18000  } },
  { id: 'snohomish',     name: 'Snohomish River',      region: 'Northwest',   usgsId: '12150800', targetSpecies: ['Coho Salmon','Chinook Salmon','Steelhead'],              idealCfs: { min: 2000,  max: 12000  } },
  { id: 'nooksack',      name: 'Nooksack River',       region: 'Northwest',   usgsId: '12210500', targetSpecies: ['Chinook Salmon','Coho Salmon','Steelhead'],              idealCfs: { min: 1500,  max: 8000   } },
  { id: 'stillaguamish', name: 'Stillaguamish River',  region: 'Northwest',   usgsId: '12167000', targetSpecies: ['Coho Salmon','Chinook Salmon','Steelhead'],              idealCfs: { min: 800,   max: 5000   } },
  { id: 'sauk',          name: 'Sauk River',           region: 'Northwest',   usgsId: '12186000', targetSpecies: ['Chinook Salmon','Steelhead'],                           idealCfs: { min: 500,   max: 3000   } },
  { id: 'skykomish',     name: 'Skykomish River',      region: 'Northwest',   usgsId: '12134500', targetSpecies: ['Coho Salmon','Chinook Salmon','Steelhead'],              idealCfs: { min: 1000,  max: 8000   } },
  { id: 'columbia',      name: 'Columbia River',       region: 'Southeast',   usgsId: '14105700', targetSpecies: ['Chinook Salmon','Steelhead','Walleye','White Sturgeon'], idealCfs: { min: 80000, max: 250000 } },
  { id: 'snake',         name: 'Snake River',          region: 'Southeast',   usgsId: '13334300', targetSpecies: ['Steelhead','Chinook Salmon','Walleye'],                  idealCfs: { min: 10000, max: 80000  } },
  { id: 'yakima',        name: 'Yakima River',         region: 'Central',     usgsId: '12492800', targetSpecies: ['Rainbow Trout','Steelhead','Cutthroat Trout'],           idealCfs: { min: 800,   max: 5000   } },
  { id: 'cowlitz',       name: 'Cowlitz River',        region: 'Southwest',   usgsId: '14243000', targetSpecies: ['Chinook Salmon','Coho Salmon','Steelhead'],              idealCfs: { min: 2000,  max: 15000  } },
  { id: 'green',         name: 'Green River',          region: 'Puget Sound', usgsId: '12113000', targetSpecies: ['Coho Salmon','Chinook Salmon','Steelhead'],              idealCfs: { min: 500,   max: 4000   } },
  { id: 'puyallup',      name: 'Puyallup River',       region: 'Puget Sound', usgsId: '12101500', targetSpecies: ['Coho Salmon','Chinook Salmon','Steelhead'],              idealCfs: { min: 1000,  max: 8000   } },
  { id: 'nisqually',     name: 'Nisqually River',      region: 'Puget Sound', usgsId: '12089500', targetSpecies: ['Chinook Salmon','Coho Salmon','Steelhead'],              idealCfs: { min: 500,   max: 4000   } },
  { id: 'hoh',           name: 'Hoh River',            region: 'Olympic',     usgsId: '12041200', targetSpecies: ['Chinook Salmon','Steelhead','Cutthroat Trout'],          idealCfs: { min: 1000,  max: 8000   } },
]

// Keep GAUGED_RIVERS / GAUGED_IDS as aliases for flow-fetching (same set of rivers)
type GaugedRiver = RiverEntry
const GAUGED_RIVERS: GaugedRiver[] = ALL_RIVERS
const GAUGED_IDS = new Set(GAUGED_RIVERS.map(r => r.id))

// Find a river entry by water body id or name (fuzzy)
function findRiverEntry(water: WaterBody): RiverEntry | null {
  const lower = water.name.toLowerCase()
  return (
    ALL_RIVERS.find(r => r.id === water.id) ??
    ALL_RIVERS.find(r => lower.includes(r.id) || r.name.toLowerCase() === lower) ??
    null
  )
}

type FlowStatus = 'ideal' | 'low' | 'high' | 'loading' | 'error'
type FlowData = { cfs: number | null; status: FlowStatus; trend: 'rising' | 'falling' | 'stable' | null }

function getFlowStatus(cfs: number, r: GaugedRiver): FlowStatus {
  if (cfs >= r.idealCfs.min && cfs <= r.idealCfs.max) return 'ideal'
  if (cfs < r.idealCfs.min) return 'low'
  return 'high'
}

function formatCfs(cfs: number): string {
  return cfs >= 10000 ? `${(cfs / 1000).toFixed(0)}k` : cfs.toLocaleString()
}

const FLOW_PALETTE: Record<FlowStatus, { color: string; label: string }> = {
  ideal:   { color: '#6ab04c', label: 'IDEAL'   },
  low:     { color: '#f26522', label: 'LOW'      },
  high:    { color: '#ef4444', label: 'HIGH'     },
  loading: { color: '#6b7280', label: '…'        },
  error:   { color: '#6b7280', label: 'N/A'      },
}

// ─── WA Grid Map ──────────────────────────────────────────────────────────────
// 4 columns × 2 rows covering WA state bounds
const LAT_ROWS = [49.0, 47.25, 45.5]      // row 0 = North (47.25–49.0), row 1 = South (45.5–47.25)
const LNG_COLS = [-124.7, -122.78, -120.86, -118.94, -116.9]  // col 0..3

function getGridCell(lat: number, lng: number): [number, number] | null {
  if (lat < LAT_ROWS[2] || lat > LAT_ROWS[0]) return null
  if (lng < LNG_COLS[0] || lng > LNG_COLS[4]) return null
  const row = lat >= LAT_ROWS[1] ? 0 : 1
  let col = -1
  for (let i = 0; i < 4; i++) {
    if (lng >= LNG_COLS[i] && lng <= LNG_COLS[i + 1]) { col = i; break }
  }
  if (col < 0) return null
  return [row, col]
}

// Static count of water bodies per cell (computed once at module load)
const CELL_COUNTS: Record<string, number> = (() => {
  const c: Record<string, number> = {}
  for (const w of WATER_BODIES) {
    const cell = getGridCell(w.lat, w.lng)
    if (cell) {
      const key = `${cell[0]}-${cell[1]}`
      c[key] = (c[key] || 0) + 1
    }
  }
  return c
})()

// Ultra-detail WA state outline — geographic bounds mapped to 600×380 viewBox
// x = (lng + 124.73) * 76.83  |  y = (49.00 - lat) * 109.83
// ~155 waypoints computed from real geographic coordinates, clockwise from NE corner.
// Idaho border → Snake River (NW loop then SW to Columbia) → Columbia River
// (Pasco → gorge → Portland area → Longview → coast) → Pacific coast
// (Long Beach Peninsula → Willapa Bay → Grays Harbor → Olympic coast → Cape Flattery)
// → Strait of Juan de Fuca → Port Townsend → Puget Sound west (Kitsap)
// → Olympia → Puget Sound east (Tacoma/Seattle/Everett)
// → Anacortes/Bellingham/Blaine → Z closes along 49th parallel
const WA_PATH =
  'M 591,0 ' +

  // ── Idaho (east) border south to Clarkston ──
  'L 591,283 ' +

  // ── Snake River: loops NW (Almota/Lyons Ferry), then swings SW to Columbia ──
  'L 563,272 L 539,264 L 521,266 L 501,268 L 480,268 ' +
  'L 468,283 L 460,296 L 454,304 L 438,304 ' +

  // ── Columbia River from Pasco to Pacific (detailed southern border) ──
  'L 434,307 ' +                  // Kennewick
  'L 425,305 L 418,311 ' +        // Wallula/McNary area
  'L 404,340 L 397,353 ' +        // river swings south (Umatilla area)
  'L 383,360 L 374,369 ' +        // John Day Dam N side / Blalock
  'L 364,372 L 351,371 L 335,371 L 318,371 ' +
  'L 307,369 L 291,369 L 276,369 ' +
  'L 264,366 L 248,365 ' +        // White Salmon
  'L 234,361 L 218,368 ' +        // Hood River WA side
  'L 200,373 L 187,375 L 168,375 ' + // Camas / Washougal
  'L 158,371 ' +                  // Vancouver WA
  'L 151,358 L 147,348 L 143,330 ' + // river bends NW (Longview)
  'L 141,315 L 136,309 ' +        // Kelso / Longview
  'L 115,296 L 106,309 ' +        // Cathlamet
  'L 90,305 L 78,289 ' +          // Skamokawa
  'L 65,302 L 54,303 L 51,304 ' + // Columbia mouth / Cape Disappointment

  // ── Pacific Coast going north (full detail) ──
  'L 51,290 ' +                   // just north of Cape Disappointment
  'L 51,276 ' +                   // Long Beach Peninsula mid (nearly straight spit)
  'L 51,259 ' +                   // Long Beach Peninsula north
  'L 51,248 ' +                   // approaching Willapa Bay entrance
  'L 52,231 ' +                   // Leadbetter Pt (north end of Long Beach Peninsula)
  'L 46,224 ' +                   // north of Willapa Bay entrance
  'L 46,216 ' +                   // Grayland
  'L 43,206 ' +                   // Westport
  'L 41,197 ' +                   // Point Brown (north Grays Harbor)
  'L 37,181 L 33,177 ' +
  'L 29,172 ' +                   // Moclips
  'L 28,168 L 29,162 ' +
  'L 26,157 ' +                   // Kalaloch
  'L 22,151 ' +
  'L 18,142 ' +                   // Hoh River mouth
  'L 16,136 ' +
  'L 13,131 ' +                   // Ruby Beach
  'L 10,126 ' +
  'L 8,121 ' +                    // La Push
  'L 7,118 L 6,112 L 3,105 ' +
  'L 2,98 L 3,92 L 3,83 ' +       // coast north of La Push
  'L 1,70 ' +                     // Cape Flattery (NW tip of WA)

  // ── Strait of Juan de Fuca east (north Olympic Peninsula coast) ──
  'L 8,70 ' +                     // Neah Bay
  'L 25,81 ' +                    // Makah area
  'L 36,83 ' +                    // Clallam Bay
  'L 51,90 ' +                    // Pillar Point
  'L 62,92 ' +                    // Freshwater Bay
  'L 75,91 L 82,91 ' +            // Joyce
  'L 94,95 ' +
  'L 99,98 ' +                    // Port Angeles
  'L 112,100 L 121,102 ' +        // Sequim
  'L 130,103 L 135,101 L 142,102 ' +
  'L 151,97 ' +                   // Port Townsend / Admiralty Inlet entrance

  // ── Puget Sound WEST side: south through Admiralty Inlet → Kitsap ──
  'L 147,106 L 143,115 ' +        // Admiralty Inlet west
  'L 142,122 ' +
  'L 140,129 ' +                  // Hood Canal entrance
  'L 139,138 L 139,147 ' +        // Kitsap north
  'L 138,156 L 137,165 L 136,176 ' +
  'L 137,189 ' +                  // Bremerton area
  'L 141,198 L 139,206 ' +        // Port Orchard
  'L 143,210 L 143,219 ' +        // entering South Sound
  'L 141,222 L 142,227 L 143,232 ' +
  'L 143,239 ' +                  // Olympia — southernmost point of Puget Sound

  // ── Puget Sound EAST side: north through Tacoma → Seattle → Everett ──
  'L 146,237 L 151,232 ' +        // east shore of south Sound
  'L 162,222 L 167,208 ' +        // Nisqually / DuPont area
  'L 170,188 L 176,191 ' +        // Tacoma Narrows
  'L 169,177 ' +                  // Tacoma
  'L 181,167 L 181,157 ' +        // Renton
  'L 188,145 L 184,138 ' +        // Seattle
  'L 182,129 L 181,124 L 180,119 ' + // N Seattle
  'L 182,115 ' +                  // Edmonds
  'L 185,111 L 192,108 ' +        // Mukilteo
  'L 193,103 ' +                  // Everett
  'L 188,98 L 187,94 ' +          // Possession Sound
  'L 178,88 ' +                   // around Whidbey / Saratoga Passage
  'L 169,68 ' +                   // Deception Pass / Fidalgo Island
  'L 163,59 ' +                   // Anacortes
  'L 157,52 ' +                   // Guemes Channel
  'L 151,41 ' +                   // Bellingham south
  'L 152,31 L 162,22 ' +          // Bellingham
  'L 170,13 L 173,8 L 174,0 ' +   // Blaine / US-Canada land border

  // Z closes straight across top (49th parallel) back to NE corner
  'Z'

// Cell grid: 4 cols × 2 rows over the 600×380 viewBox
const COL_W = 150   // 600 / 4
const ROW_H = 190   // 380 / 2

function WaGridMap({
  selected,
  onSelect,
}: {
  selected: [number, number] | null
  onSelect: (cell: [number, number] | null) => void
}) {
  return (
    <div style={{ marginBottom: '14px', borderRadius: '14px', overflow: 'hidden' }}>
      <svg
        viewBox="0 0 600 380"
        className="w-full"
        style={{ display: 'block' }}
      >
        <defs>
          {/* Clip everything to the WA state outline */}
          <clipPath id="wa-clip">
            <path d={WA_PATH} />
          </clipPath>
        </defs>

        {/* ── State fill (ocean/background behind the shape) ── */}
        <rect width="600" height="380" fill="var(--bg, #0d1117)" />

        {/* ── WA state shape ── */}
        <path
          d={WA_PATH}
          fill="#1a2035"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1.5"
        />

        {/* ── Grid + selections clipped to WA outline ── */}
        <g clipPath="url(#wa-clip)">

          {/* Selection highlight rects */}
          {[0, 1].flatMap(row =>
            [0, 1, 2, 3].map(col => {
              const isSelected = selected !== null && selected[0] === row && selected[1] === col
              if (!isSelected) return null
              return (
                <rect
                  key={`sel-${row}-${col}`}
                  x={col * COL_W}
                  y={row * ROW_H}
                  width={COL_W}
                  height={ROW_H}
                  fill="rgba(242,101,34,0.25)"
                  stroke="#f26522"
                  strokeWidth="1.5"
                />
              )
            })
          )}

          {/* Grid lines */}
          <line x1="150" y1="0" x2="150" y2="380" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="300" y1="0" x2="300" y2="380" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="450" y1="0" x2="450" y2="380" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="0" y1="190" x2="600" y2="190" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,4" />

        </g>

        {/* ── Water-count badges — NOT clipped, always visible ── */}
        {[0, 1].flatMap(row =>
          [0, 1, 2, 3].map(col => {
            const key = `${row}-${col}`
            const count = CELL_COUNTS[key] ?? 0
            const isSelected = selected !== null && selected[0] === row && selected[1] === col
            const cx = col * COL_W + COL_W / 2
            const cy = row * ROW_H + ROW_H / 2
            if (count === 0) return null
            return (
              <g key={`lbl-${row}-${col}`}>
                {/* dark pill so number pops against any background */}
                <rect
                  x={cx - 15}
                  y={cy - 13}
                  width={30}
                  height={26}
                  rx={13}
                  fill={isSelected ? 'rgba(242,101,34,0.85)' : 'rgba(0,0,0,0.6)'}
                />
                <text
                  x={cx}
                  y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="15"
                  fontWeight="800"
                  fill="#fff"
                  style={{ userSelect: 'none' }}
                >
                  {count}
                </text>
              </g>
            )
          })
        )}

        {/* ── Hit-test rects (invisible, on top, not clipped) ── */}
        {[0, 1].flatMap(row =>
          [0, 1, 2, 3].map(col => {
            const isSelected = selected !== null && selected[0] === row && selected[1] === col
            return (
              <rect
                key={`hit-${row}-${col}`}
                x={col * COL_W}
                y={row * ROW_H}
                width={COL_W}
                height={ROW_H}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(isSelected ? null : [row, col])}
              />
            )
          })
        )}
      </svg>
    </div>
  )
}

// ─── Section helpers ──────────────────────────────────────────────────────────
type WaterSection = {
  label: string
  borderColor: string
  waters: typeof WATER_BODIES
}

function buildSections(today: Date): WaterSection[] {
  const rivers  = WATER_BODIES.filter(w => w.type === 'river' || w.type === 'stream')
  const lakes   = WATER_BODIES.filter(w => w.type === 'lake')
  const marine  = WATER_BODIES.filter(w => w.type === 'sound' || w.type === 'bay')

  // Sort each section: waters with open regs first, then alpha
  function sortWaters(list: typeof WATER_BODIES) {
    return [...list].sort((a, b) => {
      const aOpen = REGULATIONS.some(r => r.waterBodyId === a.id && isOpenOn(r, today))
      const bOpen = REGULATIONS.some(r => r.waterBodyId === b.id && isOpenOn(r, today))
      if (aOpen && !bOpen) return -1
      if (!aOpen && bOpen) return 1
      return a.name.localeCompare(b.name)
    })
  }

  return [
    { label: 'Rivers & Streams', borderColor: '#60a5fa', waters: sortWaters(rivers) },
    { label: 'Lakes & Reservoirs', borderColor: '#34d399', waters: sortWaters(lakes) },
    { label: 'Marine, Sound & Bay', borderColor: '#22d3ee', waters: sortWaters(marine) },
  ].filter(s => s.waters.length > 0)
}

export default function WatersPage() {
  const today = new Date()
  const [flowData, setFlowData] = useState<Record<string, FlowData>>({})
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Rivers → RiverDetailSheet (gold-standard view); everything else → WaterDetailSheet
  const [selectedRiver, setSelectedRiver] = useState<RiverEntry | null>(null)
  const [selectedWaterName, setSelectedWaterName] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'river' | 'lake' | 'marine'>('all')
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)

  // ── Single entry-point for all water-body taps ────────────────────────────
  const openWater = useCallback((water: WaterBody) => {
    const river = findRiverEntry(water)
    if (river) {
      setSelectedRiver(river)
    } else {
      setSelectedWaterName(water.name)
    }
  }, [])

  const allSections = buildSections(today)

  // Waters in the selected grid cell (null = show all)
  const cellFilterIds: Set<string> | null = selectedCell
    ? new Set(
        WATER_BODIES
          .filter(w => {
            const c = getGridCell(w.lat, w.lng)
            return c !== null && c[0] === selectedCell[0] && c[1] === selectedCell[1]
          })
          .map(w => w.id)
      )
    : null

  // Filter sections: grid cell first, then type chip
  const visibleSections = allSections
    .map(section => ({
      ...section,
      waters: cellFilterIds
        ? section.waters.filter(w => cellFilterIds.has(w.id))
        : section.waters,
    }))
    .filter(section => {
      if (section.waters.length === 0) return false
      if (activeFilter === 'all') return true
      if (activeFilter === 'river') return section.label === 'Rivers & Streams'
      if (activeFilter === 'lake') return section.label === 'Lakes & Reservoirs'
      return section.label === 'Marine, Sound & Bay'
    })

  // Top 4 featured waters — gauged rivers with open species first, then by open count
  const featuredWaters = [...WATER_BODIES]
    .map(w => ({
      water: w,
      openCount: new Set(
        REGULATIONS.filter(r => r.waterBodyId === w.id && isOpenOn(r, today)).map(r => r.speciesId)
      ).size,
      isGaugedRiver: GAUGED_IDS.has(w.id) && (w.type === 'river' || w.type === 'stream'),
    }))
    .filter(x => x.openCount > 0)
    .sort((a, b) => {
      // Gauged rivers always rank above non-gauged waters
      if (a.isGaugedRiver && !b.isGaugedRiver) return -1
      if (!a.isGaugedRiver && b.isGaugedRiver) return 1
      return b.openCount - a.openCount
    })
    .slice(0, 4)

  // Fetch all USGS gauges in one request
  useEffect(() => {
    async function fetchFlows() {
      setLoading(true)
      const results: Record<string, FlowData> = {}
      const ids = GAUGED_RIVERS.map(r => r.usgsId).join(',')
      try {
        const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${ids}&parameterCd=00060&period=PT2H&siteStatus=active`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const series = data?.value?.timeSeries ?? []
        for (const river of GAUGED_RIVERS) {
          const ts = series.find((s: { sourceInfo: { siteCode: { value: string }[] } }) =>
            s.sourceInfo?.siteCode?.[0]?.value === river.usgsId
          )
          const values = ts?.values?.[0]?.value ?? []
          const latest = values.length ? parseFloat(values[values.length - 1].value) : null
          const prev   = values.length > 1 ? parseFloat(values[values.length - 2].value) : latest
          const trend = latest !== null && prev !== null
            ? (latest > prev * 1.05 ? 'rising' : latest < prev * 0.95 ? 'falling' : 'stable')
            : null
          results[river.id] = {
            cfs: latest,
            status: latest !== null ? getFlowStatus(latest, river) : 'error',
            trend,
          }
        }
      } catch {
        for (const r of GAUGED_RIVERS) results[r.id] = { cfs: null, status: 'error', trend: null }
      }
      setFlowData(results)
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
      setLoading(false)
    }
    fetchFlows()
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', paddingBottom: '100px' }}>
      <header className="glass-header sticky top-0 z-30 px-4">
        <div className="max-w-lg mx-auto py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Waters</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {lastUpdated ? `Gauges updated ${lastUpdated}` : loading ? 'Loading gauges…' : 'Tap any water for details'}
          </p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-3">

        {/* ── Featured: top 4 waters with most open fishing ── */}
        {activeFilter === 'all' && selectedCell === null && featuredWaters.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>
                Most Active Right Now
              </h2>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Top waters today</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {featuredWaters.map(({ water, openCount }) => {
                const isGauged = GAUGED_IDS.has(water.id)
                const flow = flowData[water.id]
                const palette = flow ? FLOW_PALETTE[flow.status] : null
                const waterTypeLabel = water.type === 'lake' ? 'Lake'
                  : water.type === 'sound' || water.type === 'bay' ? 'Marine'
                  : 'River'
                return (
                  <button
                    key={water.id}
                    onClick={() => openWater(water)}
                    className="rounded-2xl text-left transition-all active:scale-[0.97] flex flex-col"
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid var(--border)`,
                      borderTop: `3px solid ${palette?.color ?? '#6ab04c'}`,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Top stripe with type label */}
                    <div className="px-4 pt-4 pb-3 flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                          style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                          {waterTypeLabel}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded"
                          style={{ background: 'rgba(106,176,76,0.15)', color: '#6ab04c' }}>
                          {openCount} open
                        </span>
                      </div>
                      <p className="text-base font-black text-white leading-tight mb-0.5">{water.name}</p>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-faint)' }}>{water.region}</p>
                    </div>
                    {/* Flow footer */}
                    {isGauged && flow && flow.cfs !== null && palette ? (
                      <div className="px-4 py-3 flex items-center gap-2"
                        style={{ borderTop: '1px solid var(--border)', background: `${palette.color}0d` }}>
                        <span className="text-lg font-black tabular-nums leading-none" style={{ color: palette.color }}>
                          {formatCfs(flow.cfs)}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>cfs</span>
                        <span className="text-xs font-bold ml-auto" style={{ color: palette.color }}>{palette.label}</span>
                      </div>
                    ) : (
                      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Tap for details</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── WA State Grid Map ── */}
        <WaGridMap selected={selectedCell} onSelect={setSelectedCell} />

        {/* ── Filter chips ── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
          {([
            { key: 'all',    label: 'All Waters' },
            { key: 'river',  label: 'Rivers' },
            { key: 'lake',   label: 'Lakes' },
            { key: 'marine', label: 'Marine' },
          ] as { key: typeof activeFilter; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="flex-shrink-0 px-6 py-3 rounded-xl text-base font-bold transition-all active:scale-95"
              style={{
                background: activeFilter === f.key ? 'var(--accent)' : 'var(--surface)',
                color: activeFilter === f.key ? '#fff' : 'var(--text-muted)',
                border: `2px solid ${activeFilter === f.key ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Water sections ── */}
        {visibleSections.map(section => (
          <div key={section.label} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>
                {section.label}
              </h2>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>· {section.waters.length}</span>
            </div>

            {/* Water rows */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {section.waters.map((water, idx) => {
                const isGauged = GAUGED_IDS.has(water.id)
                const flow = flowData[water.id]
                const palette = flow ? FLOW_PALETTE[flow.status] : null
                const trendIcon = flow?.trend === 'rising' ? '↑' : flow?.trend === 'falling' ? '↓' : flow?.trend === 'stable' ? '→' : null
                const trendColor = flow?.trend === 'rising' ? '#ef4444' : flow?.trend === 'falling' ? '#60a5fa' : '#22c55e'

                // Open species count for this water
                const openRegs = REGULATIONS.filter(r => r.waterBodyId === water.id && isOpenOn(r, today))
                const openCount = new Set(openRegs.map(r => r.speciesId)).size

                return (
                  <button
                    key={water.id}
                    onClick={() => openWater(water)}
                    className="w-full text-left transition-all active:scale-[0.99]"
                    style={{
                      background: 'var(--surface)',
                      border: 'none',
                      borderBottom: idx < section.waters.length - 1 ? '1px solid var(--border)' : 'none',
                      borderLeft: `4px solid ${palette?.color ?? section.borderColor}`,
                      borderRadius: 0,
                      padding: '14px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: name + region */}
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-white leading-tight truncate">{water.name}</p>
                        {openCount > 0 && (
                          <p className="text-xs mt-0.5 font-bold" style={{ color: '#6ab04c' }}>
                            {openCount} open
                          </p>
                        )}
                      </div>

                      {/* Right: gauge OR open badge */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isGauged && flow ? (
                          <>
                            {flow.status === 'loading' ? (
                              <div className="w-14 h-6 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
                            ) : flow.cfs !== null ? (
                              <span className="text-xl font-black tabular-nums leading-none"
                                style={{ color: palette?.color }}>
                                {formatCfs(flow.cfs)}
                                <span className="text-[10px] font-semibold ml-0.5" style={{ color: 'var(--text-faint)' }}>cfs</span>
                              </span>
                            ) : null}
                            {palette && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: `${palette.color}1a`, color: palette.color }}>
                                {palette.label}
                              </span>
                            )}
                            {trendIcon && (
                              <span className="text-sm font-bold" style={{ color: trendColor }}>{trendIcon}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-lg font-light" style={{ color: 'var(--text-faint)' }}>›</span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="py-3 px-4 rounded-2xl mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>River gauge legend</p>
          <div className="flex items-center gap-6">
            {[['#6ab04c','Ideal flow'],['#f26522','Low'],['#ef4444','High']].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedWaterName && (
        <WaterDetailSheet
          waterName={selectedWaterName}
          onClose={() => setSelectedWaterName(null)}
        />
      )}
      {selectedRiver && (
        <RiverDetailSheet
          river={selectedRiver}
          flow={{
            cfs: flowData[selectedRiver.id]?.cfs ?? null,
            status: flowData[selectedRiver.id]?.status ?? 'loading',
            trend: flowData[selectedRiver.id]?.trend ?? null,
            fetchedAt: lastUpdated ?? '',
          }}
          onClose={() => setSelectedRiver(null)}
        />
      )}
      <BottomNav />
    </div>
  )
}
