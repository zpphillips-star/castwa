/**
 * CastWA Daily Updates
 *
 * Manually curated statewide fishing bulletin — general interest items that
 * appear in the "Daily Updates" banner on the Today page. Not fish-specific;
 * covers notable opens, closures, re-openings, season highlights, biotoxin
 * notices, and time-sensitive reminders for all WA anglers.
 *
 * MAINTAINER NOTE: Review and update whenever:
 *   • A major season opens / closes (halibut, coastal salmon, shrimp, crab)
 *   • A biotoxin closure is posted or lifted by DOH
 *   • A WDFW emergency rule creates a notable statewide story
 *   • A one-day special event (e.g. single additional Chinook day) is confirmed
 *
 * Filter logic: an update is active if today is >= activeFrom and
 * (activeTo is null OR today is <= activeTo).
 */

export type UpdateCategory =
  | 'halibut'
  | 'salmon-marine'
  | 'salmon-freshwater'
  | 'shrimp'
  | 'crab'
  | 'biotoxin'
  | 'freshwater'
  | 'general'

/** Visual urgency level — drives icon tint & sort order */
export type UpdatePriority = 'alert' | 'highlight' | 'info'

export interface DailyUpdate {
  id: string
  category: UpdateCategory
  priority: UpdatePriority
  icon: string
  /**
   * Hero label shown at the top of the featured card.
   * E.g. "Season Opening", "Season Closure", "Biotoxin Alert", "Now Open"
   */
  featuredLabel: string
  /**
   * true  = show in Daily Updates banner (major events only)
   * false = minor restriction change; omit from banner
   * Future automated monitor should set this field.
   */
  featured: boolean
  /** One-line summary shown in the card headline */
  headline: string
  /** Location / species subtitle shown beneath the headline */
  subtext: string
  /** Full regulation detail for the expanded card */
  detail: string
  activeFrom: string        // 'YYYY-MM-DD'
  activeTo: string | null   // 'YYYY-MM-DD' or null = open-ended
  wdfw_url: string
}

// ─── UPDATE DATA ──────────────────────────────────────────────────────────────

