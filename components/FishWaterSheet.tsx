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
      className="fixed inset-0 flex flex-col justify-end"
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
            <div className="h-full overflow-y-auto no-scrollbar">

              {/* Emergency rule block */}
              {(emergencyRules.length > 0 || noteEmergency) && (
                <div
                  className="px-4 pt-4"
                >
                  {emergencyRules.map((er, i) => (
                    <div
                      key={i}
                      className="mb-3 pl-3"
                      style={{ borderLeft: '3px solid #f26522' }}
                    >
                      <p className="text-[10px] uppercase font-bold mb-1" style={{ color: '#f26522' }}>
                        EMERGENCY RULE
                      </p>
                      <p className="text-[11px] leading-snug mb-1" style={{ color: 'rgba(242,101,34,0.9)' }}>
                        {er.section} — {er.rule.effective}
                      </p>
                      {er.rule.url && (
                        <a
                          href={er.rule.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] underline"
                          style={{ color: '#f26522' }}
                        >
                          View official rule ↗
                        </a>
                      )}
                    </div>
                  ))}
                  {noteEmergency?.notes && !emergencyRules.length && (
                    <div
                      className="mb-3 pl-3"
                      style={{ borderLeft: '3px solid #f26522' }}
                    >
                      <p className="text-[10px] uppercase font-bold mb-1" style={{ color: '#f26522' }}>
                        EMERGENCY RULE
                      </p>
                      <p className="text-[11px] leading-snug" style={{ color: 'rgba(242,101,34,0.9)' }}>
                        {noteEmergency.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Inline map */}
              {isLakeType ? (
                <div
                  className="mx-4 mt-3"
                  data-no-swipe-back="true"
                  style={{ height: 180, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}
                >
                  <LakeMapInner
                    waterName={water.name}
                    lat={water.lat}
                    lng={water.lng}
                    fillColor={anyOpen ? '#6ab04c' : '#e74c3c'}
                  />
                </div>
              ) : segments.length > 0 ? (
                <div
                  className="mx-4 mt-3"
                  data-no-swipe-back="true"
                  style={{ height: 180, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}
                >
                  <RiverDetailMapInner
                    segments={segments}
                    selectedIdx={-1}
                    onSegmentClick={() => {}}
                  />
                </div>
              ) : null}

              {/* Regulation rows */}
              <div className="px-4 pb-6">
                {regs.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                      No regulation on file —{' '}
                      <a
                        href="https://wdfw.wa.gov/fishing/regulations"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: '#f26522' }}
                      >
                        check WDFW
                      </a>
                    </p>
                  </div>
                ) : (
                  regs.map(reg => {
                    const isOpen = isOpenOn(reg, today)
                    const hasNoteEmerg = reg.notes && /emergency/i.test(reg.notes)
                    return (
                      <div key={reg.id} className="mb-4">
                        {/* Season row */}
                        <div
                          className="flex items-baseline justify-between py-2.5"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-faint)' }}>SEASON</span>
                          <span className="text-sm text-white text-right" style={{ maxWidth: '60%' }}>
                            {fmtDate(reg.seasonStart)} – {fmtDate(reg.seasonEnd)}
                            {' '}
                            <span className="text-[11px] font-bold" style={{ color: isOpen ? '#6ab04c' : '#6b7280' }}>
                              {isOpen ? '● OPEN' : '○ CLOSED'}
                            </span>
                          </span>
                        </div>

                        {/* Limit row */}
                        {reg.dailyLimit != null && (
                          <div
                            className="flex items-baseline justify-between py-2.5"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                          >
                            <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-faint)' }}>DAILY LIMIT</span>
                            <span className="text-sm text-white text-right" style={{ maxWidth: '60%' }}>{reg.dailyLimit}/day</span>
                          </div>
                        )}

                        {/* Size row */}
                        {reg.minSize != null && (
                          <div
                            className="flex items-baseline justify-between py-2.5"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                          >
                            <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-faint)' }}>MIN SIZE</span>
                            <span className="text-sm text-white text-right" style={{ maxWidth: '60%' }}>{reg.minSize}&quot;</span>
                          </div>
                        )}

                        {/* Hatchery row */}
                        {reg.hatcheryOnly && (
                          <div
                            className="flex items-baseline justify-between py-2.5"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                          >
                            <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-faint)' }}>TYPE</span>
                            <span className="text-sm text-right font-semibold" style={{ color: '#fbbf24', maxWidth: '60%' }}>
                              Hatchery only (clipped adipose fin)
                            </span>
                          </div>
                        )}

                        {/* Gear row */}
                        {reg.gearRestriction && (
                          <div
                            className="flex items-baseline justify-between py-2.5"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                          >
                            <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-faint)' }}>GEAR</span>
                            <span className="text-sm text-white text-right" style={{ maxWidth: '60%' }}>{reg.gearRestriction}</span>
                          </div>
                        )}

                        {/* Notes row */}
                        {reg.notes && (
                          <div className="py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <p
                              className="text-[11px] leading-snug"
                              style={{ color: hasNoteEmerg ? '#f26522' : 'var(--text-faint)' }}
                            >
                              {reg.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}

                {/* WDFW link */}
                <a
                  href="https://wdfw.wa.gov/fishing/regulations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-5 py-3.5 rounded-2xl no-underline active:scale-[0.99] mt-6 mb-24"
                  style={{
                    background: 'rgba(242,101,34,0.12)',
                    border: '1px solid rgba(242,101,34,0.3)',
                    textDecoration: 'none',
                  }}
                >
                  <span className="text-sm font-bold" style={{ color: '#f26522' }}>Verify on WDFW →</span>
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>wdfw.wa.gov</span>
                </a>
              </div>
            </div>
          )}

          {/* ═══ GEAR TAB ═══ */}
          {activeTab === 'gear' && (
            <div className="h-full overflow-y-auto no-scrollbar px-4 pt-4 pb-24">
              {!gear ? (
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No gear data on file yet.</p>
              ) : (
                <>
                  {/* Rod & Line */}
                  <div className="mb-5">
                    <p className="text-[10px] uppercase font-bold mb-2" style={{ color: 'var(--text-faint)' }}>ROD &amp; LINE</p>
                    <p className="text-sm text-white leading-snug">{gear.rodSetup}</p>
                  </div>

                  {/* Lures */}
                  {gear.lures.filter(i => !i.name.toLowerCase().includes('not applicable')).length > 0 && (
                    <div className="mb-5">
                      <p className="text-[10px] uppercase font-bold mb-2" style={{ color: 'var(--text-faint)' }}>LURES</p>
                      <div className="overflow-x-auto no-scrollbar">
                        <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
                          {gear.lures.filter(i => !i.name.toLowerCase().includes('not applicable')).map((item, i) => (
                            <a
                              key={i}
                              href={item.amazonUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col items-center active:scale-[0.99]"
                              style={{ textDecoration: 'none', flexShrink: 0 }}
                            >
                              <span
                                className="text-[11px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' }}
                              >
                                {item.name.replace(/ fishing$/, '').replace(/\s+\(.*?\)$/, '')}
                              </span>
                              <span className="text-[9px] mt-0.5" style={{ color: '#f26522' }}>Amazon ↗</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bait */}
                  {gear.bait.filter(i => !i.name.toLowerCase().includes('not applicable')).length > 0 && (
                    <div className="mb-5">
                      <p className="text-[10px] uppercase font-bold mb-2" style={{ color: 'var(--text-faint)' }}>BAIT</p>
                      <div className="overflow-x-auto no-scrollbar">
                        <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
                          {gear.bait.filter(i => !i.name.toLowerCase().includes('not applicable')).map((item, i) => (
                            <a
                              key={i}
                              href={item.amazonUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col items-center active:scale-[0.99]"
                              style={{ textDecoration: 'none', flexShrink: 0 }}
                            >
                              <span
                                className="text-[11px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' }}
                              >
                                {item.name.replace(/ fishing$/, '').replace(/\s+\(.*?\)$/, '')}
                              </span>
                              <span className="text-[9px] mt-0.5" style={{ color: '#6ab04c' }}>Amazon ↗</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Technique */}
                  {gear.technique.length > 0 && (
                    <div className="mb-5">
                      <p className="text-[10px] uppercase font-bold mb-2" style={{ color: 'var(--text-faint)' }}>TECHNIQUE</p>
                      {gear.technique.map((t, i) => (
                        <div
                          key={i}
                          className="flex gap-3 py-2.5"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <span
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5"
                            style={{ background: 'rgba(242,101,34,0.2)', color: 'var(--accent)', flexShrink: 0 }}
                          >
                            {i + 1}
                          </span>
                          <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>{t}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ═══ TIPS TAB ═══ */}
          {activeTab === 'tips' && (
            <div className="h-full overflow-y-auto no-scrollbar px-4 pt-4">
              {guide ? (
                <>
                  {/* Best Time */}
                  <div
                    className="mb-4 pl-3"
                    style={{ borderLeft: '2px solid rgba(242,101,34,0.4)' }}
                  >
                    <p className="text-[10px] uppercase font-bold mb-1" style={{ color: '#f26522' }}>BEST TIME</p>
                    <p className="text-sm text-white leading-snug">{guide.bestTime}</p>
                  </div>

                  {/* Pro Tips */}
                  {guide.proTips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex gap-3 py-2.5"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <span style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }}>★</span>
                      <p className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>{tip}</p>
                    </div>
                  ))}

                  {/* Technique */}
                  {guide.technique.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] uppercase font-bold mb-2" style={{ color: 'var(--text-faint)' }}>TECHNIQUE</p>
                      {guide.technique.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 py-2">
                          <span style={{ color: '#6ab04c', flexShrink: 0, marginTop: 2 }}>●</span>
                          <span className="text-sm text-white leading-snug">{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : tips ? (
                <>
                  {tips.howToCatch.map((tip, i) => (
                    <div
                      key={i}
                      className="flex gap-3 py-2.5"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5"
                        style={{ background: 'rgba(242,101,34,0.2)', color: 'var(--accent)', flexShrink: 0 }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>{tip}</p>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No tips on file yet.</p>
              )}
              <div className="pb-24" />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
