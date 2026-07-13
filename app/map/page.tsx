'use client'
import { useState, useEffect, useCallback } from 'react'
import BottomNav from '@/components/BottomNav'
import WaterDetailSheet from '@/components/WaterDetailSheet'
import RiverDetailSheet from '@/components/RiverDetailSheet'
import { WATER_BODIES, REGULATIONS, SPECIES, isOpenOn } from '@/lib/fishing-data'
import type { WaterBody } from '@/lib/fishing-data'
import { GAUGED_RIVERS, findRiverEntry } from '@/lib/river-lookup'
import type { RiverEntry } from '@/lib/river-lookup'

// ── Haversine ────────────────────────────────────────────────────────────────
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

// ── Flow data ─────────────────────────────────────────────────────────────────
type FlowStatus = 'ideal' | 'low' | 'high' | 'loading' | 'error'
type FlowData = { cfs: number | null; status: FlowStatus; trend: 'rising' | 'falling' | 'stable' | null; fetchedAt: string }

const FLOW_COLORS: Record<FlowStatus, string> = {
  ideal: '#6ab04c',
  low: '#f97316',
  high: '#ef4444',
  loading: '#6b7280',
  error: '#6b7280',
}

function formatCfs(cfs: number): string {
  return cfs >= 10000 ? `${(cfs / 1000).toFixed(0)}k` : cfs.toLocaleString()
}

// ── Water type labels ─────────────────────────────────────────────────────────
// ── Near Me card (list-row style, no emojis) ─────────────────────────────────
function getCfsDescription(status: FlowStatus): string {
  if (status === 'ideal') return 'Flow levels look good — prime conditions for fishing'
  if (status === 'low') return 'River running low — fish may be concentrated in deeper holes'
  if (status === 'high') return 'High water — wade carefully, fish closer to the banks'
  return 'Flow data unavailable'
}

