'use client'
import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useStarredFish } from '@/hooks/useStarred'
import { Species, Regulation, WaterBody, REGULATIONS, WATER_BODIES, SKAGIT_SECTIONS, GEAR_ICON_INFO, GearIconCode, isOpenOn } from '@/lib/fishing-data'
import { GEAR, GearItem } from '@/lib/gear-data'
import { FISH_TIPS } from './RiverDetailSheet'
import { CATCH_GUIDES } from '@/lib/catch-guides'
import RiverDetailSheet from './RiverDetailSheet'
import RiverSectionMap from './RiverSectionMap'
import { SKAGIT_SECTION_COORDS } from '@/lib/river-sections-coords'
import type { RiverSectionStatus } from './RiverSectionMapInner'
import RiverConditionsSheet, { RiverMapConfig } from './RiverConditionsSheet'
import { SKAGIT_COORDS, SAUK_COORDS, NOOKSACK_COORDS, STILLAGUAMISH_COORDS } from '@/lib/river-coords-generated'
import WaterDetailSheet from './WaterDetailSheet'
import FishWaterSheet from './FishWaterSheet'
import { RiverEntry, findRiverEntry } from '@/lib/river-lookup'
import { useSelectedFishSegments } from '@/lib/use-fish-map-segments'
import type { FishSegment } from '@/lib/use-fish-map-segments'

// Dynamic import for WAMap (Leaflet requires client-only rendering)
const WAMapDynamic = dynamic(() => import('./WAMap'), { ssr: false })

interface Props {
  species: Species
  onClose: () => void
  showTips?: boolean
  zIndex?: number
}

type Tab = 'regs' | 'gear' | 'tips'
const TAB_ORDER: Tab[] = ['regs', 'gear', 'tips']

// ─── GEAR EMOJI LOOKUP ────────────────────────────────────────────────────────
function getGearEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('spinner') || n.includes('rooster tail') || n.includes('vibrax') || n.includes('wedding ring') || n.includes('blade spinner') || n.includes('beetle spin')) return '🌀'
  if (n.includes('spoon') || n.includes('kastmaster') || n.includes('krocodile') || n.includes('cyclone') || n.includes('pimple') || n.includes('denie') || n.includes('dick nite') || n.includes('dardevle')) return '🥄'
  if (n.includes('frog') || n.includes('topwater') || n.includes('popper')) return '🐸'
  if (n.includes('spinnerbait')) return '⚙️'
  if (n.includes('swimbait')) return '🐟'
  if (n.includes('glide') || n.includes('jerkbait') || n.includes('jake') || n.includes('believer')) return '🐠'
  if (n.includes('plug') || n.includes('kwikfish') || n.includes('rapala') || n.includes('crankbait') || n.includes('shad rap') || n.includes('dt-') || n.includes('dt6') || n.includes('original floating')) return '🎣'
  if (n.includes('fly') || n.includes('nymph') || n.includes('streamer') || n.includes('caddis') || n.includes('bugger') || n.includes("hare's ear") || n.includes('pheasant tail') || n.includes('hoochie') || n.includes('coho fly') || n.includes('dodger')) return '🦋'
  if (n.includes('jig') || n.includes('curly tail') || n.includes('tube jig') || n.includes('ned rig') || n.includes('drop shot') || n.includes('hair jig') || n.includes('spin-n-glo') || n.includes('ketchum') || n.includes('jigging')) return '🪝'
  if (n.includes('corky') || n.includes('yarn') || n.includes('egg') || n.includes('pautzke') || n.includes('salmon egg') || n.includes('roe')) return '🟠'
  if (n.includes('powerbait') || n.includes('power bait') || n.includes('dough') || n.includes('boil') || n.includes('bread') || n.includes('corn') || n.includes('tiger nut') || n.includes('shoepeg') || n.includes('method feeder') || n.includes('ground bait')) return '🟡'
  if (n.includes('worm') || n.includes('crawler') || n.includes('senko') || n.includes('grub') || n.includes('finesse worm') || n.includes('z-man') || n.includes('sandworm') || n.includes('pile worm') || n.includes('leech')) return '🪱'
  if (n.includes('shrimp') || n.includes('prawn')) return '🦐'
  if (n.includes('crayfish') || n.includes('crab') || n.includes('sand crab') || n.includes('mole crab')) return '🦀'
  if (n.includes('herring') || n.includes('cut plug') || n.includes('anchovy') || n.includes('tuna') || n.includes('smelt') || n.includes('shad') || n.includes('cisco')) return '🐡'
  if (n.includes('minnow') || n.includes('fathead') || n.includes('chub') || n.includes('sucker') || n.includes('waterdog') || n.includes('mudpuppies')) return '🐠'
  if (n.includes('squid') || n.includes('octopus')) return '🦑'
  if (n.includes('clam') || n.includes('mussel') || n.includes('neck')) return '🐚'
  if (n.includes('chicken') || n.includes('turkey') || n.includes('liver') || n.includes('cat food')) return '🍗'
  if (n.includes('maggot')) return '🐛'
  if (n.includes('cricket') || n.includes('grasshopper')) return '🦗'
  if (n.includes('lamprey')) return '🐍'
  if (n.includes('pot') || n.includes('ring net') || n.includes('clam gun') || n.includes('digger')) return '🧺'
  if (n.includes('bucktail')) return '🦌'
  if (n.includes('hair rig')) return '🪢'
  if (n.includes('not applicable')) return '—'
  return '🎣'
}