export const DAILY_UPDATES: DailyUpdate[] = [

  // ── HALIBUT — ALL PRIMARY SEASONS CLOSED; AUG REOPENINGS CONFIRMED ──────────
  {
    id: 'du-halibut-2026-reopen',
    category: 'halibut',
    priority: 'highlight',
    featured: true,
    featuredLabel: 'Season Reopening',
    icon: '🐟',
    headline: 'Halibut: MA 1–2 OPEN now thru Sep 30; MA 3–10 opens Aug 16; MA 11/12/13 closed',
    subtext: 'All WA Marine Areas — daily limit 1, catch record card required',
    detail:
      'Halibut is NOW OPEN in some WA marine areas through Sept 30, 2026:\n\n' +
      '✅ MA 1 (Columbia River) & MA 2 (Westport / Ocean Shores): OPEN NOW Aug 8 – Sep 30, daily, limit 1.\n' +
      '✅ MA 3–4 (North Coast / Neah Bay / La Push) & MA 5–10 (Puget Sound / Strait): Opens Aug 16 – Sep 30, daily, limit 1.\n' +
      '🚫 MA 11 (Tacoma), MA 12 (Hood Canal), MA 13 (South Puget Sound): CLOSED for the year.\n\n' +
      'No minimum size. Catch record card required. Seasons may close early if quota is reached.',
    activeFrom: '2026-06-28',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/halibut',
  },

  // ── MA 6 SHRIMP — OPENS TODAY AUG 2 ─────────────────────────────────────────
  {
    id: 'du-ma6-shrimp-aug2-2026',
    category: 'shrimp',
    priority: 'alert',
    featured: true,
    featuredLabel: 'Opens Today',
    icon: '🦐',
    headline: 'MA 6 shrimp opens TODAY — all species, daylight only',
    subtext: 'Marine Area 6 (excl. Discovery Bay) · Aug 2 only for spot shrimp',
    detail:
      'Marine Area 6 (excluding Discovery Bay Shrimp District) opens TODAY (Aug 2) for ALL shrimp species, daylight hours only.\n\n' +
      '⚠️ SPOT SHRIMP: today (Aug 2) is the ONLY day you can keep spot shrimp in MA 6 this year.\n' +
      '✅ Starting Aug 3 through Oct 15: non-spot shrimp only (depth limit 175 ft). All spot shrimp must be immediately released.\n\n' +
      'Daily limit: 80 spot shrimp (today only) or 10 lb combined non-spot.\n' +
      'Pots must be set and pulled during daylight (1 hr before sunrise to 1 hr after sunset). All traps must be removed when closed.\n' +
      'Heads must be retained until ashore.',
    activeFrom: '2026-08-02',
    activeTo: '2026-10-15',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/puget-sound-shrimp-fishery-update-2026-07',
  },

  // ── MA 7 SAN JUAN ISLANDS — EXTRA CHINOOK DAY AUG 6 (minor — not featured) ──
  {
    id: 'du-ma7-aug6-2026',
    category: 'salmon-marine',
    priority: 'highlight',
    featured: false,
    featuredLabel: 'One-Day Opening',
    icon: '🎣',
    headline: 'San Juan Islands (MA 7): Extra Chinook day — Aug 6 only',
    subtext: 'Marine Area 7 excluding Bellingham Bay · limit 2, ≤1 hatchery Chinook',
    detail:
      'WDFW has opened Marine Area 7 (San Juan Islands, excluding Bellingham Bay) for one additional Chinook retention day on Aug 6, 2026.\n\n' +
      'Daily limit: 2 salmon, no more than 1 hatchery Chinook.\n' +
      'Chinook minimum size: 22". All other salmon species: no minimum size.\n' +
      'Release: chum, sockeye, wild coho, and wild Chinook.\n\n' +
      '⚠️ Bellingham Bay is excluded — it remains open under regular pamphlet rules. All year-round closed areas remain closed.',
    activeFrom: '2026-08-03',
    activeTo: '2026-08-06',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-7-san-juan-islands-opens-additional-day-chinook-retention-2026-07',
  },

  // ── COMMENCEMENT BAY (MA 11) — SALMON LIMIT MODIFIED (minor — not featured) ──
  {
    id: 'du-commencement-bay-aug2026',
    category: 'salmon-marine',
    priority: 'highlight',
    featured: false,
    featuredLabel: 'Limit Change',
    icon: '🐟',
    headline: 'Commencement Bay salmon limit modified — now ≤1 hatchery Chinook',
    subtext: 'Marine Area 11, Commencement Bay · Aug 1 – Sep 30',
    detail:
      'Effective Aug 1, 2026: Commencement Bay (MA 11) salmon daily limit is 2, with no more than 1 hatchery Chinook.\n\n' +
      'Chinook minimum size: 22". Other salmon species: no minimum size.\n' +
      'Release chum and wild Chinook.\n\n' +
      'Location: east of a line bearing 215° true from the Cliff House Restaurant (47°17.85\'N, 122°25.90\'W) through Sperry Ocean Dock (47°16.43\'N, 122°27.37\'W).',
    activeFrom: '2026-08-01',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/commencement-bay-salmon-fishery-update-2026-07',
  },

  // ── BIOTOXIN — HOOD CANAL & ADMIRALTY INLET BIVALVES CLOSED ─────────────────
  {
    id: 'du-biotoxin-psp-ma12-2026',
    category: 'biotoxin',
    priority: 'alert',
    featured: true,
    featuredLabel: 'Biotoxin Closure',
    icon: '☠️',
    headline: 'BIOTOXIN: Hood Canal & Admiralty Inlet bivalves CLOSED',
    subtext: 'MA 12 (Hood Canal) + MA 9 south of Foulweather Bluff · open-ended',
    detail:
      '🚨 ALL bivalve shellfish harvest CLOSED due to PSP (paralytic shellfish poisoning) at LETHAL levels.\n\n' +
      'Affected waters:\n' +
      '• Hood Canal (MA 12): entire area, including Port Gamble Bay, Quilcene Bay, Dabob Bay, and Mats Mats Bay.\n' +
      '• Admiralty Inlet (MA 9): south of Foulweather Bluff to Olele Point.\n\n' +
      'Affected species: clams, mussels, oysters, scallops (all bivalves).\n' +
      '✅ Shrimp and crab are NOT affected.\n\n' +
      '⚠️ PSP cannot be detected by sight, smell, or taste — cooking does NOT remove the toxin.\n\n' +
      'Always check the DOH Shellfish Safety Map before harvesting: fortress.wa.gov/doh/biotoxin',
    activeFrom: '2026-06-12',
    activeTo: null,
    wdfw_url: 'https://wdfw.wa.gov/newsroom/news-release/wdfw-closes-hood-canal-admiralty-inlet-shellfish-harvesting-effective-immediately-following-reports',
  },

  // ── TULALIP TERMINAL AREA (MA 8-2) SALMON CLOSED (minor — not featured) ──────
  {
    id: 'du-tulalip-terminal-2026',
    category: 'salmon-marine',
    priority: 'alert',
    featured: false,
    featuredLabel: 'Area Closure',
    icon: '🚫',
    headline: 'Tulalip Terminal Area (MA 8-2) salmon CLOSED through Sep 7',
    subtext: 'Marine Area 8-2, west of Tulalip Bay within 2,000 ft of shore',
    detail:
      '🚨 Salmon fishing is CLOSED in the Tulalip Terminal Area (MA 8-2) through September 7, 2026. The area Chinook quota of 600 fish has been reached.\n\n' +
      'Affected area: west of Tulalip Bay within 2,000 ft of shore, from pilings at Old Bower\'s Resort to boundary marker ~1.4 miles NW of Hermosa Point (excluding waters east of Mission Point–Hermosa Point line).',
    activeFrom: '2026-07-07',
    activeTo: '2026-09-07',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/tulalip-terminal-area-salmon-fishing-closed-2026-07',
  },

  // ── SUMMER CRAB — PUGET SOUND OPEN THU–MON ───────────────────────────────────
  {
    id: 'du-ps-crab-summer-2026',
    category: 'crab',
    priority: 'info',
    featured: true,
    featuredLabel: 'Season Open',
    icon: '🦀',
    headline: 'Puget Sound Dungeness crab open Thu–Mon most areas',
    subtext: 'Most Puget Sound MAs · through Sep 28 · daily limit 5',
    detail:
      'Summer Dungeness crab season is open Thursday–Monday in most Puget Sound areas through late September. Summer Crab Recreation Card (CRC) required.\n\n' +
      '✅ MA 4E & 5: Jun 29–Oct 15 (daily)\n' +
      '✅ MA 6: Jul 1–Sep 28 (Thu–Mon)\n' +
      '✅ MA 8-1, 8-2, 9: Jul 2–Sep 7 (Thu–Mon)\n' +
      '✅ MA 10: Sun–Mon only, Jul 5–Sep 7\n' +
      '✅ MA 11: Sun–Mon only, Jul 5–Aug 17\n' +
      '✅ MA 7S: Jul 16–Sep 28 (Thu–Mon)\n' +
      '🚫 MA 12 south of Ayock Pt & MA 13: CLOSED\n\n' +
      'Daily limit: 5 Dungeness crab (males only, 6¼" min). Standard shellfish/crab license required.',
    activeFrom: '2026-07-02',
    activeTo: '2026-09-28',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/puget-sound-summer-crab-schedule-2026-06',
  },

  // ── PUGET SOUND SHRIMP — BROAD SEASON ACTIVE (minor vs. the MA6 opens-today card)
  {
    id: 'du-ps-shrimp-broad-2026',
    category: 'shrimp',
    priority: 'info',
    featured: false,
    featuredLabel: 'Season Open',
    icon: '🦐',
    headline: 'Non-spot shrimp seasons active across most Puget Sound areas',
    subtext: 'MA 4E, 5, 7E, 8-1/8-2, 9, 11, 13 · through Oct 15',
    detail:
      'Non-spot shrimp seasons are active in most Puget Sound Marine Areas through October 15, 2026. Daylight hours only.\n\n' +
      '✅ MA 4E & 5: ALL shrimp open through Oct 15 (80 spot/day; 10 lb combined limit).\n' +
      '✅ MA 6 (excl. Discovery Bay): non-spot only Aug 3–Oct 15; depth limit 175 ft; release all spot shrimp.\n' +
      '✅ MA 7E, 8-1, 8-2, 9, 11, 13: Non-spot only through Oct 15 — depth limits apply.\n\n' +
      '🚫 MA 7 West: CLOSED (spot shrimp quota met).\n' +
      '🚫 MA 7S, MA 10, MA 12, Discovery Bay Shrimp District: CLOSED.\n\n' +
      'Pots set/pulled 1 hr before sunrise to 1 hr after sunset. All traps out when season is closed. Heads must be retained until ashore.',
    activeFrom: '2026-06-29',
    activeTo: '2026-10-15',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/puget-sound-shrimp-fishery-update-2026-07',
  },

  // ── ENTIAT RIVER CHINOOK OPEN (single river — not statewide enough for featured)
  {
    id: 'du-entiat-chinook-2026',
    category: 'salmon-freshwater',
    priority: 'highlight',
    featured: false,
    featuredLabel: 'Season Opening',
    icon: '🎣',
    headline: 'Entiat River open for summer Chinook — until further notice',
    subtext: 'Entiat River, mouth to Mad River Road Bridge · limit 6',
    detail:
      'The Entiat River (mouth to Mad River Road Bridge near Ardenvoir) is open for summer Chinook until further notice.\n\n' +
      'Daily limit: 6 Chinook, minimum 12".\n' +
      'Release all salmon other than Chinook. Night closure in effect.\n\n' +
      '⚠️ May close on short notice — always verify at wdfw.wa.gov before fishing.\n\n' +
      'This fishery opened July 9 as an alternative to the mainstem Columbia, following lower-than-forecast Columbia summer Chinook returns.',
    activeFrom: '2026-07-09',
    activeTo: null,
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/entiat-river-open-summer-chinook-fishing-2026-07',
  },

  // ── SKYKOMISH RIVER — ALL SPECIES CLOSED ─────────────────────────────────────
  {
    id: 'du-skykomish-closed-2026',
    category: 'salmon-freshwater',
    priority: 'alert',
    featured: true,
    featuredLabel: 'Season Closure',
    icon: '🚫',
    headline: 'Skykomish River CLOSED to all fishing through Oct 31',
    subtext: 'Mouth to North/South Fork confluence · overrides all pamphlet seasons',
    detail:
      '🚨 The Skykomish River (mouth to North/South Fork confluence) is CLOSED to all fishing through October 31, 2026. This overrides ALL pamphlet seasons, including Wallace River Hatchery Chinook and Reiter Ponds steelhead.\n\n' +
      'Closure reason: Critically low wild Chinook forecast. Snohomish Basin-wide protections.\n\n' +
      '⚠️ Verify status of any Snohomish Basin tributary before fishing — some may be affected by basin-wide restrictions.',
    activeFrom: '2026-06-02',
    activeTo: '2026-10-31',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/skykomish-river-fishing-will-not-open-until-nov-1-2026-06',
  },

  // ── COASTAL SALMON SEASONS OPEN ───────────────────────────────────────────────
  {
    id: 'du-coastal-salmon-2026',
    category: 'salmon-marine',
    priority: 'info',
    featured: true,
    featuredLabel: 'Season Open',
    icon: '🐟',
    headline: 'Coastal salmon seasons open Jun 20 – Sep 30',
    subtext: 'Marine Areas 1–4 (Ilwaco, Westport, La Push, Neah Bay)',
    detail:
      'Coastal and ocean salmon seasons are open through September 30, 2026:\n\n' +
      '✅ MA 1 (Ilwaco): Daily limit 2 (≤1 Chinook). Chinook min 22", coho min 16". Release wild coho.\n' +
      '✅ MA 2 (Westport / Ocean Shores): Daily limit 2 (≤1 Chinook). Chinook min 22", coho min 16". Release wild coho. Willapa Bay (2-1) same rules through Jul 31.\n' +
      '✅ MA 3 (La Push): Aug 1–Sep 30: limit 2, Chinook min 24", coho min 16". Release chum & wild coho.\n' +
      '✅ MA 4 (Neah Bay): Aug 1–Sep 30: limit 2, coho min 16". Release Chinook (east side), chum, and wild coho. Kydaka Point Area closed to salmon through Aug 15.\n\n' +
      'Columbia River Control Zone (MA 1): closed except from north jetty when adjacent waters are open.',
    activeFrom: '2026-06-20',
    activeTo: '2026-09-30',
    wdfw_url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/marine-area-1-ilwaco-recreational-salmon-season-2026-06',
  },
]

