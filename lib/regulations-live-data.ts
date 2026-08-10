/**
 * CastWA — regulations_live source data (web repo copy)
 *
 * This file holds the same RegEntry data as castwa-native/lib/regulations-data.ts
 * in a web-compatible format. It is used by the sync script to push current
 * emergency regulation data to Supabase so native and web apps can fetch
 * live data without a build.
 *
 * MAINTAINER: Keep this in sync with castwa-native/lib/regulations-data.ts.
 * When WDFW posts new emergency rules, update BOTH files and run:
 *   npm run sync-alerts
 */

export type RegSeverity = 'info' | 'warning' | 'emergency' | 'closure'

export interface RegEntry {
  id: string
  title: string
  body: string
  severity: RegSeverity
  waters: string[]
  species: string[]
  effectiveDate: string   // YYYY-MM-DD
  expiresDate?: string    // YYYY-MM-DD
  source: string
  isEmergency: boolean
  ruleRef?: string
}

export const REGULATIONS: RegEntry[] = [

  // ── Active Closures ───────────────────────────────────────────────────────

  {
    id: 'reg-skykomish-closed-2026',
    title: 'Skykomish River Closed to All Fishing Until Nov. 1',
    body:
      'Official WDFW emergency rule published Jun. 2, 2026: Skykomish River is closed to ALL FISHING immediately through Oct. 31, 2026. ' +
      'Location: from the mouth to the confluence of the North and South forks. Species affected: all species. ' +
      'Reason: season openings are delayed until Nov. 1 to protect returning wild Chinook salmon after a very low pre-season forecast. ' +
      'The rule overrides salmon, steelhead, and game fish seasons listed in the 2025-2026 pamphlet, including previously planned Wallace River Hatchery Chinook and Reiter Ponds steelhead fisheries.',
    severity: 'closure',
    waters: ['Skykomish River'],
    species: ['All species', 'Chinook Salmon', 'Coho Salmon', 'Steelhead'],
    effectiveDate: '2026-06-02',
    expiresDate: '2026-10-31',
    source: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/skykomish-river-fishing-will-not-open-until-nov-1-2026-06',
    isEmergency: true,
    ruleRef: 'WDFW emergency rule published Jun. 2, 2026',
  },

  {
    id: 'reg-snake-river-fall-chinook-2026',
    title: 'Snake River Fall Chinook Opens Aug 18',
    body:
      'WDFW ER 26-139-136878: Snake River Fall Chinook season opens in selected sections beginning Aug. 18, 2026. ' +
      'Power lines ~3 miles below Clarkston to WA/ID state line (CRC 648): Aug 18–Oct 15, daily, limit 3 adult Chinook, no more than 1 wild adult. ' +
      'WA/ID state line to OR state line (CRC 650): Aug 18–Oct 31, daily, limit 3 adult Chinook, no more than 1 wild adult. ' +
      'Lyons Ferry Bubble (Marker 28 to Hwy 261 bridge): Sept 3–Oct 25, Thu–Sun only, limit 2 adult Chinook, no more than 1 wild adult. ' +
      'All sections: no daily limit on jack Chinook under 24", minimum size 12", barbless hooks required, Columbia River Salmon & Steelhead Endorsement required (anglers 15+), two-pole fishing not allowed.',
    severity: 'info',
    waters: ['Snake River'],
    species: ['Chinook Salmon'],
    effectiveDate: '2026-08-18',
    expiresDate: '2026-10-31',
    source: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/fall-chinook-harvest-open-snake-river-2026-08',
    isEmergency: false,
    ruleRef: 'ER 26-139-136878',
  },

  {
    id: 'reg-columbia-upper-salmon-closed-2026',
    title: 'Upper Columbia (Priest Rapids to Chief Joseph) — All Salmon CLOSED',
    body:
      'WDFW ER 26-113-136726: All salmon fishing is CLOSED in the Columbia River from Priest Rapids Dam to Chief Joseph Dam ' +
      'from July 1 through August 31, 2026. ' +
      'Reason: pre-season forecast of 275,000 sockeye downgraded dramatically; actual returns tracked far below forecast. ' +
      'Lower/mid-Columbia (Astoria to Priest Rapids) sockeye closure (Jul 6–31) has expired — pamphlet rules apply as of Aug 1 for those sections. ' +
      'Always verify current status at wdfw.wa.gov before fishing any Columbia River section.',
    severity: 'closure',
    waters: ['Columbia River (Priest Rapids Dam to Chief Joseph Dam)'],
    species: ['All Salmon', 'Chinook Salmon', 'Sockeye Salmon', 'Coho Salmon'],
    effectiveDate: '2026-07-01',
    expiresDate: '2026-08-31',
    source: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/columbia-river-sockeye-salmon-2026-06',
    isEmergency: true,
    ruleRef: 'ER 26-113-136726',
  },

  {
    id: 'reg-entiat-chinook-open-2026',
    title: 'Entiat River Open for Summer Chinook (Until Further Notice)',
    body:
      'WDFW ER 26-125-136777: Entiat River (Railroad Bridge at mouth to Mad River Road Bridge near Ardenvoir) is open for summer Chinook until further notice. ' +
      'Daily limit: 6 Chinook, minimum size 12". Release all salmon other than Chinook. Night closure in effect. ' +
      'This fishery opened July 9 as an alternative to the mainstem Columbia after a lower-than-forecast Columbia summer Chinook return. ' +
      '⚠️ May close on short notice — always verify at wdfw.wa.gov before fishing.',
    severity: 'info',
    waters: ['Entiat River'],
    species: ['Chinook Salmon'],
    effectiveDate: '2026-07-09',
    source: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/entiat-river-open-summer-chinook-fishing-2026-07',
    isEmergency: false,
    ruleRef: 'ER 26-125-136777',
  },

  {
    id: 'reg-ma6-chinook-limit-aug7-2026',
    title: 'MA 6 East Juan de Fuca — Chinook Daily Limit Reduced Aug 7–15',
    body:
      'WDFW ER 26-141-136875: Marine Area 6 East Juan de Fuca Strait Chinook Selective Fishery Area — daily limit reduced to max 1 hatchery Chinook (Aug 7–15, 2026). ' +
      'Daily limit: 2 total salmon, no more than 1 Chinook; Chinook minimum size 22". ' +
      'Release chum, sockeye, wild coho, and wild Chinook. Freshwater Bay remains closed to salmon.',
    severity: 'warning',
    waters: ['Marine Area 6', 'East Juan de Fuca Strait'],
    species: ['Chinook Salmon', 'Coho Salmon'],
    effectiveDate: '2026-08-07',
    expiresDate: '2026-08-15',
    source: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-6-east-juan-de-fuca-strait-chinook-daily-limit-reduced-2026-08',
    isEmergency: true,
    ruleRef: 'ER 26-141-136875',
  },

  {
    id: 'reg-quillayute-wild-jack-release-2026',
    title: 'Quillayute River & Sol Duc — Wild Jack Coho Must Be Released',
    body:
      'WDFW ER 26-62-136494: Wild (unclipped) jack coho must be released immediately in the Quillayute River system and Sol Duc River, effective May 1, 2026 until further notice. ' +
      'Hatchery-marked (adipose-clipped) jacks may be retained where salmon retention is otherwise allowed. ' +
      'Always verify status before fishing — this rule may be modified as run returns are assessed.',
    severity: 'warning',
    waters: ['Quillayute River', 'Sol Duc River'],
    species: ['Coho Salmon'],
    effectiveDate: '2026-05-01',
    source: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules',
    isEmergency: true,
    ruleRef: 'ER 26-62-136494',
  },
]