function NearMeCard({
  water,
  distMiles,
  openSpecies,
  flowData,
  onTap,
  isLast,
}: {
  water: WaterBody
  distMiles: number
  openSpecies: string[]
  flowData: FlowData | null
  onTap: () => void
  isLast: boolean
}) {
  const dist = distMiles < 10
    ? `${distMiles.toFixed(1)} mi`
    : `${Math.round(distMiles)} mi`

  const hasFlow = flowData && flowData.cfs !== null
  const flowColor = hasFlow ? FLOW_COLORS[flowData!.status] : null

  return (
    <button
      onClick={onTap}
      className="w-full text-left transition-all active:opacity-70"
      style={{
        padding: '16px 4px',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.22)',
        display: 'block',
        background: 'transparent',
      }}
    >
      {/* Top row: name left, CFS right */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)', marginBottom: '4px' }}>
            {water.region} · {water.type}
          </p>
          <p style={{ fontSize: '20px', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{water.name}</p>

          {/* Species pills */}
          {openSpecies.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', marginRight: '2px', alignSelf: 'center' }}>Open now:</span>
              {openSpecies.slice(0, 4).map(sp => (
                <span key={sp} style={{
                  background: 'rgba(106,176,76,0.15)',
                  color: '#6ab04c',
                  borderRadius: '20px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}>
                  {sp.replace(' Salmon', '').replace(' Trout', '')}
                </span>
              ))}
              {openSpecies.length > 4 && (
                <span style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-faint)', borderRadius: '20px', padding: '2px 8px', fontSize: '11px' }}>
                  +{openSpecies.length - 4}
                </span>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '13px', marginTop: '8px', color: 'var(--text-faint)' }}>No species open today</p>
          )}
        </div>

        {/* Right: CFS */}
        {hasFlow && flowColor ? (
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <p style={{ fontSize: '30px', fontWeight: 900, lineHeight: 1, color: flowColor }}>
              {formatCfs(flowData!.cfs!)}
            </p>
            <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-faint)', marginTop: '2px' }}>
              cfs
            </p>
            <span style={{
              display: 'inline-block', marginTop: '6px',
              fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
              background: flowColor + '22', color: flowColor,
              borderRadius: '20px', padding: '2px 8px',
            }}>
              {flowData!.status}
            </span>
            <p style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '4px' }}>{dist}</p>
          </div>
        ) : (
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#f26522' }}>{dist}</p>
          </div>
        )}
      </div>

      {/* Note — inline, no separator */}
      {hasFlow && flowData!.status !== 'loading' && flowData!.status !== 'error' && (
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-faint)', flexShrink: 0 }}>Note</span>
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{getCfsDescription(flowData!.status)}</span>
        </div>
      )}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NearMePage() {
  const today = new Date()
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [locState, setLocState] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle')
  const [flowMap, setFlowMap] = useState<Record<string, FlowData>>({})
  const [selectedRiver, setSelectedRiver] = useState<RiverEntry | null>(null)
  const [selectedWaterName, setSelectedWaterName] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'open' | 'river' | 'lake' | 'marine'>('open')

  // Auto-request location on mount
  useEffect(() => {
    setLocState('loading')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocState('granted')
      },
      () => setLocState('denied'),
      { timeout: 8000 }
    )
  }, [])

  // Fetch USGS flow data
  useEffect(() => {
    async function fetchFlows() {
      const ids = GAUGED_RIVERS.map(r => r.usgsId).join(',')
      try {
        const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${ids}&parameterCd=00060&period=PT2H&siteStatus=active`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const series = data?.value?.timeSeries ?? []
        const map: Record<string, FlowData> = {}
        for (const river of GAUGED_RIVERS) {
          const ts = series.find((s: { sourceInfo: { siteCode: { value: string }[] } }) =>
            s.sourceInfo?.siteCode?.[0]?.value === river.usgsId
          )
          const raw = ts?.values?.[0]?.value
          const last = Array.isArray(raw) ? raw[raw.length - 1] : null
          const cfs = last ? parseFloat(last.value) : null
          if (cfs !== null && !isNaN(cfs)) {
            const status: FlowStatus = cfs >= river.idealCfs.min && cfs <= river.idealCfs.max
              ? 'ideal' : cfs < river.idealCfs.min ? 'low' : 'high'
            map[river.id] = { cfs, status, trend: null, fetchedAt: new Date().toISOString() }
          }
        }
        setFlowMap(map)
      } catch { /* silent */ }
    }
    fetchFlows()
  }, [])

  // Build nearby waters list
  const nearbyWaters = userLoc
    ? WATER_BODIES
        .map(w => {
          const distMiles = distanceMiles(userLoc.lat, userLoc.lng, w.lat, w.lng)
          const openRegs = REGULATIONS.filter(r => r.waterBodyId === w.id && isOpenOn(r, today))
          const openSpecies = Array.from(new Set(openRegs.map(r => {
            const sp = SPECIES.find(s => s.id === r.speciesId)
            return sp?.name ?? r.speciesId
          })))
          return { water: w, distMiles, openSpecies }
        })
        .filter(x => x.distMiles <= 50)
        .sort((a, b) => a.distMiles - b.distMiles)
    : []

  // Apply filter chip
  const filtered = nearbyWaters.filter(x => {
    if (filterType === 'open') return x.openSpecies.length > 0
    if (filterType === 'river') return x.water.type === 'river' || x.water.type === 'stream'
    if (filterType === 'lake') return x.water.type === 'lake'
    if (filterType === 'marine') return x.water.type === 'sound' || x.water.type === 'bay'
    return true
  })

  const openWater = useCallback((water: WaterBody) => {
    const river = findRiverEntry(water)
    if (river) setSelectedRiver(river)
    else setSelectedWaterName(water.name)
  }, [])

  const chips: { key: typeof filterType; label: string }[] = [
    { key: 'open', label: 'Open Now' },
    { key: 'all', label: 'All Waters' },
    { key: 'river', label: 'Rivers' },
    { key: 'lake', label: 'Lakes' },
    { key: 'marine', label: 'Marine' },
  ]

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--bg)', paddingBottom: '100px' }}>
      {/* Header */}
      <header className="glass-header px-4 flex-shrink-0">
        <div className="max-w-lg mx-auto py-3">
          <h1 className="text-lg font-bold text-white">Near Me</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {locState === 'granted' && userLoc
              ? `${filtered.length} water${filtered.length !== 1 ? 's' : ''} within 50 miles`
              : locState === 'loading' ? 'Finding your location…'
              : locState === 'denied' ? 'Location access denied'
              : 'Getting location…'}
          </p>
        </div>
      </header>

      {/* Filter chips */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '10px 16px',
        paddingBottom: '12px',
        overflowX: 'auto',
        flexShrink: 0,
        WebkitOverflowScrolling: 'touch',
      }}>
        {chips.map(c => (
          <button
            key={c.key}
            onClick={() => setFilterType(c.key)}
            className="flex-shrink-0 font-semibold transition-all active:scale-[0.99] rounded-full"
            style={{
              whiteSpace: 'nowrap',
              padding: '7px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: filterType === c.key ? 'var(--accent)' : 'var(--surface)',
              color: filterType === c.key ? '#fff' : 'var(--text-muted)',
              border: `1.5px solid ${filterType === c.key ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '0 16px 16px' }}>
        <div className="max-w-lg mx-auto">

          {/* Location loading */}
          {locState === 'loading' && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📍</div>
              <div style={{ fontSize: '14px' }}>Finding your location…</div>
            </div>
          )}

          {/* Location denied */}
          {locState === 'denied' && (
            <div style={{
              textAlign: 'center', padding: '60px 16px',
              color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚫</div>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Location access needed</div>
              <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                Enable location in your browser settings to see nearby waters.
              </div>
            </div>
          )}

          {/* Results */}
          {locState === 'granted' && (
            <>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎣</div>
                  <div style={{ fontSize: '14px' }}>No waters found with this filter.</div>
                </div>
              ) : (
                <div>
                  {filtered.map(({ water, distMiles, openSpecies }, idx) => (
                    <NearMeCard
                      key={water.id}
                      water={water}
                      distMiles={distMiles}
                      openSpecies={openSpecies}
                      flowData={flowMap[water.id] ?? null}
                      onTap={() => openWater(water)}
                      isLast={idx === filtered.length - 1}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Detail sheets */}
      {selectedRiver && (
        <RiverDetailSheet
          river={selectedRiver}
          flow={flowMap[selectedRiver.id] ?? { cfs: null, status: 'loading' as FlowStatus, trend: null, fetchedAt: '' }}
          onClose={() => setSelectedRiver(null)}
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
