'use client'

/**
 * FishWaterSheet — THE GEM PAGE: one fish on one water body.
 *
 * Triggered from two places:
 *   - Fish page  → fish → water list → water tap  (siblingWaters provided)
 *   - Waters page → water → fish list → fish tap  (siblingFish provided)
 *
 * Layout:
 *   1. Fixed top nav bar (back + title + sibling arrows)
 *   2. Single scroll area:
 *        Hero photo (200px) with overlay fish name + status pill
 *        Restrictions banner (always visible — no tab required)
 *        Sticky tab bar: WHERE TO FISH | HOW TO CATCH | GEAR
 *        Tab content
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
type Tab = 'where' | 'how' | 'gear'
const TAB_ORDER: Tab[] = ['where', 'how', 'gear']
const TAB_LABELS: Record<Tab, string> = {
  where: 'WHERE TO FISH',
  how:   'HOW TO CATCH',
  gear:  'GEAR',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(mmdd: string): string {
  const MNAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const [m, d] = mmdd.split('-').map(Number)
  return `${MNAMES[m - 1]} ${d}`
}

function getSeasonLabel(startMmdd: string | null, fishName: string): string {
  if (!startMmdd) return `${fishName} Season`
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
  const [activeTab, setActiveTab] = useState<Tab>('where')
  const [currentIdx, setCurrentIdx] = useState(initialSiblingIndex)
  const [mapExpanded, setMapExpanded] = useState(false)
  // Skagit accordion: which section row is expanded (null = all collapsed, start closed)
  const [expandedSection, setExpandedSection] = useState<number | null>(null)
  // Emergency rule detail toggle: Set of keys (reg.id or 'skagit-N') where details are visible
  const [expandedEmergency, setExpandedEmergency] = useState<Set<string>>(new Set())
  function toggleEmergency(key: string) {
    setExpandedEmergency(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

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
  const hasEmergency  = emergencyRules.length > 0 || !!noteEmergency

  // When arriving from water→fish, only show currently-active regulations.
  // When arriving from fish→water, show all seasons.
  const displayRegs = useMemo(() => {
    // Always show only currently-active seasons regardless of entry mode.
    // If nothing is active right now, fall back to all regs (so user knows when to return).
    const activeNow = regs.filter(r => isOpenOn(r, today))
    if (activeNow.length > 0) return activeNow
    if (hasEmergency) return regs
    return regs // nothing active — show all so user can see upcoming seasons
  }, [regs, hasEmergency]) // eslint-disable-line react-hooks/exhaustive-deps

  // Next opening when nothing is currently open
  const nextOpening = useMemo(() => {
    if (anyOpen || hasEmergency) return null
    const future = regs.map(r => r.seasonStart).filter(Boolean).sort()
    return future[0] ?? null
  }, [regs, mode, anyOpen, hasEmergency]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Skagit section status list — enriched with season + emergencyRule for accordion
  const skagitSectionStatuses = useMemo(() => {
    if (!isSkagit) return []
    const nameAliases = SPECIES_SEASON_NAMES[fish.id] ?? [fish.id]
    return SKAGIT_SECTIONS.map(section => {
      let st: 'open' | 'closed' | 'emergency' = 'closed'
      if (section.emergencyRule) {
        const active = section.emergencyRule.overrides.find(
          o => o.status === 'OPEN' || o.status === 'CLOSED'
        )
        if (active) st = 'emergency'
      }
      const matchingSeason = section.seasons.find(s =>
        nameAliases.some(alias => s.species.toLowerCase().includes(alias.toLowerCase()))
      )
      if (st !== 'emergency' && matchingSeason) {
        st = matchingSeason.closed ? 'closed' : 'open'
      }
      return {
        name: section.name,
        status: st,
        season: matchingSeason ?? null,
        emergencyRule: section.emergencyRule,
      }
    })
  }, [isSkagit, fish.id])

  // Gear + tips + guide
  const gear  = GEAR[fish.id]
  const tips  = FISH_TIPS[fish.id]
  const guide = CATCH_GUIDES.find(g => g.speciesId === fish.id) ?? null

  // Overall status
  const overallStatus = hasEmergency ? 'emergency' : anyOpen ? 'open' : 'closed'
  const statusColor = overallStatus === 'emergency' ? '#f26522' : overallStatus === 'open' ? '#6ab04c' : '#6b7280'
  const statusLabel = overallStatus === 'emergency' ? 'EMERGENCY' : overallStatus === 'open' ? 'OPEN' : 'CLOSED'
  const firstReg = displayRegs[0] ?? regs[0]

  // ── Swipe: header sibling navigation ────────────────────────────────────

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

  // ── Swipe: tab content switching + swipe-right-to-close ─────────────────

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

  // ── Render ──────────────────────────────────────────────────────────────

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

        {/* ── Fixed top nav bar ── */}
        <div
          className="flex-shrink-0 flex items-center gap-2 px-4 py-3"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'var(--bg)',
            zIndex: 20,
          }}
          onTouchStart={onHeaderTouchStart}
          onTouchEnd={onHeaderTouchEnd}
        >
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

          <div className="flex-1 min-w-0 text-center px-1 truncate">
            <span className="text-sm font-bold text-white">{fish.name}</span>
            <span className="text-sm" style={{ color: 'var(--text-faint)' }}> on </span>
            <span className="text-sm font-bold text-white">{water.name}</span>
          </div>

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

        {/* ── Single scrollable area ── */}
        <div
          className="flex-1 overflow-y-auto no-scrollbar"
          onTouchStart={onTabTouchStart}
          onTouchEnd={onTabTouchEnd}
        >

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 1 — Hero: fish photo + name overlay + status pill
          ═══════════════════════════════════════════════════════════════ */}
          <div style={{ position: 'relative', height: 200, background: '#090909', flexShrink: 0 }}>
            {fish.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fish.photo}
                alt={fish.name}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                }}
              />
            )}
            {/* Gradient: transparent top → heavy black bottom for text readability */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.72) 100%)',
              pointerEvents: 'none',
            }} />

            {/* Status pill — top right */}
            <div style={{
              position: 'absolute', top: 12, right: 14,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 800, letterSpacing: '0.1em',
                color: '#fff',
                background: overallStatus === 'emergency'
                  ? 'rgba(242,101,34,0.92)'
                  : overallStatus === 'open'
                  ? 'rgba(106,176,76,0.92)'
                  : 'rgba(90,90,95,0.88)',
                padding: '4px 11px',
                borderRadius: 20,
              }}>
                {statusLabel}
              </span>
              {firstReg && overallStatus === 'open' && (
                <span style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.72)',
                  textAlign: 'right', lineHeight: 1.3,
                }}>
                  {fmtDate(firstReg.seasonStart)} – {fmtDate(firstReg.seasonEnd)}
                </span>
              )}
            </div>

            {/* Fish name + water name — bottom left */}
            <div style={{ position: 'absolute', bottom: 14, left: 16, right: 110 }}>
              <p style={{
                fontSize: 22, fontWeight: 800, color: '#fff',
                lineHeight: 1.15, marginBottom: 3,
                textShadow: '0 1px 8px rgba(0,0,0,0.6)',
              }}>
                {fish.name}
              </p>
              <p style={{
                fontSize: 13, fontWeight: 500,
                color: 'rgba(255,255,255,0.58)',
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              }}>
                on {water.name}
              </p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 2 — Restrictions banner (always visible, no tab)
          ═══════════════════════════════════════════════════════════════ */}
          <div style={{ padding: '16px 16px 0' }}>

            {/* Skagit uses the accordion below — suppress flat banners for it */}
            {/* No regulation on file */}
            {!isSkagit && regs.length === 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '18px 16px', marginBottom: 12, textAlign: 'center',
              }}>
                <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 8 }}>
                  No regulation on file
                </p>
                <a
                  href="https://wdfw.wa.gov/fishing/regulations"
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#f26522', textDecoration: 'underline' }}
                >
                  Check WDFW regulations
                </a>
              </div>
            )}

            {/* CLOSED right now — from-water mode with no active seasons */}
            {!isSkagit && displayRegs.length === 0 && regs.length > 0 && (
              <div style={{
                background: 'rgba(107,114,128,0.07)',
                border: '1px solid rgba(107,114,128,0.2)',
                borderRadius: 16, padding: '18px 16px', marginBottom: 12, textAlign: 'center',
              }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#9ca3af', marginBottom: 6 }}>
                  CLOSED right now
                </p>
                {nextOpening && (
                  <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>
                    Season opens{' '}
                    <span style={{ color: '#fff', fontWeight: 600 }}>{fmtDate(nextOpening)}</span>
                  </p>
                )}
                <a
                  href="https://wdfw.wa.gov/fishing/regulations"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    fontSize: 11, color: '#f26522', textDecoration: 'underline',
                    display: 'inline-block', marginTop: 10,
                  }}
                >
                  Verify on WDFW
                </a>
              </div>
            )}

            {/* ── Skagit: accordion section list ─────────────────────────────── */}
            {isSkagit && (
              <div style={{ marginBottom: 12 }}>
                {/* Section title */}
                <p style={{
                  fontSize: 10, textTransform: 'uppercase', fontWeight: 800,
                  letterSpacing: '0.12em', color: 'var(--text-faint)',
                  marginBottom: 10,
                }}>
                  Rules by River Section
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {skagitSectionStatuses.map((s, i) => {
                    const isExp = expandedSection === i
                    const sc = s.status === 'emergency' ? '#f26522' : s.status === 'open' ? '#6ab04c' : '#6b7280'
                    const lbl = s.status === 'emergency' ? '⚑ EMERGENCY' : s.status === 'open' ? '● OPEN' : '○ CLOSED'

                    return (
                      <div
                        key={i}
                        style={{
                          borderRadius: 16,
                          overflow: 'hidden',
                          background: s.status === 'emergency'
                            ? 'rgba(242,101,34,0.06)'
                            : s.status === 'open'
                            ? 'rgba(106,176,76,0.05)'
                            : 'rgba(255,255,255,0.04)',
                          border: s.status === 'emergency'
                            ? '1px solid rgba(242,101,34,0.22)'
                            : s.status === 'open'
                            ? '1px solid rgba(106,176,76,0.18)'
                            : '1px solid rgba(255,255,255,0.08)',
                          borderLeft: `3px solid ${sc}`,
                        }}
                      >
                        {/* ── Collapsed header row ── */}
                        <button
                          onClick={() => setExpandedSection(isExp ? null : i)}
                          style={{
                            width: '100%',
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '13px 14px',
                            background: 'transparent',
                            border: 'none', cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1.3 }}>
                            {s.name}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: sc, flexShrink: 0 }}>
                            {lbl}
                          </span>
                          <svg
                            width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke={sc} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                            style={{
                              flexShrink: 0,
                              transform: isExp ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                              opacity: 0.7,
                            }}
                          >
                            <path d="M19 9l-7 7-7-7"/>
                          </svg>
                        </button>

                        {/* ── Expanded body — ONE card, identical to non-Skagit tiles ── */}
                        {isExp && (
                          <div style={{ padding: '0 14px 14px' }}>
                            {(() => {
                              const hasEmerg = !!s.emergencyRule
                              const isSeasonOpen = s.season ? !s.season.closed : false
                              const cardStatus = hasEmerg ? 'emergency' : isSeasonOpen ? 'open' : 'closed'
                              const cardColor = cardStatus === 'emergency' ? '#f26522' : cardStatus === 'open' ? '#6ab04c' : '#9ca3af'
                              const eKey = `skagit-${i}`
                              const isEOpen = expandedEmergency.has(eKey)
                              return (
                                <div style={{
                                  background: cardStatus === 'emergency' ? 'rgba(242,101,34,0.06)' : 'rgba(255,255,255,0.05)',
                                  border: cardStatus === 'emergency' ? '1px solid rgba(242,101,34,0.18)' : '1px solid rgba(255,255,255,0.08)',
                                  borderLeft: `3px solid ${cardColor}`,
                                  borderRadius: 16, padding: '14px 14px',
                                }}>
                                  {/* Header: title + status — same as non-Skagit */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <p style={{
                                      fontSize: 10, textTransform: 'uppercase', fontWeight: 800,
                                      letterSpacing: '0.08em',
                                      color: cardStatus === 'emergency' ? '#f26522' : 'var(--text-faint)',
                                    }}>
                                      {cardStatus === 'emergency' ? 'Emergency Rule in Effect' : getSeasonLabel(null, fish.name)}
                                    </p>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: cardColor }}>
                                      {cardStatus === 'open' ? '● OPEN' : cardStatus === 'emergency' ? '⚑ ACTIVE' : '○ CLOSED'}
                                    </span>
                                  </div>

                                  {/* Date range */}
                                  {s.season && (
                                    <>
                                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
                                        {s.season.open}
                                      </p>
                                      <div style={{ height: 1, background: cardStatus === 'emergency' ? 'rgba(242,101,34,0.15)' : 'rgba(255,255,255,0.08)', marginBottom: 10 }} />
                                    </>
                                  )}

                                  {/* Daily limit */}
                                  {s.season?.dailyLimit != null && (
                                    <div style={{ marginBottom: 8 }}>
                                      <p style={{
                                        fontSize: 9, textTransform: 'uppercase', fontWeight: 700,
                                        letterSpacing: '0.08em', color: 'var(--text-faint)', marginBottom: 2,
                                      }}>
                                        Daily Limit
                                      </p>
                                      <p style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                        {s.season.dailyLimit}<span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>/day</span>
                                      </p>
                                    </div>
                                  )}

                                  {/* Season notes (non-emergency) */}
                                  {s.season?.notes && !hasEmerg && (
                                    <p style={{ fontSize: 12, lineHeight: 1.5, marginTop: 4, color: 'rgba(255,255,255,0.45)' }}>
                                      {s.season.notes}
                                    </p>
                                  )}

                                  {/* Emergency: collapsible details — same toggle as non-Skagit */}
                                  {hasEmerg && s.emergencyRule && (
                                    <div style={{ marginTop: 4 }}>
                                      <button
                                        onClick={() => toggleEmergency(eKey)}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: 4,
                                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                          fontSize: 12, fontWeight: 700, color: 'rgba(242,101,34,0.75)',
                                        }}
                                      >
                                        {isEOpen ? 'Hide details ↑' : 'See rule details ↓'}
                                      </button>
                                      {isEOpen && (
                                        <div style={{ marginTop: 8 }}>
                                          {s.emergencyRule.overrides.map((o, j) => (
                                            <p key={j} style={{
                                              fontSize: 13, color: 'rgba(242,101,34,0.82)',
                                              lineHeight: 1.55, marginBottom: 4,
                                            }}>
                                              <span style={{ fontWeight: 700 }}>{o.dates}</span>
                                              {o.status ? ` — ${o.status}` : ''}
                                              {o.notes ? `: ${o.notes}` : ''}
                                            </p>
                                          ))}
                                          {s.emergencyRule.url && (
                                            <a
                                              href={s.emergencyRule.url}
                                              target="_blank" rel="noopener noreferrer"
                                              style={{
                                                fontSize: 12, color: '#f26522',
                                                textDecoration: 'underline',
                                                display: 'inline-block', marginTop: 8,
                                              }}
                                            >
                                              View official rule →
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* No season fallback */}
                                  {!s.season && !hasEmerg && (
                                    <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                                      No regulation on file for this section.
                                    </p>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Non-Skagit: regulation season tiles ────────────────────────── */}
            {!isSkagit && displayRegs.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: displayRegs.length === 2 ? 'row' : 'column',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                {displayRegs.map((reg) => {
                  const isOpen = isOpenOn(reg, today)
                  const hasNoteEmerg = !!(reg.notes && /emergency/i.test(reg.notes))
                  const regStatus = hasNoteEmerg ? 'emergency' : isOpen ? 'open' : 'closed'
                  const regSColor = regStatus === 'emergency' ? '#f26522' : regStatus === 'open' ? '#6ab04c' : '#9ca3af'

                  return (
                    <div
                      key={reg.id}
                      style={{
                        background: regStatus === 'emergency' ? 'rgba(242,101,34,0.06)' : 'rgba(255,255,255,0.05)',
                        border: regStatus === 'emergency' ? '1px solid rgba(242,101,34,0.18)' : '1px solid rgba(255,255,255,0.08)',
                        borderLeft: regStatus === 'emergency' ? '3px solid #f26522' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16, padding: '14px 14px',
                        flex: displayRegs.length === 2 ? '1 1 0' : undefined,
                        minWidth: 0,
                      }}
                    >
                      {/* Section title: Emergency Rule in Effect OR season label */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <p style={{
                          fontSize: 10, textTransform: 'uppercase', fontWeight: 800,
                          letterSpacing: '0.08em',
                          color: regStatus === 'emergency' ? '#f26522' : 'var(--text-faint)',
                        }}>
                          {regStatus === 'emergency' ? 'Emergency Rule in Effect' : getSeasonLabel(reg.seasonStart, fish.name)}
                        </p>
                        <span style={{ fontSize: 11, fontWeight: 700, color: regSColor }}>
                          {regStatus === 'open' ? '● OPEN' : regStatus === 'emergency' ? '⚑ ACTIVE' : '○ CLOSED'}
                        </span>
                      </div>

                      {/* Date range */}
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
                        {fmtDate(reg.seasonStart)} – {fmtDate(reg.seasonEnd)}
                      </p>

                      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 10 }} />

                      {/* 2-col grid: daily limit + min size */}
                      {(reg.dailyLimit != null || reg.minSize != null) && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: reg.dailyLimit != null && reg.minSize != null ? '1fr 1fr' : '1fr',
                          gap: '8px 14px',
                          marginBottom: (reg.hatcheryOnly || reg.gearRestriction) ? 10 : 0,
                        }}>
                          {reg.dailyLimit != null && (
                            <div>
                              <p style={{
                                fontSize: 9, textTransform: 'uppercase', fontWeight: 700,
                                letterSpacing: '0.08em', color: 'var(--text-faint)', marginBottom: 2,
                              }}>
                                Daily Limit
                              </p>
                              <p style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                {reg.dailyLimit}<span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>/day</span>
                              </p>
                            </div>
                          )}
                          {reg.minSize != null && (
                            <div>
                              <p style={{
                                fontSize: 9, textTransform: 'uppercase', fontWeight: 700,
                                letterSpacing: '0.08em', color: 'var(--text-faint)', marginBottom: 2,
                              }}>
                                Min Size
                              </p>
                              <p style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                {reg.minSize}<span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>"</span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hatchery Only badge */}
                      {reg.hatcheryOnly && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 0',
                          borderTop: (reg.dailyLimit != null || reg.minSize != null) ? '1px solid rgba(255,255,255,0.07)' : 'none',
                        }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800,
                            color: '#1a1100',
                            background: '#fbbf24',
                            borderRadius: 20, padding: '3px 9px',
                          }}>
                            Hatchery Only ✂
                          </span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                            clipped adipose fin only
                          </span>
                        </div>
                      )}

                      {/* Gear restriction */}
                      {reg.gearRestriction && (
                        <div style={{
                          padding: '8px 0',
                          borderTop: '1px solid rgba(255,255,255,0.07)',
                        }}>
                          <p style={{
                            fontSize: 9, textTransform: 'uppercase', fontWeight: 700,
                            letterSpacing: '0.08em', color: 'var(--text-faint)', marginBottom: 3,
                          }}>
                            Gear Restriction
                          </p>
                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>
                            {reg.gearRestriction}
                          </p>
                        </div>
                      )}

                      {/* Notes — collapsed if emergency */}
                      {reg.notes && (() => {
                        const eKey = reg.id
                        const isEOpen = expandedEmergency.has(eKey)
                        if (hasNoteEmerg) return (
                          <div style={{ marginTop: 8 }}>
                            <button
                              onClick={() => toggleEmergency(eKey)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                fontSize: 12, fontWeight: 700, color: 'rgba(242,101,34,0.75)',
                              }}
                            >
                              {isEOpen ? 'Hide details ↑' : 'See rule details ↓'}
                            </button>
                            {isEOpen && (
                              <p style={{ fontSize: 12, lineHeight: 1.5, marginTop: 8, color: '#f26522' }}>
                                {reg.notes}
                              </p>
                            )}
                          </div>
                        )
                        return (
                          <p style={{ fontSize: 12, lineHeight: 1.5, marginTop: 8, color: 'rgba(255,255,255,0.4)' }}>
                            {reg.notes}
                          </p>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            )}

            {/* WDFW verify link */}
            {regs.length > 0 && (
              <a
                href="https://wdfw.wa.gov/fishing/regulations"
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px', borderRadius: 12,
                  background: 'rgba(242,101,34,0.09)',
                  border: '1px solid rgba(242,101,34,0.22)',
                  textDecoration: 'none', marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f26522' }}>Verify on WDFW</span>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>wdfw.wa.gov →</span>
              </a>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 3 — Sticky tab bar + scrollable tab content
          ═══════════════════════════════════════════════════════════════ */}

          {/* Sticky tab bar: sticks to top of scroll container once hero scrolls away */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'var(--bg)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            marginTop: 16,
          }}>
            {TAB_ORDER.map(tab => {
              const active = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: '11px 4px',
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                    color: active ? '#fff' : 'var(--text-faint)',
                    borderBottom: active ? '2px solid #f26522' : '2px solid transparent',
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    background: 'none', cursor: 'pointer',
                  }}
                >
                  {TAB_LABELS[tab]}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div style={{ padding: '20px 16px 96px' }}>

            {/* ───────────────────────────────────────────────────────────
                TAB 1 — WHERE TO FISH
            ─────────────────────────────────────────────────────────── */}
            {activeTab === 'where' && (
              <div>

                {/* Where to find cards */}
                {guide?.whereToFind && guide.whereToFind.length > 0 && (
                  <>
                    <p style={{
                      fontSize: 9, textTransform: 'uppercase', fontWeight: 800,
                      letterSpacing: '0.13em', color: '#f26522', marginBottom: 10,
                    }}>
                      Best Spots on {water.name}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                      {guide.whereToFind.map((spot, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 14, padding: '12px 14px',
                          }}
                        >
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: '#f26522', flexShrink: 0, marginTop: 4,
                          }} />
                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
                            {spot}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Map — collapsed by default, tap to expand */}
                {(isLakeType || segments.length > 0) && (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 10,
                    }}>
                      <p style={{
                        fontSize: 9, textTransform: 'uppercase', fontWeight: 800,
                        letterSpacing: '0.13em', color: '#f26522',
                      }}>
                        Map
                      </p>
                      <button
                        onClick={() => setMapExpanded(x => !x)}
                        style={{
                          fontSize: 12, color: 'var(--text-faint)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '2px 0',
                        }}
                      >
                        {mapExpanded ? 'Collapse ↑' : 'Expand ↓'}
                      </button>
                    </div>
                    <div
                      data-no-swipe-back="true"
                      style={{
                        borderRadius: 16, overflow: 'hidden', marginBottom: 24,
                        height: mapExpanded ? 280 : 150,
                        transition: 'height 0.25s ease',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
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

                {/* Skagit section status list removed — accordion in Section 2 covers this */}

                {!guide?.whereToFind?.length && !isLakeType && segments.length === 0 && !isSkagit && (
                  <p style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '32px 0' }}>
                    No location data on file.
                  </p>
                )}
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────
                TAB 2 — HOW TO CATCH
            ─────────────────────────────────────────────────────────── */}
            {activeTab === 'how' && (
              <div>
                {guide ? (
                  <>
                    {/* Best Time — featured block */}
                    <p style={{
                      fontSize: 9, textTransform: 'uppercase', fontWeight: 800,
                      letterSpacing: '0.13em', color: '#f26522', marginBottom: 10,
                    }}>
                      Best Time
                    </p>
                    <div style={{
                      background: 'rgba(242,101,34,0.06)',
                      border: '1px solid rgba(242,101,34,0.15)',
                      borderLeft: '3px solid #f26522',
                      borderRadius: 14, padding: '13px 15px', marginBottom: 24,
                    }}>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                        {guide.bestTime}
                      </p>
                    </div>

                    {/* Best Bait — distinct pill cards */}
                    {guide.bestBait.length > 0 && (
                      <>
                        <p style={{
                          fontSize: 9, textTransform: 'uppercase', fontWeight: 800,
                          letterSpacing: '0.13em', color: '#f26522', marginBottom: 10,
                        }}>
                          Best Bait Right Now
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                          {guide.bestBait.map((bait, i) => (
                            <div
                              key={i}
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.09)',
                                borderRadius: 14, padding: '12px 14px',
                              }}
                            >
                              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                                {bait.name}
                              </p>
                              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.52)', lineHeight: 1.5 }}>
                                {bait.when}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Techniques — numbered cards */}
                    {guide.technique.length > 0 && (
                      <>
                        <p style={{
                          fontSize: 9, textTransform: 'uppercase', fontWeight: 800,
                          letterSpacing: '0.13em', color: '#f26522', marginBottom: 10,
                        }}>
                          Techniques
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                          {guide.technique.map((t, i) => (
                            <div
                              key={i}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: 12,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 14, padding: '12px 14px',
                              }}
                            >
                              <span style={{
                                flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 800,
                                background: 'rgba(242,101,34,0.18)', color: '#f26522', marginTop: 1,
                              }}>
                                {i + 1}
                              </span>
                              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
                                {t}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Pro Tips — orange left-bar accent cards */}
                    {guide.proTips.length > 0 && (
                      <>
                        <p style={{
                          fontSize: 9, textTransform: 'uppercase', fontWeight: 800,
                          letterSpacing: '0.13em', color: '#f26522', marginBottom: 10,
                        }}>
                          Pro Tips
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {guide.proTips.map((tip, i) => (
                            <div
                              key={i}
                              style={{
                                background: 'rgba(242,101,34,0.05)',
                                border: '1px solid rgba(242,101,34,0.13)',
                                borderLeft: '3px solid #f26522',
                                borderRadius: 14, padding: '12px 14px',
                              }}
                            >
                              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 1.58 }}>
                                {tip}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : tips ? (
                  <>
                    <p style={{
                      fontSize: 9, textTransform: 'uppercase', fontWeight: 800,
                      letterSpacing: '0.13em', color: '#f26522', marginBottom: 10,
                    }}>
                      How to Catch
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {tips.howToCatch.map((tip, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex', gap: 12,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 14, padding: '12px 14px',
                          }}
                        >
                          <span style={{
                            flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800,
                            background: 'rgba(242,101,34,0.18)', color: '#f26522', marginTop: 1,
                          }}>
                            {i + 1}
                          </span>
                          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '32px 0' }}>
                    No catch guide on file yet.
                  </p>
                )}
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────
                TAB 3 — GEAR
            ─────────────────────────────────────────────────────────── */}
            {activeTab === 'gear' && (
              <div>
                {!gear ? (
                  <p style={{ fontSize: 13, color: 'var(--text-faint)', textAlign: 'center', padding: '32px 0' }}>
                    No gear data on file yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                    {/* Rod & Line */}
                    <p style={{
                      fontSize: 9, textTransform: 'uppercase', fontWeight: 800,
                      letterSpacing: '0.13em', color: '#f26522', marginBottom: 8,
                    }}>
                      Rod &amp; Line
                    </p>
                    <div style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16, padding: '14px 16px', marginBottom: 20,
                    }}>
                      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                        {gear.rodSetup}
                      </p>
                    </div>

                    {/* Lures */}
                    {gear.lures.filter(i => !i.name.toLowerCase().includes('not applicable')).length > 0 && (
                      <>
                        <p style={{
                          fontSize: 9, textTransform: 'uppercase', fontWeight: 800,
                          letterSpacing: '0.13em', color: '#f26522', marginBottom: 8,
                        }}>
                          Lures
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                          {gear.lures
                            .filter(i => !i.name.toLowerCase().includes('not applicable'))
                            .map((item, i) => (
                              <a
                                key={i}
                                href={item.amazonUrl}
                                target="_blank" rel="noopener noreferrer"
                                style={{ textDecoration: 'none' }}
                              >
                                <span style={{
                                  fontSize: 12, fontWeight: 500, padding: '6px 13px',
                                  borderRadius: 20, display: 'inline-block',
                                  background: 'rgba(255,255,255,0.08)',
                                  color: 'rgba(255,255,255,0.85)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                }}>
                                  {item.name.replace(/ fishing$/, '').replace(/\s+\(.*?\)$/, '')}
                                </span>
                              </a>
                            ))}
                        </div>
                      </>
                    )}

                    {/* Bait */}
                    {gear.bait.filter(i => !i.name.toLowerCase().includes('not applicable')).length > 0 && (
                      <>
                        <p style={{
                          fontSize: 9, textTransform: 'uppercase', fontWeight: 800,
                          letterSpacing: '0.13em', color: '#f26522', marginBottom: 8,
                        }}>
                          Bait
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                          {gear.bait
                            .filter(i => !i.name.toLowerCase().includes('not applicable'))
                            .map((item, i) => (
                              <a
                                key={i}
                                href={item.amazonUrl}
                                target="_blank" rel="noopener noreferrer"
                                style={{ textDecoration: 'none' }}
                              >
                                <span style={{
                                  fontSize: 12, fontWeight: 500, padding: '6px 13px',
                                  borderRadius: 20, display: 'inline-block',
                                  background: 'rgba(255,255,255,0.08)',
                                  color: 'rgba(255,255,255,0.85)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                }}>
                                  {item.name.replace(/ fishing$/, '').replace(/\s+\(.*?\)$/, '')}
                                </span>
                              </a>
                            ))}
                        </div>
                      </>
                    )}

                    {/* Technique */}
                    {gear.technique.length > 0 && (
                      <>
                        <p style={{
                          fontSize: 9, textTransform: 'uppercase', fontWeight: 800,
                          letterSpacing: '0.13em', color: '#f26522', marginBottom: 8,
                        }}>
                          Technique
                        </p>
                        <div style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 16, padding: '2px 0', marginBottom: 20,
                        }}>
                          {gear.technique.map((t, i) => (
                            <div
                              key={i}
                              style={{
                                display: 'flex', gap: 12, padding: '11px 16px',
                                borderBottom: i < gear.technique.length - 1
                                  ? '1px solid rgba(255,255,255,0.06)' : 'none',
                              }}
                            >
                              <span style={{
                                flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 800,
                                background: 'rgba(242,101,34,0.18)', color: '#f26522', marginTop: 2,
                              }}>
                                {i + 1}
                              </span>
                              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
                                {t}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Best Times */}
                    {gear.bestTimes && (
                      <>
                        <p style={{
                          fontSize: 9, textTransform: 'uppercase', fontWeight: 800,
                          letterSpacing: '0.13em', color: '#f26522', marginBottom: 8,
                        }}>
                          Best Times
                        </p>
                        <div style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 14, padding: '12px 16px',
                        }}>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                            {gear.bestTimes}
                          </p>
                        </div>
                      </>
                    )}

                  </div>
                )}
              </div>
            )}

          </div>{/* end tab content */}
        </div>{/* end scrollable area */}
      </div>{/* end sheet */}
    </div>
  )
}
