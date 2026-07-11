'use client'
import { useState, useEffect } from 'react'
import BottomNav from '@/components/BottomNav'
import FishDetailSheet from '@/components/FishDetailSheet'
import RiverDetailSheet from '@/components/RiverDetailSheet'
import WaterDetailSheet from '@/components/WaterDetailSheet'
import { REGULATIONS, WATER_BODIES, isOpenOn, getOpenSpeciesForDate, daysUntilOpen, SPECIES, Species } from '@/lib/fishing-data'
import { getActiveAlerts, EmergencyAlert } from '@/lib/emergency-alerts'
import { useStarred } from '@/hooks/useStarred'

// ─── WDFW LIVE ALERT TYPE ─────────────────────────────────────────────────────
type WDFWLiveAlert = { title: string; link: string; pubDate: string }

// ─── RIVER GAUGE TYPES & CONFIG ───────────────────────────────────────────────

type GaugeStatus = 'low' | 'good' | 'high' | 'flood' | 'loading'
type GaugeTrend  = 'rising' | 'falling' | 'stable' | null

type GaugeReading = {
  name: string
  shortName: string
  cfs: number | null
  status: GaugeStatus
  trend: GaugeTrend
}

// RiverData / FlowData shapes must match RiverDetailSheet's internal types
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

const GAUGES = [
  { id: '12194000', name: 'Skagit (Concrete)', shortName: 'Skagit↑',   thresholds: { low: 2000, high: 8000, flood: 22000 } },
  { id: '12200500', name: 'Skagit (Mt Vernon)', shortName: 'Skagit↓',  thresholds: { low: 4000, high: 15000, flood: 35000 } },
  { id: '12186000', name: 'Sauk River',          shortName: 'Sauk',    thresholds: { low: 500,  high: 3000,  flood: 8000  } },
  { id: '12210500', name: 'Nooksack River',       shortName: 'Nooksack',thresholds: { low: 1500, high: 8000,  flood: 20000 } },
  { id: '12167000', name: 'Stillaguamish',        shortName: 'Stilly',  thresholds: { low: 800,  high: 5000,  flood: 15000 } },
]

// Mapping from gauge name → RiverData for RiverDetailSheet
const GAUGE_TO_RIVER: Record<string, RiverData> = {
  'Skagit (Concrete)': {
    id: 'skagit', name: 'Skagit River', region: 'Northwest',
    usgsId: '12194000',
    targetSpecies: ['Chinook Salmon', 'Coho Salmon', 'Steelhead'],
    idealCfs: { min: 2000, max: 8000 },
  },
  'Skagit (Mt Vernon)': {
    id: 'skagit', name: 'Skagit River', region: 'Northwest',
    usgsId: '12200500',
    targetSpecies: ['Chinook Salmon', 'Coho Salmon', 'Steelhead'],
    idealCfs: { min: 4000, max: 15000 },
  },
  'Sauk River': {
    id: 'sauk', name: 'Sauk River', region: 'Northwest',
    usgsId: '12186000',
    targetSpecies: ['Steelhead', 'Chinook Salmon', 'Coho Salmon'],
    idealCfs: { min: 500, max: 3000 },
  },
  'Nooksack River': {
    id: 'nooksack', name: 'Nooksack River', region: 'Northwest',
    usgsId: '12210500',
    targetSpecies: ['Chinook Salmon', 'Coho Salmon', 'Steelhead', 'Chum Salmon'],
    idealCfs: { min: 1500, max: 8000 },
  },
  'Stillaguamish': {
    id: 'stillaguamish', name: 'Stillaguamish River', region: 'Northwest',
    usgsId: '12167000',
    targetSpecies: ['Steelhead', 'Coho Salmon', 'Chinook Salmon'],
    idealCfs: { min: 800, max: 5000 },
  },
}

function getGaugeStatus(cfs: number, t: { low: number; high: number; flood: number }): GaugeStatus {
  if (cfs < t.low)   return 'low'
  if (cfs > t.flood) return 'flood'
  if (cfs > t.high)  return 'high'
  return 'good'
}

function getFlowStatus(cfs: number, river: RiverData): FlowData['status'] {
  if (cfs >= river.idealCfs.min && cfs <= river.idealCfs.max) return 'ideal'
  if (cfs < river.idealCfs.min) return 'low'
  return 'high'
}

