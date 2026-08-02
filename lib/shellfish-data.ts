/**
 * shellfish-data.ts — CastWA shellfish beach data layer
 *
 * STATUS: Scaffolding + mock data for UI development.
 * Real data should come from:
 *   • DOH ArcGIS Biotoxin_v4 MapServer (safety/biotoxin closures)
 *   • WDFW regulation pamphlet API / scrape (legal seasons)
 *
 * ─── INTEGRATION TODOs ────────────────────────────────────────────────────────
 *
 * TODO-1 (DOH Safety Layer):
 *   Fetch DOH ArcGIS FeatureServer nightly:
 *   https://fortress.wa.gov/doh/eh/maps/Biotoxin_v4/MapServer/6
 *   Layer 6 = beach lines (geometry + STATUS field).
 *   Layer 7 = closure polygons.
 *   Layer 13 = biotoxin advisories.
 *   Layer 16 = growing area status (pollution/vibrio).
 *   Map STATUS codes: "Open" → doh.status='safe', "Closed" → 'biotoxin_closed',
 *   "Conditionally Approved" → 'advisory', "Prohibited" → 'pollution_closed'.
 *   Store as Supabase table `shellfish_beaches` refreshed by Edge Function on cron.
 *
 * TODO-2 (WDFW Legal Season Layer):
 *   Parse WDFW shellfish regulation pamphlet (published annually, PDF + web):
 *   https://wdfw.wa.gov/fishing/shellfish
 *   Key fields: open season dates, daily bag limit, size limit, gear restrictions.
 *   Current year pamphlet: https://wdfw.wa.gov/publications/02132
 *
 * TODO-3 (Geometry):
 *   Replace mock `coords` polylines with real beach segment geometry from DOH
 *   ArcGIS layer 6 (beach line features). These are georeferenced shoreline
 *   segments that align with the DOH beach IDs.
 *
 * TODO-4 (Combined Status Logic):
 *   Override rule: status = MOST RESTRICTIVE of (DOH safety ∩ WDFW legal).
 *   Green (open) only when: doh.status==='safe' AND wdfw.status==='open'.
 *   Red (closed) when: either DOH closed OR WDFW closed.
 *   Amber (advisory) when: DOH advisory OR data is stale (>48h old).
 *   Grey (unknown) when: no data found for this beach.
 *
 * TODO-5 (Staleness Guard):
 *   If lastOfficialUpdate is > 48h old, downgrade status to 'unknown' in the UI
 *   and show a warning banner.
 *
 * TODO-6 (Razor Clam Digs):
 *   WDFW publishes specific dig dates for each coastal beach. These are NOT
 *   continuous seasons — they are event-based. Fetch from:
 *   https://wdfw.wa.gov/fishing/shellfish/razor-clams/beaches
 *   and display "No dig scheduled" vs "Dig: [dates]".
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ShellfishStatus = 'open' | 'closed' | 'advisory' | 'unknown'

export type ShellfishSpecies = 'clam' | 'oyster' | 'mussel' | 'razor_clam' | 'geoduck'

export interface ShellfishBeach {
  id: string
  name: string
  region: string
  /** Shoreline polyline: [lat, lng][] — 2–6 points along the beach */
  coords: [number, number][]
  /** Combined conservative status (most restrictive of DOH + WDFW) */
  status: ShellfishStatus
  species: ShellfishSpecies[]

  /** DOH biotoxin / sanitation safety status */
  doh: {
    status: 'safe' | 'biotoxin_closed' | 'pollution_closed' | 'advisory' | 'unknown'
    detail: string
    /** ISO date string when DOH last updated this beach's status */
    lastChecked: string
  }

  /** WDFW legal season / regulation info */
  wdfw: {
    status: 'open' | 'closed' | 'limited' | 'unknown'
    seasonNote: string
    dailyLimit: string | null
    gearRestriction: string | null
    licenseRequired: boolean
    licenseNote: string | null
  }

  /** Public access & land ownership info */
  access: {
    type: 'public_beach' | 'state_park' | 'dnr_tidelands' | 'tribal' | 'private' | 'unknown'
    note: string
    permitRequired: boolean
  }

  /** ISO date of most recent official data update (DOH or WDFW, whichever is newer) */
  lastOfficialUpdate: string

  /** Official resource links shown in the sheet */
  officialLinks: Array<{ label: string; url: string }>

  /** Flag whether this record uses live API data or static mock data */
  dataSource: 'mock' | 'doh_api' | 'wdfw_api' | 'manual'
}

