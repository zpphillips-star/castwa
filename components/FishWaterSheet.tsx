'use client'

/**
 * FishWaterSheet — shared detail popup for ONE fish on ONE water body.
 *
 * Triggered from two places:
 *   - Fish page  → fish → water list → water tap  (siblingWaters provided)
 *   - Waters page → water → fish list → fish tap  (siblingFish provided)
 *
 * Tabs: REGULATIONS | GEAR | TIPS
 * Horizontal swipe on tab content to switch tabs.
 * Swipe right on REGULATIONS → onClose().
 */

import { useState, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import {
  Species,
  WaterBody,
  REGULATIONS,
  SKAGIT_SECTIONS,
  isOpenOn,
} from '@/lib/fishing-data'
import type { MapSegment, SegmentStatus } from './RiverDetailMapInner'
import { GEAR } from '@/lib/gear-data'
import { FISH_TIPS } from './RiverDetailSheet'
import { CATCH_GUIDES } from '@/lib/catch-guides'
import {
  SKAGIT_COORDS,
  SAUK_COORDS,
  NOOKSACK_COORDS,
  STILLAGUAMISH_COORDS,
  SNOHOMISH_COORDS,
  WA_WATERWAYS,
} from '@/lib/river-coords-generated'
import { sliceRiverBetween } from '@/lib/river-regulation-segments'

// ── Dynamic map imports ───────────────────────────────────────────────────────

const RiverDetailMapInner = dynamic(() => import('./RiverDetailMapInner'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', background: 'var(--bg)', color: '#6b7280', fontSize: 14,
    }}>
      Loading map…
    </div>
  ),
})

const LakeMapInner = dynamic(() => import('./LakeMapInner'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', background: 'var(--bg)', color: '#6b7280', fontSize: 14,
    }}>
      Loading map…
    </div>
  ),
})

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'regulations' | 'gear' | 'tips'
const TAB_ORDER: Tab[] = ['regulations', 'gear', 'tips']
const TAB_LABELS: Record<Tab, string> = { regulations: 'REGULATIONS', gear: 'GEAR', tips: 'TIPS' }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(mmdd: string): string {
  const MNAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const [m, d] = mmdd.split('-').map(Number)
  return `${MNAMES[m - 1]} ${d}`
}

function getSeasonLabel(startMmdd: string, fishName: string): string {
  const month = parseInt(startMmdd.split('-')[0], 10)
  const period =
    month === 12 || month <= 2 ? 'Winter' :
    month >= 3  && month <= 5  ? 'Spring' :
    month >= 6  && month <= 8  ? 'Summer' : 'Fall'
  return `${period} ${fishName}`
}

function parseGoogleMapsCoord(url: string): [number, number] | null {
  const m = url.match(/[?&]q=([\d.-]+),([\d.-]+)/)
  if (m) return [parseFloat(m[1]), parseFloat(m[2])]
  return null
}

const SPECIES_SEASON_NAMES: Record<string, string[]> = {
  sockeye:   ['sockeye', 'Sockeye Salmon'],
  chinook:   ['chinook', 'Chinook Salmon', 'Chinook'],
  coho:      ['coho', 'Coho Salmon', 'Coho'],
  steelhead: ['steelhead', 'Steelhead'],
  pink:      ['pink', 'Pink Salmon'],
  chum:      ['chum', 'Chum Salmon'],
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
    let status: SegmentStatus = 'closed'
    if (section.emergencyRule) {
      const activeOverride = section.emergencyRule.overrides.find(o =>
        o.status === 'OPEN' || o.status === 'CLOSED'
      )
      if (activeOverride) {
        status = 'emergency'
        return { idx, coords, status, label: section.name }
      }
    }
    const matchingSeason = section.seasons.find(s =>
      nameAliases.some(alias => s.species.toLowerCase().includes(alias.toLowerCase()))
    )
    if (matchingSeason) {
      status = matchingSeason.closed ? 'closed' : 'open'
    }
    return { idx, coords, status, label: section.name }
  })
}

