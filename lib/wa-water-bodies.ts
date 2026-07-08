/**
 * wa-water-bodies.ts
 *
 * Combines OSM geometry (from river-coords-generated.ts) with
 * regulation data (from fishing-data.ts) to produce a unified
 * list of WA water bodies for map rendering.
 */

import { WA_WATERWAYS } from './river-coords-generated'
import { WATER_BODIES, REGULATIONS, isOpenOn } from './fishing-data'

export interface WaterBodyEntry {
  id: string              // slug, e.g. 'skagit-river'
  name: string            // display name
  osmName: string         // key in WA_WATERWAYS
  type: 'river' | 'lake' | 'stream' | 'sound' | 'reservoir'
  hasRegulations: boolean
  fishingDataId?: string  // id in WATER_BODIES / REGULATIONS
  defaultStatus: 'open' | 'closed' | 'mixed' | 'unknown'
  coords: [number, number][][]  // array of polylines
}

/** Map from OSM name → fishing-data waterBodyId */
const OSM_TO_FISHING_ID: Record<string, string> = {
  'Skagit River':          'skagit',
  'Snohomish River':       'snohomish',
  'Columbia River':        'columbia',
  'Snake River':           'snake',
  'Yakima River':          'yakima',
  'Green River':           'green',
  'Cedar River':           'cedar',
  'Lake Sammamish':        'sammamish',
  'Lake Washington':       'washington',
  'Lake Chelan':           'chelan',
  'Lake Roosevelt':        'roosevelt',
  'Banks Lake':            'banks',
  'Hood Canal':            'hood',
  'Willapa Bay':           'willapa',
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function getDefaultStatus(fishingDataId: string | undefined, today: Date): 'open' | 'closed' | 'mixed' | 'unknown' {
  if (!fishingDataId) return 'unknown'
  const regs = REGULATIONS.filter(r => r.waterBodyId === fishingDataId)
  if (regs.length === 0) return 'unknown'
  const openRegs = regs.filter(r => isOpenOn(r, today))
  if (openRegs.length === 0) return 'closed'
  if (openRegs.length === regs.length) return 'open'
  return 'mixed'
}

let _cachedBodies: WaterBodyEntry[] | null = null

export function getWAWaterBodies(today: Date = new Date()): WaterBodyEntry[] {
  if (_cachedBodies) return _cachedBodies

  const bodies: WaterBodyEntry[] = []

  for (const [osmName, entry] of Object.entries(WA_WATERWAYS)) {
    const fishingDataId = OSM_TO_FISHING_ID[osmName]
    const hasRegulations = !!fishingDataId

    // Determine type
    let type: WaterBodyEntry['type'] = entry.type as WaterBodyEntry['type']
    if (osmName.toLowerCase().includes('reservoir') || osmName.toLowerCase().includes('lake')) {
      type = osmName.toLowerCase().includes('reservoir') ? 'reservoir' : 'lake'
    }

    bodies.push({
      id: slugify(osmName),
      name: osmName,
      osmName,
      type,
      hasRegulations,
      fishingDataId,
      defaultStatus: getDefaultStatus(fishingDataId, today),
      coords: entry.polylines,
    })
  }

  // Sort: regulation bodies first, then by name
  bodies.sort((a, b) => {
    if (a.hasRegulations !== b.hasRegulations) return a.hasRegulations ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  _cachedBodies = bodies
  return bodies
}

/** Returns only rivers and streams with regulation data */
export function getRegulatedRivers(today: Date = new Date()): WaterBodyEntry[] {
  return getWAWaterBodies(today).filter(
    b => b.hasRegulations && (b.type === 'river' || b.type === 'stream')
  )
}

/** Returns only lakes/reservoirs */
export function getLakes(today: Date = new Date()): WaterBodyEntry[] {
  return getWAWaterBodies(today).filter(
    b => b.type === 'lake' || b.type === 'reservoir'
  )
}
