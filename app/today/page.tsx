'use client'
import { useState, useEffect } from 'react'
import BottomNav from '@/components/BottomNav'
import FishDetailSheet from '@/components/FishDetailSheet'
import RiverDetailSheet from '@/components/RiverDetailSheet'
import WaterDetailSheet from '@/components/WaterDetailSheet'
import { REGULATIONS, WATER_BODIES, isOpenOn, getOpenSpeciesForDate, daysUntilOpen, SPECIES, Species } from '@/lib/fishing-data'
import { getActiveAlerts, EmergencyAlert } from '@/lib/emergency-alerts'
import { useStarred } from '@/hooks/useStarred'
import { WATER_COORDS } from '@/lib/water-coords'

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
  // Skagit watershed
  { id: '12194000', name: 'Skagit River (Concrete)',    shortName: 'Skagit↑',     thresholds: { low: 2000, high: 8000,   flood: 22000  } },
  { id: '12200500', name: 'Skagit River (Mt Vernon)',   shortName: 'Skagit↓',     thresholds: { low: 4000, high: 15000,  flood: 35000  } },
  { id: '12186000', name: 'Sauk River',                 shortName: 'Sauk',         thresholds: { low: 500,  high: 3000,   flood: 8000   } },
  // Snohomish watershed
  { id: '12134500', name: 'Skykomish River',            shortName: 'Skykomish',    thresholds: { low: 600,  high: 5000,   flood: 16000  } },
  { id: '12149000', name: 'Snoqualmie River',           shortName: 'Snoqualmie',   thresholds: { low: 400,  high: 4000,   flood: 14000  } },
  { id: '12167000', name: 'Stillaguamish River',        shortName: 'Stilly',       thresholds: { low: 800,  high: 5000,   flood: 15000  } },
  { id: '12210500', name: 'Nooksack River',             shortName: 'Nooksack',     thresholds: { low: 1500, high: 8000,   flood: 20000  } },
  // Central / Eastern
  { id: '12462500', name: 'Wenatchee River',            shortName: 'Wenatchee',    thresholds: { low: 500,  high: 4000,   flood: 10000  } },
  { id: '12449950', name: 'Methow River',               shortName: 'Methow',       thresholds: { low: 200,  high: 2500,   flood: 7000   } },
  { id: '12452990', name: 'Entiat River',               shortName: 'Entiat',       thresholds: { low: 100,  high: 800,    flood: 2500   } },
  { id: '12439500', name: 'Okanogan River',             shortName: 'Okanogan',     thresholds: { low: 500,  high: 4000,   flood: 10000  } },
  // Yakima / Columbia
  { id: '12500450', name: 'Yakima River',               shortName: 'Yakima',       thresholds: { low: 300,  high: 3000,   flood: 9000   } },
  { id: '14105700', name: 'Columbia River (Bonneville)',shortName: 'Columbia',     thresholds: { low: 80000,high: 350000, flood: 600000 } },
  // Southwest / Coast
  { id: '14222500', name: 'Lewis River',                shortName: 'Lewis',        thresholds: { low: 800,  high: 8000,   flood: 22000  } },
  { id: '14243000', name: 'Cowlitz River',              shortName: 'Cowlitz',      thresholds: { low: 1500, high: 12000,  flood: 30000  } },
  { id: '12025700', name: 'Chehalis River',             shortName: 'Chehalis',     thresholds: { low: 400,  high: 5000,   flood: 18000  } },
  { id: '12039500', name: 'Humptulips River',           shortName: 'Humptulips',   thresholds: { low: 200,  high: 2500,   flood: 8000   } },
  { id: '12041200', name: 'Hoh River',                  shortName: 'Hoh',          thresholds: { low: 500,  high: 5000,   flood: 16000  } },
  { id: '12076500', name: 'Skokomish River',            shortName: 'Skokomish',    thresholds: { low: 200,  high: 2500,   flood: 8000   } },
  // South Sound / Metro
  { id: '12101500', name: 'Puyallup River',             shortName: 'Puyallup',     thresholds: { low: 600,  high: 7000,   flood: 20000  } },
  { id: '12106700', name: 'Green River',                shortName: 'Green',        thresholds: { low: 300,  high: 3500,   flood: 12000  } },
  { id: '12089500', name: 'Nisqually River',            shortName: 'Nisqually',    thresholds: { low: 300,  high: 3000,   flood: 9000   } },
  // Peninsula
  { id: '12045500', name: 'Sol Duc River',              shortName: 'Sol Duc',      thresholds: { low: 300,  high: 3500,   flood: 10000  } },
  { id: '12048000', name: 'Bogachiel River',            shortName: 'Bogachiel',    thresholds: { low: 200,  high: 2500,   flood: 8000   } },
  { id: '12056500', name: 'Dungeness River',            shortName: 'Dungeness',    thresholds: { low: 100,  high: 1200,   flood: 4000   } },
  { id: '12058500', name: 'Elwha River',                shortName: 'Elwha',        thresholds: { low: 300,  high: 2500,   flood: 7000   } },
]

