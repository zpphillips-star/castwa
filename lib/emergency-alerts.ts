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
    description: 'Sockeye salmon open Skagit River through Jul 31. Daily limit 4 sockeye, min 12". Night closure in effect. Release all salmon other than sockeye. Full reach (Hwy 536 Bridge to Baker River) is open as of Jul 16 — previously scheduled tribal closures (Jul 7–9, Jul 13–15) have passed. ⚠️ Additional unannounced tribal closures may still occur on short notice — always verify WDFW before fishing.',
    activeFrom: '2026-07-01',
    activeTo: '2026-07-31',
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
  // ── SKYKOMISH RIVER — ALL SPECIES CLOSED THROUGH OCT 31 ─────────────────
  // Source: WDFW ER (pub. Jun 2 2026). Closed to protect wild Chinook (very low forecast).
  // All species, mouth to North/South Fork confluence. Overrides all pamphlet seasons incl.
  // Wallace River Hatchery Chinook and Reiter Ponds steelhead. Effective immediately – Oct 31.
  {
    id: 'ea-skykomish-closed-2026',
    type: 'CLOSED',
    species: 'All species',
    waterBody: 'Skykomish River (mouth to North/South Fork confluence)',
    description: '🚨 Skykomish River CLOSED to all fishing through Oct 31, 2026 — protecting wild Chinook salmon (critically low forecast). Overrides all pamphlet seasons including Wallace River Hatchery Chinook and Reiter Ponds steelhead. Snohomish Basin-wide closure — verify tributary status before fishing any Snohomish Basin water.',
    activeFrom: '2026-06-02',
    activeTo: '2026-10-31',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/skykomish-river-fishing-will-not-open-until-nov-1-2026-06',
  },
  // ── BIOTOXIN (PSP) — HOOD CANAL & ADMIRALTY INLET BIVALVES CLOSED ────────
  // Source: DOH news release Jun 12 2026 + WDFW closure announcement.
  // PSP at lethal levels in Hood Canal near Union; high levels in surrounding areas.
  // WDFW closed all public bivalve harvest in MA 9 (south of Foulweather Bluff–Olele Point)
  // and all of MA 12 (Hood Canal, incl. Port Gamble Bay, Quilcene Bay, Dabob Bay, Mats Mats Bay).
  // Closure until further notice. Shrimp and crab NOT affected.
  {
    id: 'ea-biotoxin-psp-ma9-ma12-2026',
    type: 'CLOSED',
    species: 'Clams, Mussels, Oysters, Scallops (all bivalves)',
    waterBody: 'Marine Area 12 (Hood Canal) & MA 9 south (Admiralty Inlet, Foulweather Bluff to Olele Point)',
    description: '🚨 ALL bivalve shellfish harvest CLOSED — PSP (paralytic shellfish poison) at LETHAL levels. Affected: Hood Canal (MA 12) including Port Gamble Bay, Quilcene Bay, Dabob Bay, and Mats Mats Bay; plus Admiralty Inlet (MA 9) south of Foulweather Bluff to Olele Point. Closure is until further notice. Shrimp and crab are NOT affected. PSP cannot be detected by sight, smell, or taste. Check DOH Shellfish Safety Map before any harvest: fortress.wa.gov/doh/biotoxin',
    activeFrom: '2026-06-12',
    activeTo: null,
    wdfw_url: 'https://wdfw.wa.gov/newsroom/news-release/wdfw-closes-hood-canal-admiralty-inlet-shellfish-harvesting-effective-immediately-following-reports',
  },
  // ── PACIFIC HALIBUT — ALL WA PRIMARY SEASONS CLOSED (QUOTA) ─────────────
  // All WA halibut primary seasons closed due to IPHC quota being reached.
  // Puget Sound (MA 5–10): closed Jun 30. North Coast (MA 3–4): closed Jun 28.
  // South Coast (MA 2): closed Jun 30. Columbia River: closed ~Jun 28.
  // Remaining quota exists in all areas; Aug/Sep reopenings are possible when
  // IPHC announces additional days — monitor wdfw.wa.gov for updates.
  {
    id: 'ea-halibut-quota-closed-2026',
    type: 'CLOSED',
    species: 'Pacific Halibut',
    waterBody: 'All WA Marine Areas (MA 2, 3–4, 5–10) & Columbia River',
    description: '🚨 All WA Pacific Halibut primary seasons are CLOSED — area quotas reached. Puget Sound (MA 5–10): closed Jun 30. North Coast (MA 3–4): closed Jun 28. South Coast (MA 2): closed Jun 30. Columbia River: closed ~Jun 28. Remaining quota exists in all areas; August/September reopenings are possible once IPHC announces additional days. Check wdfw.wa.gov for reopening announcements before fishing.',
    activeFrom: '2026-06-28',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/basics/halibut',
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
