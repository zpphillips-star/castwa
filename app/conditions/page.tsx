'use client'
import { useState, useEffect, useCallback } from 'react'
import BottomNav from '@/components/BottomNav'
import WaterDetailSheet from '@/components/WaterDetailSheet'
import { WATER_BODIES, REGULATIONS, SPECIES, isOpenOn } from '@/lib/fishing-data'
import type { WaterBody } from '@/lib/fishing-data'

// ─── Canonical river list — single source of truth ───────────────────────────
import { RiverEntry, GAUGED_RIVERS } from '@/lib/river-lookup'
import { WATER_COORDS } from '@/lib/water-coords'

// GAUGED_IDS: used to show flow-rate indicators only for gauged rivers
const GAUGED_IDS = new Set(GAUGED_RIVERS.map(r => r.id))

type FlowStatus = 'ideal' | 'low' | 'high' | 'loading' | 'error'
type FlowData = { cfs: number | null; status: FlowStatus; trend: 'rising' | 'falling' | 'stable' | null }

// ─── Haversine distance ───────────────────────────────────────────────────────
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function getFlowStatus(cfs: number, r: RiverEntry): FlowStatus {
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
const LAT_ROWS = [49.0, 47.25, 45.5]
const LNG_COLS = [-124.7, -122.78, -120.86, -118.94, -116.9]

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

const WA_PATH =
  'M 591,0 ' +
  'L 591,283 ' +
  'L 563,272 L 539,264 L 521,266 L 501,268 L 480,268 ' +
  'L 468,283 L 460,296 L 454,304 L 438,304 ' +
  'L 434,307 ' +
  'L 425,305 L 418,311 ' +
  'L 404,340 L 397,353 ' +
  'L 383,360 L 374,369 ' +
  'L 364,372 L 351,371 L 335,371 L 318,371 ' +
  'L 307,369 L 291,369 L 276,369 ' +
  'L 264,366 L 248,365 ' +
  'L 234,361 L 218,368 ' +
  'L 200,373 L 187,375 L 168,375 ' +
  'L 158,371 ' +
  'L 151,358 L 147,348 L 143,330 ' +
  'L 141,315 L 136,309 ' +
  'L 115,296 L 106,309 ' +
  'L 90,305 L 78,289 ' +
  'L 65,302 L 54,303 L 51,304 ' +
  'L 51,290 ' +
  'L 51,276 ' +
  'L 51,259 ' +
  'L 51,248 ' +
  'L 52,231 ' +
  'L 46,224 ' +
  'L 46,216 ' +
  'L 43,206 ' +
  'L 41,197 ' +
  'L 37,181 L 33,177 ' +
  'L 29,172 ' +
  'L 28,168 L 29,162 ' +
  'L 26,157 ' +
  'L 22,151 ' +
  'L 18,142 ' +
  'L 16,136 ' +
  'L 13,131 ' +
  'L 10,126 ' +
  'L 8,121 ' +
  'L 7,118 L 6,112 L 3,105 ' +
  'L 2,98 L 3,92 L 3,83 ' +
  'L 1,70 ' +
  'L 8,70 ' +
  'L 25,81 ' +
  'L 36,83 ' +
  'L 51,90 ' +
  'L 62,92 ' +
  'L 75,91 L 82,91 ' +
  'L 94,95 ' +
  'L 99,98 ' +
  'L 112,100 L 121,102 ' +
  'L 130,103 L 135,101 L 142,102 ' +
  'L 151,97 ' +
  'L 147,106 L 143,115 ' +
  'L 142,122 ' +
  'L 140,129 ' +
  'L 139,138 L 139,147 ' +
  'L 138,156 L 137,165 L 136,176 ' +
  'L 137,189 ' +
  'L 141,198 L 139,206 ' +
  'L 143,210 L 143,219 ' +
  'L 141,222 L 142,227 L 143,232 ' +
  'L 143,239 ' +
  'L 146,237 L 151,232 ' +
  'L 162,222 L 167,208 ' +
  'L 170,188 L 176,191 ' +
  'L 169,177 ' +
  'L 181,167 L 181,157 ' +
  'L 188,145 L 184,138 ' +
  'L 182,129 L 181,124 L 180,119 ' +
  'L 182,115 ' +
  'L 185,111 L 192,108 ' +
  'L 193,103 ' +
  'L 188,98 L 187,94 ' +
  'L 178,88 ' +
  'L 169,68 ' +
  'L 163,59 ' +
  'L 157,52 ' +
  'L 151,41 ' +
  'L 152,31 L 162,22 ' +
  'L 170,13 L 173,8 L 174,0 ' +
  'Z'

const COL_W = 150
const ROW_H = 190

function WaGridMap({
  selected,
  onSelect,
}: {
  selected: [number, number] | null
  onSelect: (cell: [number, number] | null) => void
}) {
  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden' }}>
      <svg viewBox="0 0 600 380" className="w-full" style={{ display: 'block' }}>
        <defs>
          <clipPath id="wa-clip">
            <path d={WA_PATH} />
          </clipPath>
        </defs>
        <rect width="600" height="380" fill="var(--bg, #0d1117)" />
        <path d={WA_PATH} fill="#1a2035" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        <g clipPath="url(#wa-clip)">
          {[0, 1].flatMap(row =>
            [0, 1, 2, 3].map(col => {
              const isSelected = selected !== null && selected[0] === row && selected[1] === col
              if (!isSelected) return null
              return (
                <rect key={`sel-${row}-${col}`}
                  x={col * COL_W} y={row * ROW_H} width={COL_W} height={ROW_H}
                  fill="rgba(242,101,34,0.25)" stroke="#f26522" strokeWidth="1.5"
                />
              )
            })
          )}
          <line x1="150" y1="0" x2="150" y2="380" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="300" y1="0" x2="300" y2="380" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="450" y1="0" x2="450" y2="380" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="0" y1="190" x2="600" y2="190" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,4" />
        </g>
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
                <rect x={cx - 15} y={cy - 13} width={30} height={26} rx={13}
                  fill={isSelected ? 'rgba(242,101,34,0.85)' : 'rgba(0,0,0,0.6)'} />
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                  fontSize="15" fontWeight="800" fill="#fff" style={{ userSelect: 'none' }}>
                  {count}
                </text>
              </g>
            )
          })
        )}
        {[0, 1].flatMap(row =>
          [0, 1, 2, 3].map(col => {
            const isSelected = selected !== null && selected[0] === row && selected[1] === col
            return (
              <rect key={`hit-${row}-${col}`}
                x={col * COL_W} y={row * ROW_H} width={COL_W} height={ROW_H}
                fill="transparent" style={{ cursor: 'pointer' }}
                onClick={() => onSelect(isSelected ? null : [row, col])}
              />
            )
          })
        )}
      </svg>
    </div>
  )
}