// ─── GEAR ICON GRID ───────────────────────────────────────────────────────────
function GearGrid({ items, accent }: { items: GearItem[]; accent: string }) {
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
          className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl active:scale-[0.99] text-center"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', textDecoration: 'none' }}
        >
          <span style={{ fontSize: '26px', lineHeight: 1 }}>{getGearEmoji(item.name)}</span>
          <span className="text-[10px] leading-tight font-medium"
            style={{ color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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

// Which species are found on the Skagit + which section IDs are relevant
const SKAGIT_SPECIES_MAP: Record<string, string[]> = {
  sockeye:   ['skagit-hwy536-to-gilligan', 'skagit-gilligan-to-dalles'],
  chinook:   ['skagit-rockport-to-marblemount'],
  coho:      ['skagit-mouth-to-hwy536', 'skagit-hwy536-to-gilligan', 'skagit-gilligan-to-dalles', 'skagit-dalles-to-baker-below', 'skagit-baker-confluence', 'skagit-baker-above-to-rockport', 'skagit-rockport-to-marblemount'],
  steelhead: ['skagit-marblemount-to-newhalem'],
}

// ─── GAUGE MAP FOR WATER-TAP ─────────────────────────────────────────────────
type GaugeConfig = {
  gaugeId: string
  gaugeName: string
  thresholds: { low: number; high: number; flood: number }
  riverMapConfig: RiverMapConfig
}

const FISH_GAUGE_MAP: Record<string, GaugeConfig> = {
  skagit: {
    gaugeId: '12194000',
    gaugeName: 'Skagit (Concrete)',
    thresholds: { low: 2000, high: 8000, flood: 22000 },
    riverMapConfig: { riverName: 'Skagit River', coords: SKAGIT_COORDS, riverId: 'skagit', startLabel: 'Headwaters', endLabel: 'Mouth' },
  },
  sauk: {
    gaugeId: '12186000',
    gaugeName: 'Sauk River',
    thresholds: { low: 500, high: 3000, flood: 8000 },
    riverMapConfig: { riverName: 'Sauk River', coords: SAUK_COORDS, startLabel: 'Headwaters', endLabel: 'Confluence' },
  },
  nooksack: {
    gaugeId: '12210500',
    gaugeName: 'Nooksack River',
    thresholds: { low: 1500, high: 8000, flood: 20000 },
    riverMapConfig: { riverName: 'Nooksack River', coords: NOOKSACK_COORDS, startLabel: 'Headwaters', endLabel: 'Mouth' },
  },
  stillaguamish: {
    gaugeId: '12167000',
    gaugeName: 'Stillaguamish',
    thresholds: { low: 800, high: 5000, flood: 15000 },
    riverMapConfig: { riverName: 'Stillaguamish River', coords: STILLAGUAMISH_COORDS, startLabel: 'Headwaters', endLabel: 'Mouth' },
  },
}

function findGaugeForWater(waterName: string): GaugeConfig | null {
  const lower = waterName.toLowerCase()
  for (const [key, val] of Object.entries(FISH_GAUGE_MAP)) {
    if (lower.includes(key)) return val
  }
  return null
}

// ─── River lookup — imported from lib/river-lookup (single source of truth) ──
// (RiverEntry + findRiverEntry are now shared; do not redefine here)

function getTodaySkagitStatus(speciesId: string): { sectionId: string; sectionName: string; status: 'OPEN' | 'CLOSED' | 'EMERGENCY'; detail: string; mapsUp: string; mapsDown: string }[] {
  const sectionIds = SKAGIT_SPECIES_MAP[speciesId]
  if (!sectionIds) return []
  const today = new Date()
  const mm = today.getMonth() + 1
  const dd = today.getDate()
  const dateStr = `${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`

  return sectionIds.map(id => {
    const section = SKAGIT_SECTIONS.find(s => s.id === id)
    if (!section) return null

    // Check emergency rule first
    if (section.emergencyRule) {
      for (const o of section.emergencyRule.overrides) {
        if (o.status === 'CLOSED') {
          // Try to parse date range — if it matches today, mark CLOSED
          // Simple check: if the override says "CLOSED" and we're past Jul 1 in this range
          const closedDates = ['Jun 25 – Jun 26', 'Jun 30 – Jul 2'].some(d => o.dates === d)
          // Jul 3–31 is OPEN with emergency sockeye
          if (o.dates.includes('Jul 3') || o.dates.includes('Jul 1 – Jul 31') || o.dates.includes('Immediately')) {
            return {
              sectionId: id,
              sectionName: section.name,
              status: 'EMERGENCY' as const,
              detail: o.notes,
              mapsUp: section.mapsLinkUpstream,
              mapsDown: section.mapsLinkDownstream,
            }
          }
        }
      }
      // Has emergency rule and it's active — show the active override
      const activeOverride = section.emergencyRule.overrides.find(o => o.status === 'OPEN' && (o.dates.includes('Jul 3') || o.dates.includes('Immediately') || o.dates.includes('Jun 27')))
      if (activeOverride) {
        return {
          sectionId: id,
          sectionName: section.name,
          status: 'EMERGENCY' as const,
          detail: activeOverride.notes,
          mapsUp: section.mapsLinkUpstream,
          mapsDown: section.mapsLinkDownstream,
        }
      }
    }

    // Check base seasons for this species
    const matchingSeason = section.seasons.find(s =>
      s.species.toLowerCase().includes(speciesId) ||
      (speciesId === 'chinook' && s.species.toLowerCase().includes('chinook')) ||
      (speciesId === 'coho' && s.species.toLowerCase().includes('coho')) ||
      (speciesId === 'sockeye' && s.species.toLowerCase().includes('sockeye')) ||
      (speciesId === 'steelhead' && s.species.toLowerCase().includes('steelhead'))
    )

    // Baker confluence is always closed in summer
    if (id === 'skagit-baker-confluence' && mm >= 6 && mm <= 9) {
      return {
        sectionId: id,
        sectionName: section.name,
        status: 'CLOSED' as const,
        detail: 'CLOSED WATERS Jun 1 – Sep 15',
        mapsUp: section.mapsLinkUpstream,
        mapsDown: section.mapsLinkDownstream,
      }
    }

    const isOpen = matchingSeason && !matchingSeason.closed
    return {
      sectionId: id,
      sectionName: section.name,
      status: isOpen ? 'OPEN' as const : 'CLOSED' as const,
      detail: matchingSeason?.notes ?? (isOpen ? `Limit: ${matchingSeason?.dailyLimit ?? '—'}` : 'No open season in base pamphlet for this period'),
      mapsUp: section.mapsLinkUpstream,
      mapsDown: section.mapsLinkDownstream,
    }
  }).filter(Boolean) as { sectionId: string; sectionName: string; status: 'OPEN' | 'CLOSED' | 'EMERGENCY'; detail: string; mapsUp: string; mapsDown: string }[]
}

function RegCard({ reg, water }: { reg: Regulation; water: WaterBody }) {
  const isOpen = isOpenOn(reg, new Date())
  return (
    <div className="rounded-md p-3 mb-2"
      style={{ background: 'var(--bg)', borderLeft: `3px solid ${isOpen ? 'var(--accent-green)' : '#374151'}` }}>
      <div className="flex items-start justify-between mb-1">
        <span className="text-sm font-semibold text-white">{water.name}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded ml-2"
          style={{ background: isOpen ? 'rgba(106,176,76,0.15)' : 'rgba(239,68,68,0.15)',
                   color: isOpen ? '#6ab04c' : '#ef4444' }}>
          {isOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Season: {reg.seasonStart} – {reg.seasonEnd}</p>
      {reg.dailyLimit && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Daily limit: <span className="text-white">{reg.dailyLimit}</span>
        </p>
      )}
      {reg.minSize && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Min size: <span className="text-white">{reg.minSize}&quot;</span>
        </p>
      )}
      {reg.hatcheryOnly && <p className="text-xs mt-0.5 text-amber-400">Hatchery fish only</p>}
      {reg.gearRestriction && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Gear: <span className="text-white">{reg.gearRestriction}</span>
        </p>
      )}
      {reg.notes && <p className="text-xs mt-0.5 text-amber-400">{reg.notes}</p>}
    </div>
  )
}

export default function FishDetailSheet({ species, onClose, showTips = true, zIndex = 60 }: Props) {
  const { isStarred: isFishStarred, toggle: toggleFishStar } = useStarredFish()
  const [activeTab, setActiveTab] = useState<Tab>('regs')
  const [mapSection, setMapSection] = useState<{
    sectionId: string
    sectionName: string
    status: RiverSectionStatus
    detail: string
  } | null>(null)
  const [selectedWaterForConditions, setSelectedWaterForConditions] = useState<GaugeConfig | null>(null)
  const [selectedFullWater, setSelectedFullWater] = useState<string | null>(null)
  const [selectedRiverFromFish, setSelectedRiverFromFish] = useState<RiverEntry | null>(null)
  const [fishWaterCombo, setFishWaterCombo] = useState<{ water: WaterBody; index: number; siblings: WaterBody[] } | null>(null)
  const fishSegments = useSelectedFishSegments(species.id)
  const regs    = REGULATIONS.filter(r => r.speciesId === species.id)
  const waters  = regs.map(r => WATER_BODIES.find(w => w.id === r.waterBodyId)!).filter(Boolean)
  const tips    = FISH_TIPS[species.id]
  const gear    = GEAR[species.id]
  const guide   = CATCH_GUIDES.find(g => g.speciesId === species.id) ?? null
  const today   = new Date()

  const openRegs      = regs.filter(r => WATER_BODIES.find(w => w.id === r.waterBodyId) && isOpenOn(r, today))
  const anyOpen       = openRegs.length > 0

  // Next opening — earliest seasonStart across all non-open regs
  const allNonOpenRegs = regs.filter(r => WATER_BODIES.find(w => w.id === r.waterBodyId) && !isOpenOn(r, today))
  const nextOpen = !anyOpen && allNonOpenRegs.length > 0
    ? allNonOpenRegs.reduce((best, r) => {
        if (!best) return r.seasonStart
        return r.seasonStart < best ? r.seasonStart : best
      }, '' as string)
    : null

  // Open waters count
  const openWaterCount = openRegs.filter(r => WATER_BODIES.find(w => w.id === r.waterBodyId)).length

  // Detect emergency rule on a water body for this species
  function hasEmergencyOnWater(waterId: string): boolean {
    if (waterId === 'skagit' && SKAGIT_SPECIES_MAP[species.id]) {
      return SKAGIT_SPECIES_MAP[species.id].some(sid => {
        const sec = SKAGIT_SECTIONS.find(s => s.id === sid)
        return !!sec?.emergencyRule
      })
    }
    const reg = regs.find(r => r.waterBodyId === waterId)
    return !!(reg?.notes && /emergency/i.test(reg.notes))
  }

  // Format MM-DD → "Aug 16"
  function fmtDate(mmdd: string) {
    const MNAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const [m, d] = mmdd.split('-').map(Number)
    return `${MNAMES[m-1]} ${d}`
  }

  // Days until season opens (MM-DD string → integer days, future occurrences only)
  function daysUntilOpen(mmdd: string): number {
    const [m, d] = mmdd.split('-').map(Number)
    const year = today.getFullYear()
    let openDate = new Date(year, m - 1, d)
    if (openDate <= today) openDate = new Date(year + 1, m - 1, d)
    return Math.ceil((openDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  // ── Share handler ──────────────────────────────────────────────────────────
  async function handleShare() {
    const firstOpenWater = openRegs[0] ? waters.find(w => w?.id === openRegs[0].waterBodyId) : null
    const shareText = anyOpen
      ? `${species.name} is OPEN${firstOpenWater ? ` on ${firstOpenWater.name}` : ''} right now! Check castwa.com for regulations and gear tips.`
      : nextOpen
        ? `${species.name} season opens ${fmtDate(nextOpen)}. Set a reminder at castwa.com`
        : `${species.name} fishing info at castwa.com`
    const shareData = { title: `${species.name} — CastWA`, text: shareText, url: 'https://castwa.com' }
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareText} https://castwa.com`)
        // Brief visual feedback — no state needed, just rely on the button press
      }
    } catch { /* user cancelled or clipboard failed */ }
  }

  const touchStartX = useRef<number | null>(null)
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
  function handleTouchStart(e: React.TouchEvent) {
    e.stopPropagation()
    // Don't arm tab-swipe if touch starts inside a map or no-swipe element
    if (isInsideMapOrNoSwipe(e.touches[0].target)) {
      touchStartX.current = null
      return
    }
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    e.stopPropagation()
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 50) return
    const idx = TAB_ORDER.indexOf(activeTab)
    if (dx < 0 && idx < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[idx + 1])
    else if (dx > 0 && idx > 0) setActiveTab(TAB_ORDER[idx - 1])
    else if (dx > 0 && idx === 0) onClose()   // swipe right at first tab = go back / close
    touchStartX.current = null
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'regs', label: 'Waters' },
    { key: 'gear', label: 'Gear'   },
    { key: 'tips', label: 'Tips'   },
  ]

  return (
    <>
    <div className="fixed inset-0 flex flex-col justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ background: 'rgba(0,0,0,0.8)', zIndex }}>
      <div className="animate-slide-up rounded-t-xl overflow-hidden flex flex-col"
        style={{ background: 'var(--surface)', height: '92vh' }}>

        {/* ── Hero photo — compact ── */}
        <div className="relative flex-shrink-0 flex items-center justify-center"
          style={{ height: '120px', background: 'rgb(11,13,20)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={species.photo} alt={species.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />
          <div className="absolute inset-x-0 bottom-0 h-8"
            style={{ background: 'linear-gradient(to top, var(--surface), transparent)' }} />
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          {/* ── Star button ── */}
          <button
            onClick={() => toggleFishStar(species.id)}
            className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            {isFishStarred(species.id) ? (
              <svg className="w-4 h-4" fill="#f59e0b" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.6)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.499z"/></svg>
            )}
          </button>
        </div>

        {/* ── Status banner — always visible, no scrolling required ── */}
        <div className="flex-shrink-0 px-4 py-2.5"
          style={{ background: anyOpen ? 'rgba(106,176,76,0.12)' : 'rgba(55,65,81,0.4)',
                   borderBottom: `2px solid ${anyOpen ? 'rgba(106,176,76,0.4)' : 'rgba(55,65,81,0.6)'}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black" style={{ color: anyOpen ? '#6ab04c' : '#6b7280' }}>
                {anyOpen ? '● OPEN' : '○ CLOSED'}
              </span>
              {anyOpen && openWaterCount > 0 && (
                <button
                  onClick={() => setActiveTab('regs')}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full active:scale-[0.99]"
                  style={{ background: 'rgba(106,176,76,0.18)', color: '#6ab04c', border: '1px solid rgba(106,176,76,0.3)' }}>
                  {openWaterCount} {openWaterCount === 1 ? 'water' : 'waters'} open — see all →
                </button>
              )}
              {anyOpen && openRegs[0] && openWaterCount === 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                  {fmtDate(openRegs[0].seasonStart)}–{fmtDate(openRegs[0].seasonEnd)}
                </span>
              )}
              {!anyOpen && nextOpen && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                  Opens {fmtDate(nextOpen)}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white leading-tight">{species.name}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{species.category}</p>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 flex-shrink-0 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="flex-1 py-2 text-sm font-bold rounded-md transition-all active:scale-[0.99]"
              style={{
                background: activeTab === t.key ? 'var(--accent)' : 'var(--surface)',
                color: activeTab === t.key ? '#fff' : 'var(--text-faint)',
                border: `1.5px solid ${activeTab === t.key ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}>

          {/* ════ WATERS TAB — sticky map + scrollable list ════ */}
          {activeTab === 'regs' && (
            <div className="flex flex-col min-h-0 flex-1">
              {/* ── WA State map — stays put while list scrolls ── */}
              <div className="flex-shrink-0" data-no-swipe-back="true" style={{ height: '38vh', position: 'relative' }}>
                <WAMapDynamic
                  fishSegments={fishSegments}
                  onSegmentClick={(seg: FishSegment) => {
                    const wb = WATER_BODIES.find(w => w.id === seg.waterId)
                    if (wb) {
                      const riverEntry = findRiverEntry(wb)
                      if (riverEntry) setSelectedRiverFromFish(riverEntry)
                      else setSelectedFullWater(seg.waterName)
                    }
                  }}
                  onOpenRiver={(riverId: string) => {
                    const wb = WATER_BODIES.find(w => w.id === riverId)
                    if (wb) {
                      const riverEntry = findRiverEntry(wb)
                      if (riverEntry) setSelectedRiverFromFish(riverEntry)
                    }
                  }}
                />
                {/* Legend overlay */}
                <div className="absolute bottom-2 left-2 flex gap-2.5 px-2.5 py-1.5 rounded-lg"
                  style={{ background: 'rgba(10,12,20,0.85)', backdropFilter: 'blur(4px)' }}>
                  {([['#6ab04c','Open'],['#ef4444','Closed'],['#374151','No data']] as [string,string][]).map(([c,l]) => (
                    <span key={l} className="flex items-center gap-1 text-[10px] font-semibold text-white">
                      <span style={{ width:8, height:8, borderRadius:'50%', background:c, display:'inline-block', flexShrink:0 }} />{l}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Water list — scrolls independently ── */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
              {regs.length === 0 ? (
                <div className="rounded-xl p-4 text-center" style={{ border: '1px solid var(--border)' }}>
                  <p className="text-sm font-semibold text-white mb-1">No regulation data on file</p>
                  <a href="https://wdfw.wa.gov/fishing/regulations" target="_blank" rel="noopener noreferrer"
                    className="text-xs underline" style={{ color: '#f26522' }}>
                    Check WDFW directly →
                  </a>
                </div>
              ) : (
                <>
                  {/* ── Water list: emergency first, then open, then closed ── */}
                  <div className="space-y-2">
                    {[...regs]
                      .map(r => ({ reg: r, water: WATER_BODIES.find(w => w.id === r.waterBodyId) }))
                      .filter((item): item is { reg: Regulation; water: WaterBody } => !!item.water)
                      .sort((a, b) => {
                        const aEmerg = hasEmergencyOnWater(a.water.id) ? 0 : isOpenOn(a.reg, today) ? 1 : 2
                        const bEmerg = hasEmergencyOnWater(b.water.id) ? 0 : isOpenOn(b.reg, today) ? 1 : 2
                        if (aEmerg !== bEmerg) return aEmerg - bEmerg
                        return a.water.name.localeCompare(b.water.name)
                      })
                      .map(({ reg, water }) => {
                        const isEmerg = hasEmergencyOnWater(water.id)
                        const isOpen  = isOpenOn(reg, today)
                        const isRestricted = isOpen && !isEmerg && (reg.hatcheryOnly || !!reg.gearRestriction)
                        const days    = !isOpen ? daysUntilOpen(reg.seasonStart) : null
                        const soon    = days !== null && days <= 30

                        const borderColor = isEmerg ? '#f97316' : isRestricted ? '#f97316' : isOpen ? '#6ab04c' : '#374151'
                        const bgColor     = isEmerg ? 'rgba(249,115,22,0.08)' : isRestricted ? 'rgba(249,115,22,0.06)' : isOpen ? 'rgba(106,176,76,0.08)' : 'transparent'
                        const opacity     = (!isOpen && !isEmerg) ? 0.6 : 1

                        const badge = isEmerg
                          ? { text: 'EMERGENCY RULE', color: '#f97316', bg: 'rgba(249,115,22,0.18)' }
                          : isRestricted
                            ? { text: 'OPEN · RESTRICTED', color: '#f97316', bg: 'rgba(249,115,22,0.18)' }
                          : isOpen
                            ? { text: '● OPEN',   color: '#6ab04c', bg: 'rgba(106,176,76,0.18)' }
                            : { text: '○ CLOSED', color: '#6b7280', bg: 'rgba(107,114,128,0.18)' }

                        return (
                          <button
                            key={reg.id}
                            onClick={() => {
                              const sortedSibs = [...regs]
                                .map(r => ({ reg: r, wb: WATER_BODIES.find(w => w.id === r.waterBodyId) }))
                                .filter((x) => !!x.wb)
                                .sort((a, b) => {
                                  const aE = hasEmergencyOnWater(a.wb!.id) ? 0 : isOpenOn(a.reg, today) ? 1 : 2
                                  const bE = hasEmergencyOnWater(b.wb!.id) ? 0 : isOpenOn(b.reg, today) ? 1 : 2
                                  if (aE !== bE) return aE - bE
                                  return a.wb!.name.localeCompare(b.wb!.name)
                                })
                                .map(x => x.wb as WaterBody)
                              const sibIdx = sortedSibs.findIndex(w => w.id === water.id)
                              setFishWaterCombo({ water, index: Math.max(0, sibIdx), siblings: sortedSibs })
                            }}
                            className="flex items-center w-full text-left rounded-lg overflow-hidden transition-colors active:scale-[0.99]"
                            style={{
                              background: bgColor,
                              border: `1px solid ${isEmerg ? 'rgba(249,115,22,0.3)' : isOpen ? 'rgba(106,176,76,0.2)' : 'var(--border)'}`,
                              borderLeft: `3px solid ${borderColor}`,
                              opacity,
                              padding: '12px 12px 12px 14px',
                            }}
                          >
                            <div className="flex-1 min-w-0 mr-2">
                              <p className="text-sm font-bold text-white leading-tight">{water.name}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ background: badge.bg, color: badge.color }}>
                                  {badge.text}
                                </span>
                                {!isOpen && !isEmerg && soon && (
                                  <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                                    Opens {fmtDate(reg.seasonStart)}
                                  </span>
                                )}
                                {!isOpen && !isEmerg && !soon && (
                                  <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                                    {fmtDate(reg.seasonStart)}–{fmtDate(reg.seasonEnd)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="flex-shrink-0 text-lg font-light" style={{ color: 'var(--text-faint)' }}>›</span>
                          </button>
                        )
                      })
                    }
                  </div>

                  {/* ── Skagit section detail moved into water detail popup ── */}
                  {false && SKAGIT_SPECIES_MAP[species.id] && (() => {
                    const STATUS_ORDER = { OPEN: 0, EMERGENCY: 1, CLOSED: 2 } as const
                    const sortedSkagit = [...getTodaySkagitStatus(species.id)].sort(
                      (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
                    )
                    return (
                    <div className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid rgba(242,101,34,0.3)' }}>
                      <div className="px-3 py-2.5 flex items-center justify-between"
                        style={{ background: 'rgba(242,101,34,0.1)', borderBottom: '1px solid rgba(242,101,34,0.2)' }}>
                        <p className="text-xs font-black tracking-widest" style={{ color: 'var(--accent)' }}>SKAGIT RIVER — BY SECTION</p>
                        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>CRC #830</span>
                      </div>
                      {sortedSkagit.map((sec, i, arr) => {
                        const coordData = SKAGIT_SECTION_COORDS[sec.sectionId]
                        const mapStatus: RiverSectionStatus =
                          sec.status === 'OPEN' ? 'open' :
                          sec.status === 'EMERGENCY' ? 'emergency' : 'closed'
                        const rowContent = (
                          <>
                            <span className="flex-shrink-0 text-[10px] font-black mt-0.5 px-1.5 py-0.5 rounded"
                              style={{
                                background: sec.status === 'OPEN' ? 'rgba(106,176,76,0.15)' : sec.status === 'EMERGENCY' ? 'rgba(242,101,34,0.15)' : 'rgba(239,68,68,0.15)',
                                color: sec.status === 'OPEN' ? '#6ab04c' : sec.status === 'EMERGENCY' ? '#f26522' : '#ef4444',
                                whiteSpace: 'nowrap',
                              }}>
                              {sec.status === 'OPEN' ? '● OPEN' : sec.status === 'EMERGENCY' ? '! EMERG.' : '○ CLOSED'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white leading-tight">{sec.sectionName}</p>
                              <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--text-faint)' }}>{sec.detail}</p>
                            </div>
                            {coordData && (
                              <span className="flex-shrink-0 text-gray-400 text-base font-light ml-1">›</span>
                            )}
                          </>
                        )
                        const rowStyle = {
                          borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                          background: 'var(--bg)',
                        }
                        if (coordData) {
                          return (
                            <button key={i}
                              onClick={() => setMapSection({
                                sectionId: sec.sectionId,
                                sectionName: sec.sectionName,
                                status: mapStatus,
                                detail: sec.detail,
                              })}
                              className="flex items-start gap-3 px-3 py-2.5 w-full text-left cursor-pointer hover:bg-gray-800/50 active:bg-gray-800 transition-colors"
                              style={rowStyle}>
                              {rowContent}
                            </button>
                          )
                        }
                        return (
                          <div key={i} className="flex items-start gap-3 px-3 py-2.5" style={rowStyle}>
                            {rowContent}
                          </div>
                        )
                      })}
                    </div>
                    )
                  })()}

                  <a href="https://wdfw.wa.gov/fishing/regulations" target="_blank" rel="noopener noreferrer"
                    className="block text-center text-xs py-2" style={{ color: 'var(--text-faint)', textDecoration: 'none' }}>
                    Always verify at wdfw.wa.gov ↗
                  </a>
                </>
              )}
              </div>{/* end p-4 water list */}
            </div>
          )}

          {/* ════ GEAR TAB ════ */}
          {activeTab === 'gear' && (
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
              {!gear ? (
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No gear data on file yet.</p>
              ) : (
                <>
                  <div className="rounded-md" style={{ border: '1px solid var(--border)' }}>
                    <div className="px-3 py-2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      <p className="text-[11px] font-black tracking-widest" style={{ color: 'var(--text-faint)' }}>ROD & LINE SETUP</p>
                    </div>
                    <div className="px-3 py-3" style={{ background: 'var(--bg)' }}>
                      <p className="text-sm font-medium text-white">{gear.rodSetup}</p>
                    </div>
                  </div>

                  <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <div className="px-3 py-2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      <p className="text-[11px] font-black tracking-widest" style={{ color: 'var(--text-faint)' }}>LURES</p>
                    </div>
                    <div className="p-3" style={{ background: 'var(--bg)' }}>
                      <GearGrid items={gear.lures} accent="#f26522" />
                    </div>
                  </div>

                  <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <div className="px-3 py-2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      <p className="text-[11px] font-black tracking-widest" style={{ color: 'var(--text-faint)' }}>BAIT</p>
                    </div>
                    <div className="p-3" style={{ background: 'var(--bg)' }}>
                      <GearGrid items={gear.bait} accent="#6ab04c" />
                    </div>
                  </div>

                  <div className="rounded-md" style={{ border: '1px solid var(--border)' }}>
                    <div className="px-3 py-2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      <p className="text-[11px] font-black tracking-widest" style={{ color: 'var(--text-faint)' }}>TECHNIQUE</p>
                    </div>
                    <div style={{ background: 'var(--bg)' }}>
                      {gear.technique.map((t, i) => (
                        <div key={i} className="flex gap-3 px-3 py-3"
                          style={{ borderBottom: i < gear.technique.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                            style={{ background: 'rgba(242,101,34,0.2)', color: 'var(--accent)' }}>{i + 1}</span>
                          <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════ TIPS TAB — How to Catch Guide ════ */}
          {activeTab === 'tips' && (
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5">
              {guide ? (
                <>
                  {/* Where to Find */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>Where to Find Them</p>
                    <ul className="space-y-1.5">
                      {guide.whereToFind.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="flex-shrink-0 mt-0.5 text-xs" style={{ color: '#6ab04c' }}>●</span>
                          <span className="text-sm text-white leading-snug">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Best Bait */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>Best Bait &amp; Lures</p>
                    <div className="space-y-2">
                      {guide.bestBait.map((bait, i) => (
                        <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded"
                          style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white leading-tight">{bait.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{bait.when}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technique */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>Technique</p>
                    <ul className="space-y-1.5">
                      {guide.technique.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="flex-shrink-0 mt-0.5 text-xs" style={{ color: '#63b3ed' }}>●</span>
                          <span className="text-sm text-white leading-snug">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Best Time */}
                  <div className="px-3 py-2.5 rounded" style={{ background: 'rgba(242,101,34,0.08)', border: '1px solid rgba(242,101,34,0.2)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#f26522' }}>Best Time</p>
                    <p className="text-sm text-white leading-snug">{guide.bestTime}</p>
                  </div>

                  {/* Pro Tips */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>WA Pro Tips</p>
                    <ul className="space-y-1.5">
                      {guide.proTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="flex-shrink-0 mt-0.5 text-xs" style={{ color: '#f59e0b' }}>★</span>
                          <span className="text-sm text-white leading-snug">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* About (preserved below guide) */}
                  <div className="rounded-md" style={{ border: '1px solid var(--border)' }}>
                    <div className="px-3 py-2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      <p className="text-[11px] font-black tracking-widest" style={{ color: 'var(--text-faint)' }}>ABOUT</p>
                    </div>
                    <div className="px-3 py-3" style={{ background: 'var(--bg)' }}>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{species.description}</p>
                    </div>
                  </div>
                </>
              ) : (
                // Fallback for species without a dedicated guide
                <>
                  {/* Best times from gear data */}
                  {gear?.bestTimes && (
                    <div className="rounded-md" style={{ border: '1px solid var(--border)' }}>
                      <div className="px-3 py-2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                        <p className="text-[11px] font-black tracking-widest" style={{ color: 'var(--text-faint)' }}>BEST TIMES</p>
                      </div>
                      <div className="px-3 py-3" style={{ background: 'var(--bg)' }}>
                        <p className="text-sm font-semibold text-white">{gear.bestTimes}</p>
                      </div>
                    </div>
                  )}

                  {/* How to catch from FISH_TIPS */}
                  {showTips && tips && (
                    <div className="rounded-md" style={{ border: '1px solid var(--border)' }}>
                      <div className="px-3 py-2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                        <p className="text-[11px] font-black tracking-widest" style={{ color: 'var(--text-faint)' }}>HOW TO CATCH</p>
                      </div>
                      <div style={{ background: 'var(--bg)' }}>
                        {tips.howToCatch.map((tip, i) => (
                          <div key={i} className="flex gap-3 px-3 py-2.5"
                            style={{ borderBottom: i < tips.howToCatch.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5"
                              style={{ background: 'rgba(242,101,34,0.2)', color: 'var(--accent)' }}>{i + 1}</span>
                            <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Identification */}
                  {showTips && tips && (
                    <div className="rounded-md" style={{ border: '1px solid var(--border)' }}>
                      <div className="px-3 py-2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                        <p className="text-[11px] font-black tracking-widest" style={{ color: 'var(--text-faint)' }}>IDENTIFICATION</p>
                      </div>
                      <div style={{ background: 'var(--bg)' }}>
                        <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{tips.whatToLookFor}</p>
                        </div>
                        {tips.howToSpot.map((tip, i) => (
                          <div key={i} className="flex gap-3 px-3 py-2.5"
                            style={{ borderBottom: i < tips.howToSpot.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <span className="flex-shrink-0 font-bold text-sm mt-0.5" style={{ color: '#6ab04c' }}>●</span>
                            <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* About */}
                  <div className="rounded-md" style={{ border: '1px solid var(--border)' }}>
                    <div className="px-3 py-2" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      <p className="text-[11px] font-black tracking-widest" style={{ color: 'var(--text-faint)' }}>ABOUT</p>
                    </div>
                    <div className="px-3 py-3" style={{ background: 'var(--bg)' }}>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{species.description}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* ── License footer ── */}
        <a
          href="https://fishhunt.dfw.wa.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center justify-between px-4 py-3 no-underline"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', textDecoration: 'none' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            Buy / Renew WA Fishing License
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>↗</span>
        </a>
      </div>
    </div>

    {/* ── River section map modal ── */}
    {mapSection && (() => {
      const coordData = SKAGIT_SECTION_COORDS[mapSection.sectionId]
      if (!coordData) return null
      return (
        <RiverSectionMap
          sectionName={mapSection.sectionName}
          startLabel={coordData.startLabel}
          endLabel={coordData.endLabel}
          coordinates={coordData.coords}
          status={mapSection.status}
          detail={mapSection.detail}
          onClose={() => setMapSection(null)}
          riverId="skagit"
          startCoord={coordData.coords[0]}
          endCoord={coordData.coords[coordData.coords.length - 1]}
        />
      )
    })()}

    {/* ── River conditions sheet (gauge waters) ── */}
    {selectedWaterForConditions && (
      <RiverConditionsSheet
        gaugeId={selectedWaterForConditions.gaugeId}
        gaugeName={selectedWaterForConditions.gaugeName}
        thresholds={selectedWaterForConditions.thresholds}
        riverMapConfig={selectedWaterForConditions.riverMapConfig}
        onClose={() => setSelectedWaterForConditions(null)}
      />
    )}

    {/* ── Full water detail sheet (opens with this species pre-selected) ── */}
    {selectedFullWater && (
      <WaterDetailSheet
        waterName={selectedFullWater}
        onClose={() => setSelectedFullWater(null)}
        zIndex={90}
        initialSpeciesId={species.id}
      />
    )}

    {/* ── River detail sheet (full RiverDetailSheet for rivers with USGS gauges) ── */}
    {selectedRiverFromFish && (
      <RiverDetailSheet
        river={selectedRiverFromFish}
        flow={{ cfs: null, status: 'loading', trend: null, fetchedAt: '' }}
        onClose={() => setSelectedRiverFromFish(null)}
        zIndex={zIndex + 40}
      />
    )}

    {/* ── FishWaterSheet — fish+water detail (from water tap in waters list) ── */}
    {fishWaterCombo && (
      <FishWaterSheet
        fish={species}
        water={fishWaterCombo.water}
        siblingWaters={fishWaterCombo.siblings}
        initialSiblingIndex={fishWaterCombo.index}
        onClose={() => setFishWaterCombo(null)}
        zIndex={zIndex + 50}
      />
    )}

    </>
  )
}