const STATUS_CONFIG: Record<GaugeStatus, { color: string; bg: string; label: string }> = {
  low:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Low'   },
  good:    { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   label: 'Good'  },
  high:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'High'  },
  flood:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'Flood' },
  loading: { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', label: '…'     },
}

const TREND_ARROW: Record<NonNullable<GaugeTrend>, string> = {
  rising:  '↑',
  falling: '↓',
  stable:  '→',
}

function useRiverGauges(): GaugeReading[] {
  const [data, setData] = useState<GaugeReading[]>(
    GAUGES.map(g => ({ name: g.name, shortName: g.shortName, cfs: null, status: 'loading', trend: null }))
  )

  useEffect(() => {
    const ids = GAUGES.map(g => g.id).join(',')
    // Fetch last 3 hours so we get multiple readings for trend
    fetch(`https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${ids}&parameterCd=00060&period=PT3H&siteStatus=active`)
      .then(r => r.json())
      .then(json => {
        const series: {
          sourceInfo: { siteCode: { value: string }[] }
          values: { value: { value: string; dateTime: string }[] }[]
        }[] = json?.value?.timeSeries ?? []

        setData(GAUGES.map(gauge => {
          const ts = series.find(s => s.sourceInfo.siteCode[0]?.value === gauge.id)
          const readings = ts?.values?.[0]?.value ?? []
          // Latest reading is last in array
          const latest  = readings[readings.length - 1]
          const earlier = readings[readings.length - 3] ?? readings[0]

          const cfs = latest ? Math.round(parseFloat(latest.value)) : null
          const prevCfs = earlier ? Math.round(parseFloat(earlier.value)) : null

          const status: GaugeStatus = cfs === null ? 'loading' : getGaugeStatus(cfs, gauge.thresholds)

          let trend: GaugeTrend = null
          if (cfs !== null && prevCfs !== null) {
            const delta = cfs - prevCfs
            if (Math.abs(delta) < cfs * 0.02) trend = 'stable'
            else if (delta > 0) trend = 'rising'
            else trend = 'falling'
          }

          return { name: gauge.name, shortName: gauge.shortName, cfs, status, trend }
        }))
      })
      .catch(() => {
        setData(GAUGES.map(g => ({ name: g.name, shortName: g.shortName, cfs: null, status: 'loading' as const, trend: null })))
      })
  }, [])

  return data
}