const REGION_LABELS: string[][] = [
  ['Northwest WA', 'North Central WA', 'Northeast WA', 'Far Northeast WA'],
  ['Southwest WA', 'South Central WA', 'Southeast WA', 'Far Southeast WA'],
]
function getRegionLabel(row: number, col: number): string {
  return REGION_LABELS[row]?.[col] ?? 'WA Region'
}

function RegionSheet({
  cell, today, flowData, onOpenWater, onClose,
}: {
  cell: [number, number]; today: Date; flowData: Record<string, FlowData>
  onOpenWater: (water: WaterBody) => void; onClose: () => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  const [row, col] = cell
  const label = getRegionLabel(row, col)
  const cellWaters = WATER_BODIES.filter(w => {
    const c = getGridCell(w.lat, w.lng)
    return c !== null && c[0] === row && c[1] === col
  })
  const groups = [
    { label: 'Rivers & Streams', waters: cellWaters.filter(w => w.type === 'river' || w.type === 'stream') },
    { label: 'Lakes & Reservoirs', waters: cellWaters.filter(w => w.type === 'lake') },
    { label: 'Marine, Sound & Bay', waters: cellWaters.filter(w => w.type === 'sound' || w.type === 'bay') },
  ].filter(g => g.waters.length > 0)
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
        background: 'var(--bg)', borderRadius: '24px 24px 0 0',
        maxHeight: '70vh', display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 300ms ease-out',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px' }}>
          <div>
            <p style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: 0 }}>{label}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>{cellWaters.length} waters</p>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: '#fff', fontSize: '16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 32px' }}>
          {cellWaters.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '32px 0', fontSize: '14px' }}>No waters in this area</p>
          ) : groups.map(group => (
            <div key={group.label} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', whiteSpace: 'nowrap' }}>
                  {group.label} · {group.waters.length}
                </span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {group.waters.map((water, idx) => {
                  const isGauged = GAUGED_IDS.has(water.id)
                  const flow = flowData[water.id]
                  const palette = flow ? FLOW_PALETTE[flow.status] : null
                  const openCount = new Set(REGULATIONS.filter(r => r.waterBodyId === water.id && isOpenOn(r, today)).map(r => r.speciesId)).size
                  return (
                    <button key={water.id} onClick={() => onOpenWater(water)} style={{
                      width: '100%', textAlign: 'left', background: 'var(--surface)', border: 'none',
                      borderBottom: idx < group.waters.length - 1 ? '1px solid var(--border)' : 'none',
                      padding: '14px 16px', cursor: 'pointer',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{water.name}</p>
                          {openCount > 0 && <p style={{ fontSize: '12px', fontWeight: 700, color: '#6ab04c', marginTop: '2px', marginBottom: 0 }}>{openCount} open</p>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {isGauged && flow && flow.cfs !== null && palette ? (
                            <>
                              <span style={{ fontSize: '17px', fontWeight: 900, color: palette.color, fontVariantNumeric: 'tabular-nums' }}>
                                {formatCfs(flow.cfs)}<span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-faint)', marginLeft: '2px' }}>cfs</span>
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: `${palette.color}1a`, color: palette.color }}>
                                {palette.label}
                              </span>
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-faint)', fontSize: '14px' }}>›</span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
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

// Preferred rivers for "Most Active Today" featured section

export default function WatersPage() {
  const today = new Date()
  const [flowData, setFlowData] = useState<Record<string, FlowData>>({})
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // All waters → WaterDetailSheet (consistent with Today page)
  const [selectedWaterName, setSelectedWaterName] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'river' | 'lake' | 'marine'>('all')
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [regionSheetCell, setRegionSheetCell] = useState<[number, number] | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationRequested, setLocationRequested] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)

  // ── Nearby waters (Near Me feature) ──────────────────────────────────────
  const nearbyWaters = userLocation
    ? WATER_BODIES
        .filter(w => WATER_COORDS[w.id])
        .map(w => {
          const coords = WATER_COORDS[w.id]
          const distMiles = distanceMiles(userLocation.lat, userLocation.lng, coords.lat, coords.lng)
          const openCount = new Set(REGULATIONS.filter(r => r.waterBodyId === w.id && isOpenOn(r, today)).map(r => r.speciesId)).size
          return { water: w, distMiles, openCount }
        })
        .filter(x => x.openCount > 0)
        .sort((a, b) => a.distMiles - b.distMiles)
        .slice(0, 5)
    : []

  function requestLocation() {
    setLocationRequested(true)
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationDenied(true)
    )
  }

  // ── Single entry-point for all water-body taps ────────────────────────────
  const openWater = useCallback((water: WaterBody) => {
    setSelectedWaterName(water.name)
  }, [])

  // ── Map click handler — unified for rivers + water bodies ─────────────────
  // ── Species pills helper ──────────────────────────────────────────────────
  function getOpenSpeciesPills(waterId: string, max = 3): { pills: string[]; extra: number } {
    const openIds = [...new Set(
      REGULATIONS.filter(r => r.waterBodyId === waterId && isOpenOn(r, today)).map(r => r.speciesId)
    )]
    const names = openIds.map(id => {
      const sp = SPECIES.find(s => s.id === id)
      // Shorten long names for pills
      const n = sp?.name ?? id
      return n.replace(' Salmon', '').replace(' Trout', '').replace('Mountain ', '')
    })
    return { pills: names.slice(0, max), extra: Math.max(0, names.length - max) }
  }

  const allSections = buildSections(today)

  // Filter sections: type chip only (region drill-down is now in the bottom sheet)
  const visibleSections = allSections
    .filter(section => {
      if (section.waters.length === 0) return false
      if (activeFilter === 'all') return true
      if (activeFilter === 'river') return section.label === 'Rivers & Streams'
      if (activeFilter === 'lake') return section.label === 'Lakes & Reservoirs'
      return section.label === 'Marine, Sound & Bay'
    })

  // Top 6 featured waters — gauged rivers with open species first, then by open count
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
    .slice(0, 6)

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
    <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--bg)' }}>
      <header className="glass-header flex-shrink-0 z-30 px-4">
        <div className="max-w-lg mx-auto py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Waters</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Find a place to fish</p>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {lastUpdated ? `Gauges updated ${lastUpdated}` : loading ? 'Loading gauges…' : 'Tap any water for details'}
          </p>
        </div>
      </header>

      {/* ── Single scrollable body: everything scrolls ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: '100px' }}>
      <div className="max-w-lg mx-auto w-full px-4 pt-4">

        {/* Most Active Right Now */}
        {featuredWaters.length > 0 && (
          <div className="mb-4">
            {/* Featured header */}
            <div style={{ padding: '4px 0 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 3, height: 18, borderRadius: 2, background: '#f26522', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f26522' }}>
                Most Active Right Now
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)' }}>
                · {featuredWaters.length} waters
              </span>
            </div>

            {/* Horizontal scroll row */}
            <div className="no-scrollbar" style={{ overflowX: 'auto', display: 'flex', gap: 12, padding: '0 0 8px', WebkitOverflowScrolling: 'touch' }}>
              {featuredWaters.map(({ water, openCount }) => {
                const isGauged = GAUGED_IDS.has(water.id)
                const flow = flowData[water.id]
                const palette = flow ? FLOW_PALETTE[flow.status] : null
                const accentColor = (isGauged && flow && palette)
                  ? palette.color
                  : '#6ab04c'
                const waterTypeLabel = water.type === 'lake' ? 'LAKE'
                  : water.type === 'sound' || water.type === 'bay' ? 'MARINE'
                  : 'RIVER'
                const { pills: speciesPills, extra: speciesExtra } = getOpenSpeciesPills(water.id)
                return (
                  <button
                    key={water.id}
                    onClick={() => openWater(water)}
                    style={{
                      width: 162,
                      flexShrink: 0,
                      borderRadius: 20,
                      overflow: 'hidden',
                      position: 'relative',
                      border: `1.5px solid ${accentColor}55`,
                      boxShadow: `0 4px 20px ${accentColor}1a`,
                      background: 'var(--surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Top accent bar */}
                    <div style={{ height: 3, background: accentColor, flexShrink: 0 }} />

                    {/* Card body */}
                    <div style={{ flex: 1, padding: '12px 12px 8px' }}>
                      <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)', margin: '0 0 4px' }}>
                        {waterTypeLabel}
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1.15, margin: '0 0 6px' }}>
                        {water.name}
                      </p>
                      {/* Species pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {speciesPills.map(pill => (
                          <span key={pill} style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 9999,
                            background: `${accentColor}18`, color: accentColor,
                          }}>{pill}</span>
                        ))}
                        {speciesExtra > 0 && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 9999,
                            background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                          }}>+{speciesExtra}</span>
                        )}
                      </div>
                    </div>

                    {/* Card footer */}
                    {isGauged && flow && flow.cfs !== null && palette ? (
                      <div style={{ padding: '8px 12px 11px', borderTop: '1px solid var(--border)', background: `${accentColor}0d`, display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: accentColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                          {formatCfs(flow.cfs)}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>cfs</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: accentColor }}>
                          {palette.label}
                        </span>
                      </div>
                    ) : (
                      <div style={{ padding: '8px 12px 11px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6ab04c' }}>{openCount} open</span>
                        <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>›</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* WA Grid Map + Near You tethered below */}
        <div className="rounded-2xl mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Map */}
          <div style={{ padding: '10px 10px 0' }}>
            <WaGridMap
              selected={selectedCell}
              onSelect={(cell) => {
                setSelectedCell(cell)
                setRegionSheetCell(cell)
              }}
            />
          </div>
          {/* Near You — tethered to map */}
          {!locationRequested ? (
            <button
              onClick={requestLocation}
              className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              style={{
                padding: '14px 16px',
                background: 'rgba(242,101,34,0.12)',
                borderTop: '1px solid rgba(242,101,34,0.2)',
                color: '#f26522',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.01em',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              <span>Find Waters Near You</span>
            </button>
          ) : locationDenied ? (
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '12px', color: 'var(--text-faint)', textAlign: 'center' }}>
              Location access denied — enable in browser settings
            </div>
          ) : nearbyWaters.length === 0 && userLocation ? (
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '12px', color: 'var(--text-faint)', textAlign: 'center' }}>
              No open waters found nearby today
            </div>
          ) : nearbyWaters.length === 0 ? (
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(242,101,34,0.2)', fontSize: '12px', color: 'var(--text-faint)', textAlign: 'center' }}>
              Getting your location…
            </div>
          ) : null}
        </div>

        {/* Near You results (shown outside card once we have results) */}
        {locationRequested && !locationDenied && nearbyWaters.length > 0 && (
          <div className="mb-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', whiteSpace: 'nowrap' }}>Near You · Open Today</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div className="flex flex-col gap-2">
              {nearbyWaters.map(({ water, distMiles, openCount }) => (
                <button key={water.id} onClick={() => openWater(water)}
                  className="flex items-center justify-between px-4 text-left transition-all active:scale-[0.99]"
                  style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="text-sm font-bold text-white truncate">{water.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{openCount} species open</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <p className="text-sm font-bold" style={{ color: '#f26522' }}>{distMiles < 10 ? distMiles.toFixed(1) : Math.round(distMiles)} mi</p>
                    <span style={{ color: 'var(--text-faint)', fontSize: '14px' }}>›</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Filter chips ── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
          {([
            { key: 'all',    label: 'All Waters' },
            { key: 'river',  label: 'Rivers' },
            { key: 'lake',   label: 'Lakes' },
            { key: 'marine', label: 'Marine' },
          ] as { key: typeof activeFilter; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="flex-shrink-0 font-semibold transition-all active:scale-[0.99] rounded-full"
              style={{
                padding: '7px 16px',
                fontSize: '13px',
                background: activeFilter === f.key ? 'var(--accent)' : 'var(--surface)',
                color: activeFilter === f.key ? '#fff' : 'var(--text-muted)',
                border: `1.5px solid ${activeFilter === f.key ? 'var(--accent)' : 'var(--border)'}`,
                whiteSpace: 'nowrap',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Water sections ── */}
        {visibleSections.map(section => (
          <div key={section.label} className="mb-8">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', whiteSpace: 'nowrap' }}>
                {section.label} · {section.waters.length}
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Water rows */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {section.waters.map((water, idx) => {
                const isGauged = GAUGED_IDS.has(water.id)
                const flow = flowData[water.id]
                const palette = flow ? FLOW_PALETTE[flow.status] : null
                const trendIcon = flow?.trend === 'rising' ? '↑' : flow?.trend === 'falling' ? '↓' : flow?.trend === 'stable' ? '→' : null
                const trendColor = flow?.trend === 'rising' ? '#ef4444' : flow?.trend === 'falling' ? '#60a5fa' : '#6ab04c'

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
      </div>{/* end max-w-lg */}
      </div>{/* end scrollable */}

      {regionSheetCell && (
        <RegionSheet
          cell={regionSheetCell}
          today={today}
          flowData={flowData}
          onOpenWater={(water) => {
            setRegionSheetCell(null)
            setSelectedCell(null)
            openWater(water)
          }}
          onClose={() => {
            setRegionSheetCell(null)
            setSelectedCell(null)
          }}
        />
      )}
      {selectedWaterName && (
        <WaterDetailSheet
          waterName={selectedWaterName}
          onClose={() => setSelectedWaterName(null)}
        />
      )}
      <BottomNav />
    </div>
  )
}
