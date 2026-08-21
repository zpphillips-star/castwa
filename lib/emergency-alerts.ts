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
  // ARCHIVED 2026-08-01: activeTo 2026-07-31 has passed; filter excludes from active list.
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

  // Lower/mid-Columbia most sections: closed to sockeye July 6–31 (reverts to pamphlet Aug 1+).
  // Priest Rapids Dam to Chief Joseph Dam: closed to ALL salmon July 1–Aug 31.
  // activeTo extended to 2026-08-31 to cover the upper-river closure.

  {
    id: 'ea-columbia-sockeye-closed-2026',
    type: 'CLOSED',
    species: 'Sockeye Salmon',
    waterBody: 'Columbia River (most sections)',
    description: 'Columbia River sockeye — pre-season forecast 275,000 but returns tracked well below expectations. 🚨 Priest Rapids Dam to Chief Joseph Dam: CLOSED to ALL salmon July 1–August 31 (expires Aug 31). Lower/mid-Columbia (Astoria to Priest Rapids): sockeye closure (Jul 6–31) has expired — pamphlet rules now apply as of Aug 1. Verify WDFW before fishing any Columbia River section.',
    activeFrom: '2026-06-18',
    activeTo: '2026-08-31',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/columbia-river-salmon-and-steelhead-fishery-update-2026-06',
  },
  // ── PUGET SOUND SUMMER CRAB ──────────────────────────────────────────────
  // Source: WDFW ER (pub. Jun 2026) + ER 26-147-136925 (pub. Aug 13 2026, MA 7N opening).
  // MA 7N confirmed open Aug 15–Sep 28 (Thu–Mon). MA 11 closes Aug 17.
  // MA 12 south of Ayock Pt and MA 13 remain CLOSED until further notice.
  // UPDATE: WDFW ER (pub. Aug 13 2026) confirms MA 7 North opens Aug 15–Sept 28 (Thu–Mon).
  {
    id: 'ea-ps-crab-summer-2026',
    type: 'OPEN',
    species: 'Dungeness Crab',
    waterBody: 'Puget Sound (most areas)',
    description: 'Summer Dungeness crab open Thu–Mon in most Puget Sound areas. MA 4E/5/6 & 8-1/8-2/9 & 12N: Jul 2–Sep 7. MA 10: Sun–Mon Jul 5–Sep 7. ⚠️ MA 11: Sun–Mon Jul 5–Aug 17 (closes Aug 17). MA 7S: Jul 16–Sep 28. ✅ MA 7N: Thu–Mon Aug 15–Sep 28 (now open — hardshell criteria met). MA 12S and MA 13 CLOSED. Daily limit 5 Dungeness, 6 Red Rock, 6 Tanner. Summer CRC required.',    activeFrom: '2026-07-02',
    activeTo: '2026-09-28',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/puget-sound-recreational-crabbing-update-marine-area-7-north-opens-aug-15-2026-08',
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
  // ARCHIVED 2026-08-01: activeTo 2026-07-31 has passed; filter excludes from active list.
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
  // ── PUGET SOUND SUMMER SHRIMP SEASONS (2026) ────────────────────────────
  // Source: WDFW ER 26-119-136754 (pub. Jun 29 2026) + ER 26-134-136837 (pub. Jul 27 2026).
  // Jul 27 update adds Marine Area 6 (excl. Discovery Bay Shrimp District):
  //   Aug 2 only: all shrimp species open (daylight only).
  //   Aug 3–Oct 15: non-spot shrimp only (depth limit 175 ft; all spot shrimp must be released).
  // MA 7 West spot shrimp quota met → closed. Broad non-spot seasons active through Oct 15.
  {
    id: 'ea-ps-shrimp-summer-2026',
    type: 'MODIFIED',
    species: 'Shrimp (spot & non-spot)',
    waterBody: 'Puget Sound Marine Areas',
    description: 'Summer/fall shrimp seasons active in Puget Sound through Oct 15. ✅ MA 4E & 5: ALL shrimp open Jun 29–Oct 15 (daylight only; 80 spot shrimp/day; 10 lb combined daily limit). ✅ MA 6 (excl. Discovery Bay Shrimp District): ALL shrimp Aug 2 only; non-spot only Aug 3–Oct 15 (depth limit 175 ft; release all spot shrimp). ✅ MA 7E, 8-1, 8-2, 9, 11, 13: Non-spot shrimp only through Oct 15 — depth limits apply; all spot shrimp must be immediately released. ⚠️ MA 7 West CLOSED — spot shrimp quota met. ⚠️ MA 7S, MA 10, MA 12, Discovery Bay Shrimp District: CLOSED. Daylight hours only (pots set/pulled 1 hr before sunrise to 1 hr after sunset; all traps out when closed). Non-spot seasons: 10 lb/day combined limit. All shrimp heads must be retained until ashore.',
    activeFrom: '2026-06-29',
    activeTo: '2026-10-15',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/puget-sound-shrimp-fishery-update-2026-07',
  },
  // ── COMMENCEMENT BAY (MA 11) SALMON — CHINOOK LIMIT MODIFICATION ─────────
  // Source: WDFW ER 26-136-136857 (pub. Jul 29 2026). Rule change aligns
  // Commencement Bay with the rest of Marine Area 11 per 2026 North of Falcon
  // season setting process. Effective Aug 1–14, 2026.
  // ⚠️ SUPERSEDED as of Aug 15: full MA 11 Chinook retention closure effective Aug 15–Sept 30
  //    (see ea-ma11-chinook-closed-2026). Year-round piers (Des Moines, Les Davis, Point Defiance,
  //    Redondo) exempt from that broader closure.
  {
    id: 'ea-commencement-bay-salmon-2026',
    type: 'MODIFIED',
    species: 'Salmon (hatchery Chinook)',
    waterBody: 'Marine Area 11, Commencement Bay',
    description: 'Commencement Bay (MA 11) salmon MODIFIED Aug 1–14, 2026. No more than one hatchery Chinook may be retained as part of the daily limit. Daily limit 2, ≤1 hatchery Chinook. Chinook min 22". Other salmon species no minimum size. Release chum and wild Chinook. Location: east of a line bearing 215° true from the Cliff House Restaurant (47°17.85\'N, 122°25.90\'W) through Sperry Ocean Dock (47°16.43\'N, 122°27.37\'W). ⚠️ Superseded by MA 11 Chinook closure starting Aug 15 — see separate alert.',
    activeFrom: '2026-08-01',
    activeTo: '2026-08-14',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/commencement-bay-salmon-fishery-update-2026-07',
  },

  // ── MARINE AREA 6 (EAST JUAN DE FUCA) CHINOOK LIMIT REDUCED ────────────────
  // Source: WDFW ER 26-141-136875 (pub. Aug 5 2026). Chinook reduced to avoid early quota closure.
  // Applies to MA 6 Chinook Selective Fishery area: waters west of true N/S line through
  // #2 Buoy immediately east of Ediz Hook, except Freshwater Bay.
  // Effective Aug 7–15, 2026.
  // ⚠️ SUPERSEDED as of Aug 13: full Chinook retention closure effective Aug 13–15 (see ea-ma6-chinook-closed-2026).
  {
    id: 'ea-ma6-chinook-limit-reduced-2026',
    type: 'MODIFIED',
    species: 'Chinook Salmon',
    waterBody: 'Marine Area 6 (East Juan de Fuca Strait, Chinook Selective Fishery Area)',
    description: '⚠️ MA 6 Chinook daily limit REDUCED — max 1 hatchery Chinook, Aug 7–12, 2026 (superseded by full Chinook retention closure starting Aug 13 — see separate alert). Applies west of the true N/S line through the #2 Buoy east of Ediz Hook. ⚠️ Freshwater Bay remains CLOSED to salmon. Daily limit 2 total, no more than 1 Chinook. Chinook min 22". All other salmon species no minimum size. Release chum, sockeye, wild coho, and wild Chinook.',
    activeFrom: '2026-08-07',
    activeTo: '2026-08-12',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-6-east-juan-de-fuca-strait-chinook-daily-limit-reduced-2026-08',
  },

  // ── MARINE AREA 7 (SAN JUAN ISLANDS) SALMON — ADDITIONAL DAY AUG 6 ───────
  // Source: WDFW ER 26-138-136860 (pub. Jul 31 2026). Catch estimates indicate
  // sufficient summer Chinook quota remains for one more retention day.
  // Bellingham Bay unaffected (open under regular pamphlet rules).
  // ARCHIVED 2026-08-07: activeTo 2026-08-06 has passed; filter excludes from active list.
  {
    id: 'ea-ma7-salmon-aug6-2026',
    type: 'OPEN',
    species: 'Salmon (hatchery Chinook)',
    waterBody: 'Marine Area 7 (San Juan Islands, excluding Bellingham Bay)',
    description: 'Marine Area 7 (San Juan Islands) salmon open Aug 6, 2026 only — additional day of Chinook retention. Daily limit 2, no more than 1 hatchery Chinook. Chinook min 22". All other salmon species no minimum size. Release chum, sockeye, wild coho, and wild Chinook. ⚠️ Bellingham Bay excluded (open under regular pamphlet rules). All year-round closed areas remain closed.',
    activeFrom: '2026-08-06',
    activeTo: '2026-08-06',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-7-san-juan-islands-opens-additional-day-chinook-retention-2026-07',
  },
  // ── SNAKE RIVER FALL CHINOOK OPEN (2026) ─────────────────────────────────
  // Source: WDFW ER 26-139-136878 (pub. Aug 6 2026). Columbia River upriver bright
  // Chinook forecast includes sufficient Snake River-origin fish for harvest.
  // Three zones with different dates/rules:
  //   Lyons Ferry Bubble (Marker 28 to Hwy 261 bridge): Sept 3–Oct 25, Thu–Sun, limit 2 adults (≤1 wild).
  //   Power lines downstream of Clarkston to WA/ID state line (CRC area 648): Aug 18–Oct 15, daily, limit 3 adults (≤1 wild).
  //   WA/ID state line to OR state line (CRC area 650): Aug 18–Oct 31, daily, limit 3 adults (≤1 wild).
  // All zones: jack Chinook no daily limit. Min size 12". Barbless hooks. CRSSE required for anglers 15+.
  // May close on short notice if quota met or ESA impacts. Two-pole fishing NOT allowed.
  {
    id: 'ea-snake-river-fall-chinook-2026',
    type: 'OPEN',
    species: 'Chinook Salmon',
    waterBody: 'Snake River (Lyons Ferry Bubble; Clarkston area to WA/ID state line; WA/ID to OR state line)',
    description: '✅ Snake River Fall Chinook opens Aug 18, 2026. Three zones: (1) Power lines ~3 mi below Clarkston to WA/ID state line (CRC 648): Aug 18–Oct 15, open daily, limit 3 adult Chinook (≤1 wild). (2) WA/ID state line to OR state line (CRC 650): Aug 18–Oct 31, open daily, limit 3 adult Chinook (≤1 wild). (3) Lyons Ferry Bubble (Marker 28 to Hwy 261 bridge): Sept 3–Oct 25, Thu–Sun only, limit 2 adult Chinook (≤1 wild). All zones: no daily limit on jack Chinook (under 24"). Min size 12". Barbless hooks required. Columbia River salmon & steelhead endorsement (CRSSE) required for anglers 15+. Two-pole fishing NOT allowed. ⚠️ May close on short notice — verify WDFW before fishing.',
    activeFrom: '2026-08-18',
    activeTo: '2026-10-31',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/fall-chinook-harvest-open-snake-river-2026-08',
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
  // UPDATE Aug 12: WDFW ER 26-150-136907 adds near-shore closure (N of 46°15'N, E of 124°08.667'W).
  // UPDATE Aug 17: WDFW ER 26-156-136941 closes Chinook retention + possession in outer area Aug 18–Sept 30.
  // Outer area rules: daily limit 2, coho min 16", release Chinook and wild coho.
  // North Jetty remains open under the more liberal of MA 1 or Buoy 10 rules.
  {
    id: 'ea-ma1-salmon-2026',
    type: 'MODIFIED',
    species: 'Salmon (Chinook & Coho)',
    waterBody: 'Marine Area 1 (Ilwaco)',
    description: 'Marine Area 1 (Ilwaco) salmon season June 20–Sept 30, 2026. ⚠️ UPDATED Aug 17: (1) Near-shore area (N of 46°15\'N, E of 124°08.667\'W, ~Columbia River mouth to Leadbetter Pt, within ~3 miles of shore) CLOSED to all salmon since Aug 13. (2) Outer MA 1: Chinook retention and possession onboard vessel CLOSED Aug 18–Sept 30. Outer area rules: daily limit 2, coho min 16", release Chinook and wild coho. Columbia River Control Zone closed except from north jetty. See companion closure alert for full details.',
    activeFrom: '2026-06-20',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-1-ilwaco-recreational-salmon-season-update-2026-08-0',
  },
  // ── MARINE AREA 2 (WESTPORT / OCEAN SHORES) SALMON SEASON ────────────────
  // Source: WDFW ER 26-101-136686 (pub. Jun 10 2026). Season open Jun 20–Sept 30 2026.
  // Jun 29–Sept 30: limit 2 (≤1 Chinook), Chinook min 22", coho min 16", release wild coho.
  // Willapa Bay (2-1) same rules Jun 20–Jul 31. Grays Harbor Control Zone open Jun 20–Sept 30.
  // UPDATE Aug 17: WDFW ER 26-156-136942 closes Chinook retention + vessel possession Aug 22–Sept 30.
  {
    id: 'ea-ma2-salmon-2026',
    type: 'MODIFIED',
    species: 'Salmon (Chinook & Coho)',
    waterBody: 'Marine Area 2 (Westport / Ocean Shores)',
    description: 'Marine Area 2 salmon season June 20–Sept 30, 2026. ⚠️ UPDATED Aug 17: Chinook retention and possession onboard vessel CLOSED Aug 22–Sept 30 (Chinook quota nearly reached). Rules Aug 22–Sept 30: daily limit two, coho min 16 inches, release Chinook and wild coho. Grays Harbor Control Zone and Area 2-2 (west of Buoy 13 line) open through Sept 30 under same rules. Willapa Bay (2-1): open June 20–July 31 under same rules. See companion Chinook closure alert.',
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
    description: 'Marine Area 4 (Neah Bay) salmon open June 20 – Sept 30, 2026. July 1–31: limit 2, Chinook min 24", coho min 16", release wild coho (both sides of Bonilla-Tatoosh line). Aug 1–Sept 30: limit 2, coho min 16", release Chinook (east side), release chum and wild coho. ℹ️ Kydaka Point Area special salmon closure (through Aug 15) has expired — pamphlet rules now apply.',
    activeFrom: '2026-06-20',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-4-neah-bay-recreational-salmon-seasons-2026-06',
  },
  // ── PACIFIC HALIBUT — MA 11/12/13 CLOSED FOR THE YEAR ──────────────────
  // All primary seasons closed Jun 28–30 2026. MA 11/12/13 have no reopening scheduled for 2026.
  // Reopenings for other areas: see ea-halibut-reopen-* alerts below.
  // Source: wdfw.wa.gov/fishing/regulations/halibut/puget-sound (verified Aug 5 2026).
  {
    id: 'ea-halibut-quota-closed-2026',
    type: 'CLOSED',
    species: 'Pacific Halibut',
    waterBody: 'Marine Areas 11 (Tacoma), 12 (Hood Canal), 13 (S. Puget Sound)',
    description: '🚨 Pacific Halibut CLOSED for the year in MA 11 (Tacoma/Commencement Bay), MA 12 (Hood Canal), and MA 13 (South Puget Sound). No reopening scheduled for 2026. Catch record card required. See separate alerts for reopenings in MA 1–10.',
    activeFrom: '2026-06-28',
    activeTo: null,
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/halibut/puget-sound',
  },
  // ── PACIFIC HALIBUT REOPENING — MA 1 (COLUMBIA RIVER) & MA 2 (WESTPORT/OCEAN SHORES) ──
  // Source: WDFW ER 26-127-136876 (pub. Aug 5 2026). Annual limit 6; daily limit 1, no min size.
  // MA 1 quota: 19,299 lbs. MA 2 quota: 65,857 lbs. May close before Sep 30 if quota taken.
  // Anglers may clean/portion in field but must retain carcass until ashore.
  {
    id: 'ea-halibut-reopen-south-coast-columbia-2026',
    type: 'OPEN',
    species: 'Pacific Halibut',
    waterBody: 'Marine Area 1 (Columbia River) & MA 2 (Westport / Ocean Shores)',
    description: '✅ Pacific Halibut REOPENS Aug 8 – Sept 30 in MA 1 (Columbia River) and MA 2 (Westport/Ocean Shores). Open 7 days per week, all-depth. Daily limit 1 halibut, no minimum size. Annual bag limit 6. Catch record card required. Carcass must be retained until ashore. ⚠️ Seasons may close before Sept 30 if quota is taken — verify WDFW before fishing.',
    activeFrom: '2026-08-08',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/summer-halibut-fishery-2026-2026-08',
  },
  // ── PACIFIC HALIBUT REOPENING — MA 3–4 (NORTH COAST) & MA 5–10 (PUGET SOUND/STRAIT) ──
  // Source: WDFW ER 26-127-136876 (pub. Aug 5 2026). Annual limit 6; daily limit 1, no min size.
  // MA 3 & 4 combined quota: 131,149 lbs. MA 5–10 combined quota: 80,512 lbs.
  // MA 4 east of Bonilla-Tatoosh line: sablefish may be retained seaward of 120-ft bottomfish closure on halibut days.
  // MA 5: sablefish may be retained seaward of 120-ft bottomfish closure on halibut days.
  {
    id: 'ea-halibut-reopen-north-coast-ps-2026',
    type: 'OPEN',
    species: 'Pacific Halibut',
    waterBody: 'MA 3 (La Push), MA 4 (Neah Bay), MA 5–10 (Puget Sound / Strait of Juan de Fuca)',
    description: '✅ Pacific Halibut REOPENS Aug 16 – Sept 30 in MA 3 (La Push), MA 4 (Neah Bay), and MA 5–10 (Puget Sound/Strait of Juan de Fuca). Open 7 days per week. Daily limit 1 halibut, no minimum size. Annual bag limit 6. Catch record card required. Carcass must be retained until ashore. 🐟 Sablefish bonus: may be retained seaward of 120-ft bottomfish closure in MA 4 (east of Bonilla-Tatoosh line) and MA 5 on open halibut days. ⚠️ Seasons may close before Sept 30 if quota is taken — verify WDFW before fishing.',
    activeFrom: '2026-08-16',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/summer-halibut-fishery-2026-2026-08',
  },
  // ── MARINE AREA 6 (EAST JUAN DE FUCA) — CHINOOK RETENTION CLOSED ────────
  // Source: WDFW ER 26-149-136913 (pub. Aug 12 2026). Quota reached; supersedes limit-reduction rule.
  // Effective Aug 13–15, 2026. MA 6 Chinook Selective Fishery area (west of N/S line through #2 Buoy
  // east of Ediz Hook, except Freshwater Bay).
  {
    id: 'ea-ma6-chinook-closed-2026',
    type: 'CLOSED',
    species: 'Chinook Salmon',
    waterBody: 'Marine Area 6 (East Juan de Fuca Strait, Chinook Selective Fishery Area)',
    description: '🚨 MA 6 Chinook retention CLOSED Aug 13–15, 2026 — allowable Chinook encounter limit for summer season has been reached. Applies west of the true N/S line through the #2 Buoy east of Ediz Hook (except Freshwater Bay, which remains closed to all salmon). Hatchery coho fishing continues 7 days/week through Sept 24; non-selective coho Sept 25–Oct 15. See 2026–2027 pamphlet for full coho details.',
    activeFrom: '2026-08-13',
    activeTo: '2026-08-15',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-6-east-juan-de-fuca-strait-chinook-retention-closes-aug-13-2026-08',
  },
  // ── MARINE AREA 11 (TACOMA / VASHON ISLAND) — CHINOOK RETENTION CLOSED ──
  // Source: WDFW ER 26-151-136909 (pub. Aug 12 2026). Sublegal Chinook encounter guideline reached.
  // Effective Aug 15 – Sept 30, 2026. Excludes year-round piers (Des Moines, Les Davis,
  // Point Defiance Boathouse Dock, and Redondo).
  {
    id: 'ea-ma11-chinook-closed-2026',
    type: 'CLOSED',
    species: 'Chinook Salmon',
    waterBody: 'Marine Area 11 (Tacoma and Vashon Island)',
    description: '🚨 MA 11 Chinook retention CLOSED Aug 15–Sept 30, 2026 — sublegal Chinook encounter guideline will be reached by Aug 14. Applies to all MA 11 waters EXCEPT year-round piers (Des Moines Pier, Les Davis Pier, Point Defiance Boathouse Dock, Redondo Pier). Salmon rules: no min size. Daily limit 2. Release chum and Chinook. Year-round pier rules remain per 2026 pamphlet.',
    activeFrom: '2026-08-15',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-11-tacoma-and-vashon-island-salmon-fishery-update-2026-08',
  },
  // ── MARINE AREA 1 (ILWACO) — NEAR-SHORE SALMON CLOSURE ──────────────────
  // Source: WDFW ER 26-150-136907 (pub. Aug 12 2026). Chinook catches near shore higher than expected.
  // Closes near-shore MA 1 waters north of 46°15'N and east of 124°08.667'W to all salmon.
  // Effective Aug 13–Sept 30, 2026. Area outside closure: limit 2, ≤1 Chinook (22"), coho 16", release wild coho.
  {
    id: 'ea-ma1-nearshore-salmon-closed-2026',
    type: 'CLOSED',
    species: 'Salmon',
    waterBody: 'Marine Area 1 (Ilwaco) — near-shore area north of 46°15\'N, east of 124°08.667\'W',
    description: '🚨 MA 1 PARTIAL CLOSURE — near-shore area CLOSED to all salmon Aug 13–Sept 30, 2026. ⚠️ Aug 18 UPDATE: Chinook retention and onboard vessel possession also CLOSED in the open portion through Sept 30. Near-shore closed area: north of 46°15\'N and east of 124°08.667\'W (~Columbia River mouth to Leadbetter Pt, within ~3 miles of shore). Waters OUTSIDE near-shore closure (open area): daily limit 2; coho min 16"; other salmon no min size; release Chinook and wild coho; Chinook onboard possession prohibited. North jetty follows the more liberal rules of MA 1 or Buoy 10 fishery.',
    activeFrom: '2026-08-13',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-1-ilwaco-recreational-salmon-season-update-2026-08-0',
  },
  // ── BIOTOXIN — WILLAPA BAY BIVALVES ADVISORY/CLOSED ─────────────────────
  // Source: DOH ArcGIS vBeachStatus (Table 18), verified Aug 14 2026.
  // Multiple Willapa Bay zones showing "Advisory,Closed" for All Species:
  //   Bay Center Area (20.07), Tokeland Area (20.01), Nemah Area (20.08),
  //   Nahcotta Area (20.13), Diamond Point (20.14), Smokey Hollow (20.12),
  //   Tokeland Marina.
  // Affects all bivalves including razor clams, oysters, clams, mussels.
  // Until further notice — check DOH Shellfish Safety Map before harvesting.
  {
    id: 'ea-biotoxin-willapa-bay-2026',
    type: 'CLOSED',
    species: 'Clams, Oysters, Mussels (all bivalves)',
    waterBody: 'Willapa Bay (multiple zones)',
    description: '🚨 Willapa Bay shellfish harvest CLOSED — biotoxin advisory active for All Species across multiple zones (Bay Center, Tokeland, Nemah, Nahcotta, Diamond Point, Smokey Hollow, Tokeland Marina). Status as of Aug 14, 2026: Advisory,Closed (DOH). Affects all bivalves including razor clams, oysters, clams, and mussels. Shrimp and crab typically not affected by biotoxin closures. PSP cannot be detected by sight, smell, or taste — do NOT rely on appearance. Always check DOH Shellfish Safety Map before any harvest: fortress.wa.gov/doh/biotoxin',
    activeFrom: '2026-08-14',
    activeTo: null,
    wdfw_url: 'https://doh.wa.gov/community-and-environment/food/shellfish/shellfish-safety-recreation',
  },
  // ── GREEN RIVER (DUWAMISH) — CHINOOK RETENTION CLOSED ───────────────────────
  // Source: WDFW ER (pub. Aug 17 2026). In-season data shows Chinook return to
  // Green River much smaller than forecasted; broodstock and natural spawning goals at risk.
  // Effective Aug. 20, 2026 (TODAY), until further notice.
  // Location: Tukwila International Blvd/Old Highway 99 to the S 212th Street Bridge.
  // Salmon rules: min 12". Daily limit 6 incl. ≤3 total chum + adult coho. Release Chinook.
  {
    id: 'ea-green-river-chinook-closed-2026',
    type: 'CLOSED',
    species: 'Chinook Salmon',
    waterBody: 'Green (Duwamish) River (Tukwila International Blvd/Old Hwy 99 to S 212th St Bridge)',
    description: '🚨 EFFECTIVE AUG 20, 2026: Green River Chinook retention CLOSED until further notice — in-season data shows Chinook return is much smaller than forecasted; broodstock and natural spawning goals at risk. Location: Tukwila International Blvd/Old Hwy 99 to S 212th Street Bridge. Other salmon rules: daily limit 6 including no more than 3 total of any combination of chum and adult coho; minimum size 12"; release all Chinook. ⚠️ Upper river section closed to ALL fishing Sept 16–Oct 31 — see separate alert. Verify WDFW before fishing. Contact: North Puget Sound Region, 425-775-1311.',
    activeFrom: '2026-08-20',
    activeTo: null,
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/green-duwamish-river-chinook-retention-closed-2026-08',
  },
  // ── UPPER GREEN (DUWAMISH) RIVER — ALL FISHING CLOSED SEPT 16–OCT 31 ────
  // Source: WDFW ER (pub. Aug 17 2026). Critical Chinook spawning grounds actively in use.
  // Effective Sept. 16–Oct. 31, 2026.
  // Location: Auburn Black Diamond Road Bridge downstream to Tacoma Municipal Boundary Marker.
  // All species closed. Contact: North Puget Sound Region, 425-775-1311.
  {
    id: 'ea-upper-green-river-closed-2026',
    type: 'CLOSED',
    species: 'All species',
    waterBody: 'Green (Duwamish) River (Auburn Black Diamond Road Bridge to Tacoma Municipal Boundary Marker)',
    description: '🚨 Upper Green River CLOSED to ALL fishing Sept 16–Oct 31, 2026 — critical Chinook spawning grounds in active use. Location: Auburn Black Diamond Road Bridge downstream to the Tacoma Municipal Boundary Marker. All species, all gear. ⚠️ Note: lower river section already has Chinook retention closed starting Aug 20 (see separate alert). Contact: North Puget Sound Region, 425-775-1311.',
    activeFrom: '2026-09-16',
    activeTo: '2026-10-31',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/upper-green-duwamish-river-closed-fishing-sept-16-oct-31-2026-08',
  },
  // ── MARINE AREA 2 (WESTPORT) — CHINOOK RETENTION & ONBOARD POSSESSION CLOSED ─
  // Source: WDFW ER (pub. Aug 17 2026, updated Aug 18 2026 to add possession prohibition).
  // Chinook guideline for MA 2 expected to be reached by end of day Aug 21.
  // Effective Aug. 22–Sept. 30, 2026. Also applies to Grays Harbor (Area 2-2) west of Buoy 13 line.
  {
    id: 'ea-ma2-chinook-closed-2026',
    type: 'CLOSED',
    species: 'Chinook Salmon',
    waterBody: 'Marine Area 2 (Westport / Ocean Shores) & Grays Harbor Area 2-2',
    description: '🚨 MA 2 Chinook retention and onboard vessel possession CLOSED Aug 22–Sept 30, 2026 — Chinook guideline expected reached by end of day Aug 21. Salmon rules Aug 22–Sept 30: daily limit 2; coho min size 16"; other salmon no minimum size; release Chinook and wild coho; possession of Chinook onboard a vessel prohibited. Applies to MA 2 and Grays Harbor Control Zone (Area 2-2) west of the Buoy 13 line (both open through Sept 30 under same rules). Contact: Fish Program, 360-902-2700.',
    activeFrom: '2026-08-22',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-2-westport-ocean-shores-recreational-salmon-season-update-2026-08',
  },
  // ── QUILLAYUTE & SOL DUC RIVERS — RELEASE WILD JACK CHINOOK & WILD JACK COHO ─
  // Source: WDFW ER 26-62-136494 (pub. Apr 23 2026). North of Falcon harvest management
  // agreement with co-managers. Conservation concern for wild summer Chinook and coho.
  // Effective May 1, 2026, until further notice.
  {
    id: 'ea-quillayute-sol-duc-wild-jack-2026',
    type: 'MODIFIED',
    species: 'Chinook Salmon, Coho Salmon',
    waterBody: 'Quillayute River (ONP boundary to Sol Duc/Bogachiel confluence) & Sol Duc River (mouth to Sol Duc Hatchery pump station)',
    description: '⚠️ Quillayute & Sol Duc Rivers MODIFIED — wild jack Chinook and wild jack coho must be released (effective May 1, 2026, until further notice). Daily limit 2. Minimum size 12". Release sockeye, wild Chinook, and wild jack coho. Only hatchery (adipose fin-clipped) jack Chinook and jack coho may be retained. Single-point barbless hook required for all species. Locations: Quillayute River from ONP park boundary upstream to Sol Duc/Bogachiel confluence; Sol Duc River from mouth to concrete pump station at Sol Duc Hatchery.',
    activeFrom: '2026-05-01',
    activeTo: null,
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/quillayute-and-sol-duc-river-anglers-must-release-wild-jack-chinook-and-wild-jack-coho-beginning-may-2026-04',
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