// ─── FILTER FUNCTION ──────────────────────────────────────────────────────────

/**
 * Returns featured DailyUpdates active on the given date, sorted by priority then
 * activeFrom descending (newest first within same priority).
 *
 * Only items with featured: true are included — minor restriction changes are
 * excluded from the banner. Future automated monitors should set featured: false
 * for small bag-limit tweaks, single-area closures, etc.
 *
 * Priority order: alert → highlight → info
 */
export function getDailyUpdatesForDate(date: Date): DailyUpdate[] {
  const d = date.toISOString().slice(0, 10)
  const PRIORITY_ORDER: Record<UpdatePriority, number> = { alert: 0, highlight: 1, info: 2 }

  return DAILY_UPDATES
    .filter(u => {
      if (!u.featured) return false
      if (u.activeFrom > d) return false
      if (u.activeTo && u.activeTo < d) return false
      return true
    })
    .sort((a, b) => {
      const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (pd !== 0) return pd
      // Newest activeFrom first within same priority
      return b.activeFrom.localeCompare(a.activeFrom)
    })
    // Hard cap: never show more than 5 cards in the featured popup
    .slice(0, 5)
}

/** Returns the count of featured items that became active today (for "new" badge). */
export function getNewUpdatesCount(date: Date): number {
  const d = date.toISOString().slice(0, 10)
  return DAILY_UPDATES.filter(u => u.featured && u.activeFrom === d && (!u.activeTo || u.activeTo >= d)).length
}