function getRiverCoords(riverId: string): [number, number][] {
  const direct: Record<string, [number, number][]> = {
    skagit:        SKAGIT_COORDS,
    snohomish:     SNOHOMISH_COORDS,
    nooksack:      NOOKSACK_COORDS,
    sauk:          SAUK_COORDS,
    stillaguamish: STILLAGUAMISH_COORDS,
  }
  if (direct[riverId]) return direct[riverId]
  const nameMap: Record<string, string> = {
    columbia:  'Columbia River',
    yakima:    'Yakima River',
    green:     'Green River',
    cedar:     'Cedar River',
    snake:     'Snake River',
    skykomish: 'Skykomish River',
    puyallup:  'Puyallup River',
    nisqually: 'Nisqually River',
    cowlitz:   'Cowlitz River',
    lewis:     'Lewis River',
    chehalis:  'Chehalis River',
    hoh:       'Hoh River',
  }
  const name = nameMap[riverId]
  if (name && WA_WATERWAYS[name]) return WA_WATERWAYS[name].polylines.flat() as [number, number][]
  return []
}

function isInsideMapOrNoSwipe(target: EventTarget | null): boolean {
  let node = target as HTMLElement | null
  while (node && node !== document.body) {
    if (
      node.classList?.contains('leaflet-container') ||
      node.classList?.contains('leaflet-map-pane') ||
      node.getAttribute?.('data-no-swipe-back') === 'true'
    ) return true
    node = node.parentElement
  }
  return false
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FishWaterSheetProps {
  fish: Species
  water: WaterBody
  onClose: () => void
  /** "from-fish" mode: navigate between these waters (same fish) */
  siblingWaters?: WaterBody[]
  /** "from-water" mode: navigate between these fish (same water) */
  siblingFish?: Species[]
  /** Index of the current fish or water in the sibling list */
  initialSiblingIndex?: number
  zIndex?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FishWaterSheet({
  fish: initialFish,
  water: initialWater,
  onClose,
  siblingWaters,
  siblingFish,
  initialSiblingIndex = 0,
  zIndex = 80,
}: FishWaterSheetProps) {
  const today = new Date()
  const [activeTab, setActiveTab] = useState<Tab>('regulations')
  const [currentIdx, setCurrentIdx] = useState(initialSiblingIndex)

  // Determine mode and resolve current fish + water
  const mode = siblingWaters ? 'from-fish' : siblingFish ? 'from-water' : 'solo'
  const fish: Species    = mode === 'from-water' && siblingFish ? (siblingFish[currentIdx] ?? initialFish) : initialFish
  const water: WaterBody = mode === 'from-fish' && siblingWaters ? (siblingWaters[currentIdx] ?? initialWater) : initialWater

  const siblings: (WaterBody | Species)[] =
    mode === 'from-fish'  ? (siblingWaters ?? []) :
    mode === 'from-water' ? (siblingFish   ?? []) : []

  const canPrev = currentIdx > 0
  const canNext = currentIdx < siblings.length - 1

  // ── Data ──────────────────────────────────────────────────────────────────

  const regs = useMemo(
    () => REGULATIONS.filter(r => r.speciesId === fish.id && r.waterBodyId === water.id),
    [fish.id, water.id]
  )

  const anyOpen  = regs.some(r => isOpenOn(r, today))
  const isSkagit = water.id === 'skagit'

  // Emergency rules (Skagit only, plus notes-based emergency)
  const emergencyRules = useMemo(() => {
    if (!isSkagit) return []
    return SKAGIT_SECTIONS
      .filter(s =>
        s.emergencyRule &&
        s.seasons.some(season =>
          (SPECIES_SEASON_NAMES[fish.id] ?? [fish.id]).some(alias =>
            season.species.toLowerCase().includes(alias.toLowerCase())
          )
        )
      )
      .map(s => ({ section: s.name, rule: s.emergencyRule! }))
  }, [isSkagit, fish.id])

  const noteEmergency = regs.find(r => r.notes && /emergency/i.test(r.notes))
  const hasEmergency = emergencyRules.length > 0 || !!noteEmergency

  // Map segments
  const segments = useMemo<MapSegment[]>(() => {
    if (isSkagit) return buildSkagitSegmentsForSpecies(fish.id)
    if (water.type === 'river' || water.type === 'stream') {
      const coords = getRiverCoords(water.id)
      if (coords.length > 0) {
        return [{ idx: 0, coords, status: anyOpen ? 'open' : 'closed', label: water.name }]
      }
    }
    return []
  }, [isSkagit, fish.id, water.id, water.type, anyOpen])

  const isLakeType = !isSkagit && segments.length === 0

  // Gear + tips
  const gear  = GEAR[fish.id]
  const tips  = FISH_TIPS[fish.id]
  const guide = CATCH_GUIDES.find(g => g.speciesId === fish.id) ?? null

  // Status info
  const statusColor = hasEmergency ? '#f26522' : anyOpen ? '#6ab04c' : '#6b7280'
  const statusLabel = hasEmergency ? '⚑ EMERGENCY RULE' : anyOpen ? '● OPEN' : '○ CLOSED'
  const firstReg = regs[0]

  // ── Header swipe for sibling navigation ──────────────────────────────────

  const headerTouchX = useRef<number | null>(null)
  function onHeaderTouchStart(e: React.TouchEvent) {
    headerTouchX.current = e.touches[0].clientX
  }
  function onHeaderTouchEnd(e: React.TouchEvent) {
    if (headerTouchX.current === null) return
    const dx = e.changedTouches[0].clientX - headerTouchX.current
    headerTouchX.current = null
    if (Math.abs(dx) < 60) return
    if (dx < 0 && canNext) setCurrentIdx(i => i + 1)
    else if (dx > 0 && canPrev) setCurrentIdx(i => i - 1)
    else if (dx > 0 && !canPrev) onClose()
  }

  // ── Tab content swipe ─────────────────────────────────────────────────────

  const tabTouchX = useRef<number | null>(null)
  function onTabTouchStart(e: React.TouchEvent) {
    if (isInsideMapOrNoSwipe(e.touches[0].target)) {
      tabTouchX.current = null
      return
    }
    tabTouchX.current = e.touches[0].clientX
  }
  function onTabTouchEnd(e: React.TouchEvent) {
    if (tabTouchX.current === null) return
    const dx = e.changedTouches[0].clientX - tabTouchX.current
    tabTouchX.current = null
    if (Math.abs(dx) < 50) return
    const idx = TAB_ORDER.indexOf(activeTab)
    if (dx < 0 && idx < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[idx + 1])
    else if (dx > 0 && idx > 0) setActiveTab(TAB_ORDER[idx - 1])
    else if (dx > 0 && idx === 0) onClose()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 flex flex-col justify-end animate-backdrop"
      style={{ zIndex, background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="animate-slide-up rounded-t-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--bg)', height: '95dvh' }}
      >

        {/* ── Fixed header ── */}
        <div
          className="flex-shrink-0 flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'var(--bg)' }}
          onTouchStart={onHeaderTouchStart}
          onTouchEnd={onHeaderTouchEnd}
        >
          {/* Back */}
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm font-semibold flex-shrink-0 active:scale-[0.99]"
            style={{ color: 'var(--text-faint)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>

          {/* Center title */}
          <div className="flex-1 min-w-0 text-center px-1 truncate">
            <span className="text-sm font-bold text-white">{fish.name}</span>
            <span className="text-sm" style={{ color: 'var(--text-faint)' }}> on </span>
            <span className="text-sm font-bold text-white">{water.name}</span>
          </div>

          {/* Sibling nav */}
          {siblings.length > 1 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => canPrev ? setCurrentIdx(i => i - 1) : onClose()}
                className="text-[13px] px-1 active:scale-[0.99]"
                style={{ color: 'var(--text-faint)' }}
              >
                ‹
              </button>
              <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                {currentIdx + 1}/{siblings.length}
              </span>
              <button
                onClick={() => canNext && setCurrentIdx(i => i + 1)}
                className="text-[13px] px-1 active:scale-[0.99]"
                style={{ color: canNext ? 'var(--text-faint)' : 'transparent' }}
              >
                ›
              </button>
            </div>
          )}
        </div>

        {/* ── Fixed status bar ── */}
        <div
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="text-sm font-bold" style={{ color: statusColor }}>{statusLabel}</span>
          {firstReg && (
            <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
              · {fmtDate(firstReg.seasonStart)}–{fmtDate(firstReg.seasonEnd)}
            </span>
          )}
          {firstReg?.hatcheryOnly && (
            <span className="text-[11px] font-bold" style={{ color: '#fbbf24' }}>
              · Hatchery Only
            </span>
          )}
        </div>

        {/* ── Fixed tab bar ── */}
        <div
          className="flex-shrink-0 flex"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          {TAB_ORDER.map(tab => {
            const active = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 text-center active:scale-[0.99]"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: active ? '#ffffff' : 'var(--text-faint)',
                  borderBottom: active ? '3px solid #f26522' : '3px solid transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                {TAB_LABELS[tab]}
              </button>
            )
          })}
        </div>

        {/* ── Scrollable tab content ── */}
        <div
          className="flex-1 overflow-hidden"
          onTouchStart={onTabTouchStart}
          onTouchEnd={onTabTouchEnd}
        >

          {/* ═══ REGULATIONS TAB ═══ */}
          {activeTab === 'regulations' && (
            <div className="h-full overflow-y-auto no-scrollbar px-4 pt-4 pb-24">

              {/* 1. Emergency rule tile */}
              {hasEmergency && (
                <div
                  className="rounded-2xl mb-4 p-4"
                  style={{
                    background: 'rgba(242,101,34,0.06)',
                    border: '1px solid rgba(242,101,34,0.2)',
                    borderLeft: '3px solid #f26522',
                  }}
                >
                  <p className="text-[10px] uppercase font-bold mb-2 tracking-widest" style={{ color: '#f26522' }}>
                    Emergency Rule
                  </p>
                  {emergencyRules.map((er, i) => (
                    <div
                      key={i}
                      className={i > 0 ? 'mt-3 pt-3' : ''}
                      style={i > 0 ? { borderTop: '1px solid rgba(242,101,34,0.15)' } : {}}
                    >
                      <p className="text-sm leading-snug mb-1" style={{ color: 'rgba(242,101,34,0.9)' }}>
                        {er.section} — {er.rule.effective}
                      </p>
                      {er.rule.overrides.map((o, j) => (
                        <p key={j} className="text-xs leading-snug" style={{ color: 'rgba(242,101,34,0.75)' }}>
                          {o.dates}{o.status ? ` — ${o.status}` : ''}{o.notes ? `: ${o.notes}` : ''}
                        </p>
                      ))}
                      {er.rule.url && (
                        <a
                          href={er.rule.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] underline mt-1 inline-block"
                          style={{ color: '#f26522' }}
                        >
                          View official rule
                        </a>
                      )}
                    </div>
                  ))}
                  {noteEmergency?.notes && !emergencyRules.length && (
                    <p className="text-sm leading-snug" style={{ color: 'rgba(242,101,34,0.9)' }}>
                      {noteEmergency.notes}
                    </p>
                  )}
                </div>
              )}

              {/* 2. Season tiles — side-by-side for 2, stacked for 3+ */}
              {regs.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm mb-3" style={{ color: 'var(--text-faint)' }}>No regulation on file</p>
                  <a
                    href="https://wdfw.wa.gov/fishing/regulations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline"
                    style={{ color: '#f26522' }}
                  >
                    Check WDFW regulations
                  </a>
                </div>
              ) : (
                <div
                  className="mb-4"
                  style={{
                    display: 'flex',
                    flexDirection: regs.length === 2 ? 'row' : 'column',
                    gap: 12,
                  }}
                >
                  {regs.map((reg, idx) => {
                    const isOpen = isOpenOn(reg, today)
                    const hasNoteEmerg = !!(reg.notes && /emergency/i.test(reg.notes))
                    const statusColor = hasNoteEmerg ? '#f26522' : isOpen ? '#6ab04c' : '#6b7280'
                    const statusText  = hasNoteEmerg ? 'EMERGENCY' : isOpen ? 'OPEN' : 'CLOSED'
                    const statusDot   = hasNoteEmerg ? '⚑' : isOpen ? '●' : '○'
                    const tileLabel   = regs.length > 1
                      ? getSeasonLabel(reg.seasonStart, fish.name)
                      : getSeasonLabel(reg.seasonStart, fish.name)
                    return (
                      <div
                        key={reg.id}
                        className="rounded-2xl p-4"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          flex: regs.length === 2 ? '1 1 0' : undefined,
                          minWidth: 0,
                        }}
                      >
                        {/* Tile label */}
                        <p
                          className="text-[10px] uppercase font-bold mb-2 tracking-widest truncate"
                          style={{ color: 'var(--text-faint)' }}
                        >
                          {tileLabel}
                        </p>

                        {/* Date row + status pill */}
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-3">
                          <span className="text-sm font-bold text-white">
                            {fmtDate(reg.seasonStart)} – {fmtDate(reg.seasonEnd)}
                          </span>
                          <span
                            className="text-[11px] font-bold ml-auto"
                            style={{ color: statusColor }}
                          >
                            {statusDot} {statusText}
                          </span>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 10 }} />

                        {/* Detail rows */}
                        <div className="flex flex-col gap-2">
                          {reg.dailyLimit != null && (
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[10px] uppercase font-bold flex-shrink-0" style={{ color: 'var(--text-faint)' }}>Limit</span>
                              <span className="text-sm text-white text-right">{reg.dailyLimit}/day</span>
                            </div>
                          )}
                          {reg.minSize != null && (
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[10px] uppercase font-bold flex-shrink-0" style={{ color: 'var(--text-faint)' }}>Min size</span>
                              <span className="text-sm text-white text-right">{reg.minSize}&quot;</span>
                            </div>
                          )}
                          {reg.hatcheryOnly && (
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[10px] uppercase font-bold flex-shrink-0" style={{ color: 'var(--text-faint)' }}>Type</span>
                              <span className="text-sm font-semibold text-right" style={{ color: '#fbbf24' }}>Hatchery only</span>
                            </div>
                          )}
                          {reg.gearRestriction && (
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[10px] uppercase font-bold flex-shrink-0" style={{ color: 'var(--text-faint)' }}>Gear</span>
                              <span className="text-sm text-white text-right" style={{ maxWidth: '65%' }}>{reg.gearRestriction}</span>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {reg.notes && (
                          <p
                            className="text-xs leading-snug mt-3"
                            style={{ color: hasNoteEmerg ? '#f26522' : 'rgba(255,255,255,0.5)' }}
                          >
                            {reg.notes}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 3. Location map tile — compact, at bottom */}
              {(isLakeType || segments.length > 0) && (
                <>
                  <div className="flex items-center gap-2 mb-3 mt-2">
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                    <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--text-faint)' }}>
                      Location
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                  <div
                    className="rounded-2xl overflow-hidden mb-4"
                    data-no-swipe-back="true"
                    style={{ height: 140 }}
                  >
                    {isLakeType ? (
                      <LakeMapInner
                        waterName={water.name}
                        lat={water.lat}
                        lng={water.lng}
                        fillColor={anyOpen ? '#6ab04c' : '#e74c3c'}
                      />
                    ) : (
                      <RiverDetailMapInner
                        segments={segments}
                        selectedIdx={-1}
                        onSegmentClick={() => {}}
                      />
                    )}
                  </div>
                </>
              )}

              {/* WDFW link */}
              <a
                href="https://wdfw.wa.gov/fishing/regulations"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full px-5 py-3.5 rounded-2xl active:scale-[0.99]"
                style={{
                  background: 'rgba(242,101,34,0.12)',
                  border: '1px solid rgba(242,101,34,0.3)',
                  textDecoration: 'none',
                }}
              >
                <span className="text-sm font-bold" style={{ color: '#f26522' }}>Verify on WDFW</span>
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>wdfw.wa.gov</span>
              </a>
            </div>
          )}

          {/* ═══ GEAR TAB ═══ */}
          {activeTab === 'gear' && (
            <div className="h-full overflow-y-auto no-scrollbar px-4 pt-4 pb-24">
              {!gear ? (
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No gear data on file yet.</p>
              ) : (
                <div className="flex flex-col gap-3">

                  {/* Rod & Line tile */}
                  <div
                    className="rounded-2xl p-4"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <p className="text-[10px] uppercase font-bold mb-3 tracking-widest" style={{ color: 'var(--text-faint)' }}>Rod &amp; Line</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{gear.rodSetup}</p>
                  </div>

                  {/* Lures tile */}
                  {gear.lures.filter(i => !i.name.toLowerCase().includes('not applicable')).length > 0 && (
                    <div
                      className="rounded-2xl p-4"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <p className="text-[10px] uppercase font-bold mb-3 tracking-widest" style={{ color: 'var(--text-faint)' }}>Lures</p>
                      <div className="flex flex-wrap gap-2">
                        {gear.lures.filter(i => !i.name.toLowerCase().includes('not applicable')).map((item, i) => (
                          <a
                            key={i}
                            href={item.amazonUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="active:scale-[0.99]"
                            style={{ textDecoration: 'none' }}
                          >
                            <span
                              className="text-xs font-medium px-3 py-1 rounded-full inline-block"
                              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                            >
                              {item.name.replace(/ fishing$/, '').replace(/\s+\(.*?\)$/, '')}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bait tile */}
                  {gear.bait.filter(i => !i.name.toLowerCase().includes('not applicable')).length > 0 && (
                    <div
                      className="rounded-2xl p-4"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <p className="text-[10px] uppercase font-bold mb-3 tracking-widest" style={{ color: 'var(--text-faint)' }}>Bait</p>
                      <div className="flex flex-wrap gap-2">
                        {gear.bait.filter(i => !i.name.toLowerCase().includes('not applicable')).map((item, i) => (
                          <a
                            key={i}
                            href={item.amazonUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="active:scale-[0.99]"
                            style={{ textDecoration: 'none' }}
                          >
                            <span
                              className="text-xs font-medium px-3 py-1 rounded-full inline-block"
                              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                            >
                              {item.name.replace(/ fishing$/, '').replace(/\s+\(.*?\)$/, '')}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technique tile */}
                  {gear.technique.length > 0 && (
                    <div
                      className="rounded-2xl p-4"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <p className="text-[10px] uppercase font-bold mb-3 tracking-widest" style={{ color: 'var(--text-faint)' }}>Technique</p>
                      <div className="flex flex-col">
                        {gear.technique.map((t, i) => (
                          <div
                            key={i}
                            className="flex gap-3 py-2.5"
                            style={{ borderBottom: i < gear.technique.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                          >
                            <span
                              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                              style={{ background: 'rgba(242,101,34,0.2)', color: 'var(--accent)', marginTop: 1 }}
                            >
                              {i + 1}
                            </span>
                            <p className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>{t}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* ═══ TIPS TAB ═══ */}
          {activeTab === 'tips' && (
            <div className="h-full overflow-y-auto no-scrollbar px-4 pt-4 pb-24">
              {guide ? (
                <div className="flex flex-col gap-3">

                  {/* Best Time tile */}
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: 'rgba(242,101,34,0.06)',
                      border: '1px solid rgba(242,101,34,0.15)',
                      borderLeft: '3px solid #f26522',
                    }}
                  >
                    <p className="text-[10px] uppercase font-bold mb-2 tracking-widest" style={{ color: '#f26522' }}>Best Time</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{guide.bestTime}</p>
                  </div>

                  {/* Pro Tips tile */}
                  {guide.proTips.length > 0 && (
                    <div
                      className="rounded-2xl p-4"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <p className="text-[10px] uppercase font-bold mb-3 tracking-widest" style={{ color: 'var(--text-faint)' }}>Tips</p>
                      {guide.proTips.map((tip, i) => (
                        <div
                          key={i}
                          className="py-2.5"
                          style={{ borderBottom: i < guide.proTips.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                        >
                          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Technique tile */}
                  {guide.technique.length > 0 && (
                    <div
                      className="rounded-2xl p-4"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <p className="text-[10px] uppercase font-bold mb-3 tracking-widest" style={{ color: 'var(--text-faint)' }}>Technique</p>
                      {guide.technique.map((tip, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 py-2"
                          style={{ borderBottom: i < guide.technique.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                        >
                          <span
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                            style={{ background: 'rgba(106,176,76,0.2)', color: '#6ab04c', marginTop: 1 }}
                          >
                            {i + 1}
                          </span>
                          <span className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ) : tips ? (
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <p className="text-[10px] uppercase font-bold mb-3 tracking-widest" style={{ color: 'var(--text-faint)' }}>How to Catch</p>
                  {tips.howToCatch.map((tip, i) => (
                    <div
                      key={i}
                      className="flex gap-3 py-2.5"
                      style={{ borderBottom: i < tips.howToCatch.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                    >
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                        style={{ background: 'rgba(242,101,34,0.2)', color: 'var(--accent)', marginTop: 1 }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>{tip}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No tips on file yet.</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
