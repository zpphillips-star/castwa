'use client'
import { useState, useEffect } from 'react'
import RiverSectionMap from './RiverSectionMap'
import { useSwipeBack } from '@/hooks/useSwipeBack'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type GaugeStatus = 'low' | 'good' | 'high' | 'flood' | 'loading' | 'error'
type GaugeTrend  = 'rising' | 'falling' | 'stable' | null

type SheetData = {
  cfs: number | null
  status: GaugeStatus
  trend: GaugeTrend
}

export type RiverMapConfig = {
  riverName: string
  coords: [number, number][]
  riverId?: string
  startLabel: string
  endLabel: string
}

export interface RiverConditionsSheetProps {
  gaugeId: string
  gaugeName: string
  thresholds: { low: number; high: number; flood: number }
  riverMapConfig?: RiverMapConfig
  onClose: () => void
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getStatus(cfs: number, t: { low: number; high: number; flood: number }): GaugeStatus {
  if (cfs < t.low)   return 'low'
  if (cfs >= t.low && cfs <= t.high) return 'good'
  if (cfs > t.flood) return 'flood'
  return 'high'
}

function formatCfs(cfs: number): string {
  if (cfs >= 10000) return `${(cfs / 1000).toFixed(0)}k`
  return cfs.toLocaleString()
}

// Three-tier fishability label
const FISHABLE: Record<GaugeStatus, { label: string; color: string }> = {
  low:     { label: 'Safe',      color: '#22c55e' },
  good:    { label: 'Safe',      color: '#22c55e' },
  high:    { label: 'Caution',   color: '#f59e0b' },
  flood:   { label: 'Dangerous', color: '#ef4444' },
  loading: { label: '…',         color: '#6b7280' },
  error:   { label: 'N/A',       color: '#6b7280' },
}

// Border accent per status
const STATUS_BORDER: Record<GaugeStatus, string> = {
  low:     '#22c55e',
  good:    '#22c55e',
  high:    '#f59e0b',
  flood:   '#ef4444',
  loading: '#6b7280',
  error:   '#6b7280',
}

// One-line plain-English summary
function getSummary(status: GaugeStatus, trend: GaugeTrend): string {
  if (status === 'loading') return 'Fetching live data…'
  if (status === 'error')   return 'Unable to load gauge data'
  if (status === 'flood')   return 'Dangerous — stay out of the water'
  if (status === 'high') {
    if (trend === 'rising')  return 'Rising fast — wading not recommended'
    if (trend === 'falling') return 'Falling from high — still use caution'
    return 'Elevated flow — wade with extreme caution'
  }
  if (status === 'good') {
    if (trend === 'rising')  return 'Rising — monitor before wading'
    if (trend === 'falling') return 'Falling — conditions improving'
    return 'Stable, good conditions'
  }
  // low
  if (trend === 'rising') return 'Rising from low — watch for snags'
  return 'Low water — wade carefully near shallow areas'
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function RiverConditionsSheet({
  gaugeId,
  gaugeName,
  thresholds,
  riverMapConfig,
  onClose,
}: RiverConditionsSheetProps) {
  const [data, setData] = useState<SheetData>({ cfs: null, status: 'loading', trend: null })
  const [showMap, setShowMap] = useState(false)
  const swipeBack = useSwipeBack(onClose)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const url =
          `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${gaugeId}&parameterCd=00060&period=PT3H&siteStatus=active`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const series = json?.value?.timeSeries ?? []
        const ts = series.find(
          (s: { sourceInfo: { siteCode: { value: string }[] } }) =>
            s.sourceInfo.siteCode[0]?.value === gaugeId
        )
        const rawValues: { value: string; dateTime: string }[] =
          ts?.values?.[0]?.value ?? []

        if (cancelled) return
        if (rawValues.length === 0) {
          setData({ cfs: null, status: 'error', trend: null })
          return
        }

        const latest   = Math.round(parseFloat(rawValues[rawValues.length - 1].value))
        const threeHBack = Math.round(parseFloat(rawValues[Math.max(0, rawValues.length - 13)].value))

        if (isNaN(latest)) {
          setData({ cfs: null, status: 'error', trend: null })
          return
        }

        const status = getStatus(latest, thresholds)
        const delta = latest - threeHBack
        const trend: GaugeTrend =
          Math.abs(delta) < latest * 0.02 ? 'stable'
          : delta > 0 ? 'rising'
          : 'falling'

        setData({ cfs: latest, status, trend })
      } catch {
        if (!cancelled) setData({ cfs: null, status: 'error', trend: null })
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [gaugeId, thresholds])

  const fishable   = FISHABLE[data.status]
  const borderColor = STATUS_BORDER[data.status]
  const trendArrow = data.trend === 'rising' ? '↑' : data.trend === 'falling' ? '↓' : '→'
  const summary    = getSummary(data.status, data.trend)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70]"
        style={{ background: 'rgba(0,0,0,0.75)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[71] flex flex-col"
        style={{
          background: '#0d0f1a',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '90dvh',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.8)',
          border: `1px solid ${borderColor}30`,
          borderBottom: 'none',
        }}
        {...swipeBack}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-3"
          style={{ borderBottom: `1px solid rgba(255,255,255,0.07)` }}
        >
          <p className="text-base font-black text-white leading-tight">{gaugeName}</p>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center active:opacity-60"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Three-question body ── */}
        <div className="flex flex-col px-6 py-8 gap-7" style={{ overscrollBehavior: 'contain' }}>

          {/* 1 ── Is it fishable? */}
          <div className="flex items-center gap-3">
            {/* Color dot */}
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: fishable.color,
                flexShrink: 0,
                boxShadow: `0 0 8px ${fishable.color}80`,
              }}
            />
            <span className="text-2xl font-black" style={{ color: fishable.color, letterSpacing: '-0.02em' }}>
              {fishable.label}
            </span>
          </div>

          {/* 2 ── What's the flow? */}
          <div className="flex items-baseline gap-3">
            {data.status === 'loading' ? (
              <div className="w-36 h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
            ) : data.cfs !== null ? (
              <>
                <span
                  className="font-black leading-none"
                  style={{ fontSize: 'clamp(52px, 14vw, 72px)', color: '#ffffff', letterSpacing: '-0.03em' }}
                >
                  {formatCfs(data.cfs)}
                </span>
                <span className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>cfs</span>
                {data.trend && (
                  <span
                    className="text-3xl font-black"
                    style={{
                      color: data.trend === 'rising' ? '#ef4444' : data.trend === 'falling' ? '#60a5fa' : '#22c55e',
                      lineHeight: 1,
                    }}
                  >
                    {trendArrow}
                  </span>
                )}
              </>
            ) : (
              <span className="text-2xl font-black" style={{ color: '#6b7280' }}>No data</span>
            )}
          </div>

          {/* 3 ── Anything else? */}
          <p className="text-base font-medium leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {summary}
          </p>

        </div>

        {/* ── Bottom action ── */}
        <div className="px-6 pb-8 pt-2">
          {riverMapConfig ? (
            <button
              onClick={() => setShowMap(true)}
              className="flex items-center justify-between w-full px-5 py-4 rounded-2xl active:opacity-70"
              style={{
                background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.22)',
              }}
            >
              <span className="text-sm font-semibold text-white">View on Map</span>
              <span className="text-base font-bold" style={{ color: '#4ade80' }}>→</span>
            </button>
          ) : (
            <a
              href={`https://waterdata.usgs.gov/monitoring-location/${gaugeId}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-5 py-4 rounded-2xl active:opacity-70 no-underline"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                textDecoration: 'none',
              }}
            >
              <span className="text-sm font-semibold text-white">Full gauge data</span>
              <span className="text-base font-bold" style={{ color: 'var(--text-muted)' }}>→</span>
            </a>
          )}
        </div>
      </div>

      {/* Map sub-modal */}
      {showMap && riverMapConfig && (
        <RiverSectionMap
          sectionName={riverMapConfig.riverName}
          startLabel={riverMapConfig.startLabel}
          endLabel={riverMapConfig.endLabel}
          coordinates={riverMapConfig.coords}
          status="open"
          riverId={riverMapConfig.riverId}
          onClose={() => setShowMap(false)}
        />
      )}
    </>
  )
}