// ─── COLOR HELPERS ────────────────────────────────────────────────────────────

export function shellfishStatusColor(status: ShellfishStatus): string {
  switch (status) {
    case 'open':     return '#4ade80'   // var(--status-open-bright)
    case 'closed':   return '#ef4444'   // var(--live)
    case 'advisory': return '#f59e0b'   // var(--amber)
    case 'unknown':  return 'rgba(107,114,128,0.55)'
  }
}

export function shellfishStatusLabel(status: ShellfishStatus): string {
  switch (status) {
    case 'open':     return 'OPEN'
    case 'closed':   return 'CLOSED'
    case 'advisory': return 'ADVISORY'
    case 'unknown':  return 'UNKNOWN'
  }
}

export function shellfishStatusAnswer(status: ShellfishStatus): string {
  switch (status) {
    case 'open':     return 'Yes — harvesting currently allowed'
    case 'closed':   return 'No — this beach is closed'
    case 'advisory': return 'Use caution — advisory in effect'
    case 'unknown':  return 'Unknown — verify before harvesting'
  }
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// NOTE: All data below is MOCK / approximate for UI scaffolding.
// Statuses reflect plausible Aug 2026 conditions but are NOT verified.
// Replace via TODO-1 through TODO-4 above.

export const SHELLFISH_BEACHES: ShellfishBeach[] = [

  // ── HOOD CANAL ──────────────────────────────────────────────────────────────
  {
    id: 'dosewallips-sp',
    name: 'Dosewallips State Park',
    region: 'Hood Canal',
    coords: [
      [47.685, -122.906],
      [47.692, -122.903],
      [47.698, -122.899],
    ],
    status: 'advisory',
    species: ['clam', 'oyster', 'mussel'],
    doh: {
      status: 'advisory',
      detail: 'Biotoxin (PSP) levels elevated. Lab sampling in progress. Do not harvest bivalves until cleared.',
      lastChecked: '2026-08-01',
    },
    wdfw: {
      status: 'open',
      seasonNote: 'Clams and oysters open year-round when DOH safety status allows.',
      dailyLimit: '40 clams or 18 oysters per person',
      gearRestriction: 'Hand harvest only; no mechanical devices',
      licenseRequired: true,
      licenseNote: 'Shellfish/seaweed license required (age 15+)',
    },
    access: {
      type: 'state_park',
      note: 'Day-use parking fee applies. Walk-in beach access from park.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-08-01',
    officialLinks: [
      { label: 'DOH Beach Status', url: 'https://fortress.wa.gov/doh/eh/portal/sf/default.aspx' },
      { label: 'WDFW Hood Canal', url: 'https://wdfw.wa.gov/fishing/shellfish/clams-mussels-oysters/recreational' },
    ],
    dataSource: 'mock',
  },

  {
    id: 'twanoh-sp',
    name: 'Twanoh State Park',
    region: 'Hood Canal',
    coords: [
      [47.375, -123.010],
      [47.370, -123.018],
      [47.366, -123.025],
    ],
    status: 'closed',
    species: ['clam', 'oyster', 'mussel'],
    doh: {
      status: 'biotoxin_closed',
      detail: 'CLOSED — Paralytic Shellfish Poison (PSP) levels exceed safe limits. Closure effective Jul 15, 2026.',
      lastChecked: '2026-08-01',
    },
    wdfw: {
      status: 'open',
      seasonNote: 'WDFW season is open, but DOH biotoxin closure supersedes. Do not harvest.',
      dailyLimit: '40 clams or 18 oysters per person',
      gearRestriction: 'Hand harvest only',
      licenseRequired: true,
      licenseNote: 'Shellfish/seaweed license required (age 15+)',
    },
    access: {
      type: 'state_park',
      note: 'State park day-use access. Parking fee.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-07-15',
    officialLinks: [
      { label: 'DOH Beach Status', url: 'https://fortress.wa.gov/doh/eh/portal/sf/default.aspx' },
      { label: 'DOH PSP Hotline', url: 'https://www.doh.wa.gov/CommunityandEnvironment/Shellfish/RecreationalShellfish/Biotoxins' },
    ],
    dataSource: 'mock',
  },

  {
    id: 'potlatch-sp',
    name: 'Potlatch State Park',
    region: 'Hood Canal',
    coords: [
      [47.356, -123.152],
      [47.362, -123.146],
      [47.368, -123.140],
    ],
    status: 'closed',
    species: ['clam', 'oyster', 'mussel'],
    doh: {
      status: 'biotoxin_closed',
      detail: 'CLOSED — PSP levels unsafe. Harvest prohibited for all bivalve shellfish.',
      lastChecked: '2026-08-01',
    },
    wdfw: {
      status: 'open',
      seasonNote: 'Year-round season when DOH status is safe. Currently overridden by biotoxin closure.',
      dailyLimit: '40 clams or 18 oysters per person',
      gearRestriction: 'Hand harvest only',
      licenseRequired: true,
      licenseNote: 'Shellfish/seaweed license required (age 15+)',
    },
    access: {
      type: 'state_park',
      note: 'Excellent beach access. Camping available.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-08-01',
    officialLinks: [
      { label: 'DOH Beach Status', url: 'https://fortress.wa.gov/doh/eh/portal/sf/default.aspx' },
    ],
    dataSource: 'mock',
  },

  {
    id: 'quilcene-bay',
    name: 'Quilcene Bay',
    region: 'Hood Canal',
    coords: [
      [47.818, -122.878],
      [47.825, -122.872],
      [47.832, -122.868],
    ],
    status: 'open',
    species: ['oyster', 'clam'],
    doh: {
      status: 'safe',
      detail: 'DOH growing area approved. Biotoxin levels within safe range as of last sampling.',
      lastChecked: '2026-07-30',
    },
    wdfw: {
      status: 'open',
      seasonNote: 'Oysters and clams open year-round in approved areas of Quilcene Bay.',
      dailyLimit: '18 oysters per person; 40 clams per person',
      gearRestriction: 'Hand harvest only on DNR tidelands',
      licenseRequired: true,
      licenseNote: 'Shellfish/seaweed license required. Check DNR tidelands lease status — some areas are private aquaculture.',
    },
    access: {
      type: 'dnr_tidelands',
      note: 'Portions of tidelands are public DNR lands. Some areas privately leased for aquaculture — do not harvest from leased beds.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-07-30',
    officialLinks: [
      { label: 'DOH Beach Status', url: 'https://fortress.wa.gov/doh/eh/portal/sf/default.aspx' },
      { label: 'DNR Tidelands', url: 'https://www.dnr.wa.gov/programs-initiatives/aquatic-resources/recreation/shellfish-and-seaweed' },
    ],
    dataSource: 'mock',
  },

  // ── SOUTH PUGET SOUND ───────────────────────────────────────────────────────
  {
    id: 'totten-inlet',
    name: 'Totten Inlet',
    region: 'South Puget Sound',
    coords: [
      [47.164, -122.960],
      [47.172, -122.948],
      [47.180, -122.935],
    ],
    status: 'advisory',
    species: ['oyster', 'clam', 'mussel'],
    doh: {
      status: 'advisory',
      detail: 'Elevated fecal coliform levels detected near stormwater outfall. Conditional approval with restrictions. Do not harvest within 100m of outfall.',
      lastChecked: '2026-07-28',
    },
    wdfw: {
      status: 'limited',
      seasonNote: 'Open in DOH-approved portions only. Some tidelands are private aquaculture — look for posted signs.',
      dailyLimit: '18 oysters; 40 clams per person',
      gearRestriction: null,
      licenseRequired: true,
      licenseNote: 'Shellfish/seaweed license required (age 15+)',
    },
    access: {
      type: 'dnr_tidelands',
      note: 'Mix of public DNR tidelands and private aquaculture leases. Look for posted markers.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-07-28',
    officialLinks: [
      { label: 'DOH Beach Status', url: 'https://fortress.wa.gov/doh/eh/portal/sf/default.aspx' },
      { label: 'WDFW South Sound', url: 'https://wdfw.wa.gov/fishing/shellfish/clams-mussels-oysters/recreational' },
    ],
    dataSource: 'mock',
  },

  {
    id: 'henderson-inlet',
    name: 'Henderson Inlet',
    region: 'South Puget Sound',
    coords: [
      [47.075, -122.822],
      [47.082, -122.815],
      [47.090, -122.808],
    ],
    status: 'closed',
    species: ['clam', 'oyster'],
    doh: {
      status: 'pollution_closed',
      detail: 'CLOSED — Prohibited area due to chronic fecal coliform pollution from urban runoff. Permanent closure designation.',
      lastChecked: '2026-08-01',
    },
    wdfw: {
      status: 'closed',
      seasonNote: 'Closed — superseded by DOH permanent pollution closure.',
      dailyLimit: null,
      gearRestriction: null,
      licenseRequired: false,
      licenseNote: null,
    },
    access: {
      type: 'public_beach',
      note: 'Beach accessible but shellfish harvest permanently prohibited due to pollution.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-08-01',
    officialLinks: [
      { label: 'DOH Beach Status', url: 'https://fortress.wa.gov/doh/eh/portal/sf/default.aspx' },
    ],
    dataSource: 'mock',
  },

  {
    id: 'case-inlet',
    name: 'Case Inlet (Penrose Point)',
    region: 'South Puget Sound',
    coords: [
      [47.318, -122.850],
      [47.326, -122.844],
      [47.334, -122.838],
    ],
    status: 'open',
    species: ['clam', 'oyster'],
    doh: {
      status: 'safe',
      detail: 'Growing area conditionally approved. Biotoxin and fecal coliform within acceptable limits.',
      lastChecked: '2026-07-31',
    },
    wdfw: {
      status: 'open',
      seasonNote: 'Clams and oysters open year-round when DOH approves. Check DOH status before each trip.',
      dailyLimit: '18 oysters or 40 clams per person per day',
      gearRestriction: 'Hand harvest only',
      licenseRequired: true,
      licenseNote: 'Shellfish/seaweed license required (age 15+)',
    },
    access: {
      type: 'state_park',
      note: 'Penrose Point State Park. Walk to beach from park. Day-use parking.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-07-31',
    officialLinks: [
      { label: 'DOH Beach Status', url: 'https://fortress.wa.gov/doh/eh/portal/sf/default.aspx' },
      { label: 'WDFW Shellfish', url: 'https://wdfw.wa.gov/fishing/shellfish/clams-mussels-oysters/recreational' },
    ],
    dataSource: 'mock',
  },

  // ── NORTH PUGET SOUND / WHIDBEY ─────────────────────────────────────────────
  {
    id: 'penn-cove',
    name: 'Penn Cove (Whidbey Island)',
    region: 'North Sound',
    coords: [
      [48.218, -122.718],
      [48.225, -122.700],
      [48.230, -122.682],
    ],
    status: 'advisory',
    species: ['mussel', 'clam', 'oyster'],
    doh: {
      status: 'advisory',
      detail: 'Diarrhetic Shellfish Poison (DSP) advisory in effect for mussels. Clams and oysters currently safe.',
      lastChecked: '2026-07-30',
    },
    wdfw: {
      status: 'limited',
      seasonNote: 'Sport harvest allowed in public tidelands only. Penn Cove Shellfish commercial beds — do not harvest from leased areas.',
      dailyLimit: '18 oysters or 40 clams or 10 lbs mussels per person',
      gearRestriction: 'Hand harvest only; no rakes in mussel beds',
      licenseRequired: true,
      licenseNote: 'Shellfish/seaweed license required (age 15+)',
    },
    access: {
      type: 'public_beach',
      note: 'Public tidelands near Coupeville wharf. Active commercial mussel farm — stay in public areas.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-07-30',
    officialLinks: [
      { label: 'DOH Beach Status', url: 'https://fortress.wa.gov/doh/eh/portal/sf/default.aspx' },
      { label: 'WDFW Shellfish', url: 'https://wdfw.wa.gov/fishing/shellfish/clams-mussels-oysters/recreational' },
    ],
    dataSource: 'mock',
  },

  {
    id: 'birch-bay',
    name: 'Birch Bay',
    region: 'Northwest',
    coords: [
      [48.896, -122.783],
      [48.903, -122.774],
      [48.910, -122.765],
    ],
    status: 'open',
    species: ['clam'],
    doh: {
      status: 'safe',
      detail: 'Growing area approved. Biotoxin and pollution levels within safe limits.',
      lastChecked: '2026-08-01',
    },
    wdfw: {
      status: 'open',
      seasonNote: 'Manila and native littleneck clams open year-round subject to DOH status.',
      dailyLimit: '40 clams per person per day (must be 1½" or larger)',
      gearRestriction: 'Hand harvest; small clam guns/forks OK',
      licenseRequired: true,
      licenseNote: 'Shellfish/seaweed license required (age 15+)',
    },
    access: {
      type: 'state_park',
      note: 'Birch Bay State Park. Easy beach access. Popular family destination.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-08-01',
    officialLinks: [
      { label: 'DOH Beach Status', url: 'https://fortress.wa.gov/doh/eh/portal/sf/default.aspx' },
      { label: 'WDFW Shellfish', url: 'https://wdfw.wa.gov/fishing/shellfish/clams-mussels-oysters/recreational' },
    ],
    dataSource: 'mock',
  },

  // ── OLYMPIC PENINSULA ───────────────────────────────────────────────────────
  {
    id: 'dungeness-spit',
    name: 'Dungeness Spit',
    region: 'Olympic Peninsula',
    coords: [
      [48.148, -123.174],
      [48.160, -123.156],
      [48.172, -123.138],
      [48.182, -123.120],
    ],
    status: 'open',
    species: ['clam', 'oyster'],
    doh: {
      status: 'safe',
      detail: 'Clean, approved area. Dungeness Bay is well-monitored. Biotoxin levels safe.',
      lastChecked: '2026-08-01',
    },
    wdfw: {
      status: 'open',
      seasonNote: 'Dungeness Bay clams and oysters open year-round in approved areas. Dungeness crab also popular here.',
      dailyLimit: '40 clams per person; 18 oysters per person',
      gearRestriction: 'Hand harvest only inside National Wildlife Refuge (most of the spit)',
      licenseRequired: true,
      licenseNote: 'Shellfish/seaweed license required. Federal Wildlife Refuge permit also required — free at refuge office.',
    },
    access: {
      type: 'public_beach',
      note: 'Dungeness National Wildlife Refuge. Entry fee ($3/family). 5.5-mile round trip to lighthouse.',
      permitRequired: true,
    },
    lastOfficialUpdate: '2026-08-01',
    officialLinks: [
      { label: 'DOH Beach Status', url: 'https://fortress.wa.gov/doh/eh/portal/sf/default.aspx' },
      { label: 'Dungeness NWR', url: 'https://www.fws.gov/refuge/dungeness' },
    ],
    dataSource: 'mock',
  },

  {
    id: 'discovery-bay',
    name: 'Discovery Bay',
    region: 'Olympic Peninsula',
    coords: [
      [48.063, -122.886],
      [48.072, -122.878],
      [48.081, -122.870],
    ],
    status: 'open',
    species: ['clam', 'oyster'],
    doh: {
      status: 'safe',
      detail: 'Growing area approved. Good water quality. Recent sampling shows safe biotoxin levels.',
      lastChecked: '2026-07-29',
    },
    wdfw: {
      status: 'open',
      seasonNote: 'Manila and littleneck clams, oysters — open year-round when DOH approves.',
      dailyLimit: '40 clams per person; 18 oysters per person',
      gearRestriction: 'Hand harvest only',
      licenseRequired: true,
      licenseNote: 'Shellfish/seaweed license required (age 15+)',
    },
    access: {
      type: 'dnr_tidelands',
      note: 'DNR public tidelands available. Some private parcels — look for posted signs.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-07-29',
    officialLinks: [
      { label: 'DOH Beach Status', url: 'https://fortress.wa.gov/doh/eh/portal/sf/default.aspx' },
    ],
    dataSource: 'mock',
  },

  // ── PACIFIC COAST — RAZOR CLAMS ─────────────────────────────────────────────
  {
    id: 'long-beach',
    name: 'Long Beach Peninsula',
    region: 'Pacific Coast',
    coords: [
      [46.335, -124.058],
      [46.380, -124.060],
      [46.430, -124.062],
      [46.480, -124.063],
    ],
    status: 'closed',
    species: ['razor_clam'],
    doh: {
      status: 'safe',
      detail: 'Beach sanitation is safe. No biotoxin concerns.',
      lastChecked: '2026-08-01',
    },
    wdfw: {
      status: 'closed',
      seasonNote: 'No razor clam dig currently scheduled. WDFW schedules specific dig events in fall/winter based on razor clam population surveys. Next season typically opens Oct–Mar.',
      dailyLimit: null,
      gearRestriction: null,
      licenseRequired: false,
      licenseNote: 'Shellfish/seaweed license required when season opens',
    },
    access: {
      type: 'public_beach',
      note: 'Washington State public beach. Razor clam digs are some of the most popular events in WA — thousands of diggers attend approved dig dates.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-08-01',
    officialLinks: [
      { label: 'WDFW Razor Clam Digs', url: 'https://wdfw.wa.gov/fishing/shellfish/razor-clams' },
      { label: 'Dig Schedule', url: 'https://wdfw.wa.gov/fishing/shellfish/razor-clams/beaches/long-beach' },
    ],
    dataSource: 'mock',
  },

  {
    id: 'twin-harbors',
    name: 'Twin Harbors Beach',
    region: 'Pacific Coast',
    coords: [
      [46.844, -124.112],
      [46.862, -124.113],
      [46.880, -124.114],
    ],
    status: 'closed',
    species: ['razor_clam'],
    doh: {
      status: 'safe',
      detail: 'Beach sanitation safe. No biotoxin issues.',
      lastChecked: '2026-08-01',
    },
    wdfw: {
      status: 'closed',
      seasonNote: 'No dig scheduled. WDFW conducts population surveys in Sep–Oct and announces fall dig dates. Sign up for WDFW email alerts.',
      dailyLimit: null,
      gearRestriction: null,
      licenseRequired: false,
      licenseNote: 'License required when open',
    },
    access: {
      type: 'state_park',
      note: 'Twin Harbors State Park. Camping available. Beach driving permitted for razor clam access.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-08-01',
    officialLinks: [
      { label: 'WDFW Razor Clam Digs', url: 'https://wdfw.wa.gov/fishing/shellfish/razor-clams' },
    ],
    dataSource: 'mock',
  },

  {
    id: 'copalis-beach',
    name: 'Copalis Beach',
    region: 'Pacific Coast',
    coords: [
      [47.118, -124.180],
      [47.140, -124.181],
      [47.160, -124.182],
    ],
    status: 'closed',
    species: ['razor_clam'],
    doh: {
      status: 'safe',
      detail: 'Sanitation safe. No biotoxin issues currently.',
      lastChecked: '2026-08-01',
    },
    wdfw: {
      status: 'closed',
      seasonNote: 'Closed — no razor clam dig currently approved. WDFW manages harvest based on population surveys. Check WDFW website for next approved dig dates.',
      dailyLimit: null,
      gearRestriction: null,
      licenseRequired: false,
      licenseNote: 'License required when digs are open',
    },
    access: {
      type: 'public_beach',
      note: 'Public ocean beach. No fee for beach access.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-08-01',
    officialLinks: [
      { label: 'WDFW Razor Clam Digs', url: 'https://wdfw.wa.gov/fishing/shellfish/razor-clams' },
    ],
    dataSource: 'mock',
  },

  {
    id: 'mocrocks',
    name: 'Mocrocks Beach',
    region: 'Pacific Coast',
    coords: [
      [47.188, -124.188],
      [47.206, -124.189],
      [47.222, -124.190],
    ],
    status: 'closed',
    species: ['razor_clam'],
    doh: {
      status: 'safe',
      detail: 'No safety issues. Beach sanitation within acceptable limits.',
      lastChecked: '2026-08-01',
    },
    wdfw: {
      status: 'closed',
      seasonNote: 'No dig scheduled for summer. Fall/winter dig dates will be announced after population surveys.',
      dailyLimit: null,
      gearRestriction: null,
      licenseRequired: false,
      licenseNote: 'License required when open',
    },
    access: {
      type: 'public_beach',
      note: 'Pacific ocean beach north of Copalis. Beach driving allowed during approved digs.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-08-01',
    officialLinks: [
      { label: 'WDFW Razor Clam Digs', url: 'https://wdfw.wa.gov/fishing/shellfish/razor-clams' },
    ],
    dataSource: 'mock',
  },

  // ── WILLAPA BAY ─────────────────────────────────────────────────────────────
  {
    id: 'willapa-bay-nahcotta',
    name: 'Willapa Bay (Nahcotta)',
    region: 'Southwest Coast',
    coords: [
      [46.493, -124.043],
      [46.505, -124.038],
      [46.515, -124.033],
    ],
    status: 'open',
    species: ['oyster', 'clam'],
    doh: {
      status: 'safe',
      detail: 'Willapa Bay is one of the cleanest bays in the US. DOH growing area fully approved.',
      lastChecked: '2026-08-01',
    },
    wdfw: {
      status: 'open',
      seasonNote: 'Pacific oysters and manila clams open year-round in public DNR tidelands. One of the most productive shellfish areas in WA.',
      dailyLimit: '18 oysters per person; 40 clams per person',
      gearRestriction: 'Hand harvest only on public tidelands',
      licenseRequired: true,
      licenseNote: 'Shellfish/seaweed license required (age 15+)',
    },
    access: {
      type: 'dnr_tidelands',
      note: 'Public DNR tidelands available near Nahcotta. Large areas of private oyster beds — do not harvest from marked commercial areas.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-08-01',
    officialLinks: [
      { label: 'DOH Beach Status', url: 'https://fortress.wa.gov/doh/eh/portal/sf/default.aspx' },
      { label: 'Willapa Bay Info', url: 'https://wdfw.wa.gov/fishing/shellfish/clams-mussels-oysters/recreational' },
    ],
    dataSource: 'mock',
  },

  // ── GRAYS HARBOR ────────────────────────────────────────────────────────────
  {
    id: 'grays-harbor',
    name: 'Grays Harbor (Westport)',
    region: 'Pacific Coast',
    coords: [
      [46.878, -124.088],
      [46.886, -124.094],
      [46.894, -124.100],
    ],
    status: 'unknown',
    species: ['clam', 'oyster', 'razor_clam'],
    doh: {
      status: 'unknown',
      detail: 'Data unavailable. Contact DOH or check the biotoxin hotline before harvesting.',
      lastChecked: '2026-07-15',
    },
    wdfw: {
      status: 'unknown',
      seasonNote: 'Check current WDFW regulations — Grays Harbor has complex area-specific rules.',
      dailyLimit: null,
      gearRestriction: null,
      licenseRequired: true,
      licenseNote: 'Shellfish/seaweed license required',
    },
    access: {
      type: 'public_beach',
      note: 'Various public access points in and around Westport.',
      permitRequired: false,
    },
    lastOfficialUpdate: '2026-07-15',
    officialLinks: [
      { label: 'DOH Biotoxin Hotline', url: 'https://www.doh.wa.gov/CommunityandEnvironment/Shellfish/RecreationalShellfish/Biotoxins' },
      { label: 'WDFW Shellfish', url: 'https://wdfw.wa.gov/fishing/shellfish/clams-mussels-oysters/recreational' },
    ],
    dataSource: 'mock',
  },
]

// ─── PHONE NUMBERS ───────────────────────────────────────────────────────────
export const DOH_BIOTOXIN_HOTLINE = '1-800-562-5632'
export const WDFW_INFO_LINE = '360-902-2200'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function dohStatusLabel(status: ShellfishBeach['doh']['status']): string {
  switch (status) {
    case 'safe':             return 'Safe to harvest'
    case 'biotoxin_closed':  return 'Biotoxin closure (PSP/DSP)'
    case 'pollution_closed': return 'Pollution closure'
    case 'advisory':         return 'Advisory — elevated risk'
    case 'unknown':          return 'Status unknown'
  }
}

export function wdfwStatusLabel(status: ShellfishBeach['wdfw']['status']): string {
  switch (status) {
    case 'open':    return 'Season open'
    case 'closed':  return 'Season closed'
    case 'limited': return 'Open with restrictions'
    case 'unknown': return 'Unknown — verify with WDFW'
  }
}

export function speciesLabel(s: ShellfishSpecies): string {
  switch (s) {
    case 'clam':       return 'Clams'
    case 'oyster':     return 'Oysters'
    case 'mussel':     return 'Mussels'
    case 'razor_clam': return 'Razor Clams'
    case 'geoduck':    return 'Geoduck'
  }
}
