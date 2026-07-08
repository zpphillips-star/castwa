'use client'
import { useState, useEffect } from 'react'
import type L from 'leaflet'
import { MapContainer, TileLayer, CircleMarker, Polyline, Polygon, Popup, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { WATER_BODIES, REGULATIONS, SKAGIT_SECTIONS, isOpenOn } from '@/lib/fishing-data'
import RiverSectionMap from './RiverSectionMap'
import { SKAGIT_SECTION_COORDS } from '@/lib/river-sections-coords'
import type { RiverSectionStatus } from './RiverSectionMapInner'
import {
  SKAGIT_COORDS,
  SAUK_COORDS,
  NOOKSACK_COORDS,
  STILLAGUAMISH_COORDS,
  SNOHOMISH_COORDS,
  SKYKOMISH_COORDS,
  WA_WATERWAYS,
  type WaterwayEntry,
} from '@/lib/river-coords-generated'
import { sliceRiverBetween } from '@/lib/river-regulation-segments'
import type { FishSegment } from '@/lib/use-fish-map-segments'

// --- PROPS ---
interface WAMapProps {
  selectedFish?: string | null
  fishSegments?: FishSegment[]
  onSegmentClick?: (segment: FishSegment) => void
  zoomToSkagit?: number
}

// --- MAP CONTROLLER ---
function MapController({ zoomToSkagit }: { zoomToSkagit: number }) {
  const map = useMap()
  useEffect(() => {
    if (zoomToSkagit > 0) {
      map.flyToBounds([[48.38, -122.54], [48.68, -121.24]], { padding: [40, 40], maxZoom: 10 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomToSkagit])
  return null
}

// ─── DATE RANGE PARSER ────────────────────────────────────────────────────────
// Parses strings like "Jul 3 – Jul 31", "Jun 25 – Jun 26", "Immediately – Jul 31 2026"

const MONTH_MAP: Record<string, number> = {
  jan:0, feb:1, mar:2, apr:3, may:4, jun:5,
  jul:6, aug:7, sep:8, oct:9, nov:10, dec:11,
}

function parseMonDay(s: string): { m: number; d: number } | null {
  const m = s.trim().match(/^(\w{3})\.?\s+(\d+)/i)
  if (!m) return null
  const mon = MONTH_MAP[m[1].toLowerCase()]
  return mon !== undefined ? { m: mon, d: parseInt(m[2]) } : null
}

function isInRange(today: Date, rangeStr: string): boolean {
  const yr = today.getFullYear()
  const s = rangeStr.trim()
  if (s.toLowerCase().startsWith('year')) return true
  if (s.toLowerCase().startsWith('all other') || s === '—') return false

  if (s.toLowerCase().startsWith('immediately') || s.toLowerCase().startsWith('now')) {
    const endPart = s.match(/–\s*(.+)/)
    if (!endPart) return true
    const ep = parseMonDay(endPart[1])
    if (!ep) return true
    return today <= new Date(yr, ep.m, ep.d, 23, 59, 59)
  }

  const parts = s.split(/\s*–\s*/)
  if (parts.length !== 2) return false
  const a = parseMonDay(parts[0])
  const b = parseMonDay(parts[1])
  if (!a || !b) return false
  const start = new Date(yr, a.m, a.d)
  const end   = new Date(b.m < a.m ? yr + 1 : yr, b.m, b.d, 23, 59, 59)
  return today >= start && today <= end
}

// ─── SKAGIT SECTION STATUS ────────────────────────────────────────────────────

type SegStatus = 'open' | 'closed_hard' | 'closed'

function skagitStatus(sectionId: string, today: Date): { status: SegStatus; line1: string; line2?: string } {
  const sec = SKAGIT_SECTIONS.find(s => s.id === sectionId)
  if (!sec) return { status: 'closed', line1: 'No data' }

  // Emergency rule: hard closures first
  if (sec.emergencyRule) {
    for (const o of sec.emergencyRule.overrides) {
      if (o.status === 'CLOSED' && isInRange(today, o.dates)) {
        return { status: 'closed_hard', line1: '⛔ Emergency closure', line2: o.notes }
      }
    }
    // Emergency open overrides
    for (const o of sec.emergencyRule.overrides) {
      if (o.status === 'OPEN' && isInRange(today, o.dates)) {
        return { status: 'open', line1: '🚨 Emergency rule', line2: o.notes.split('.')[0] }
      }
    }
  }

  // Base pamphlet — check each season entry
  for (const s of sec.seasons) {
    if (s.closed) continue
    if (!s.open || s.open === '—') continue
    // season.open can be compound: "Jun 1–Jun 30 / Aug 1–Aug 15"
    const ranges = s.open.split(/[/&+]/).map(r => r.trim())
    for (const r of ranges) {
      if (isInRange(today, r)) {
        return {
          status: 'open',
          line1: s.species,
          line2: s.dailyLimit ? `Limit ${s.dailyLimit}` : undefined,
        }
      }
    }
  }

  // Hard-closed seasons (e.g. "CLOSED WATERS Jun 1 – Sep 15")
  for (const s of sec.seasons) {
    if (!s.closed) continue
    if (s.open && s.open !== '—' && isInRange(today, s.open)) {
      return { status: 'closed_hard', line1: s.notes ?? 'Closed waters', line2: undefined }
    }
  }

  return { status: 'closed', line1: 'No open season today' }
}

// ─── PRE-COMPUTE SKAGIT PRECISE COORDS FROM OSM TRACE ────────────────────────
// For each regulation section, slice the full OSM trace between its endpoints.
// Falls back to existing simple coords if the OSM slice is too short.
const SKAGIT_PRECISE: Record<string, [number, number][]> = Object.fromEntries(
  Object.entries(SKAGIT_SECTION_COORDS).map(([id, sec]) => {
    const start = sec.coords[0]
    const end   = sec.coords[sec.coords.length - 1]
    const slice = sliceRiverBetween(SKAGIT_COORDS, start, end)
    return [id, slice.length >= 3 ? slice : sec.coords]
  })
)

// ─── OSM NAME → FISHING DATA ID ──────────────────────────────────────────────
/** Maps OSM waterway names to fishing-data.ts waterBodyIds */
const OSM_TO_FISHING_ID: Record<string, string> = {
  'Snohomish River':  'snohomish',
  'Columbia River':   'columbia',
  'Snake River':      'snake',
  'Yakima River':     'yakima',
  'Green River':      'green',
  'Cedar River':      'cedar',
  'Lake Sammamish':   'sammamish',
  'Lake Washington':  'washington',
  'Lake Chelan':      'chelan',
  'Lake Roosevelt':   'roosevelt',
  'Banks Lake':       'banks',
  'Hood Canal':       'hood',
  'Willapa Bay':      'willapa',
}

/** Rivers handled by Skagit sections — skip from WA_WATERWAYS rendering */
const SKIP_FROM_WATERWAYS = new Set(['Skagit River'])

/**
 * Some rivers are tagged natural=water in OSM, causing the lake query to
 * overwrite the river entry. Detect these by name and treat as rivers.
 */
function getEffectiveType(name: string, entry: WaterwayEntry): 'river' | 'lake' | 'stream' {
  if (entry.type === 'lake' && /River|Creek|Stream|Fork|Run/i.test(name)) return 'river'
  return entry.type
}

// ─── PUGET SOUND MARINE AREAS ────────────────────────────────────────────────
type MarineArea = {
  id: string
  name: string
  description: string
  salmonNote: string
  coords: [number, number][]
}

const MARINE_AREAS: MarineArea[] = [
  {
    // Waters east of Whidbey Island: Skagit Bay, Saratoga Passage, Port Susan
    // Outer perimeter clockwise: Possession Point → Mukilteo coast → Anacortes →
    //   Deception Pass → Whidbey east coast → back to Possession Point
    // Camano Island sits inside this perimeter; at 0.12 fillOpacity the tile layer
    // shows through so land/water contrast remains visible.
    id: 'area-8-1',
    name: 'Marine Area 8-1',
    description: 'Deception Pass / Skagit Bay / Saratoga Passage / Port Susan',
    salmonNote: 'Chinook Jul 1–Oct 15 (hatchery only) · Coho Aug 15–Nov 15',
    coords: [
      [47.93, -122.38],  // Possession Point (S tip Whidbey, S boundary start)
      [47.95, -122.25],  // Mukilteo shore (S boundary E end)
      [48.05, -122.22],  // Tulalip area (E boundary S)
      [48.25, -122.30],  // Stanwood / mainland mid (E boundary)
      [48.37, -122.36],  // N mainland near Skagit delta (NE)
      [48.42, -122.46],  // Near Anacortes / Fidalgo Island SE (NE corner)
      [48.42, -122.63],  // Deception Pass (NW corner, N boundary W end)
      [48.28, -122.60],  // Whidbey NE coast (W boundary N)
      [48.10, -122.52],  // Whidbey E coast central (W boundary mid)
      [47.97, -122.42],  // Clinton area (W boundary S, E coast of Whidbey)
    ] as [number, number][],
  },
  {
    // Possession Sound and Port Gardner — between S Whidbey and Everett/Edmonds shore
    // N: Possession Point line; S: ~Edmonds; E: mainland; W: S Whidbey + Admiralty approach
    id: 'area-8-2',
    name: 'Marine Area 8-2',
    description: 'Port Gardner / Possession Sound',
    salmonNote: 'Chinook Aug 1–Sep 30 · Coho Sep 1–Oct 31',
    coords: [
      [47.93, -122.38],  // Possession Point (NW, S tip Whidbey)
      [47.95, -122.25],  // Mukilteo (NE, mainland)
      [47.80, -122.25],  // Everett S shore (SE)
      [47.75, -122.40],  // Edmonds area (S boundary)
      [47.80, -122.52],  // SW (approaching S Whidbey / Admiralty Inlet entrance)
      [47.90, -122.55],  // Bush Point area (S Whidbey W coast, W boundary)
    ] as [number, number][],
  },
  {
    // Admiralty Inlet — wide passage between Whidbey Island (W) and
    // Port Townsend / Quimper Peninsula (E).
    // N: Partridge Point → Point Wilson; S: Point No Point → Possession Sound
    id: 'area-9',
    name: 'Marine Area 9',
    description: 'Admiralty Inlet / Port Townsend',
    salmonNote: 'Seasonal closures in effect — check WDFW emergency rules',
    coords: [
      [48.20, -122.91],  // Partridge Point (NW Whidbey, NW corner)
      [48.14, -122.75],  // Point Wilson / Port Townsend (NE corner)
      [47.93, -122.75],  // Quimper Peninsula going S (E boundary)
      [47.88, -122.53],  // Port Ludlow / Kitsap (SE corner)
      [47.91, -122.53],  // Point No Point (S boundary E end)
      [47.90, -122.55],  // Point No Point W (S boundary)
      [47.88, -122.62],  // S boundary W (between Kitsap and Whidbey)
      [47.97, -122.65],  // Fort Casey / S Whidbey W coast (W boundary S)
      [48.06, -122.69],  // Admiralty Head (W boundary mid)
    ] as [number, number][],
  },
  {
    // Central Puget Sound — main basin from Seattle/Edmonds to Tacoma Narrows
    // N: Point No Point → Edmonds; S: Tacoma Narrows entrance; E: Seattle shore; W: Kitsap
    // Bainbridge Island inside perimeter — at 0.12 opacity tiles show through
    id: 'area-10',
    name: 'Marine Area 10',
    description: 'Central Puget Sound / Seattle',
    salmonNote: 'Chinook Jul 1–Oct 15 (hatchery) · Coho Aug 15–Nov 15',
    coords: [
      [47.91, -122.53],  // Point No Point (N boundary W)
      [47.80, -122.25],  // Edmonds / Lynnwood shore (N boundary E)
      [47.50, -122.25],  // Tacoma N shore (SE, S boundary E end)
      [47.50, -122.58],  // Gig Harbor / Tacoma Narrows W (S boundary W end)
      [47.62, -122.78],  // SW Kitsap / Bremerton area (W boundary S)
      [47.78, -122.90],  // W Kitsap (W boundary mid)
      [47.92, -122.70],  // N Kitsap near Kingston (W boundary N)
    ] as [number, number][],
  },
  {
    // South Puget Sound — Tacoma Narrows south to Olympia and the inlets
    // Simplified outer perimeter; multiple sub-inlets inside at 0.12 opacity look fine
    id: 'area-11',
    name: 'Marine Area 11',
    description: 'South Puget Sound / Tacoma Narrows',
    salmonNote: 'Limited openings — check WDFW emergency rules before fishing',
    coords: [
      [47.50, -122.58],  // Tacoma Narrows NW (N boundary W)
      [47.50, -122.25],  // Tacoma NE (N boundary E)
      [47.10, -122.45],  // SE (Nisqually / Lacey area)
      [47.05, -122.55],  // S (Olympia / Budd Inlet)
      [47.18, -122.85],  // SW (Shelton / Hammersley Inlet)
      [47.35, -122.95],  // W (S Kitsap / Hood Canal mouth region)
      [47.40, -122.78],  // NW (N Gig Harbor / S Kitsap)
    ] as [number, number][],
  },
]

// ─── SKAGIT SECTION DEFS ─────────────────────────────────────────────────────
type RiverSeg = {
  id: string
  label: string
  skagitId: string
  coords: [number, number][]
  weight?: number
}

const SKAGIT_SEGS: RiverSeg[] = [
  { id: 'sk-1', label: 'Skagit: Mouth → Hwy 536 (Mt. Vernon)',           skagitId: 'skagit-mouth-to-hwy536',          weight: 5, coords: SKAGIT_PRECISE['skagit-mouth-to-hwy536'] },
  { id: 'sk-2', label: 'Skagit: Hwy 536 → Gilligan Creek',               skagitId: 'skagit-hwy536-to-gilligan',       weight: 5, coords: SKAGIT_PRECISE['skagit-hwy536-to-gilligan'] },
  { id: 'sk-3', label: 'Skagit: Gilligan Creek → Dalles Bridge',          skagitId: 'skagit-gilligan-to-dalles',       weight: 5, coords: SKAGIT_PRECISE['skagit-gilligan-to-dalles'] },
  { id: 'sk-4', label: 'Skagit: Dalles Bridge → 200\' Below Baker River', skagitId: 'skagit-dalles-to-baker-below',    weight: 5, coords: SKAGIT_PRECISE['skagit-dalles-to-baker-below'] },
  { id: 'sk-5', label: 'Skagit: Baker Confluence Zone (±200\')',           skagitId: 'skagit-baker-confluence',         weight: 6, coords: SKAGIT_PRECISE['skagit-baker-confluence'] },
  { id: 'sk-6', label: 'Skagit: 200\' Above Baker → Hwy 530 (Rockport)',  skagitId: 'skagit-baker-above-to-rockport',  weight: 5, coords: SKAGIT_PRECISE['skagit-baker-above-to-rockport'] },
  { id: 'sk-7', label: 'Skagit: Rockport → Marblemount',                  skagitId: 'skagit-rockport-to-marblemount',  weight: 5, coords: SKAGIT_PRECISE['skagit-rockport-to-marblemount'] },
  { id: 'sk-8', label: 'Skagit: Marblemount → Gorge Powerhouse',          skagitId: 'skagit-marblemount-to-newhalem',  weight: 5, coords: SKAGIT_PRECISE['skagit-marblemount-to-newhalem'] },
]

// ─── COLORS ───────────────────────────────────────────────────────────────────
const C_OPEN        = '#22c55e'   // green  — open today (fish selected + in season)
const C_HARD        = '#ef4444'   // red    — closed (fish selected + out of season)
const C_GREY        = '#374151'   // grey   — no data for selected fish
const C_GREY2       = '#4b5563'   // lighter grey for stroke
const C_BLUE        = '#3b82f6'   // blue   — no fish selected (default)
const C_BLUE2       = '#60a5fa'   // lighter blue stroke
const C_SLATE       = '#475569'   // slate  — unregulated river
const C_LAKE_FILL   = '#1e3a5f'   // dark blue fill for lakes
const C_LAKE_STROKE = '#3b82f6'   // blue stroke for lakes (same as C_BLUE)
const C_MARINE_OPEN = '#22c55e'   // green fill for open marine areas
const C_MARINE_GREY = '#374151'   // grey fill for closed/restricted marine areas

// ─── INNER MAP COMPONENT ─────────────────────────────────────────────────────
// Must live inside <MapContainer> to use react-leaflet hooks.

type MapSectionPayload = {
  segId: string
  label: string
  status: RiverSectionStatus
  popup1: string
  popup2?: string
}

function WAMapContents({
  today,
  onSelectSection,
  fishSegments,
  onSegmentClick,
}: {
  today: Date
  onSelectSection: (s: MapSectionPayload) => void
  fishSegments?: FishSegment[]
  onSegmentClick?: (segment: FishSegment) => void
}) {
  // Track zoom for zoom-gated unregulated rivers
  const [zoom, setZoom] = useState(7)
  useMapEvents({ zoomend: (e) => setZoom((e.target as L.Map).getZoom()) })
  // Track hovered marine area for fill opacity highlight
  const [hoveredMarineId, setHoveredMarineId] = useState<string | null>(null)

  // Pre-compute Puget Sound open status for marine area coloring
  const pugSalmonOpen = REGULATIONS
    .filter(r => r.waterBodyId === 'puget' && (r.speciesId === 'chinook' || r.speciesId === 'coho'))
    .some(r => isOpenOn(r, today))

  return (
    <>
      {/* ── Skagit River — 8 individually-colored regulation sections ── */}
      {SKAGIT_SEGS.map(seg => {
        const { status, line1, line2 } = skagitStatus(seg.skagitId, today)
        // Fish-selector overlay: if a fish is selected, override color & opacity
        const fishSeg = fishSegments?.find(fs => fs.id === seg.skagitId)
        const hasFishFilter = fishSegments !== undefined
        // Color logic:
        //   No fish selected        → blue (default)
        //   Fish selected + data + open    → green
        //   Fish selected + data + closed  → red
        //   Fish selected + no data → grey
        const color = hasFishFilter
          ? fishSeg
            ? fishSeg.status === 'open' ? C_OPEN : C_HARD
            : C_GREY
          : C_BLUE
        const opacity = hasFishFilter && !fishSeg ? 0.25 : 0.9
        return (
          <Polyline
            key={seg.id}
            positions={seg.coords}
            pathOptions={{ color, weight: seg.weight ?? 5, opacity, lineCap: 'round', lineJoin: 'round' }}
            eventHandlers={{
              click: () => {
                // Fish selected + matching segment → call onSegmentClick for detail popup
                if (fishSeg && onSegmentClick) {
                  onSegmentClick(fishSeg)
                } else {
                  onSelectSection({
                    segId: seg.skagitId,
                    label: seg.label,
                    status: status === 'open' ? 'open' : 'closed',
                    popup1: line1,
                    popup2: line2,
                  })
                }
              },
            }}
          >
            <Popup>
              <div style={{ background: '#111118', color: '#fff', borderRadius: 8, padding: '8px 12px', minWidth: 170 }}>
                <p style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{seg.label}</p>
                <p style={{ fontSize: 11, marginBottom: line2 ? 2 : 0,
                  color: color === C_OPEN ? C_OPEN : color === C_HARD ? C_HARD : '#6b7280' }}>
                  {fishSeg ? (fishSeg.status === 'open' ? 'Open for selected fish' : fishSeg.status === 'emergency' ? 'Emergency closure' : 'No season for selected fish') : line1}
                </p>
                {!fishSeg && line2 && <p style={{ fontSize: 10, color: '#9ca3af' }}>{line2}</p>}
                <p style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>Tap line to open section detail</p>
              </div>
            </Popup>
          </Polyline>
        )
      })}

      {/* ── All WA rivers from OSM (via WA_WATERWAYS) ── */}
      {(Object.entries(WA_WATERWAYS) as [string, WaterwayEntry][])
        .filter(([name, entry]) =>
          getEffectiveType(name, entry) === 'river' && !SKIP_FROM_WATERWAYS.has(name)
        )
        .flatMap(([name, entry]) => {
          const fishingId = OSM_TO_FISHING_ID[name]
          let color: string
          let popupStatus: string
          let opacity: number

          const hasFishFilter = fishSegments !== undefined

          if (hasFishFilter) {
            // Fish is selected — colour by open/closed/no-data for that specific fish
            if (fishingId) {
              const fishSeg = fishSegments!.find(fs => fs.waterId === fishingId)
              if (fishSeg) {
                color = fishSeg.status === 'open' ? C_OPEN : C_HARD
                popupStatus = fishSeg.status === 'open' ? 'Open for selected fish' : 'Closed for selected fish'
                opacity = 0.85
              } else {
                color = C_GREY
                popupStatus = 'No data for selected fish'
                opacity = 0.35
              }
            } else {
              // Unregulated — only render at zoom > 8
              if (zoom <= 8) return []
              color = C_GREY
              popupStatus = 'No regulation data'
              opacity = 0.35
            }
          } else {
            // No fish selected — default blue (or slate for unregulated)
            if (fishingId) {
              color = C_BLUE
              popupStatus = 'Select a fish to see season status'
              opacity = 0.85
            } else {
              if (zoom <= 8) return []
              color = C_SLATE
              popupStatus = 'No regulation data'
              opacity = 0.65
            }
          }

          return entry.polylines.map((coords, i) => (
            <Polyline
              key={`river-${name}-${i}`}
              positions={coords}
              pathOptions={{
                color,
                weight: fishingId ? 3 : 2,
                opacity,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            >
              <Popup>
                <div style={{ background: '#111118', color: '#fff', borderRadius: 8, padding: '8px 12px', minWidth: 160 }}>
                  <p style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{name}</p>
                  <p style={{ fontSize: 11,
                    color: color === C_OPEN ? C_OPEN : color === C_HARD ? C_HARD : color === C_BLUE ? C_BLUE : color === C_SLATE ? C_SLATE : '#6b7280' }}>
                    {popupStatus}
                  </p>
                </div>
              </Popup>
            </Polyline>
          ))
        })
      }

      {/* ── Lakes & reservoirs from OSM — filled polygons ── */}
      {(Object.entries(WA_WATERWAYS) as [string, WaterwayEntry][])
        .filter(([name, entry]) => getEffectiveType(name, entry) === 'lake')
        .flatMap(([name, entry]) => {
          const fishingId = OSM_TO_FISHING_ID[name]
          const hasFishFilter = fishSegments !== undefined

          let strokeColor: string
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let popupContent: any

          if (hasFishFilter) {
            // Fish is selected — colour stroke by open/closed/no-data
            if (fishingId) {
              const fishSeg = fishSegments!.find(fs => fs.waterId === fishingId)
              if (fishSeg) {
                strokeColor = fishSeg.status === 'open' ? C_OPEN : C_HARD
                popupContent = (
                  <p style={{ fontSize: 11, color: strokeColor }}>
                    {fishSeg.status === 'open' ? 'Open for selected fish' : 'Closed for selected fish'}
                  </p>
                )
              } else {
                strokeColor = C_GREY2
                popupContent = <p style={{ fontSize: 11, color: '#6b7280' }}>No data for selected fish</p>
              }
            } else {
              strokeColor = C_GREY2
              popupContent = <p style={{ fontSize: 11, color: '#6b7280' }}>Lake / water body</p>
            }
          } else {
            // No fish selected — default blue stroke
            strokeColor = C_LAKE_STROKE
            popupContent = <p style={{ fontSize: 11, color: '#6b7280' }}>Select a fish to see season status</p>
          }

          // Use only the first (outer) ring
          return entry.polylines.slice(0, 1).map((coords, i) => (
            <Polygon
              key={`lake-${name}-${i}`}
              positions={coords}
              pathOptions={{
                fillColor: C_LAKE_FILL,
                fillOpacity: 0.5,
                color: strokeColor,
                weight: 1,
              }}
            >
              <Popup>
                <div style={{ background: '#111118', color: '#fff', borderRadius: 8, padding: '8px 12px', minWidth: 160 }}>
                  <p style={{ fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{name}</p>
                  {popupContent}
                </div>
              </Popup>
            </Polygon>
          ))
        })
      }

      {/* ── Puget Sound Marine Areas 8-1, 8-2, 9, 10, 11 ── */}
      {MARINE_AREAS.map((area) => {
        // Areas 8-1 and 10 align with puget Chinook (Jul 1–Oct 15)
        const areaOpen = pugSalmonOpen && (area.id === 'area-8-1' || area.id === 'area-10')
        const fillColor = areaOpen ? C_MARINE_OPEN : C_MARINE_GREY
        const isHovered = hoveredMarineId === area.id
        return (
          <Polygon
            key={area.id}
            positions={area.coords}
            pathOptions={{
              fillColor,
              fillOpacity: isHovered ? 0.30 : 0.12,
              color: fillColor,
              weight: 2,
              dashArray: '6 4',
              opacity: isHovered ? 0.9 : 0.65,
            }}
            eventHandlers={{
              mouseover: () => setHoveredMarineId(area.id),
              mouseout: () => setHoveredMarineId(null),
            }}
          >
            <Popup>
              <div style={{ background: '#111118', color: '#fff', borderRadius: 8, padding: '8px 12px', minWidth: 190 }}>
                <p style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{area.name}</p>
                <p style={{ fontSize: 10, color: '#9ca3af', marginBottom: 5 }}>{area.description}</p>
                <p style={{ fontSize: 11, color: areaOpen ? C_OPEN : '#6b7280' }}>{area.salmonNote}</p>
              </div>
            </Popup>
          </Polygon>
        )
      })}

      {/* ── Lakes / sounds / bays from WATER_BODIES — CircleMarker (fallback for bodies without OSM polygon) ── */}
      {WATER_BODIES
        .filter(wb =>
          wb.type !== 'river' && wb.type !== 'stream' && wb.type !== 'lake'
        )
        .map(wb => {
          const hasFishFilter = fishSegments !== undefined
          let fillColor: string
          let strokeColor: string
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let popupContent: any

          if (hasFishFilter) {
            // Fish is selected — colour by open/closed/no-data for that specific fish
            const fishSeg = fishSegments!.find(fs => fs.waterId === wb.id)
            if (fishSeg) {
              fillColor = fishSeg.status === 'open' ? C_OPEN : C_HARD
              strokeColor = fillColor
              popupContent = (
                <p style={{ fontSize: 11, color: fillColor }}>
                  {fishSeg.status === 'open' ? 'Open for selected fish' : 'Closed for selected fish'}
                </p>
              )
            } else {
              fillColor = C_GREY
              strokeColor = C_GREY2
              popupContent = <p style={{ fontSize: 11, color: '#6b7280' }}>No data for selected fish</p>
            }
          } else {
            // No fish selected — default blue
            fillColor = C_BLUE
            strokeColor = C_BLUE2
            popupContent = <p style={{ fontSize: 11, color: '#6b7280' }}>Select a fish to see season status</p>
          }

          return (
            <CircleMarker
              key={wb.id}
              center={[wb.lat, wb.lng]}
              radius={7}
              pathOptions={{
                fillColor,
                fillOpacity: hasFishFilter && fillColor === C_GREY ? 0.45 : 0.85,
                color: strokeColor,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ background: '#111118', color: '#fff', borderRadius: 8, padding: '8px 12px', minWidth: 160 }}>
                  <p style={{ fontWeight: 700, marginBottom: 3, fontSize: 12 }}>{wb.name}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{wb.region} · {wb.type}</p>
                  {popupContent}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
    </>
  )
}

export default function WAMap({ selectedFish, fishSegments, onSegmentClick, zoomToSkagit = 0 }: WAMapProps = {}) {
  const today = new Date()
  const [mapSection, setMapSection] = useState<MapSectionPayload | null>(null)

  return (
    <>
    <MapContainer
      center={[47.5, -120.5]}
      zoom={7}
      zoomControl={false}
      style={{ height: '100%', width: '100%', background: '#08080f' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <MapController zoomToSkagit={zoomToSkagit} />
      <WAMapContents today={today} onSelectSection={setMapSection} fishSegments={fishSegments} onSegmentClick={onSegmentClick} />
    </MapContainer>

    {/* ── River section map modal (opened by clicking a Skagit polyline) ── */}
    {mapSection && (() => {
      const coordData = SKAGIT_SECTION_COORDS[mapSection.segId]
      if (!coordData) return null
      const preciseCoords = SKAGIT_PRECISE[mapSection.segId] ?? coordData.coords
      return (
        <RiverSectionMap
          sectionName={mapSection.label}
          startLabel={coordData.startLabel}
          endLabel={coordData.endLabel}
          coordinates={preciseCoords}
          status={mapSection.status}
          detail={mapSection.popup2 ?? mapSection.popup1}
          onClose={() => setMapSection(null)}
        />
      )
    })()}
    </>
  )
}
