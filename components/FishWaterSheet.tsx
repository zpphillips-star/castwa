'use client'

/**
 * FishWaterSheet — shared detail popup for ONE fish on ONE water body.
 *
 * Triggered from two places:
 *   - Fish page  → fish → water list → water tap  (siblingWaters provided)
 *   - Waters page → water → fish list → fish tap  (siblingFish provided)
 *
 * If siblings are provided, left/right nav arrows (+ swipe) cycle through them.
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
import { useSwipeBack } from '@/hooks/useSwipeBack'
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
      height: '100%', background: '#08080f', color: '#6b7280', fontSize: 14,
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
      height: '100%', background: '#b8d8ea', color: '#374151', fontSize: 14,
    }}>
      Loading map…
    </div>
  ),
})

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

function getGearEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('spinner') || n.includes('rooster tail') || n.includes('vibrax') || n.includes('wedding ring')) return '🌀'
  if (n.includes('spoon') || n.includes('kastmaster') || n.includes('krocodile') || n.includes('cyclone') || n.includes('dardevle')) return '🥄'
  if (n.includes('frog') || n.includes('topwater') || n.includes('popper')) return '🐸'
  if (n.includes('plug') || n.includes('kwikfish') || n.includes('rapala') || n.includes('crankbait')) return '🎣'
  if (n.includes('fly') || n.includes('nymph') || n.includes('streamer') || n.includes('caddis') || n.includes('bugger') || n.includes('hoochie') || n.includes('dodger')) return '🦋'
  if (n.includes('jig') || n.includes('curly tail') || n.includes('ned rig') || n.includes('drop shot') || n.includes('spin-n-glo') || n.includes('jigging')) return '🪝'
  if (n.includes('corky') || n.includes('yarn') || n.includes('egg') || n.includes('roe')) return '🟠'
  if (n.includes('powerbait') || n.includes('dough') || n.includes('worm') || n.includes('crawler')) return '🪱'
  if (n.includes('shrimp') || n.includes('prawn')) return '🦐'
  if (n.includes('herring') || n.includes('anchovy') || n.includes('smelt') || n.includes('cut plug')) return '🐡'
  if (n.includes('crayfish') || n.includes('crab')) return '🦀'
  if (n.includes('squid')) return '🦑'
  if (n.includes('clam') || n.includes('mussel')) return '🐚'
  if (n.includes('pot') || n.includes('ring net') || n.includes('clam gun')) return '🧺'
  return '🎣'
}

// ── Gear mini-grid ────────────────────────────────────────────────────────────

function GearMiniGrid({ items, accent }: { items: { name: string; amazonUrl: string }[]; accent: string }) {
  const visible = items.filter(i => !i.name.toLowerCase().includes('not applicable'))
  if (visible.length === 0) return null
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {visible.map((item, i) => (
        <a
          key={i}
          href={item.amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl active:scale-[0.99] text-center"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', textDecoration: 'none' }}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>{getGearEmoji(item.name)}</span>
          <span className="text-[9px] leading-tight font-medium"
            style={{
              color: 'var(--text-muted)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
            {item.name.replace(/ fishing$/, '').replace(/\s+\(.*?\)$/, '')}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5"
            style={{ background: `${accent}20`, color: accent }}>
            Amazon ↗
          </span>
        </a>
      ))}
    </div>
  )
}

// ── Section divider ───────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: '#6b7280', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
    </div>
  )
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
  initialIndex?: number
  zIndex?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FishWaterSheet({
  fish: initialFish,
  water: initialWater,
  onClose,
  siblingWaters,
  siblingFish,
  initialIndex = 0,
  zIndex = 80,
}: FishWaterSheetProps) {
  const today = new Date()

  // Navigation state
  const [currentIdx, setCurrentIdx] = useState(initialIndex)

  // Determine mode and resolve current fish + water
  const mode = siblingWaters ? 'from-fish' : siblingFish ? 'from-water' : 'solo'
  const fish: Species   = mode === 'from-water' && siblingFish ? (siblingFish[currentIdx] ?? initialFish) : initialFish
  const water: WaterBody = mode === 'from-fish' && siblingWaters ? (siblingWaters[currentIdx] ?? initialWater) : initialWater

  const siblings: (WaterBody | Species)[] =
    mode === 'from-fish'  ? (siblingWaters ?? []) :
    mode === 'from-water' ? (siblingFish   ?? []) : []

  const canPrev = currentIdx > 0
  const canNext = currentIdx < siblings.length - 1

  // Horizontal swipe on the header to navigate siblings
  const touchStartX = useRef<number | null>(null)
  function onHeaderTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onHeaderTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 60) return
    if (dx < 0 && canNext) setCurrentIdx(i => i + 1)
    else if (dx > 0 && canPrev) setCurrentIdx(i => i - 1)
    else if (dx > 0 && !canPrev) onClose()
  }

  // Swipe-back gesture for closing
  const swipeBack = useSwipeBack(onClose)

  // ── Data ──────────────────────────────────────────────────────────────────

  const regs = useMemo(
    () => REGULATIONS.filter(r => r.speciesId === fish.id && r.waterBodyId === water.id),
    [fish.id, water.id]
  )

  const anyOpen    = regs.some(r => isOpenOn(r, today))
  const isSkagit   = water.id === 'skagit'

  // Emergency rules (Skagit only for now — reg.notes emergency is handled in the reg card)
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

  // Also check reg notes for any "emergency" mention
  const noteEmergency = regs.find(r => r.notes && /emergency/i.test(r.notes))

  const hasEmergency = emergencyRules.length > 0 || !!noteEmergency

  // ── Map segments ──────────────────────────────────────────────────────────

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

  // ── Gear + tips ───────────────────────────────────────────────────────────

  const gear  = GEAR[fish.id]
  const tips  = FISH_TIPS[fish.id]
  const guide = CATCH_GUIDES.find(g => g.speciesId === fish.id) ?? null

  // ── Status colors ─────────────────────────────────────────────────────────

  const statusColor  = hasEmergency ? '#f26522' : anyOpen ? '#6ab04c' : '#6b7280'
  const statusBg     = hasEmergency ? 'rgba(249,115,22,0.12)' : anyOpen ? 'rgba(106,176,76,0.12)' : 'rgba(55,65,81,0.4)'
  const statusBorder = hasEmergency ? 'rgba(249,115,22,0.4)'  : anyOpen ? 'rgba(106,176,76,0.4)'  : 'rgba(55,65,81,0.6)'
  const statusLabel  = hasEmergency ? '! EMERGENCY RULE' : anyOpen ? '● OPEN' : '○ CLOSED'

  return (
    <div
      className="fixed inset-0 flex flex-col justify-end"
      style={{ zIndex, background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="animate-slide-up rounded-t-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--bg)', height: '95dvh' }}
        {...swipeBack}
      >

        {/* ── Header ── */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          onTouchStart={onHeaderTouchStart}
          onTouchEnd={onHeaderTouchEnd}
        >
          {/* Close / back */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-semibold active:scale-[0.99] flex-shrink-0"
            style={{ color: 'var(--accent)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>

          {/* Centre title */}
          <div className="flex-1 min-w-0 text-center px-1">
            <p className="text-sm font-black text-white leading-tight truncate">{fish.name}</p>
            <p className="text-[11px] font-medium truncate" style={{ color: 'var(--text-faint)' }}>{water.name}</p>
          </div>

          {/* Fish thumbnail */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fish.photo}
            alt={fish.name}
            style={{
              width: 36, height: 36, objectFit: 'contain',
              borderRadius: 6, background: '#0b0d14', flexShrink: 0,
            }}
          />
        </div>

        {/* ── Sibling navigation bar ── */}
        {siblings.length > 1 && (
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 py-2"
            style={{ background: 'var(--surface)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
              disabled={!canPrev}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg active:scale-[0.99]"
              style={{
                background: canPrev ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: canPrev ? 'var(--text-muted)' : 'var(--text-faint)',
                border: canPrev ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                opacity: canPrev ? 1 : 0.3,
              }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
              </svg>
              {mode === 'from-fish' ? 'Prev water' : 'Prev fish'}
            </button>

            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-faint)' }}>
              {mode === 'from-fish'
                ? `Water ${currentIdx + 1} of ${siblings.length}`
                : `Fish ${currentIdx + 1} of ${siblings.length}`}
            </span>

            <button
              onClick={() => setCurrentIdx(i => Math.min(siblings.length - 1, i + 1))}
              disabled={!canNext}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg active:scale-[0.99]"
              style={{
                background: canNext ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: canNext ? 'var(--text-muted)' : 'var(--text-faint)',
                border: canNext ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                opacity: canNext ? 1 : 0.3,
              }}
            >
              {mode === 'from-fish' ? 'Next water' : 'Next fish'}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── Emergency banner (Skagit sections) ── */}
        {emergencyRules.length > 0 && (
          <div className="flex-shrink-0">
            {emergencyRules.slice(0, 2).map((er, i) => (
              <div
                key={i}
                className="px-4 py-2.5 flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.12)', borderBottom: '1.5px solid rgba(239,68,68,0.3)' }}
              >
                <span className="text-base flex-shrink-0 mt-0.5">🚨</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: '#ef4444' }}>
                    Emergency Rule — {er.section}
                  </p>
                  <p className="text-[11px] leading-snug mt-0.5" style={{ color: '#fca5a5' }}>
                    {er.rule.effective}
                  </p>
                  <a
                    href={er.rule.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] underline"
                    style={{ color: '#ef4444' }}
                  >
                    View official rule ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Status banner ── */}
        <div
          className="flex-shrink-0 px-4 py-2.5"
          style={{ background: statusBg, borderBottom: `2px solid ${statusBorder}` }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-black" style={{ color: statusColor }}>{statusLabel}</span>
            {regs.length > 0 && (
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-faint)' }}>
                {fmtDate(regs[0].seasonStart)} – {fmtDate(regs[0].seasonEnd)}
              </span>
            )}
            {regs[0]?.hatcheryOnly && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                🏷 Hatchery only
              </span>
            )}
          </div>
        </div>

        {/* ── Map (fixed height, not scrollable) ── */}
        {isLakeType ? (
          <div className="flex-shrink-0" data-no-swipe-back="true" style={{ height: '180px' }}>
            <LakeMapInner
              waterName={water.name}
              lat={water.lat}
              lng={water.lng}
              fillColor={anyOpen ? '#4ade80' : '#ef4444'}
            />
          </div>
        ) : segments.length > 0 ? (
          <div className="flex-shrink-0" data-no-swipe-back="true" style={{ height: '180px' }}>
            <RiverDetailMapInner
              segments={segments}
              selectedIdx={-1}
              onSegmentClick={() => {}}
            />
          </div>
        ) : null}

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar">

          {/* ── Regulations ── */}
          <div className="px-4 pt-4 pb-3">
            <SectionDivider label="Regulations" />

            {regs.length === 0 ? (
              <div className="rounded-2xl p-4 text-center" style={{ border: '1px solid var(--border)' }}>
                <p className="text-sm font-semibold text-white mb-1">No specific regulation on file</p>
                <a
                  href="https://wdfw.wa.gov/fishing/regulations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline"
                  style={{ color: '#f26522' }}
                >
                  Check WDFW directly →
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {regs.map(reg => {
                  const isOpen = isOpenOn(reg, today)
                  const hasNoteEmerg = reg.notes && /emergency/i.test(reg.notes)
                  return (
                    <div
                      key={reg.id}
                      className="rounded-2xl px-4 py-3"
                      style={{
                        background: hasNoteEmerg ? 'rgba(249,115,22,0.08)' : isOpen ? 'rgba(106,176,76,0.08)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${hasNoteEmerg ? 'rgba(249,115,22,0.3)' : isOpen ? 'rgba(106,176,76,0.25)' : 'var(--border)'}`,
                        borderLeft: `3px solid ${hasNoteEmerg ? '#f26522' : isOpen ? '#6ab04c' : '#374151'}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-xs font-black px-2 py-0.5 rounded"
                          style={{
                            background: hasNoteEmerg ? 'rgba(249,115,22,0.18)' : isOpen ? 'rgba(106,176,76,0.18)' : 'rgba(107,114,128,0.18)',
                            color: hasNoteEmerg ? '#f26522' : isOpen ? '#6ab04c' : '#9ca3af',
                          }}
                        >
                          {hasNoteEmerg ? '! EMERGENCY' : isOpen ? '● OPEN' : '○ CLOSED'}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                          {fmtDate(reg.seasonStart)} – {fmtDate(reg.seasonEnd)}
                        </span>
                      </div>

                      {/* Key stats grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        {reg.dailyLimit != null && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Daily Limit</p>
                            <p className="text-sm font-bold text-white">{reg.dailyLimit}<span className="text-xs font-normal" style={{ color: 'var(--text-faint)' }}>/day</span></p>
                          </div>
                        )}
                        {reg.minSize != null && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Min Size</p>
                            <p className="text-sm font-bold text-white">{reg.minSize}&quot;</p>
                          </div>
                        )}
                        {reg.hatcheryOnly && (
                          <div className="col-span-2 mt-0.5">
                            <p className="text-xs font-semibold" style={{ color: '#fbbf24' }}>
                              🏷 Hatchery fish only (clipped adipose fin required)
                            </p>
                          </div>
                        )}
                        {reg.gearRestriction && (
                          <div className="col-span-2 mt-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Gear Rules</p>
                            <p className="text-sm font-bold text-white">{reg.gearRestriction}</p>
                          </div>
                        )}
                      </div>

                      {reg.notes && (
                        <p className="text-xs mt-2 leading-snug" style={{ color: '#fdba74' }}>{reg.notes}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Gear ── */}
          {gear && (
            <div className="px-4 pb-4">
              <SectionDivider label="Gear & Setup" />

              {/* Rod setup */}
              <div
                className="rounded-2xl px-4 py-3 mb-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-faint)' }}>Rod & Line</p>
                <p className="text-sm text-white leading-snug">{gear.rodSetup}</p>
              </div>

              {/* Lures */}
              {gear.lures.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-faint)' }}>Lures</p>
                  <GearMiniGrid items={gear.lures} accent="#f26522" />
                </div>
              )}

              {/* Bait */}
              {gear.bait.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-faint)' }}>Bait</p>
                  <GearMiniGrid items={gear.bait} accent="#6ab04c" />
                </div>
              )}

              {/* Technique */}
              {gear.technique.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-faint)' }}>Technique</p>
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {gear.technique.map((t, i) => (
                      <div
                        key={i}
                        className="flex gap-3 px-4 py-3"
                        style={{
                          background: 'var(--surface)',
                          borderBottom: i < gear.technique.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5"
                          style={{ background: 'rgba(242,101,34,0.2)', color: 'var(--accent)' }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>{t}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tips ── */}
          {(guide || tips) && (
            <div className="px-4 pb-4">
              <SectionDivider label="Tips" />

              {guide ? (
                <>
                  {/* Best time */}
                  <div
                    className="rounded-2xl px-4 py-3 mb-3"
                    style={{ background: 'rgba(242,101,34,0.08)', border: '1px solid rgba(242,101,34,0.2)' }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: '#f26522' }}>Best Time</p>
                    <p className="text-sm text-white leading-snug">{guide.bestTime}</p>
                  </div>

                  {/* Pro tips */}
                  {guide.proTips.map((tip, i) => (
                    <div key={i} className="flex gap-3 mb-2">
                      <span style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }}>★</span>
                      <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>{tip}</p>
                    </div>
                  ))}

                  {/* Technique */}
                  {guide.technique.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-faint)' }}>Technique</p>
                      <ul className="space-y-1.5">
                        {guide.technique.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span style={{ color: '#63b3ed', flexShrink: 0, marginTop: 2 }}>●</span>
                            <span className="text-sm text-white leading-snug">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : tips ? (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  {tips.howToCatch.map((tip, i) => (
                    <div
                      key={i}
                      className="flex gap-3 px-4 py-3"
                      style={{
                        background: 'var(--surface)',
                        borderBottom: i < tips.howToCatch.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5"
                        style={{ background: 'rgba(242,101,34,0.2)', color: 'var(--accent)' }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>{tip}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* ── WDFW verify link ── */}
          <div className="px-4 pb-8">
            <a
              href="https://wdfw.wa.gov/fishing/regulations"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-5 py-3.5 rounded-2xl no-underline active:scale-[0.99]"
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
      </div>
    </div>
  )
}
