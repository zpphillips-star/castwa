'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useStarredWaters } from '@/hooks/useStarred'
import dynamic from 'next/dynamic'
import {
  WATER_BODIES, REGULATIONS, SPECIES, SKAGIT_SECTIONS,
  isOpenOn,
} from '@/lib/fishing-data'
import type { Species, Regulation, WaterBody } from '@/lib/fishing-data'
import {
  SKAGIT_COORDS, SNOHOMISH_COORDS, NOOKSACK_COORDS,
  SAUK_COORDS, STILLAGUAMISH_COORDS,
  WA_WATERWAYS,
} from '@/lib/river-coords-generated'
import { sliceRiverBetween } from '@/lib/river-regulation-segments'
import type { MapSegment, SegmentStatus } from './RiverDetailMapInner'
import { FISH_TIPS } from './RiverDetailSheet'
import FishDetailSheet from './FishDetailSheet'
import { useSwipeBack } from '@/hooks/useSwipeBack'

const RiverDetailMapInner = dynamic(
  () => import('./RiverDetailMapInner'),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', background: '#08080f', color: '#6b7280', fontSize: 14 }}>
        Loading map…
      </div>
    ),
  }
)

const LakeMapInner = dynamic(
  () => import('./LakeMapInner'),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', background: '#b8d8ea', color: '#374151', fontSize: 14 }}>
        Loading map…
      </div>
    ),
  }
)

// ─── River data (rivers with USGS gauges) ─────────────────────────────────────
type RiverEntry = {
  id: string; name: string; region: string; usgsId: string
  targetSpecies: string[]; idealCfs: { min: number; max: number }
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

type FlowData = {
  cfs: number | null
  status: 'ideal' | 'low' | 'high' | 'loading' | 'error'
  trend: 'rising' | 'falling' | 'stable' | null
  fetchedAt: string
}

// ─── Map helpers (mirrors RiverDetailSheet) ───────────────────────────────────
function parseGoogleMapsCoord(url: string): [number, number] | null {
  const m = url.match(/[?&]q=([\d.-]+),([\d.-]+)/)
  if (m) return [parseFloat(m[1]), parseFloat(m[2])]
  return null
}

function getSectionStatus(section: typeof SKAGIT_SECTIONS[0]): SegmentStatus {
  if (section.emergencyRule) return 'emergency'
  const allClosed = section.seasons.every(s => s.closed)
  return allClosed ? 'closed' : 'open'
}

function getRiverCoords(riverId: string): [number, number][] {
  const direct: Record<string, [number, number][]> = {
    skagit: SKAGIT_COORDS, snohomish: SNOHOMISH_COORDS,
    nooksack: NOOKSACK_COORDS, sauk: SAUK_COORDS, stillaguamish: STILLAGUAMISH_COORDS,
  }
  if (direct[riverId]) return direct[riverId]
  const nameMap: Record<string, string> = {
    columbia: 'Columbia River', yakima: 'Yakima River',
    green: 'Green River', cedar: 'Cedar River', snake: 'Snake River',
  }
  const name = nameMap[riverId]
  if (name && WA_WATERWAYS[name]) return WA_WATERWAYS[name].polylines.flat() as [number, number][]
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

// Species-aware Skagit segment builder
const SPECIES_SEASON_NAMES: Record<string, string[]> = {
  sockeye:   ['sockeye', 'Sockeye Salmon'],
  chinook:   ['chinook', 'Chinook Salmon', 'Chinook'],
  coho:      ['coho', 'Coho Salmon', 'Coho'],
  steelhead: ['steelhead', 'Steelhead'],
}

function buildSkagitSegmentsForSpecies(speciesId: string): MapSegment[] {
  const nameAliases = SPECIES_SEASON_NAMES[speciesId] ?? [speciesId]
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

    // Determine status for THIS species
    let status: SegmentStatus = 'closed'

    // Emergency rule takes priority if it affects this species
    if (section.emergencyRule) {
      const activeOverride = section.emergencyRule.overrides.find(o =>
        o.status === 'OPEN' || o.status === 'CLOSED'
      )
      if (activeOverride) {
        status = 'emergency'
        return { idx, coords, status, label: section.name }
      }
    }

    // Check season entries for this species
    const matchingSeason = section.seasons.find(s =>
      nameAliases.some(alias => s.species.toLowerCase().includes(alias.toLowerCase()))
    )

    if (matchingSeason) {
      status = matchingSeason.closed ? 'closed' : 'open'
    } else {
      // No season entry for this species = closed
      status = 'closed'
    }

    return { idx, coords, status, label: section.name }
  })
}

