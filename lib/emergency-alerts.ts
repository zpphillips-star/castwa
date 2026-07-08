/**
 * CastWA Emergency Alerts
 *
 * Manually maintained static list of active WDFW emergency rule changes.
 * ⚠️  MAINTAINER NOTE: Update this file whenever WDFW posts new emergency rules at:
 *     https://wdfw.wa.gov/fishing/regulations/emergency
 *
 * Each alert is active between activeFrom and activeTo (ISO date strings, or null = open-ended).
 * Set dismissed: false for new alerts.
 */

export type AlertType = 'OPEN' | 'CLOSED' | 'MODIFIED'

export interface EmergencyAlert {
  id: string
  type: AlertType
  species: string
  waterBody: string
  description: string       // short summary shown in banner
  activeFrom: string        // 'YYYY-MM-DD'
  activeTo: string | null   // 'YYYY-MM-DD' or null if ongoing
  wdfw_url: string
}

export const EMERGENCY_ALERTS: EmergencyAlert[] = [
  // ── SKAGIT RIVER SOCKEYE ─────────────────────────────────────────────────
  // Source: WDFW ER 26-126-136780 (pub. Jul 7 2026). Supersedes ER 26-123-136776.
  // Effective Jul 7–31 2026. Hwy 536 to Baker River. Limit 4 sockeye.
  // Tribal closures: Gilligan Creek→Baker River CLOSED Jul 7–12:29pm Jul 9 and Jul 13–15 (all species).
  {
    id: 'ea-skagit-sockeye-2026',
    type: 'OPEN',
    species: 'Sockeye Salmon',
    waterBody: 'Skagit River (Hwy 536 Bridge to Baker River)',
    description: 'Sockeye salmon open Skagit River through Jul 31. Daily limit 4 sockeye, min 12". Night closure in effect. Release all salmon other than sockeye. ⚠️ Tribal conflict closures: Gilligan Creek → Baker River CLOSED to ALL fishing Jul 7–12:29pm Jul 9 and Jul 13–15. Additional periodic closures may occur — verify WDFW before fishing.',
    activeFrom: '2026-07-01',
    activeTo: '2026-07-31',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/lower-skagit-river-fishing-updates-2026-07',
  },
  // ── SKAGIT RIVER TRIBAL CLOSURE — JULY 7 THROUGH 12:29 PM JULY 9 ─────────
  // Source: WDFW ER 26-126-136780 (pub. Jul 7 2026). Extended from Jul 8 to Jul 9 due to
  // treaty fishery extension. Gear conflict with tribal fishery.
  {
    id: 'ea-skagit-tribal-closure-jul7-2026',
    type: 'CLOSED',
    species: 'All species',
    waterBody: 'Skagit River (Gilligan Creek to Baker River)',
    description: '🚨 CLOSED TO ALL FISHING July 7 through 12:29 p.m. July 9 — tribal fishery conflict avoidance (extended). Affects Gilligan Creek to Dalles Bridge AND Dalles Bridge to Baker River. Hwy 536 to Gilligan Creek remains open (4 sockeye). Baker River boat launch also closed.',
    activeFrom: '2026-07-07',
    activeTo: '2026-07-09',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/lower-skagit-river-fishing-updates-2026-07',
  },
  // ── SKAGIT RIVER TRIBAL CLOSURE — JULY 13–15 ────────────────────────────
  // Source: WDFW ER 26-123-136776 (pub. Jul 6 2026). Gear conflict with tribal fishery.
  {
    id: 'ea-skagit-tribal-closure-jul13-2026',
    type: 'CLOSED',
    species: 'All species',
    waterBody: 'Skagit River (Gilligan Creek to Baker River)',
    description: '⚠️ CLOSED TO ALL FISHING July 13–15 — tribal fishery conflict avoidance. Affects Gilligan Creek to Dalles Bridge AND Dalles Bridge to Baker River. Hwy 536 to Gilligan Creek remains open (4 sockeye). Baker River boat launch also closed.',
    activeFrom: '2026-07-13',
    activeTo: '2026-07-15',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/lower-skagit-river-fishing-updates-2026-07',
  },
  // ── TULALIP TERMINAL AREA SALMON CLOSED (MA 8-2) ─────────────────────────
  // Source: WDFW ER 26-124-136779 (pub. Jul 7 2026). Chinook quota of 600 reached.
  // Effective immediately through Sept. 7, 2026.
  {
    id: 'ea-tulalip-terminal-salmon-closed-2026',
    type: 'CLOSED',
    species: 'Salmon',
    waterBody: 'Marine Area 8-2, Tulalip Terminal Area',
    description: '🚨 Salmon fishing CLOSED in Tulalip Terminal Area (MA 8-2) through Sept 7, 2026. Area quota of 600 Chinook has been reached. Affected waters: west of Tulalip Bay within 2,000 ft of shore from pilings at Old Bower\'s Resort to boundary marker ~1.4 miles NW of Hermosa Point (excluding waters east of Mission Point–Hermosa Point line).',
    activeFrom: '2026-07-07',
    activeTo: '2026-09-07',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/tulalip-terminal-area-salmon-fishing-closed-2026-07',
  },
  // ── ENTIAT RIVER SUMMER CHINOOK OPEN ─────────────────────────────────────
  // Source: WDFW ER 26-125-136777 (pub. Jul 7 2026). Columbia River summer Chinook run
  // downgraded to 38,600; mainstem unfeasible, Entiat opened as alternative.
  // Effective July 9, 2026 until further notice. May close on short notice.
  {
    id: 'ea-entiat-chinook-open-2026',
    type: 'OPEN',
    species: 'Chinook Salmon',
    waterBody: 'Entiat River (mouth to Mad River Road Bridge)',
    description: 'Entiat River open for summer Chinook starting July 9 until further notice. Daily limit 6 Chinook, min 12". Release all salmon other than Chinook. Night closure in effect. ⚠️ May close on short notice — verify before fishing. Location: Railroad Bridge at mouth to Mad River Road Bridge near Ardenvoir (Chelan County).',
    activeFrom: '2026-07-09',
    activeTo: null,
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/entiat-river-open-summer-chinook-fishing-2026-07',
  },
  // ── COLUMBIA RIVER SOCKEYE CLOSURE ──────────────────────────────────────
  // Source: WDFW ER 26-113-136726 (pub. Jun 18 2026). Low returns trigger closures.
  // Most Columbia River sections closed to sockeye Jul 6–31. Possible limited reopening if returns improve.
  {
    id: 'ea-columbia-sockeye-closed-2026',
    type: 'CLOSED',
    species: 'Sockeye Salmon',
    waterBody: 'Columbia River (most sections)',
    description: 'Columbia River sockeye severely restricted — below-forecast returns. Most sections closed to sockeye retention July 6–31. Lower Columbia (Astoria–Bonneville) reverts to hatchery jack Chinook only. Richland/Pasco area closed June 20–July 31. Possible selective reopening of some upper sections if returns improve — verify WDFW before fishing.',
    activeFrom: '2026-06-18',
    activeTo: '2026-07-31',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/columbia-river-salmon-and-steelhead-fishery-update-2026-06',
  },
  // ── PUGET SOUND SHRIMP UPDATE ────────────────────────────────────────────
  // Source: WDFW ER 26-119-136754 (pub. Jun 29 2026).
  // MA 7 West July 18–20 CANCELLED (quota met). MA 6 outside Discovery Bay added July 19–20.
  {
    id: 'ea-ps-shrimp-ma7w-cancelled-2026',
    type: 'MODIFIED',
    species: 'Shrimp (all species)',
    waterBody: 'Puget Sound Marine Areas 6 & 7 West',
    description: 'Marine Area 7 West shrimp July 18–20 CANCELLED — spot shrimp quota met. MA 6 (outside Discovery Bay) added July 19–20 for all shrimp. MA 4E/5, 7E, 8-1/8-2, 9, 11, 13: open June 29–Oct 15 non-spot shrimp. MA 12: open July 7 only (9am–1pm). MA 7 South and Discovery Bay: closed.',
    activeFrom: '2026-06-29',
    activeTo: '2026-07-20',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/puget-sound-shrimp-fishery-update-2026-06-0',
  },
  // ── PUGET SOUND SUMMER CRAB ──────────────────────────────────────────────
  // Source: WDFW ER (pub. Jun 2026). Summer Dungeness season open Thu–Mon most areas.
  // MA 12 south of Ayock Pt and MA 13 remain CLOSED until further notice.
  {
    id: 'ea-ps-crab-summer-2026',
    type: 'OPEN',
    species: 'Dungeness Crab',
    waterBody: 'Puget Sound (most areas)',
    description: 'Summer Dungeness crab open Thu–Mon in most Puget Sound areas. MA 4E/5/6 & 8-1/8-2/9 & 12N: Jul 2–Sep 7. MA 10: Sun–Mon Jul 5–Sep 7. MA 11: Sun–Mon Jul 5–Aug 17. MA 7S: Jul 16–Sep 28. MA 7N TBD (~mid-Aug). MA 12S and MA 13 CLOSED. Daily limit 5 Dungeness. Summer CRC required.',
    activeFrom: '2026-07-02',
    activeTo: '2026-09-28',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/puget-sound-summer-crab-schedule-2026-06',
  },
]

/**
 * Returns alerts that are active on the given date.
 */
export function getActiveAlerts(date: Date): EmergencyAlert[] {
  const d = date.toISOString().slice(0, 10)
  return EMERGENCY_ALERTS.filter(a => {
    if (a.activeFrom > d) return false
    if (a.activeTo && a.activeTo < d) return false
    return true
  })
}
