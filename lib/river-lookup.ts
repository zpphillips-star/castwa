/**
 * lib/river-lookup.ts
 *
 * SINGLE SOURCE OF TRUTH for the "is this a river?" question.
 *
 * Every tappable surface in the app — Today gauges, Conditions list,
 * Fish > open waters, Map polylines — calls findRiverEntry() and opens
 * RiverDetailSheet for any river-type water body.  Lakes, sounds, and
 * bays get WaterDetailSheet instead.
 *
 * Rule: never duplicate this list in components or pages.
 */

export type RiverEntry = {
  id: string
  name: string
  region: string
  /** USGS site ID for live flow data.  Empty string = no gauge (flow panel hidden). */
  usgsId: string
  targetSpecies: string[]
  idealCfs: { min: number; max: number }
}

// ─── Gauged rivers — live USGS flow data ──────────────────────────────────────
export const GAUGED_RIVERS: RiverEntry[] = [
  { id: 'skagit',        name: 'Skagit River',        region: 'Northwest',   usgsId: '12200500', targetSpecies: ['Chinook Salmon','Coho Salmon','Steelhead'],              idealCfs: { min: 3000,  max: 18000  } },
  { id: 'snohomish',     name: 'Snohomish River',      region: 'Northwest',   usgsId: '12150800', targetSpecies: ['Coho Salmon','Chinook Salmon','Steelhead'],              idealCfs: { min: 2000,  max: 12000  } },
  { id: 'nooksack',      name: 'Nooksack River',       region: 'Northwest',   usgsId: '12210500', targetSpecies: ['Chinook Salmon','Coho Salmon','Steelhead'],              idealCfs: { min: 1500,  max: 8000   } },
  { id: 'stillaguamish', name: 'Stillaguamish River',  region: 'Northwest',   usgsId: '12167000', targetSpecies: ['Coho Salmon','Chinook Salmon','Steelhead'],              idealCfs: { min: 800,   max: 5000   } },
  { id: 'sauk',          name: 'Sauk River',           region: 'Northwest',   usgsId: '12186000', targetSpecies: ['Chinook Salmon','Steelhead'],                           idealCfs: { min: 500,   max: 3000   } },
  { id: 'skykomish',     name: 'Skykomish River',      region: 'Northwest',   usgsId: '12134500', targetSpecies: ['Coho Salmon','Chinook Salmon','Steelhead'],              idealCfs: { min: 1000,  max: 8000   } },
  { id: 'snoqualmie',    name: 'Snoqualmie River',     region: 'Northwest',   usgsId: '12149000', targetSpecies: ['Coho Salmon','Steelhead','Chinook Salmon'],              idealCfs: { min: 400,   max: 4000   } },
  { id: 'columbia',      name: 'Columbia River',       region: 'Southeast',   usgsId: '14105700', targetSpecies: ['Chinook Salmon','Steelhead','Walleye','White Sturgeon'], idealCfs: { min: 80000, max: 250000 } },
  { id: 'snake',         name: 'Snake River',          region: 'Southeast',   usgsId: '13334300', targetSpecies: ['Steelhead','Chinook Salmon','Walleye'],                  idealCfs: { min: 10000, max: 80000  } },
  { id: 'yakima',        name: 'Yakima River',         region: 'Central',     usgsId: '12492800', targetSpecies: ['Rainbow Trout','Steelhead','Cutthroat Trout'],           idealCfs: { min: 800,   max: 5000   } },
  { id: 'wenatchee',     name: 'Wenatchee River',      region: 'Central',     usgsId: '12462500', targetSpecies: ['Chinook Salmon','Sockeye Salmon','Steelhead'],           idealCfs: { min: 500,   max: 4000   } },
  { id: 'methow',        name: 'Methow River',         region: 'Eastern',     usgsId: '12449950', targetSpecies: ['Chinook Salmon','Sockeye Salmon','Steelhead'],           idealCfs: { min: 200,   max: 2500   } },
  { id: 'entiat',        name: 'Entiat River',         region: 'Central',     usgsId: '12452990', targetSpecies: ['Chinook Salmon','Steelhead'],                           idealCfs: { min: 100,   max: 800    } },
  { id: 'okanogan',      name: 'Okanogan River',       region: 'Eastern',     usgsId: '12439500', targetSpecies: ['Sockeye Salmon','Chinook Salmon','Steelhead'],           idealCfs: { min: 500,   max: 4000   } },
  { id: 'cowlitz',       name: 'Cowlitz River',        region: 'Southwest',   usgsId: '14243000', targetSpecies: ['Chinook Salmon','Coho Salmon','Steelhead'],              idealCfs: { min: 2000,  max: 15000  } },
  { id: 'lewis',         name: 'Lewis River',          region: 'Southwest',   usgsId: '14222500', targetSpecies: ['Chinook Salmon','Coho Salmon','Steelhead'],              idealCfs: { min: 800,   max: 8000   } },
  { id: 'chehalis',      name: 'Chehalis River',       region: 'Southwest',   usgsId: '12025700', targetSpecies: ['Chinook Salmon','Coho Salmon','Steelhead'],              idealCfs: { min: 400,   max: 5000   } },
  { id: 'humptulips',    name: 'Humptulips River',     region: 'Coast',       usgsId: '12039500', targetSpecies: ['Coho Salmon','Steelhead','Chinook Salmon'],              idealCfs: { min: 200,   max: 2500   } },
  { id: 'green',         name: 'Green River',          region: 'Puget Sound', usgsId: '12113000', targetSpecies: ['Coho Salmon','Chinook Salmon','Steelhead'],              idealCfs: { min: 500,   max: 4000   } },
  { id: 'puyallup',      name: 'Puyallup River',       region: 'Puget Sound', usgsId: '12101500', targetSpecies: ['Coho Salmon','Chinook Salmon','Steelhead'],              idealCfs: { min: 1000,  max: 8000   } },
  { id: 'nisqually',     name: 'Nisqually River',      region: 'Puget Sound', usgsId: '12089500', targetSpecies: ['Chinook Salmon','Coho Salmon','Steelhead'],              idealCfs: { min: 500,   max: 4000   } },
  { id: 'hoh',           name: 'Hoh River',            region: 'Olympic',     usgsId: '12041200', targetSpecies: ['Chinook Salmon','Steelhead','Cutthroat Trout'],          idealCfs: { min: 1000,  max: 8000   } },
  { id: 'sol-duc',       name: 'Sol Duc River',        region: 'Olympic',     usgsId: '12045500', targetSpecies: ['Steelhead','Chinook Salmon','Coho Salmon'],              idealCfs: { min: 300,   max: 3500   } },
  { id: 'bogachiel',     name: 'Bogachiel River',      region: 'Olympic',     usgsId: '12048000', targetSpecies: ['Steelhead','Coho Salmon'],                              idealCfs: { min: 200,   max: 2500   } },
  { id: 'dungeness',     name: 'Dungeness River',      region: 'Olympic',     usgsId: '12056500', targetSpecies: ['Pink Salmon','Chum Salmon','Coho Salmon'],               idealCfs: { min: 100,   max: 1200   } },
  { id: 'elwha',         name: 'Elwha River',          region: 'Olympic',     usgsId: '12058500', targetSpecies: ['Chinook Salmon','Steelhead','Coho Salmon'],              idealCfs: { min: 300,   max: 2500   } },
  { id: 'skokomish',     name: 'Skokomish River',      region: 'Olympic',     usgsId: '12076500', targetSpecies: ['Chum Salmon','Coho Salmon','Chinook Salmon'],            idealCfs: { min: 200,   max: 2500   } },
]