export default function TodayPage() {
  const today = new Date()

  const [selectedFish, setSelectedFish] = useState<Species | null>(null)
  const [selectedRiver, setSelectedRiver] = useState<RiverData | null>(null)
  const [selectedRiverFlow, setSelectedRiverFlow] = useState<FlowData | null>(null)
  const [selectedWater, setSelectedWater] = useState<string | null>(null)
  const [showOpenSheet, setShowOpenSheet] = useState(false)
  const [showAlertsSheet, setShowAlertsSheet] = useState(false)
  const [liveAlerts, setLiveAlerts] = useState<WDFWLiveAlert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)

  const { starredFishIds, starredWaterIds, hydrated } = useStarred()

  const gauges = useRiverGauges()

  // Starred fish species objects
  const starredFish = SPECIES.filter(s => starredFishIds.includes(s.id))

  // Starred water body objects
  const starredWaters = WATER_BODIES.filter(w => starredWaterIds.includes(w.id))

  // Opening Soon — species not open today but opening within 14 days
  const openingSoon = SPECIES
    .filter(s => !getOpenSpeciesForDate(today).some(o => o.id === s.id))
    .map(s => ({ species: s, days: daysUntilOpen(s.id, today) }))
    .filter(x => x.days !== null && x.days <= 14)
    .sort((a, b) => (a.days ?? 99) - (b.days ?? 99))
    .slice(0, 6)

  // Static alerts (from lib/emergency-alerts.ts)
  const staticAlerts = getActiveAlerts(today)

  // Live WDFW RSS alerts
  useEffect(() => {
    fetch('/api/wdfw-alerts')
      .then(r => r.json())
      .then(d => { setLiveAlerts(d.alerts ?? []); setAlertsLoading(false) })
      .catch(() => setAlertsLoading(false))
  }, [])

  const totalAlertCount = staticAlerts.length + liveAlerts.length

  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const openSpecies = getOpenSpeciesForDate(today)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', paddingBottom: '100px' }}>
      <header className="glass-header sticky top-0 z-30 px-4">
        <div className="max-w-lg mx-auto py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Today</h1>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{dateStr}</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* ── EMERGENCY RULES — compact inline banner ── */}
        <button
          onClick={() => setShowAlertsSheet(true)}
          className="w-full text-left rounded-xl mb-5 transition-all active:scale-[0.99] flex items-center gap-3 px-4 py-3"
          style={{
            background: totalAlertCount > 0 ? 'rgba(239,68,68,0.10)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${totalAlertCount > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
          }}
        >
          <span className="text-xl flex-shrink-0">{totalAlertCount > 0 ? '🚨' : '✅'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">
              {totalAlertCount > 0 ? `${totalAlertCount} Emergency Rule${totalAlertCount > 1 ? 's' : ''} Active` : 'No Emergency Rules Today'}
            </p>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: totalAlertCount > 0 ? '#fca5a5' : 'var(--text-muted)' }}>
              {alertsLoading ? 'Checking WDFW…' : totalAlertCount > 0 ? 'Tap to review before fishing' : 'All clear — no active closures'}
            </p>
          </div>
          <span className="text-base font-light flex-shrink-0" style={{ color: totalAlertCount > 0 ? '#ef4444' : 'var(--text-faint)' }}>›</span>
        </button>

        {/* ── MY WATERS ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>My Waters</h2>
            {starredWaters.length === 0 && hydrated && (
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>tap ☆ on any water to add</span>
            )}
          </div>

          {!hydrated ? (
            <div className="rounded-2xl animate-pulse" style={{ height: 130, background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)' }} />
          ) : starredWaters.length === 0 ? (
            <button
              onClick={() => setSelectedWater('Skagit River')}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all active:scale-[0.99]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.15)' }}
            >
              <span className="text-3xl">💧</span>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-tight">Star your go-to waters</p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                  Open any river or lake and tap ☆ — conditions show up here every day
                </p>
              </div>
              <span className="text-sm" style={{ color: 'var(--text-faint)' }}>›</span>
            </button>
          ) : (
            <>
              {/* FEATURED — first starred water */}
              {(() => {
                const water = starredWaters[0]
                const firstWord = water.name.toLowerCase().split(' ')[0]
                const gauge = gauges.find(g => g.name.toLowerCase().includes(firstWord))
                const hasGauge = !!gauge && gauge.cfs !== null
                const cfg = hasGauge ? STATUS_CONFIG[gauge!.status] : null
                const openHere = REGULATIONS
                  .filter(r => r.waterBodyId === water.id && isOpenOn(r, today))
                  .map(r => SPECIES.find(s => s.id === r.speciesId)?.name)
                  .filter((n): n is string => !!n)
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .slice(0, 4)
                return (
                  <button
                    onClick={() => setSelectedWater(water.name)}
                    className="w-full text-left rounded-2xl overflow-hidden mb-3 transition-all active:scale-[0.99]"
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid ${hasGauge && cfg ? cfg.color + '50' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {hasGauge && cfg && <div style={{ height: 3, background: cfg.color }} />}
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>
                            {water.region} · {water.type}
                          </p>
                          <p className="text-xl font-black text-white leading-tight">{water.name}</p>
                          {openHere.length > 0 ? (
                            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wide mr-0.5" style={{ color: 'var(--text-faint)' }}>Open now:</span>
                              {openHere.map(name => (
                                <span key={name} className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: 'rgba(106,176,76,0.15)', color: '#6ab04c' }}>
                                  {name.replace(' Salmon', '').replace(' Trout', '')}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm mt-2" style={{ color: 'var(--text-faint)' }}>No species open today</p>
                          )}
                        </div>
                        {hasGauge && cfg && gauge && (
                          <div className="flex-shrink-0 text-right">
                            <p className="text-3xl font-black leading-none" style={{ color: cfg.color }}>
                              {gauge.cfs?.toLocaleString() ?? '—'}
                            </p>
                            <p className="text-[10px] font-semibold uppercase mt-1" style={{ color: 'var(--text-faint)' }}>
                              cfs {gauge.trend ? TREND_ARROW[gauge.trend] : ''}
                            </p>
                            <span className="inline-block mt-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide"
                              style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })()}

              {/* Additional waters — compact rows */}
              {starredWaters.length > 1 && (
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {starredWaters.slice(1).map((water, i) => {
                    const firstWord = water.name.toLowerCase().split(' ')[0]
                    const gauge = gauges.find(g => g.name.toLowerCase().includes(firstWord))
                    const hasGauge = !!gauge && gauge.cfs !== null
                    const cfg = hasGauge ? STATUS_CONFIG[gauge!.status] : null
                    return (
                      <button
                        key={water.id}
                        onClick={() => setSelectedWater(water.name)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left transition-all active:opacity-75"
                        style={{ borderBottom: i < starredWaters.length - 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                      >
                        <p className="text-sm font-semibold text-white">{water.name}</p>
                        <div className="flex items-center gap-2">
                          {hasGauge && cfg && gauge ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded"
                              style={{ background: cfg.bg, color: cfg.color }}>
                              {gauge.cfs?.toLocaleString()} cfs{gauge.trend ? ` ${TREND_ARROW[gauge.trend]}` : ''}
                            </span>
                          ) : (
                            <span className="text-xs capitalize" style={{ color: 'var(--text-faint)' }}>{water.type}</span>
                          )}
                          <span style={{ color: 'var(--text-faint)', fontSize: 14 }}>›</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── MY FISH ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>My Fish</h2>
            {starredFish.length === 0 && hydrated && (
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>tap ☆ on any fish to add</span>
            )}
          </div>

          {!hydrated ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-4 px-4 py-4 rounded-2xl animate-pulse"
                  style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-16 h-16 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="flex-1">
                    <div className="h-4 rounded mb-2" style={{ background: 'rgba(255,255,255,0.07)', width: '50%' }} />
                    <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.04)', width: '75%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : starredFish.length === 0 ? (
            <button
              onClick={() => setShowOpenSheet(true)}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all active:scale-[0.99]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.15)' }}
            >
              <span className="text-3xl">🐟</span>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-tight">Star your target fish</p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                  Open any fish and tap ☆ — regulations show up here every day
                </p>
              </div>
              <span className="text-sm" style={{ color: 'var(--text-faint)' }}>›</span>
            </button>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {starredFish.map((fish, i) => {
                const isOpen = openSpecies.some(s => s.id === fish.id)
                const regs = REGULATIONS.filter(r => r.speciesId === fish.id && isOpenOn(r, today))
                const bestReg = regs[0] ?? null
                return (
                  <button
                    key={fish.id}
                    onClick={() => setSelectedFish(fish)}
                    className="w-full flex items-center gap-4 px-4 py-4 text-left transition-all active:opacity-75"
                    style={{ borderBottom: i < starredFish.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                  >
                    {/* LEFT: fish photo */}
                    <div className="flex-shrink-0 rounded-xl overflow-hidden"
                      style={{ width: 80, height: 80, background: '#0b0d14' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fish.photo}
                        alt={fish.name}
                        style={{
                          width: '100%', height: '100%', objectFit: 'contain', padding: 8,
                          filter: isOpen ? 'none' : 'grayscale(1)',
                          opacity: isOpen ? 1 : 0.45,
                        }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>

                    {/* RIGHT: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-base font-bold text-white leading-tight">{fish.name}</p>
                        <span
                          className="text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={isOpen
                            ? { background: 'rgba(106,176,76,0.2)', color: '#6ab04c' }
                            : { background: 'rgba(107,114,128,0.15)', color: '#6b7280' }}
                        >
                          {isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                      </div>
                      {isOpen && bestReg ? (
                        <div className="grid grid-cols-2 gap-x-5 gap-y-1 mt-0.5">
                          {bestReg.dailyLimit !== null && (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)', minWidth: 34 }}>Limit</span>
                              <span className="text-xs font-semibold text-white">{bestReg.dailyLimit} / day</span>
                            </div>
                          )}
                          {bestReg.minSize !== null && (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)', minWidth: 34 }}>Min</span>
                              <span className="text-xs font-semibold text-white">{bestReg.minSize}&quot;</span>
                            </div>
                          )}
                          {bestReg.hatcheryOnly && (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)', minWidth: 34 }}>Type</span>
                              <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Hatchery</span>
                            </div>
                          )}
                          {bestReg.gearRestriction && (
                            <div className="flex items-baseline gap-1.5 col-span-2">
                              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)', minWidth: 34 }}>Rules</span>
                              <span className="text-xs font-semibold text-white">{bestReg.gearRestriction}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          Season closed — check dates in Fish tab
                        </p>
                      )}
                    </div>

                    <span className="flex-shrink-0 text-sm font-light" style={{ color: 'var(--text-faint)' }}>›</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── OPENING SOON — next 14 days ── */}
        {openingSoon.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-gray-400 text-xs font-semibold tracking-widest uppercase">Opening Soon</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(99,179,237,0.12)', color: '#63b3ed', border: '1px solid rgba(99,179,237,0.25)' }}>
                Next 14 days
              </span>
            </div>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {openingSoon.map(({ species: fish, days }, i) => (
                <button
                  key={fish.id}
                  onClick={() => setSelectedFish(fish)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-all active:opacity-75 text-left"
                  style={{ borderBottom: i < openingSoon.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fish.photo} alt={fish.name}
                    className="rounded-lg flex-shrink-0"
                    style={{ width: 44, height: 44, objectFit: 'contain', padding: 4, background: '#0b0d14' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white leading-tight truncate">{fish.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{fish.category}</p>
                  </div>
                  <div className="flex-shrink-0 text-right ml-2">
                    <p className="text-base font-black" style={{ color: '#63b3ed' }}>{days}d</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                      {days === 1 ? 'Opens tomorrow' : `Opens in ${days} days`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── WA FISHING LICENSE ── */}
        <a
          href="https://fishhunt.dfw.wa.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-3 rounded-xl no-underline"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '20px' }}>🎫</span>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">WA Fishing License</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>fishhunt.dfw.wa.gov</p>
            </div>
          </div>
          <span className="text-base font-bold flex-shrink-0" style={{ color: 'var(--accent)' }}>↗</span>
        </a>
      </div>

      {/* ── WDFW ALERTS BOTTOM SHEET ── */}
      {showAlertsSheet && (
        <div
          className="fixed inset-0 flex flex-col justify-end"
          style={{ zIndex: 1200, background: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAlertsSheet(false) }}
        >
          <div
            className="animate-slide-up rounded-t-2xl flex flex-col overflow-hidden"
            style={{ background: '#0d0f1a', maxHeight: '88dvh' }}
          >
            {/* Handle + header */}
            <div className="flex-shrink-0 px-4 pt-3 pb-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-8 h-1 rounded-full mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-black text-white">WDFW Emergency Rules & Updates</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{dateStr}</p>
                </div>
                <button onClick={() => setShowAlertsSheet(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>

              {/* No alerts state */}
              {!alertsLoading && staticAlerts.length === 0 && liveAlerts.length === 0 && (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <svg className="w-6 h-6" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-white">All clear today</p>
                  <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                    No active emergency rules or closures from WDFW.
                  </p>
                  <a href="https://wdfw.wa.gov/fishing/regulations" target="_blank" rel="noopener noreferrer"
                    className="text-xs mt-2" style={{ color: 'var(--accent)' }}>
                    Verify on wdfw.wa.gov ↗
                  </a>
                </div>
              )}

              {/* ── Static emergency alerts (detailed, with species/water/description) ── */}
              {staticAlerts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                      Active Rules — All Species
                    </p>
                    <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Verified by daily monitor</span>
                  </div>
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.25)' }}>
                    {staticAlerts.map((alert: EmergencyAlert, i: number) => {
                      const typeColor = alert.type === 'CLOSED' ? '#ef4444' : alert.type === 'OPEN' ? '#22c55e' : '#f59e0b'
                      const typeBg = alert.type === 'CLOSED' ? 'rgba(239,68,68,0.12)' : alert.type === 'OPEN' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)'
                      return (
                        <div key={alert.id}
                          className="px-4 py-3"
                          style={{
                            background: 'var(--surface)',
                            borderBottom: i < staticAlerts.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                          }}>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-black px-2 py-0.5 rounded-full"
                              style={{ background: typeBg, color: typeColor }}>
                              {alert.type}
                            </span>
                            <span className="text-sm font-bold text-white">{alert.species}</span>
                          </div>
                          <p className="text-xs font-semibold mb-1" style={{ color: '#fde68a' }}>{alert.waterBody}</p>
                          <p className="text-xs leading-snug" style={{ color: '#d1d5db' }}>{alert.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                              {alert.activeFrom}{alert.activeTo ? ` – ${alert.activeTo}` : ''}
                            </p>
                            <a href={alert.wdfw_url} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>
                              Official rule ↗
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Live WDFW RSS — ALL fishing emergency rules from WDFW website ── */}
              {alertsLoading ? (
                <div className="flex items-center gap-2 py-4" style={{ color: 'var(--text-faint)' }}>
                  <div className="w-4 h-4 rounded-full animate-pulse" style={{ background: 'var(--border)' }} />
                  <span className="text-sm">Checking WDFW emergency feed...</span>
                </div>
              ) : liveAlerts.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                      WDFW Emergency Feed — All Fish & Shellfish
                    </p>
                    <span className="text-[10px]" style={{ color: '#6ab04c' }}>● Live</span>
                  </div>
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                    {liveAlerts.map((alert: WDFWLiveAlert, i: number) => (
                      <a key={i}
                        href={alert.link || 'https://wdfw.wa.gov/fishing/regulations'}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-start gap-3 px-4 py-3 no-underline transition-opacity active:opacity-70"
                        style={{
                          background: 'var(--surface)',
                          borderBottom: i < liveAlerts.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                          textDecoration: 'none',
                          display: 'flex',
                        }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#ef4444" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white leading-snug">{alert.title}</p>
                          {alert.pubDate && (
                            <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
                              {new Date(alert.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <span className="text-sm flex-shrink-0" style={{ color: '#ef4444' }}>↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                !alertsLoading && staticAlerts.length > 0 && (
                  <p className="text-xs text-center py-2" style={{ color: 'var(--text-faint)' }}>
                    Live WDFW feed unavailable — check wdfw.wa.gov for the latest
                  </p>
                )
              )}

              {/* Footer link */}
              <a href="https://wdfw.wa.gov/fishing/regulations" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl no-underline"
                style={{ background: 'rgba(242,101,34,0.08)', border: '1px solid rgba(242,101,34,0.2)', textDecoration: 'none' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>View all rules on WDFW →</span>
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>wdfw.wa.gov</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── WHAT'S OPEN BOTTOM SHEET ── */}
      {showOpenSheet && (
        <div
          className="fixed inset-0 flex flex-col justify-end"
          style={{ zIndex: 60, background: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowOpenSheet(false) }}
        >
          <div
            className="animate-slide-up rounded-t-2xl flex flex-col overflow-hidden"
            style={{ background: '#0d0f1a', maxHeight: '85dvh' }}
          >
            {/* Handle + header */}
            <div className="flex-shrink-0 px-4 pt-3 pb-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-8 h-1 rounded-full mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-black text-white">Open Today</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {dateStr} · {openSpecies.length} species
                  </p>
                </div>
                <button onClick={() => setShowOpenSheet(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Fish list */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
              {openSpecies.length === 0 ? (
                <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Nothing open today — check the calendar for upcoming dates.
                </p>
              ) : (
                openSpecies.map(fish => {
                  const regs = REGULATIONS.filter(r => r.speciesId === fish.id && isOpenOn(r, today))
                  const waters = regs.map(r => WATER_BODIES.find(w => w.id === r.waterBodyId)).filter(Boolean)
                  return (
                    <button key={fish.id}
                      onClick={() => { setShowOpenSheet(false); setSelectedFish(fish) }}
                      className="w-full text-left flex items-center gap-3 p-3 mb-2 rounded-xl transition-all active:opacity-75"
                      style={{ background: 'var(--surface)', border: '1px solid rgba(106,176,76,0.2)' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fish.photo} alt={fish.name}
                        className="rounded-lg flex-shrink-0"
                        style={{ width: 56, height: 56, objectFit: 'contain', padding: 3, background: '#0b0d14' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-white leading-tight">{fish.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(106,176,76,0.15)', color: '#6ab04c' }}>OPEN</span>
                        </div>
                        <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                          {waters.slice(0, 3).map(w => w!.name).join(', ')}
                          {waters.length > 3 ? ` +${waters.length - 3} more` : ''}
                        </p>
                        {regs[0]?.dailyLimit != null && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                            Limit: <span className="text-white">{regs[0].dailyLimit}</span>
                            {regs[0].hatcheryOnly && <span className="text-amber-400 ml-2">· Hatchery only</span>}
                          </p>
                        )}
                      </div>
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-faint)' }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {selectedFish && (
        <FishDetailSheet species={selectedFish} onClose={() => setSelectedFish(null)} />
      )}
      {selectedRiver && selectedRiverFlow && (
        <RiverDetailSheet
          river={selectedRiver}
          flow={selectedRiverFlow}
          onClose={() => { setSelectedRiver(null); setSelectedRiverFlow(null) }}
        />
      )}
      {selectedWater && (
        <WaterDetailSheet waterName={selectedWater} onClose={() => setSelectedWater(null)} zIndex={70} />
      )}
      <BottomNav />
    </div>
  )
}