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
  ideal: '#22c55e',
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
function NearMeCard({
  water,
  distMiles,
  openSpecies,
  flowData,
  onTap,
  isFirst,
  isLast,
}: {
  water: WaterBody
  distMiles: number
  openSpecies: string[]
  flowData: FlowData | null
  onTap: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const dist = distMiles < 10
    ? `${distMiles.toFixed(1)} mi`
    : `${Math.round(distMiles)} mi`

  return (
    <button
      onClick={onTap}
      className="w-full text-left transition-all active:opacity-70"
      style={{
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: isFirst && isLast ? '16px' : isFirst ? '16px 16px 0 0' : isLast ? '0 0 16px 16px' : '0',
      }}
    >
      {/* Left: name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {water.name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {water.region} · {water.type}
        </div>
        {openSpecies.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
            {openSpecies.slice(0, 4).map(sp => (
              <span key={sp} style={{
                background: '#22c55e',
                color: '#fff',
                borderRadius: '10px',
                padding: '1px 7px',
                fontSize: '10px',
                fontWeight: 700,
              }}>
                {sp.replace(' Salmon', '').replace(' Trout', '')}
              </span>
            ))}
            {openSpecies.length > 4 && (
              <span style={{
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--text-muted)',
                borderRadius: '10px',
                padding: '1px 7px',
                fontSize: '10px',
              }}>
                +{openSpecies.length - 4}
              </span>
            )}
          </div>
        )}
        {openSpecies.length === 0 && (
          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '3px' }}>No species open today</div>
        )}
      </div>

      {/* Right: CFS + distance */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {flowData && flowData.cfs !== null ? (
          <>
            <div style={{ fontSize: '20px', fontWeight: 900, lineHeight: 1, color: FLOW_COLORS[flowData.status] }}>
              {formatCfs(flowData.cfs)}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-faint)', marginTop: '2px', textTransform: 'uppercase' }}>
              cfs
            </div>
            <div style={{
              fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
              background: FLOW_COLORS[flowData.status] + '22',
              color: FLOW_COLORS[flowData.status],
              borderRadius: '6px', padding: '1px 5px', marginTop: '3px',
              letterSpacing: '0.05em',
            }}>
              {flowData.status}
            </div>
          </>
        ) : (
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-faint)' }}>{dist}</div>
        )}
        {flowData && flowData.cfs !== null && (
          <div style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '4px' }}>{dist}</div>
        )}
      </div>

      <span style={{ color: 'var(--text-faint)', fontSize: '14px', flexShrink: 0 }}>›</span>
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
    <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--bg)', paddingBottom: '80px' }}>
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
        overflowX: 'auto',
        flexShrink: 0,
        WebkitOverflowScrolling: 'touch',
      }}>
        {chips.map(c => (
          <button
            key={c.key}
            onClick={() => setFilterType(c.key)}
            style={{
              whiteSpace: 'nowrap',
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: filterType === c.key ? '#22c55e' : 'var(--surface)',
              color: filterType === c.key ? '#fff' : 'var(--text-muted)',
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
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {filtered.map(({ water, distMiles, openSpecies }, idx) => (
                    <NearMeCard
                      key={water.id}
                      water={water}
                      distMiles={distMiles}
                      openSpecies={openSpecies}
                      flowData={flowMap[water.id] ?? null}
                      onTap={() => openWater(water)}
                      isFirst={idx === 0}
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