/**
 * Fast id → RiverEntry lookup used by MapWithFishSelector and WAMap
 * when converting an OSM fishing-data id into a RiverDetailSheet river.
 * Covers all gauged rivers.
 */
export const RIVER_MAP: Record<string, RiverEntry> = Object.fromEntries(
  GAUGED_RIVERS.map(r => [r.id, r])
)

/**
 * Given any water body, return the RiverEntry to open RiverDetailSheet with.
 *
 * Matching priority:
 *   1. Exact id match in GAUGED_RIVERS  → full entry with live gauge
 *   2. Exact name match in GAUGED_RIVERS
 *   3. Water name contains the river's id slug (e.g. 'nooksack')
 *   4. Water body type is 'river' or 'stream' but not in gauged list
 *      → minimal entry (usgsId = ''); RiverDetailSheet skips the flow panel
 *
 * Returns null for lakes, sounds, bays → caller opens WaterDetailSheet.
 */
export function findRiverEntry(water: {
  id: string
  name: string
  type?: string
}): RiverEntry | null {
  const { id, name, type } = water
  const lower = name.toLowerCase()

  // Non-river types → WaterDetailSheet
  if (type && type !== 'river' && type !== 'stream') return null

  // 1. Exact id match
  const byId = GAUGED_RIVERS.find(r => r.id === id)
  if (byId) return byId

  // 2. Exact name match
  const byName = GAUGED_RIVERS.find(r => r.name.toLowerCase() === lower)
  if (byName) return byName

  // 3. Fuzzy: water name contains the river id slug
  const fuzzy = GAUGED_RIVERS.find(r => lower.includes(r.id))
  if (fuzzy) return fuzzy

  // 4. River/stream type not in gauged list → minimal entry, no gauge
  if (type === 'river' || type === 'stream') {
    return {
      id,
      name,
      region: 'Washington',
      usgsId: '',   // RiverDetailSheet handles '' gracefully (flow panel hidden)
      targetSpecies: [],
      idealCfs: { min: 0, max: 9_999_999 },
    }
  }

  return null
}