function buildFullRiverSegment(riverId: string): MapSegment[] {
  const coords = getRiverCoords(riverId)
  if (coords.length === 0) return []
  return [{ idx: 0, coords, status: 'neutral', label: 'Full River' }]
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionStatusChip({ status }: { status: SegmentStatus }) {
  const cfg = {
    open:       { label: '● OPEN',       color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
    closed:     { label: '○ CLOSED',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
    emergency:  { label: '🚨 EMERG.',    color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    restricted: { label: '⚠️ RESTR.',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    neutral:    { label: '● WATERWAY',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  }[status]
  return (
    <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-1"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

function FlowStatusBadge({ status, cfs, trend }: { status: FlowData['status']; cfs: number | null; trend: FlowData['trend'] }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    ideal:   { label: 'IDEAL',   color: '#6ab04c', bg: 'rgba(106,176,76,0.15)'  },
    low:     { label: 'LOW',     color: '#f26522', bg: 'rgba(242,101,34,0.15)'  },
    high:    { label: 'HIGH',    color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
    loading: { label: '…',       color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
    error:   { label: 'N/A',     color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
  }
  const c = cfg[status] ?? cfg.loading
  const trendIcon = trend === 'rising' ? '↑' : trend === 'falling' ? '↓' : trend === 'stable' ? '→' : null
  const trendColor = trend === 'rising' ? '#ef4444' : trend === 'falling' ? '#60a5fa' : '#22c55e'
  return (
    <div className="flex items-center gap-1.5">
      {cfs !== null && (
        <span className="text-sm font-black tabular-nums" style={{ color: c.color }}>
          {cfs >= 10000 ? `${(cfs / 1000).toFixed(0)}k` : cfs.toLocaleString()}
          <span className="text-[10px] font-semibold ml-0.5" style={{ color: 'var(--text-faint)' }}>cfs</span>
        </span>
      )}
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
        style={{ background: c.bg, color: c.color }}>{c.label}</span>
      {trendIcon && <span className="text-xs font-bold" style={{ color: trendColor }}>{trendIcon}</span>}
    </div>
  )
}

// ─── FishInRiverView ──────────────────────────────────────────────────────────
interface FishInRiverViewProps {
  species: Species
  water: WaterBody
  waterName: string
  isSkagit: boolean
  riverId: string | null
  onBack: () => void
}

function FishInRiverView({ species, water, waterName, isSkagit, riverId, onBack }: FishInRiverViewProps) {
  const [selectedSegIdx, setSelectedSegIdx] = useState(0)
  const [segHighlighted, setSegHighlighted] = useState(false)
  const today = new Date()

  // Regulations for this species at this water body
  const fishRegs = useMemo(() => {
    return REGULATIONS.filter(r => r.speciesId === species.id && r.waterBodyId === water.id)
  }, [species.id, water.id])

  // Build map segments (river / Skagit only — lakes handled separately)
  const segments = useMemo<MapSegment[]>(() => {
    if (isSkagit) return buildSkagitSegmentsForSpecies(species.id)
    const coords = getRiverCoords(riverId ?? '')
    const hasOpenReg = fishRegs.some(r => isOpenOn(r, today))
    if (coords.length > 0) {
      return [{ idx: 0, coords, status: hasOpenReg ? 'open' : 'closed', label: waterName }]
    }
    return []
  }, [isSkagit, species.id, riverId, fishRegs, waterName, today]) // eslint-disable-line react-hooks/exhaustive-deps

  // True when the water body has no river-polyline data (lakes, sounds, bays)
  const isLakeType = !isSkagit && segments.length === 0
  const lakeRegStatus: 'open' | 'closed' = fishRegs.some(r => isOpenOn(r, today)) ? 'open' : 'closed'

  // Emergency rules for this species on this river
  const emergencyRules = useMemo(() => {
    if (!isSkagit) return []
    return SKAGIT_SECTIONS
      .filter(s => s.emergencyRule && s.seasons.some(season =>
        (SPECIES_SEASON_NAMES[species.id] ?? [species.id]).some(alias =>
          season.species.toLowerCase().includes(alias.toLowerCase())
        )
      ))
      .map(s => ({ section: s.name, rule: s.emergencyRule! }))
  }, [isSkagit, species.id])

  const tips = FISH_TIPS[species.id]

  function fmtDate(mmdd: string) {
    const MNAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const [m, d] = mmdd.split('-').map(Number)
    return `${MNAMES[m - 1]} ${d}`
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0d0f1a' }}>

      {/* ── Back header ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold active:opacity-70"
          style={{ color: 'var(--accent)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          {waterName}
        </button>
        <div className="flex-1" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={species.photo} alt={species.name}
          style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, background: '#0b0d14' }} />
        <div className="text-right">
          <p className="text-sm font-black text-white leading-tight">{species.name}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>in {waterName}</p>
        </div>
      </div>

      {/* ── Emergency banners ── */}
      {emergencyRules.length > 0 && (
        <div className="flex-shrink-0">
          {emergencyRules.slice(0, 1).map((er, i) => (
            <div key={i} className="px-4 py-2.5 flex items-start gap-2"
              style={{ background: 'rgba(239,68,68,0.12)', borderBottom: '1.5px solid rgba(239,68,68,0.3)' }}>
              <span className="text-base flex-shrink-0 mt-0.5">🚨</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: '#ef4444' }}>
                  Emergency Rule Active — {er.section}
                </p>
                <p className="text-[11px] leading-snug mt-0.5" style={{ color: '#fca5a5' }}>
                  {er.rule.effective}
                </p>
                <a href={er.rule.url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] underline" style={{ color: '#ef4444' }}>
                  View official rule ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Map (fixed height, not scrollable) ── */}
      {isLakeType ? (
        <div className="flex-shrink-0" style={{ height: '200px' }}>
          <LakeMapInner
            waterName={waterName}
            lat={water.lat}
            lng={water.lng}
            fillColor={lakeRegStatus === 'open' ? '#4ade80' : '#ef4444'}
          />
        </div>
      ) : segments.length > 0 ? (
        <div className="flex-shrink-0" style={{ height: '200px' }}>
          <RiverDetailMapInner
            segments={segments}
            selectedIdx={segHighlighted ? selectedSegIdx : -1}
            onSegmentClick={idx => { setSelectedSegIdx(idx); setSegHighlighted(true) }}
          />
        </div>
      ) : null}

      {/* ── Section tile strip (Skagit only, same as RiverDetailSheet) ── */}
      {isSkagit && segments.length > 0 && (
        <div className="flex-shrink-0 px-3 py-2 overflow-x-auto no-scrollbar"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex gap-2" style={{ paddingRight: 12 }}>
            {segments.map((seg, i) => {
              const selected = segHighlighted && selectedSegIdx === i
              const statusCfg: Record<string, { color: string; label: string }> = {
                open:      { color: '#4ade80', label: '● OPEN'      },
                emergency: { color: '#f97316', label: '⚠ EMERGENCY' },
                closed:    { color: '#ef4444', label: '○ CLOSED'    },
              }
              const cfg = statusCfg[seg.status] ?? statusCfg.closed
              return (
                <button key={i}
                  onClick={() => { setSelectedSegIdx(i); setSegHighlighted(true) }}
                  className="flex-shrink-0 px-3 py-2 rounded-xl text-left transition-all active:scale-[0.97]"
                  style={{
                    background: selected ? `${cfg.color}18` : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${selected ? cfg.color : 'rgba(255,255,255,0.09)'}`,
                    minWidth: 140,
                    maxWidth: 170,
                  }}>
                  <p className="text-xs font-bold text-white leading-tight"
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                    {seg.label}
                  </p>
                  <p className="text-[10px] font-bold mt-0.5" style={{ color: cfg.color }}>{cfg.label}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">

        {/* Legend (only when map is shown) */}
        {(segments.length > 0 || isLakeType) && (
          <div className="flex gap-3 px-4 pt-3 pb-1 flex-wrap">
            {[
              { color: '#4ade80', label: 'OPEN' },
              { color: '#f97316', label: 'EMERGENCY' },
              { color: '#ef4444', label: 'CLOSED' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <span className="w-3 h-2 rounded-sm inline-block" style={{ background: l.color }} />
                <span className="text-[10px] font-semibold" style={{ color: 'var(--text-faint)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Fish-specific regulations for this river */}
        <div className="px-4 pt-2 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: 'var(--text-faint)' }}>
            {species.name} Regulations — {waterName}
          </p>

          {fishRegs.length === 0 ? (
            <div className="rounded-xl p-4 text-center" style={{ border: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold text-white mb-1">No specific regulation on file</p>
              <a href="https://wdfw.wa.gov/fishing/regulations" target="_blank" rel="noopener noreferrer"
                className="text-xs underline" style={{ color: '#f26522' }}>
                Check WDFW directly →
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {fishRegs.map(reg => {
                const isOpen = isOpenOn(reg, today)
                return (
                  <div key={reg.id}
                    className="rounded-xl px-4 py-3"
                    style={{
                      background: isOpen ? 'rgba(106,176,76,0.08)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isOpen ? 'rgba(106,176,76,0.25)' : 'var(--border)'}`,
                      borderLeft: `3px solid ${isOpen ? '#6ab04c' : '#374151'}`,
                    }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded"
                        style={{
                          background: isOpen ? 'rgba(106,176,76,0.18)' : 'rgba(107,114,128,0.18)',
                          color: isOpen ? '#6ab04c' : '#9ca3af',
                        }}>
                        {isOpen ? '● OPEN' : '○ CLOSED'}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                        {fmtDate(reg.seasonStart)} – {fmtDate(reg.seasonEnd)}
                      </span>
                    </div>
                    {reg.dailyLimit != null && (
                      <p className="text-sm font-semibold text-white">
                        Daily limit: <span style={{ color: '#6ab04c' }}>{reg.dailyLimit}</span>
                      </p>
                    )}
                    {reg.minSize != null && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Min size: <span className="text-white">{reg.minSize}&quot;</span>
                      </p>
                    )}
                    {reg.hatcheryOnly && (
                      <p className="text-xs mt-1 font-semibold" style={{ color: '#fbbf24' }}>
                        🏷 Hatchery fish only (clipped adipose fin)
                      </p>
                    )}
                    {reg.gearRestriction && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Gear: <span className="text-white">{reg.gearRestriction}</span>
                      </p>
                    )}
                    {reg.notes && (
                      <p className="text-xs mt-1.5 leading-snug" style={{ color: '#fdba74' }}>{reg.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* How to fish tips */}
        {tips && (
          <div className="px-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--text-faint)' }}>
              How to fish for {species.name}
            </p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {tips.howToCatch.map((tip, i) => (
                <div key={i} className="flex gap-3 px-4 py-3"
                  style={{ background: 'var(--bg)', borderBottom: i < tips.howToCatch.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5"
                    style={{ background: 'rgba(242,101,34,0.2)', color: 'var(--accent)' }}>{i + 1}</span>
                  <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WDFW link */}
        <div className="px-4 pb-6">
          <a href="https://wdfw.wa.gov/fishing/regulations" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-5 py-3.5 rounded-xl no-underline"
            style={{ background: 'rgba(242,101,34,0.12)', border: '1px solid rgba(242,101,34,0.3)', textDecoration: 'none' }}>
            <span className="text-sm font-bold" style={{ color: '#f26522' }}>Verify on WDFW →</span>
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>wdfw.wa.gov</span>
          </a>
        </div>

      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  waterName: string
  onClose: () => void
  zIndex?: number
  initialSpeciesId?: string
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WaterDetailSheet({ waterName, onClose, zIndex = 50, initialSpeciesId }: Props) {
  const { isStarred: isWaterStarred, toggle: toggleWaterStar } = useStarredWaters()
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(
    initialSpeciesId ? (SPECIES.find(s => s.id === initialSpeciesId) ?? null) : null
  )
  // Fish tapped in the fish grid → open FishDetailSheet (consistent across all surfaces)
  const [selectedFishForSheet, setSelectedFishForSheet] = useState<Species | null>(null)
  const [selectedSectionIdx, setSelectedSectionIdx] = useState(0)
  const [sectionHighlighted, setSectionHighlighted] = useState(false)
  const [flow, setFlow]                         = useState<FlowData>({ cfs: null, status: 'loading', trend: null, fetchedAt: '' })

  // Swipe right = pop innermost state: if species selected → clear it, else → close sheet
  const handleBack = useCallback(() => {
    if (selectedSpecies) setSelectedSpecies(null)
    else onClose()
  }, [selectedSpecies, onClose])
  const swipeBack = useSwipeBack(handleBack)

  const today = new Date()

  // ── Look up water body ──────────────────────────────────────────────────────
  const water = useMemo(() => {
    const lower = waterName.toLowerCase()
    return (
      WATER_BODIES.find(w => w.name.toLowerCase() === lower) ??
      WATER_BODIES.find(w => lower.includes(w.id)) ??
      WATER_BODIES.find(w => w.name.toLowerCase().startsWith(lower.split(' ')[0]))
    )
  }, [waterName])

  // ── Regulations → species ───────────────────────────────────────────────────
  const speciesRegs = useMemo(() => {
    if (!water) return []
    const regs = REGULATIONS.filter(r => r.waterBodyId === water.id)
    return regs
      .map(r => ({ reg: r, species: SPECIES.find(s => s.id === r.speciesId)! }))
      .filter(item => !!item.species)
      .sort((a, b) => {
        const aOpen = isOpenOn(a.reg, today)
        const bOpen = isOpenOn(b.reg, today)
        if (aOpen && !bOpen) return -1
        if (!aOpen && bOpen) return 1
        return a.species.name.localeCompare(b.species.name)
      })
  }, [water]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Find river entry (gauged?) ──────────────────────────────────────────────
  const riverEntry = useMemo(() => {
    const lower = waterName.toLowerCase()
    return ALL_RIVERS.find(r => lower.includes(r.id) || r.name.toLowerCase() === lower) ?? null
  }, [waterName])

  const isSkagit = riverEntry?.id === 'skagit'

  // ── Build map segments (plain blue waterway — no restrictions until fish selected) ──
  const segments = useMemo<MapSegment[]>(() => {
    if (!riverEntry) return []
    return buildFullRiverSegment(riverEntry.id)
  }, [riverEntry])

  // ── Self-fetch USGS flow ────────────────────────────────────────────────────
  useEffect(() => {
    if (!riverEntry) return
    async function fetchFlow() {
      try {
        const url = `https://waterservices.usgs.gov/nwis/iv/?sites=${riverEntry!.usgsId}&parameterCd=00060&format=json&period=PT2H`
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const values = data?.value?.timeSeries?.[0]?.values?.[0]?.value
        if (!values?.length) throw new Error('no data')
        const latest = parseFloat(values[values.length - 1]?.value)
        const prev   = values.length > 1 ? parseFloat(values[values.length - 2]?.value) : latest
        const trend: FlowData['trend'] = latest > prev * 1.05 ? 'rising' : latest < prev * 0.95 ? 'falling' : 'stable'
        const { min, max } = riverEntry!.idealCfs
        const status: FlowData['status'] = (latest >= min && latest <= max) ? 'ideal' : latest < min ? 'low' : 'high'
        setFlow({ cfs: latest, status, trend, fetchedAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) })
      } catch {
        setFlow(f => ({ ...f, status: 'error' }))
      }
    }
    fetchFlow()
  }, [riverEntry])

  function fmtDate(mmdd: string) {
    const MNAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const [m, d] = mmdd.split('-').map(Number)
    return `${MNAMES[m - 1]} ${d}`
  }

  return (
    <>
      <div
        className="fixed inset-0 flex flex-col justify-end"
        style={{ zIndex, background: 'rgba(0,0,0,0.75)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          className="animate-slide-up rounded-t-2xl flex flex-col overflow-hidden"
          style={{ background: '#0d0f1a', height: '92dvh' }}
          {...swipeBack}
        >

          {/* ── When a species is selected: show fish-in-river view ── */}
          {selectedSpecies && water ? (
            <FishInRiverView
              species={selectedSpecies}
              water={water}
              waterName={waterName}
              isSkagit={isSkagit}
              riverId={riverEntry?.id ?? null}
              onBack={() => setSelectedSpecies(null)}
            />
          ) : (
            <>
          {/* ── Header ── */}
          <div className="flex-shrink-0 flex items-start justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex-1 min-w-0 mr-3">
              <h2 className="text-xl font-black text-white leading-tight">{waterName}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {water && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {water.region} · {water.type}
                  </span>
                )}
                {riverEntry && (
                  <FlowStatusBadge status={flow.status} cfs={flow.cfs} trend={flow.trend} />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
              {/* Star button */}
              {water && (
                <button
                  onClick={() => toggleWaterStar(water.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>
                    {isWaterStarred(water.id) ? '⭐' : '☆'}
                  </span>
                </button>
              )}
              <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto no-scrollbar">

            {/* ── River Conditions (gauged rivers only) ── */}
            {riverEntry && (
              <div className="px-4 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--text-faint)' }}>River Conditions</p>

                {/* Live stats row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-xl px-3 py-2.5 col-span-2"
                    style={{ background: flow.status === 'ideal' ? 'rgba(106,176,76,0.1)' : flow.status === 'loading' ? 'rgba(255,255,255,0.04)' : 'rgba(242,101,34,0.1)', border: `1px solid ${flow.status === 'ideal' ? 'rgba(106,176,76,0.25)' : flow.status === 'loading' ? 'var(--border)' : 'rgba(242,101,34,0.25)'}` }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-faint)' }}>Live Flow</p>
                    {flow.cfs !== null ? (
                      <p className="text-2xl font-black text-white">
                        {flow.cfs >= 10000 ? `${(flow.cfs / 1000).toFixed(0)}k` : flow.cfs.toLocaleString()}
                        <span className="text-sm font-semibold ml-1" style={{ color: 'var(--text-faint)' }}>cfs</span>
                      </p>
                    ) : (
                      <div className="h-7 w-20 rounded animate-pulse" style={{ background: 'var(--border)' }} />
                    )}
                    {flow.fetchedAt && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>as of {flow.fetchedAt}</p>}
                  </div>
                  <div className="rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-faint)' }}>Status</p>
                    <p className="text-sm font-black" style={{ color: flow.status === 'ideal' ? '#6ab04c' : flow.status === 'error' ? '#6b7280' : '#f26522' }}>
                      {flow.status === 'ideal' ? 'IDEAL' : flow.status === 'low' ? 'LOW' : flow.status === 'high' ? 'HIGH' : flow.status === 'loading' ? '…' : 'N/A'}
                    </p>
                    {flow.trend && (
                      <p className="text-[11px] mt-0.5" style={{ color: flow.trend === 'rising' ? '#ef4444' : flow.trend === 'falling' ? '#60a5fa' : '#22c55e' }}>
                        {flow.trend === 'rising' ? '↑ rising' : flow.trend === 'falling' ? '↓ falling' : '→ stable'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Map (plain blue waterway — tap a fish below to see restrictions) */}
                {segments.length > 0 && (
                  <div className="rounded-xl overflow-hidden mb-1" style={{ height: '220px' }}>
                    <RiverDetailMapInner
                      segments={segments}
                      selectedIdx={-1}
                      onSegmentClick={() => {}}
                    />
                  </div>
                )}
                <p className="text-[10px] mb-3" style={{ color: 'var(--text-faint)' }}>
                  Tap a fish below to see restrictions on the map
                </p>
              </div>
            )}

            {/* ── Location Map (lakes, sounds, bays — non-gauged waters) ── */}
            {!riverEntry && water && (
              <div className="px-4 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-faint)' }}>Location</p>
                <div className="rounded-xl overflow-hidden mb-1" style={{ height: '200px' }}>
                  <LakeMapInner
                    waterName={water.name}
                    lat={water.lat}
                    lng={water.lng}
                  />
                </div>
                <p className="text-[10px] mb-3" style={{ color: 'var(--text-faint)' }}>
                  Tap a fish below to see regulations
                </p>
              </div>
            )}

            {/* ── What's Open Today ── */}
            {speciesRegs.length > 0 && (() => {
              const openItems = speciesRegs.filter(({ reg }) => isOpenOn(reg, today))
              if (openItems.length === 0) return (
                <div className="px-4 pb-2">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>What&apos;s Open Today</p>
                  <div className="px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No species open today — check calendar for upcoming seasons</p>
                  </div>
                </div>
              )
              return (
                <div className="px-4 pb-2">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>What&apos;s Open Today</p>
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {openItems.map(({ reg, species: sp }, i) => (
                      <div key={reg.id}
                        className="flex items-center gap-4 px-4 py-3.5"
                        style={{ borderBottom: i < openItems.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <div className="flex-shrink-0 rounded-lg overflow-hidden"
                          style={{ width: 48, height: 48, background: '#0b0d14' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={sp.photo} alt={sp.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white leading-tight">{sp.name}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
                            {reg.dailyLimit !== null && (
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)', minWidth: 30 }}>Limit</span>
                                <span className="text-xs font-semibold text-white">{reg.dailyLimit}/day</span>
                              </div>
                            )}
                            {reg.minSize !== null && (
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)', minWidth: 30 }}>Min</span>
                                <span className="text-xs font-semibold text-white">{reg.minSize}&quot;</span>
                              </div>
                            )}
                            {reg.hatcheryOnly && (
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)', minWidth: 30 }}>Type</span>
                                <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Hatchery only</span>
                              </div>
                            )}
                            {reg.gearRestriction && (
                              <div className="flex items-baseline gap-1.5 col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)', minWidth: 30 }}>Rules</span>
                                <span className="text-xs font-semibold text-white">{reg.gearRestriction}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* ── Fish Grid ── */}
            <div className="px-4 pt-4 pb-4">

              {speciesRegs.length === 0 ? (
                <div className="rounded-xl p-4 text-center" style={{ border: '1px solid var(--border)' }}>
                  <p className="text-sm font-semibold text-white mb-1">No regulation data on file</p>
                  <a href="https://wdfw.wa.gov/fishing/regulations" target="_blank" rel="noopener noreferrer"
                    className="text-xs underline" style={{ color: '#f26522' }}>
                    Check WDFW directly →
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  {speciesRegs.map(({ reg, species: sp }) => {
                    const isOpen = isOpenOn(reg, today)
                    const isTarget = riverEntry?.targetSpecies.some(n =>
                      n === sp.name || sp.name.includes(n) || n.includes(sp.name.split(' ')[0])
                    )
                    return (
                      <button
                        key={reg.id}
                        onClick={() => setSelectedFishForSheet(sp)}
                        className="flex flex-col items-center rounded-xl overflow-hidden transition-all active:scale-95"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: isTarget
                            ? '1.5px solid rgba(242,101,34,0.4)'
                            : '1.5px solid rgba(255,255,255,0.10)',
                        }}
                      >
                        <div className="w-full aspect-square relative" style={{ background: '#0a0c14' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={sp.photo} alt={sp.name}
                            className="w-full h-full object-contain"
                            style={{ opacity: isOpen ? 1 : 0.45 }} />
                          {/* Target badge */}
                          {isTarget && (
                            <div className="absolute top-1 left-1 px-1 py-0.5 rounded text-[9px] font-black"
                              style={{ background: 'rgba(242,101,34,0.85)', color: 'white' }}>
                              ★
                            </div>
                          )}
                          {/* Open/Closed badge */}
                          <div className="absolute top-1 right-1 px-1 py-0.5 rounded text-[9px] font-bold"
                            style={{
                              background: isOpen ? 'rgba(74,222,128,0.9)' : 'rgba(239,68,68,0.85)',
                              color: isOpen ? '#0d1a0d' : 'white',
                            }}>
                            {isOpen ? 'OPEN' : 'CLOSED'}
                          </div>
                        </div>
                        <p className="w-full text-center text-[10px] font-semibold px-1 py-1.5 leading-tight"
                          style={{ color: isOpen ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)' }}>
                          {sp.name}
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ── Bottom CTA: View on WDFW ── */}
          <div className="flex-shrink-0 px-4 py-3"
            style={{ borderTop: '1px solid var(--border)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
            <a
              href="https://wdfw.wa.gov/fishing/regulations"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-5 py-3.5 rounded-xl no-underline transition-opacity active:opacity-75"
              style={{ background: 'rgba(242,101,34,0.12)', border: '1px solid rgba(242,101,34,0.3)', textDecoration: 'none' }}
            >
              <span className="text-sm font-bold" style={{ color: '#f26522' }}>View on WDFW →</span>
              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>wdfw.wa.gov</span>
            </a>
          </div>
          </>
          )} {/* end fish-in-river vs normal view */}

        </div>
      </div>

      {/* Fish tapped in the fish grid → open FishDetailSheet (navigation parity with all other surfaces) */}
      {selectedFishForSheet && (
        <FishDetailSheet
          species={selectedFishForSheet}
          onClose={() => setSelectedFishForSheet(null)}
          zIndex={(zIndex ?? 50) + 30}
        />
      )}
    </>
  )
}
