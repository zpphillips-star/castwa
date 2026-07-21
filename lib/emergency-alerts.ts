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
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/lower-skagit-river-fishing-updates-2026-07-0',
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
  // MA 7 West CLOSED — spot shrimp quota met July 2026. MA 6 Jul 19–20 and MA 12 Jul 7 special
  // openings have passed. Ongoing non-spot shrimp season runs Jun 29–Oct 15 in many areas.
  // Updated Jul 21 2026: extended activeTo to Oct 15 to cover ongoing non-spot season.
  {
    id: 'ea-ps-shrimp-ma7w-cancelled-2026',
    type: 'MODIFIED',
    species: 'Shrimp (all species)',
    waterBody: 'Puget Sound Marine Areas (ongoing season update)',
    description: 'Non-spot shrimp open June 29–Oct 15 (daylight hours) in MA 4E/5, 7E, 8-1/8-2, 9, 11, 13. MA 7 West CLOSED — spot shrimp quota met. MA 6, 7S, Discovery Bay, MA 10 (Elliott Bay), and MA 12 also closed. Depth restrictions apply by area. All spot shrimp caught in non-spot areas must be released immediately. Daily limit 10 lbs whole shrimp, all species combined in non-spot areas.',
    activeFrom: '2026-06-29',
    activeTo: '2026-10-15',
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
  // ── MARINE AREA 5 (SEKIU / PILLAR POINT) SALMON OPEN ────────────────────
  // Source: WDFW ER 26-128-136805 (pub. Jul 16 2026). MA 5 fishery at 15% of
  // 4,323 total legal-size encounter limit (657 through Jul 11). Opens daily
  // with up to 2 hatchery Chinook. Kydaka Point Area remains closed.
  // Effective July 18–31, 2026.
  {
    id: 'ea-ma5-salmon-open-2026',
    type: 'OPEN',
    species: 'Salmon (hatchery Chinook)',
    waterBody: 'Marine Area 5 (Sekiu & Pillar Point, excluding Kydaka Point Area)',
    description: 'Marine Area 5 salmon open DAILY July 18–31. Daily limit 2. Chinook min 22". No min size for other salmon species. Release chum, sockeye, wild coho, and wild Chinook. ⚠️ Kydaka Point Area (south of Kydaka Point–Shipwreck Point line) remains CLOSED to salmon. Barbless hooks required.',
    activeFrom: '2026-07-18',
    activeTo: '2026-07-31',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-5-sekiu-and-pillar-point-salmon-fishing-opens-daily-two-hatchery-chinook-may-be-retained-2026-07',
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
  // ── MARINE AREA 1 (ILWACO) SALMON SEASON ────────────────────────────────
  // Source: WDFW ER 26-101-136685 (pub. Jun 10 2026). Season open Jun 20–Sept 30 2026.
  // Daily limit 2, ≤1 Chinook. Chinook min 22". Coho min 16". Release wild coho.
  {
    id: 'ea-ma1-salmon-2026',
    type: 'OPEN',
    species: 'Salmon (Chinook & Coho)',
    waterBody: 'Marine Area 1 (Ilwaco)',
    description: 'Marine Area 1 (Ilwaco) salmon open June 20 – Sept 30, 2026. Daily limit 2 including no more than 1 Chinook. Chinook min 22". Coho min 16". Release wild coho. Columbia River Control Zone closed except from north jetty when adjacent waters are open.',
    activeFrom: '2026-06-20',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-1-ilwaco-recreational-salmon-season-2026-06',
  },
  // ── MARINE AREA 2 (WESTPORT / OCEAN SHORES) SALMON SEASON ────────────────
  // Source: WDFW ER 26-101-136686 (pub. Jun 10 2026). Season open Jun 20–Sept 30 2026.
  // Jun 29–Sept 30: limit 2 (≤1 Chinook), Chinook min 22", coho min 16", release wild coho.
  // Willapa Bay (2-1) same rules Jun 20–Jul 31. Grays Harbor Control Zone open Jun 20–Sept 30.
  {
    id: 'ea-ma2-salmon-2026',
    type: 'OPEN',
    species: 'Salmon (Chinook & Coho)',
    waterBody: 'Marine Area 2 (Westport / Ocean Shores)',
    description: 'Marine Area 2 salmon open June 20 – Sept 30, 2026. June 20–28: limit 1, Chinook min 22", release coho. June 29–Sept 30: limit 2 (≤1 Chinook), Chinook min 22", coho min 16", release wild coho. Willapa Bay (2-1) same rules through July 31. Grays Harbor Control Zone open June 20–Sept 30.',
    activeFrom: '2026-06-20',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-2-westport-ocean-shores-recreational-salmon-seasons-2026-06',
  },
  // ── MARINE AREA 3 (LA PUSH) SALMON SEASON ───────────────────────────────
  // Source: WDFW ER 26-101-136687 (pub. Jun 10 2026). Season open Jun 20–Sept 30 2026.
  {
    id: 'ea-ma3-salmon-2026',
    type: 'OPEN',
    species: 'Salmon (Chinook & Coho)',
    waterBody: 'Marine Area 3 (La Push)',
    description: 'Marine Area 3 (La Push) salmon open June 20 – Sept 30, 2026. June 20–30: limit 1, Chinook min 24". July 1–31: limit 2, Chinook min 24", coho min 16", release wild coho. Aug 1–Sept 30: limit 2, Chinook min 24", coho min 16", release chum and wild coho.',
    activeFrom: '2026-06-20',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-3-la-push-recreational-salmon-seasons-2026-06',
  },
  // ── MARINE AREA 4 (NEAH BAY) SALMON SEASON ──────────────────────────────
  // Source: WDFW ER 26-101-136688 (pub. Jun 10 2026). Season open Jun 20–Sept 30 2026.
  // Kydaka Point Area closed to salmon through Aug 15 (Aug 1–Sept 30 east of Bonilla-Tatoosh).
  {
    id: 'ea-ma4-salmon-2026',
    type: 'OPEN',
    species: 'Salmon (Chinook & Coho)',
    waterBody: 'Marine Area 4 (Neah Bay)',
    description: 'Marine Area 4 (Neah Bay) salmon open June 20 – Sept 30, 2026. July 1–31: limit 2, Chinook min 24", coho min 16", release wild coho (both sides of Bonilla-Tatoosh line). Aug 1–Sept 30: limit 2, coho min 16", release Chinook (east side), release chum and wild coho; Kydaka Point Area closed to salmon through Aug 15.',
    activeFrom: '2026-06-20',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-4-neah-bay-recreational-salmon-seasons-2026-06',
  },
  // ── PACIFIC HALIBUT — ALL WA PRIMARY SEASONS CLOSED (QUOTA) ─────────────
  // All WA halibut primary seasons closed at scheduled end dates.
  // Puget Sound (MA 5–10): closed Jun 30 (58% of 80,512 lb quota used, ~33,720 lbs remain).
  // North Coast (MA 3–4): closed Jun 28 (44% of 131,149 lb quota used, ~73,003 lbs remain).
  // South Coast (MA 2): closed Jun 30 (58% of 65,857 lb quota used, ~27,628 lbs remain).
  // Columbia River: closed ~Jun 28 (61% of 19,299 lb quota used, ~7,556 lbs remain).
  // All area pages explicitly note Aug/Sep reopenings possible if quota remains.
  // WDFW held a public meeting Jun 30 to discuss Aug/Sep dates — no dates announced yet
  // as of Jul 20 2026. Monitor WDFW emergency rules for reopening announcement.
  {
    id: 'ea-halibut-quota-closed-2026',
    type: 'CLOSED',
    species: 'Pacific Halibut',
    waterBody: 'All WA Marine Areas (MA 2, 3–4, 5–10) & Columbia River',
    description: '🚨 All WA Pacific Halibut primary seasons are CLOSED — scheduled season end dates reached. Puget Sound (MA 5–10): closed Jun 30. North Coast (MA 3–4): closed Jun 28. South Coast (MA 2): closed Jun 30. Columbia River: closed ~Jun 28. Substantial quota remains in all areas (North Coast ~55% unused). WDFW may announce August/September additional fishing days — monitor wdfw.wa.gov/fishing/regulations/halibut for reopening announcements before fishing.',
    activeFrom: '2026-06-28',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/halibut',
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
