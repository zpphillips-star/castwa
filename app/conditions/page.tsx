'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import BottomNav from '@/components/BottomNav'
import WaterDetailSheet from '@/components/WaterDetailSheet'
import RiverDetailSheet from '@/components/RiverDetailSheet'
import { WATER_BODIES, REGULATIONS, SPECIES, isOpenOn } from '@/lib/fishing-data'
import type { WaterBody } from '@/lib/fishing-data'

const WAMapDynamic = dynamic(() => import('@/components/WAMap'), { ssr: false })

// ─── Canonical river list — single source of truth ───────────────────────────
// Imported from lib/river-lookup; never duplicate here.
import { RiverEntry, GAUGED_RIVERS, findRiverEntry } from '@/lib/river-lookup'
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

// Preferred rivers for "Best Bet Today" ranking
const PREFERRED_RIVER_IDS = new Set(['skagit', 'snoqualmie', 'skykomish', 'snohomish'])

export default function WatersPage() {
  const today = new Date()
  const [flowData, setFlowData] = useState<Record<string, FlowData>>({})
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Rivers → RiverDetailSheet (gold-standard view); everything else → WaterDetailSheet
  const [selectedRiver, setSelectedRiver] = useState<RiverEntry | null>(null)
  const [selectedWaterName, setSelectedWaterName] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'river' | 'lake' | 'marine'>('all')
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
    const river = findRiverEntry(water)
    if (river) {
      setSelectedRiver(river)
    } else {
      setSelectedWaterName(water.name)
    }
  }, [])

  // ── Map click handler — unified for rivers + water bodies ─────────────────
  const handleMapOpen = useCallback((waterId: string) => {
    const wb = WATER_BODIES.find(w => w.id === waterId)
    if (wb) openWater(wb)
  }, [openWater])

  // ── Best Bet Today — highest-value fishable water right now ───────────────
  const bestBetWater = (() => {
    const candidates = [...WATER_BODIES]
      .map(w => {
        const openSpeciesIds = [...new Set(
          REGULATIONS.filter(r => r.waterBodyId === w.id && isOpenOn(r, today)).map(r => r.speciesId)
        )]
        const flow = flowData[w.id]
        const hasIdealFlow = flow?.status === 'ideal'
        const isFlood = flow?.status === 'high'
        const isPreferred = PREFERRED_RIVER_IDS.has(w.id)
        return { water: w, openSpeciesIds, hasIdealFlow, isFlood, isPreferred }
      })
      .filter(x => x.openSpeciesIds.length > 0 && !x.isFlood)
      .sort((a, b) => {
        if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1
        if (a.hasIdealFlow !== b.hasIdealFlow) return a.hasIdealFlow ? -1 : 1
        return b.openSpeciesIds.length - a.openSpeciesIds.length
      })
    return candidates[0] ?? null
  })()

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

      {/* ── Pinned: Best Bet + Most Active + Map ── */}
      <div className="flex-shrink-0 max-w-lg mx-auto w-full px-4 pt-4"
        style={{ background: 'var(--bg)' }}>

        {/* ── Best Bet Today ── */}
        {bestBetWater && (
          <button
            onClick={() => openWater(bestBetWater.water)}
            className="w-full text-left mb-4"
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              border: '1.5px solid #f2652255',
              boxShadow: '0 6px 28px #f265220f',
              background: 'var(--surface)',
              display: 'block',
              cursor: 'pointer',
            }}
          >
            {/* Orange accent bar */}
            <div style={{ height: 3, background: '#f26522' }} />
            <div style={{ padding: '14px 16px 0' }}>
              {/* Badge row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 9, fontWeight: 900, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#fff',
                  background: '#f26522', borderRadius: 6, padding: '3px 8px',
                }}>Best Bet Today</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {bestBetWater.water.type === 'lake' ? 'LAKE' : bestBetWater.water.type === 'sound' || bestBetWater.water.type === 'bay' ? 'MARINE' : 'RIVER'}
                </span>
              </div>
              {/* Name */}
              <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: '0 0 6px' }}>
                {bestBetWater.water.name}
              </p>
              {/* Species pills */}
              {(() => { const { pills, extra } = getOpenSpeciesPills(bestBetWater.water.id); return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {pills.map(pill => (
                    <span key={pill} style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 9999,
                      background: '#6ab04c22', color: '#6ab04c', border: '1px solid #6ab04c44',
                    }}>{pill}</span>
                  ))}
                  {extra > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 9999,
                      background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                    }}>+{extra}</span>
                  )}
                </div>
              )})()}
            </div>
            {/* Footer with flow data */}
            {(() => {
              const flow = flowData[bestBetWater.water.id]
              const palette = flow ? FLOW_PALETTE[flow.status] : null
              const isGauged = GAUGED_IDS.has(bestBetWater.water.id)
              if (isGauged && flow && flow.cfs !== null && palette) {
                return (
                  <div style={{ padding: '10px 16px 14px', borderTop: '1px solid var(--border)', background: `${palette.color}0d`, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: palette.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{formatCfs(flow.cfs)}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>cfs</span>
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 9999, background: `${palette.color}22`, color: palette.color }}>{palette.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-faint)' }}>{bestBetWater.water.region} ›</span>
                  </div>
                )
              }
              return (
                <div style={{ padding: '10px 16px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{bestBetWater.water.region}</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: 14 }}>›</span>
                </div>
              )
            })()}
          </button>
        )}

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

        {/* Real Leaflet map — replaces SVG WaGridMap */}
        <div className="rounded-2xl mb-3 overflow-hidden"
          style={{ height: 260, border: '1px solid var(--border)' }}>
          <WAMapDynamic
            onOpenRiver={handleMapOpen}
            onWaterClick={handleMapOpen}
          />
        </div>
      </div>

      {/* ── Scrollable: filter chips + water list ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: '100px' }}>
      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* ── NEAR YOU ── */}
        {!locationRequested ? (
          <div className="mb-4">
            <button
              onClick={requestLocation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.99]"
              style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}
            >
              <span>📍</span>
              <span>Find waters near you</span>
            </button>
          </div>
        ) : locationDenied ? (
          <div className="mb-4 px-4 py-3 rounded-xl text-xs" style={{ color: 'var(--text-faint)', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
            Location access denied — enable in browser settings to use Near You
          </div>
        ) : nearbyWaters.length > 0 ? (
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
        ) : userLocation ? (
          <div className="mb-4 px-4 py-3 rounded-xl text-xs" style={{ color: 'var(--text-faint)', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
            No open waters found nearby today
          </div>
        ) : (
          <div className="mb-4 px-4 py-3 rounded-xl text-xs" style={{ color: 'var(--text-faint)', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
            Getting your location…
          </div>
        )}

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