// Mapping from gauge name → RiverData for RiverDetailSheet
const GAUGE_TO_RIVER: Record<string, RiverData> = {
  // Skagit watershed
  'Skagit River (Concrete)': {
    id: 'skagit', name: 'Skagit River', region: 'Northwest',
    usgsId: '12194000',
    targetSpecies: ['Chinook Salmon', 'Coho Salmon', 'Steelhead'],
    idealCfs: { min: 2000, max: 8000 },
  },
  'Skagit River (Mt Vernon)': {
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
  'Stillaguamish River': {
    id: 'stillaguamish', name: 'Stillaguamish River', region: 'Northwest',
    usgsId: '12167000',
    targetSpecies: ['Steelhead', 'Coho Salmon', 'Chinook Salmon'],
    idealCfs: { min: 800, max: 5000 },
  },
  // Snohomish watershed
  'Skykomish River': {
    id: 'skykomish', name: 'Skykomish River', region: 'Northwest',
    usgsId: '12134500',
    targetSpecies: ['Chinook Salmon', 'Steelhead', 'Coho Salmon'],
    idealCfs: { min: 600, max: 5000 },
  },
  'Snoqualmie River': {
    id: 'snoqualmie', name: 'Snoqualmie River', region: 'Northwest',
    usgsId: '12149000',
    targetSpecies: ['Coho Salmon', 'Steelhead', 'Chinook Salmon'],
    idealCfs: { min: 400, max: 4000 },
  },
  // Central / Eastern
  'Wenatchee River': {
    id: 'wenatchee', name: 'Wenatchee River', region: 'Central',
    usgsId: '12462500',
    targetSpecies: ['Chinook Salmon', 'Sockeye Salmon', 'Steelhead'],
    idealCfs: { min: 500, max: 4000 },
  },
  'Methow River': {
    id: 'methow', name: 'Methow River', region: 'Eastern',
    usgsId: '12449950',
    targetSpecies: ['Chinook Salmon', 'Sockeye Salmon', 'Steelhead'],
    idealCfs: { min: 200, max: 2500 },
  },
  'Entiat River': {
    id: 'entiat', name: 'Entiat River', region: 'Central',
    usgsId: '12452990',
    targetSpecies: ['Chinook Salmon', 'Steelhead'],
    idealCfs: { min: 100, max: 800 },
  },
  'Okanogan River': {
    id: 'okanogan', name: 'Okanogan River', region: 'Eastern',
    usgsId: '12439500',
    targetSpecies: ['Sockeye Salmon', 'Chinook Salmon', 'Steelhead'],
    idealCfs: { min: 500, max: 4000 },
  },
  // Yakima / Columbia
  'Yakima River': {
    id: 'yakima', name: 'Yakima River', region: 'Central',
    usgsId: '12500450',
    targetSpecies: ['Rainbow Trout', 'Steelhead', 'Cutthroat Trout'],
    idealCfs: { min: 300, max: 3000 },
  },
  'Columbia River (Bonneville)': {
    id: 'columbia', name: 'Columbia River', region: 'Southeast',
    usgsId: '14105700',
    targetSpecies: ['Chinook Salmon', 'Steelhead', 'Walleye', 'White Sturgeon'],
    idealCfs: { min: 80000, max: 350000 },
  },
  // Southwest / Coast
  'Lewis River': {
    id: 'lewis', name: 'Lewis River', region: 'Southwest',
    usgsId: '14222500',
    targetSpecies: ['Chinook Salmon', 'Coho Salmon', 'Steelhead'],
    idealCfs: { min: 800, max: 8000 },
  },
  'Cowlitz River': {
    id: 'cowlitz', name: 'Cowlitz River', region: 'Southwest',
    usgsId: '14243000',
    targetSpecies: ['Chinook Salmon', 'Coho Salmon', 'Steelhead'],
    idealCfs: { min: 1500, max: 12000 },
  },
  'Chehalis River': {
    id: 'chehalis', name: 'Chehalis River', region: 'Southwest',
    usgsId: '12025700',
    targetSpecies: ['Chinook Salmon', 'Coho Salmon', 'Steelhead'],
    idealCfs: { min: 400, max: 5000 },
  },
  'Humptulips River': {
    id: 'humptulips', name: 'Humptulips River', region: 'Coast',
    usgsId: '12039500',
    targetSpecies: ['Coho Salmon', 'Steelhead', 'Chinook Salmon'],
    idealCfs: { min: 200, max: 2500 },
  },
  'Hoh River': {
    id: 'hoh', name: 'Hoh River', region: 'Olympic',
    usgsId: '12041200',
    targetSpecies: ['Chinook Salmon', 'Steelhead', 'Cutthroat Trout'],
    idealCfs: { min: 500, max: 5000 },
  },
  'Skokomish River': {
    id: 'skokomish', name: 'Skokomish River', region: 'Olympic',
    usgsId: '12076500',
    targetSpecies: ['Chum Salmon', 'Coho Salmon', 'Chinook Salmon'],
    idealCfs: { min: 200, max: 2500 },
  },
  // South Sound / Metro
  'Puyallup River': {
    id: 'puyallup', name: 'Puyallup River', region: 'Puget Sound',
    usgsId: '12101500',
    targetSpecies: ['Chinook Salmon', 'Coho Salmon', 'Steelhead'],
    idealCfs: { min: 600, max: 7000 },
  },
  'Green River': {
    id: 'green', name: 'Green River', region: 'Puget Sound',
    usgsId: '12106700',
    targetSpecies: ['Coho Salmon', 'Chinook Salmon', 'Steelhead'],
    idealCfs: { min: 300, max: 3500 },
  },
  'Nisqually River': {
    id: 'nisqually', name: 'Nisqually River', region: 'Puget Sound',
    usgsId: '12089500',
    targetSpecies: ['Chinook Salmon', 'Coho Salmon', 'Steelhead'],
    idealCfs: { min: 300, max: 3000 },
  },
  // Peninsula
  'Sol Duc River': {
    id: 'sol-duc', name: 'Sol Duc River', region: 'Olympic',
    usgsId: '12045500',
    targetSpecies: ['Steelhead', 'Chinook Salmon', 'Coho Salmon'],
    idealCfs: { min: 300, max: 3500 },
  },
  'Bogachiel River': {
    id: 'bogachiel', name: 'Bogachiel River', region: 'Olympic',
    usgsId: '12048000',
    targetSpecies: ['Steelhead', 'Coho Salmon'],
    idealCfs: { min: 200, max: 2500 },
  },
  'Dungeness River': {
    id: 'dungeness', name: 'Dungeness River', region: 'Olympic',
    usgsId: '12056500',
    targetSpecies: ['Pink Salmon', 'Chum Salmon', 'Coho Salmon'],
    idealCfs: { min: 100, max: 1200 },
  },
  'Elwha River': {
    id: 'elwha', name: 'Elwha River', region: 'Olympic',
    usgsId: '12058500',
    targetSpecies: ['Chinook Salmon', 'Steelhead', 'Coho Salmon'],
    idealCfs: { min: 300, max: 2500 },
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

// ─── Plain-English CFS description ───────────────────────────────────────────
function getCfsDescription(status: GaugeStatus): string {
  switch (status) {
    case 'low':    return 'Running low — wading is easy, fish may be concentrated in deeper holes'
    case 'good':   return 'Ideal conditions — great time to fish'
    case 'high':   return 'Running high — fish slower side channels and eddies near banks'
    case 'flood':  return 'Flood stage — dangerous, not recommended for fishing'
    default:       return ''
  }
}

// ─── Weather hook (Open-Meteo, no API key) ────────────────────────────────────
type WeatherData = { temp: number; wind: number; precip: number }

function useWeather(waterIds: string[]): Record<string, WeatherData | null> {
  const [data, setData] = useState<Record<string, WeatherData | null>>({})
  const key = waterIds.slice().sort().join(',')

  useEffect(() => {
    if (!key) return
    const entries = key.split(',').filter(id => WATER_COORDS[id])
    if (entries.length === 0) return
    Promise.all(entries.map(async id => {
      const coords = WATER_COORDS[id]
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,wind_speed_10m,precipitation_probability&wind_speed_unit=mph&temperature_unit=fahrenheit&forecast_days=1`
        const res = await fetch(url)
        const json = await res.json()
        const c = json.current
        return { id, data: { temp: c.temperature_2m as number, wind: c.wind_speed_10m as number, precip: c.precipitation_probability as number } }
      } catch {
        return { id, data: null }
      }
    })).then(results => {
      const m: Record<string, WeatherData | null> = {}
      for (const r of results) m[r.id] = r.data
      setData(m)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return data
}

// ─── Solunar bite times — accurate moon transit calculation ─────────────────
function getSolunarPeriods(date: Date): { major: number[]; minor: number[] } {
  const KNOWN_NEW_MOON_MS = 946_137_240_000
  const SYNODIC_MS = 29.530589 * 86_400_000
  const localNoon = new Date(date)
  localNoon.setHours(12, 0, 0, 0)
  const elapsed = localNoon.getTime() - KNOWN_NEW_MOON_MS
  const moonAge = ((elapsed % SYNODIC_MS) + SYNODIC_MS) % SYNODIC_MS / 86_400_000
  const SOLAR_NOON = 12.5
  const advanceHours = (moonAge * 24) / 29.530589
  const upperTransit = (SOLAR_NOON + advanceHours) % 24
  const lowerTransit = (upperTransit + 12) % 24
  const moonrise     = (upperTransit + 6) % 24
  const moonset      = (upperTransit + 18) % 24
  return {
    major: [upperTransit, lowerTransit],
    minor: [moonrise, moonset],
  }
}

function fmtHour(h: number): string {
  const norm = ((h % 24) + 24) % 24
  const hour = Math.floor(norm)
  const min  = Math.round((norm % 1) * 60)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const disp = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${disp}:${min.toString().padStart(2, '0')} ${ampm}`
}

function SolunarTimeline({ date }: { date: Date }) {
  const { major, minor } = getSolunarPeriods(date)
  const nowHour = date.getHours() + date.getMinutes() / 60
  const [open, setOpen] = useState(false)

  const pct = (h: number) => `${(((h % 24) + 24) % 24 / 24 * 100).toFixed(2)}%`
  const wid = (h: number) => `${(h / 24 * 100).toFixed(2)}%`

  const fmtRange = (center: number, half: number) => {
    const s = ((center - half) % 24 + 24) % 24
    const e = ((center + half) % 24 + 24) % 24
    return `${fmtHour(s)} – ${fmtHour(e)}`
  }

  const allWindows = [
    ...major.map(c => ({ center: c, half: 1, type: 'Optimal' as const, color: '#22c55e' })),
    ...minor.map(c => ({ center: c, half: 0.5, type: 'Good' as const, color: '#f97316' })),
  ]

  // Is now inside a window?
  const activeWindow = allWindows.find(w => {
    const s = ((w.center - w.half) % 24 + 24) % 24
    const e = ((w.center + w.half) % 24 + 24) % 24
    if (s < e) return nowHour >= s && nowHour < e
    return nowHour >= s || nowHour < e // wraps midnight
  })

  // Next upcoming window (by soonest start)
  const nextWindow = allWindows
    .map(w => {
      const s = ((w.center - w.half) % 24 + 24) % 24
      const dist = ((s - nowHour) % 24 + 24) % 24
      return { ...w, startHour: s, dist }
    })
    .filter(w => w.dist > 0)
    .sort((a, b) => a.dist - b.dist)[0]

  // Status line for the row
  let statusText: string
  let statusColor: string
  if (activeWindow) {
    const endHour = ((activeWindow.center + activeWindow.half) % 24 + 24) % 24
    statusText = `${activeWindow.type} until ${fmtHour(endHour)}`
    statusColor = activeWindow.color
  } else if (nextWindow) {
    statusText = `Next ${nextWindow.type.toLowerCase()} at ${fmtHour(nextWindow.startHour)}`
    statusColor = 'var(--text-faint)'
  } else {
    statusText = 'Tap to see today\'s windows'
    statusColor = 'var(--text-faint)'
  }

  const dayLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <>
      {/* ── Tappable row ── */}
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-5 px-4 py-4 flex items-center justify-between"
        style={{
          background: activeWindow ? activeWindow.color : 'var(--surface)',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}>
        <div className="flex items-center gap-2">
          <div>
            <div className="text-sm font-black text-left" style={{ color: activeWindow ? '#ffffff' : 'var(--text)' }}>Best Bite Times</div>
            <div className="text-[11px] font-semibold text-left mt-0.5" style={{ color: activeWindow ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)' }}>{statusText}</div>
          </div>
        </div>
        <span className="text-base font-light" style={{ color: activeWindow ? '#ffffff' : 'var(--text-muted)', opacity: 0.8 }}>›</span>
      </button>

      {/* ── Bottom sheet modal ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()}
            className="w-full px-5 pt-5 pb-8"
            style={{ background: 'var(--bg)', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px 12px 0 0', maxHeight: '85vh', overflowY: 'auto' }}>

            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
            </div>

            {/* Title */}
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-black text-white">Best Bite Times</h2>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--text-faint)', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <p className="text-xs mb-5" style={{ color: 'var(--text-faint)' }}>{dayLabel} · All species · Based on moon position</p>

            {/* Timeline */}
            <div className="relative w-full mb-1" style={{ height: 36 }}>
              <div className="absolute inset-0" style={{ background: '#070910', borderRadius: 6 }} />

              {/* Minor — orange */}
              {minor.map((center, i) => (
                <div key={`mn-${i}`} className="absolute"
                  style={{ left: pct(center - 0.5), width: wid(1), top: 6, bottom: 6, background: '#f26522', borderRadius: 3, opacity: 0.85 }} />
              ))}

              {/* Major — green */}
              {major.map((center, i) => (
                <div key={`mj-${i}`} className="absolute"
                  style={{ left: pct(center - 1), width: wid(2), top: 3, bottom: 3, background: '#22c55e', borderRadius: 3 }} />
              ))}

              {/* Current time */}
              <div className="absolute pointer-events-none"
                style={{ left: pct(nowHour), top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.75)', borderRadius: 1 }} />

              {/* Time labels */}
              {[0, 6, 12, 18, 24].map(h => (
                <div key={h} className="absolute pointer-events-none"
                  style={{ left: h === 24 ? '100%' : pct(h), bottom: -16, transform: 'translateX(-50%)' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                    {h === 0 || h === 24 ? '12' : h === 6 || h === 18 ? '6' : '12'}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ height: 22 }} />

            {/* Legend row */}
            <div className="flex items-center gap-5 mb-6">
              <div className="flex items-center gap-1.5">
                <div style={{ width: 10, height: 10, background: '#22c55e', borderRadius: 2 }} />
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Optimal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 10, height: 10, background: '#f97316', borderRadius: 2, opacity: 0.85 }} />
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Good</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 2, height: 10, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Now</span>
              </div>
            </div>

            {/* Window list */}
            <div className="flex flex-col gap-3">
              {[
                ...major.map(c => ({ center: c, half: 1, type: 'Optimal' as const, color: '#22c55e', desc: 'Moon directly overhead or underfoot — peak feeding activity' })),
                ...minor.map(c => ({ center: c, half: 0.5, type: 'Good' as const, color: '#f97316', desc: 'Moonrise or moonset — elevated feeding activity' })),
              ]
                .sort((a, b) => (((a.center) % 24 + 24) % 24) - (((b.center) % 24 + 24) % 24))
                .map((w, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3"
                    style={{ background: 'var(--surface)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: 4, borderRadius: 2, background: w.color, alignSelf: 'stretch', flexShrink: 0 }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white">{w.type}</span>
                        <span className="text-sm font-black" style={{ color: w.color }}>{fmtRange(w.center, w.half)}</span>
                      </div>
                      <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{w.desc}</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Footnote */}
            <p className="text-[10px] text-center mt-5" style={{ color: 'var(--text-faint)' }}>
              Solunar theory — fish are most active when the moon is overhead, underfoot, rising, or setting.
            </p>
          </div>
        </div>
      )}
    </>
  )
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
  const weatherData = useWeather(starredWaterIds)

  const openSpecies = getOpenSpeciesForDate(today)

  // Starred fish species objects — open first (alpha), then closed (alpha)
  const starredFish = SPECIES
    .filter(s => starredFishIds.includes(s.id))
    .sort((a, b) => {
      const aOpen = openSpecies.some(s => s.id === a.id)
      const bOpen = openSpecies.some(s => s.id === b.id)
      if (aOpen !== bOpen) return aOpen ? -1 : 1
      return a.name.localeCompare(b.name)
    })

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

        {/* ── SOLUNAR BITE TIMES ── */}
        <SolunarTimeline date={today} />

        {/* ── separator ── */}
        <div className="mb-8" style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* ── MY WATERS ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white">My Waters</h2>
              {starredWaters.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                  {starredWaters.length}
                </span>
              )}
            </div>
            {starredWaters.length === 0 && hydrated && (
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>tap ☆ to add</span>
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
            <div className="flex flex-col gap-3">
              {starredWaters.map(water => {
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
                    key={water.id}
                    onClick={() => setSelectedWater(water.name)}
                    className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.99]"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
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
                          {(() => {
                            const w = weatherData[water.id]
                            if (!w) return null
                            return (
                              <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
                                {Math.round(w.temp)}°F · {Math.round(w.wind)} mph wind{w.precip > 20 ? ` · ${w.precip}% rain` : ''}
                              </p>
                            )
                          })()}
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
                      {/* Notes row — full width below the flex row */}
                      {hasGauge && cfg && gauge && gauge.status !== 'loading' && (
                        <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <span className="text-[10px] font-bold uppercase tracking-wide mr-2" style={{ color: 'var(--text-faint)' }}>Note</span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{getCfsDescription(gauge.status)}</span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── separator ── */}
        <div className="mb-8" style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

        {/* ── MY FISH ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white">My Fish</h2>
              {starredFish.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                  {starredFish.length}
                </span>
              )}
            </div>
            {starredFish.length === 0 && hydrated && (
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>tap ☆ to add</span>
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
                      style={{ width: 96, height: 96, background: '#0b0d14' }}>
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

        {/* ── separator ── */}
        {openingSoon.length > 0 && <div className="mb-8" style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />}

        {/* ── OPENING SOON — next 14 days ── */}
        {openingSoon.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white">Opening Soon</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                  {openingSoon.length}
                </span>
              </div>
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