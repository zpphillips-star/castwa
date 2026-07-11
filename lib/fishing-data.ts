export type Habitat = 'river' | 'lake' | 'salt' | 'shellfish'

export type Species = {
  id: string
  name: string
  category: 'Salmon' | 'Trout' | 'Steelhead' | 'Bass' | 'Panfish' | 'Marine'
  habitats: Habitat[]   // where you fish for this species
  peakMonths: number[]  // 1=Jan..12=Dec
  photo: string
  description: string
}

export type WaterBody = {
  id: string
  name: string
  type: 'river' | 'lake' | 'stream' | 'sound' | 'bay'
  lat: number
  lng: number
  region: string
}

export type Regulation = {
  id: string
  speciesId: string
  waterBodyId: string
  seasonStart: string // MM-DD
  seasonEnd: string   // MM-DD
  dailyLimit: number | null
  minSize: number | null  // inches
  hatcheryOnly: boolean
  gearRestriction: string | null
  notes: string | null
  // Emergency override: if set and today falls within this range, reg is treated as CLOSED
  // regardless of seasonStart/seasonEnd. Format: 'YYYY-MM-DD'
  emergencyClosedFrom?: string | null
  emergencyClosedTo?: string | null
}

export const SPECIES: Species[] = [
  // Salmon
  { id: 'chinook',      name: 'Chinook Salmon',       category: 'Salmon',    habitats: ['river'],                   peakMonths: [7,8,9],               photo: '/fish/chinook-salmon.png',      description: 'The king of Pacific salmon, prized for its large size and rich flavor.' },
  { id: 'coho',         name: 'Coho Salmon',           category: 'Salmon',    habitats: ['river'],                   peakMonths: [9,10,11],               photo: '/fish/coho-salmon.png',         description: 'Known for their acrobatic fights and superb table fare.' },
  { id: 'sockeye',      name: 'Sockeye Salmon',        category: 'Salmon',    habitats: ['river', 'lake'],           peakMonths: [7,8],               photo: '/fish/sockeye-salmon.png',      description: 'Brilliant red flesh prized for flavor. Peak run July–August in WA lakes (Wenatchee, Chelan) and rivers (Skagit, Columbia). Most WA fisheries are hatchery-only — look for a clipped adipose fin.' },
  { id: 'chum',         name: 'Chum Salmon',           category: 'Salmon',    habitats: ['river'],                   peakMonths: [10,11],               photo: '/fish/chum-salmon.png',         description: 'Fall-run salmon found in coastal rivers and Puget Sound.' },
  { id: 'pink',         name: 'Pink Salmon',           category: 'Salmon',    habitats: ['river'],                   peakMonths: [8,9],                 photo: '/fish/pink-salmon.png',         description: 'The most abundant Pacific salmon. Runs every odd year (2025, 2027...) in Puget Sound rivers including Snohomish, Skagit, Nooksack, and Green. No closed season in even years — simply no fish present.' },
  { id: 'kokanee',      name: 'Kokanee',               category: 'Salmon',    habitats: ['lake'],                    peakMonths: [5,6,7],               photo: '/fish/kokanee.png',             description: 'Landlocked sockeye found in WA lakes; feisty and great eating.' },
  // Trout
  { id: 'rainbow',      name: 'Rainbow Trout',         category: 'Trout',     habitats: ['river', 'lake'],           peakMonths: [4,5,9,10],               photo: '/fish/rainbow-trout.png',       description: 'Washington\'s favorite freshwater sport fish, found statewide.' },
  { id: 'cutthroat',    name: 'Cutthroat Trout',       category: 'Trout',     habitats: ['river', 'lake'],           peakMonths: [4,5,6,10],               photo: '/fish/cutthroat-trout.png',     description: 'Native to Washington, identified by red slash marks on jaw.' },
  { id: 'bull',         name: 'Bull Trout',            category: 'Trout',     habitats: ['river'],                   peakMonths: [7,8,9],               photo: '/fish/bull-trout.png',          description: 'Threatened native trout; catch-and-release in most WA waters.' },
  { id: 'brook',        name: 'Brook Trout',           category: 'Trout',     habitats: ['river', 'lake'],           peakMonths: [6,7,8,9],               photo: '/fish/brook-trout.png',         description: 'Non-native but widely planted; colorful and fun to catch.' },
  { id: 'brown',        name: 'Brown Trout',           category: 'Trout',     habitats: ['river', 'lake'],           peakMonths: [4,5,9,10],               photo: '/fish/brown-trout.png',         description: 'Wary and hard to fool — a trophy catch in select WA rivers.' },
  { id: 'lake-trout',   name: 'Lake Trout',            category: 'Trout',     habitats: ['lake'],                    peakMonths: [5,6,10,11],               photo: '/fish/lake-trout.png',          description: 'Deep-water trout found in large eastern WA reservoirs.' },
  { id: 'whitefish',    name: 'Mountain Whitefish',    category: 'Trout',     habitats: ['river'],                   peakMonths: [1,2,12],               photo: '/fish/mountain-whitefish.png',  description: 'Abundant in clear WA rivers; underrated on a fly rod.' },
  // Steelhead
  { id: 'steelhead',    name: 'Steelhead',             category: 'Steelhead', habitats: ['river'],                   peakMonths: [1,2,3,12],               photo: '/fish/steelhead.png',           description: 'Sea-run rainbow trout and Washington\'s state fish. Winter and summer runs.' },
  // Bass & Pike
  { id: 'largemouth',   name: 'Largemouth Bass',       category: 'Bass',      habitats: ['lake'],                    peakMonths: [5,6,7,8],               photo: '/fish/largemouth-bass.png',     description: 'Popular game fish found in lowland lakes and slow rivers.' },
  { id: 'smallmouth',   name: 'Smallmouth Bass',       category: 'Bass',      habitats: ['lake', 'river'],           peakMonths: [6,7,8],               photo: '/fish/smallmouth-bass.png',     description: 'Pound-for-pound fighter found in rivers and rocky lakes.' },
  { id: 'muskie',       name: 'Tiger Muskie',          category: 'Bass',      habitats: ['lake'],                    peakMonths: [9,10,11],               photo: '/fish/tiger-muskie.png',        description: 'Rare trophy fish planted in select WA lakes; fierce predator.' },
  { id: 'pike',         name: 'Northern Pike',         category: 'Bass',      habitats: ['lake'],                    peakMonths: [3,4,9,10],               photo: '/fish/northern-pike.png',       description: 'Invasive predator in eastern WA; check regulations before keeping.' },
  { id: 'catfish',      name: 'Channel Catfish',       category: 'Bass',      habitats: ['lake', 'river'],           peakMonths: [6,7,8,9],               photo: '/fish/channel-catfish.png',     description: 'Found in warm slow rivers and reservoirs of eastern WA.' },
  // Panfish
  { id: 'walleye',      name: 'Walleye',               category: 'Panfish',   habitats: ['lake'],                    peakMonths: [5,6,9,10],               photo: '/fish/walleye.png',             description: 'Found primarily in eastern Washington lakes and rivers.' },
  { id: 'perch',        name: 'Yellow Perch',          category: 'Panfish',   habitats: ['lake'],                    peakMonths: [6,7,8],               photo: '/fish/yellow-perch.png',        description: 'Great eating and popular with families and beginners.' },
  { id: 'crappie',      name: 'Crappie',               category: 'Panfish',   habitats: ['lake'],                    peakMonths: [4,5,6],               photo: '/fish/crappie.png',             description: 'Prolific panfish found in warm lowland lakes statewide.' },
  { id: 'bluegill',     name: 'Bluegill',              category: 'Panfish',   habitats: ['lake'],                    peakMonths: [5,6,7],               photo: '/fish/bluegill.png',            description: 'Easy to catch, great for beginners and kids.' },
  { id: 'burbot',       name: 'Burbot',                category: 'Panfish',   habitats: ['lake'],                    peakMonths: [1,2,3],               photo: '/fish/burbot.png',              description: 'The only freshwater cod species; excellent eating, eastern WA lakes.' },
  { id: 'carp',         name: 'Common Carp',           category: 'Panfish',   habitats: ['lake', 'river'],           peakMonths: [5,6,7,8],               photo: '/fish/common-carp.png',         description: 'Widespread in WA lowlands; increasingly popular for sport fishing.' },
  // Freshwater other
  { id: 'sturgeon',     name: 'White Sturgeon',        category: 'Marine',    habitats: ['river'],                   peakMonths: [4,5,10,11],               photo: '/fish/sturgeon.png',            description: 'Ancient fish reaching 10+ feet; Columbia River famous for sturgeon.' },
  // Marine & Saltwater
  { id: 'crab',         name: 'Dungeness Crab',        category: 'Marine',    habitats: ['shellfish'],               peakMonths: [7,8,9],               photo: '/fish/dungeness-crab.png',      description: 'Iconic Pacific Northwest shellfish, found throughout Puget Sound.' },
  { id: 'rockfish',     name: 'Rockfish',              category: 'Marine',    habitats: ['salt'],                    peakMonths: [5,6,7,8,9],               photo: '/fish/rockfish.png',            description: 'Long-lived reef fish; many WA species, check regs carefully.' },
  { id: 'lingcod',      name: 'Lingcod',               category: 'Marine',    habitats: ['salt'],                    peakMonths: [11,12,1,2,3],               photo: '/fish/lingcod.png',             description: 'Aggressive ambush predator; prized for its flaky white meat.' },
  { id: 'cabezon',      name: 'Cabezon',               category: 'Marine',    habitats: ['salt'],                    peakMonths: [10,11,12,1],               photo: '/fish/cabezon.png',             description: 'Bottom-dwelling rockfish relative found in rocky nearshore areas.' },
  { id: 'halibut',      name: 'Pacific Halibut',       category: 'Marine',    habitats: ['salt'],                    peakMonths: [5,6,7,8],               photo: '/fish/pacific-halibut.png',     description: 'Massive flatfish; check IPHC season dates before targeting.' },
  { id: 'greenling',    name: 'Kelp Greenling',        category: 'Marine',    habitats: ['salt'],                    peakMonths: [6,7,8,9],               photo: '/fish/kelp-greenling.png',      description: 'Colorful nearshore fish found around kelp beds and rocky reefs.' },
  { id: 'cod',          name: 'Pacific Cod',           category: 'Marine',    habitats: ['salt'],                    peakMonths: [1,2,3,11,12],               photo: '/fish/pacific-cod.png',         description: 'Found in deeper Puget Sound waters; excellent table fish.' },
  { id: 'sablefish',    name: 'Sablefish',             category: 'Marine',    habitats: ['salt'],                    peakMonths: [5,6,7,8],               photo: '/fish/sablefish.png',           description: 'Also called black cod; rich buttery flesh, offshore and deep.' },
  { id: 'surfperch',    name: 'Surfperch',             category: 'Marine',    habitats: ['salt'],                    peakMonths: [5,6,7,8,9],               photo: '/fish/surfperch.png',           description: 'Abundant along WA beaches; great beginner saltwater fish.' },
  { id: 'flounder',     name: 'Flounder / Sole',       category: 'Marine',    habitats: ['salt'],                    peakMonths: [4,5,6,7,8],               photo: '/fish/flounder.png',            description: 'Flatfish found in sandy bays and estuaries around Puget Sound.' },
  { id: 'razorclam',    name: 'Razor Clam',            category: 'Marine',    habitats: ['shellfish'],               peakMonths: [10,11,12,1,2,3],               photo: '/fish/razor-clam.png',          description: 'WA coastal beaches open seasonally; check WDFW dig schedules.' },
  { id: 'shrimp',       name: 'Spot Shrimp',           category: 'Marine',    habitats: ['shellfish'],               peakMonths: [5],               photo: '/fish/spot-shrimp.png',         description: 'The sweetest shrimp on the planet; Puget Sound pot season in May.' },
  { id: 'skate',        name: 'Skate',                 category: 'Marine',    habitats: ['salt'],                    peakMonths: [3,4,5],               photo: '/fish/skate.png',               description: 'Ray-like flatfish caught incidentally in deeper WA waters.' },
  { id: 'herring',      name: 'Pacific Herring',       category: 'Marine',    habitats: ['salt'],                    peakMonths: [1,2,3],               photo: '/fish/pacific-herring.png',     description: 'Baitfish that supports the whole food chain; jigged in Puget Sound.' },
  { id: 'squid',        name: 'Market Squid',          category: 'Marine',    habitats: ['salt'],                    peakMonths: [12,1,2,3],               photo: '/fish/market-squid.png',        description: 'Night jigging for squid off docks is a WA winter tradition.' },
  { id: 'smelt',        name: 'Surf Smelt',            category: 'Marine',    habitats: ['salt'],                    peakMonths: [7,8],               photo: '/fish/surf-smelt.png',          description: 'Dip-netted from WA beaches in summer; great for frying.' },
]

export const WATER_BODIES: WaterBody[] = [
  { id: 'skagit', name: 'Skagit River', type: 'river', lat: 48.42, lng: -121.75, region: 'Northwest' },
  { id: 'snohomish', name: 'Snohomish River', type: 'river', lat: 47.93, lng: -122.09, region: 'Northwest' },
  { id: 'columbia', name: 'Columbia River', type: 'river', lat: 46.22, lng: -119.12, region: 'Southeast' },
  { id: 'snake', name: 'Snake River', type: 'river', lat: 46.52, lng: -117.03, region: 'Southeast' },
  { id: 'yakima', name: 'Yakima River', type: 'river', lat: 46.61, lng: -120.51, region: 'Central' },
  { id: 'green', name: 'Green River', type: 'river', lat: 47.36, lng: -122.07, region: 'Puget Sound' },
  { id: 'cedar', name: 'Cedar River', type: 'river', lat: 47.47, lng: -122.01, region: 'Puget Sound' },
  { id: 'sammamish', name: 'Lake Sammamish', type: 'lake', lat: 47.59, lng: -122.07, region: 'Puget Sound' },
  { id: 'washington', name: 'Lake Washington', type: 'lake', lat: 47.60, lng: -122.24, region: 'Puget Sound' },
  { id: 'chelan', name: 'Lake Chelan', type: 'lake', lat: 47.84, lng: -120.02, region: 'Central' },
  { id: 'roosevelt', name: 'Lake Roosevelt', type: 'lake', lat: 48.38, lng: -118.43, region: 'Northeast' },
  { id: 'banks', name: 'Banks Lake', type: 'lake', lat: 47.87, lng: -119.31, region: 'Central' },
  { id: 'puget', name: 'Puget Sound', type: 'sound', lat: 47.65, lng: -122.50, region: 'Puget Sound' },
  { id: 'hood', name: 'Hood Canal', type: 'bay', lat: 47.50, lng: -123.00, region: 'Olympic' },
  { id: 'willapa', name: 'Willapa Bay', type: 'bay', lat: 46.63, lng: -123.89, region: 'Coast' },
  // Additional Rivers
  { id: 'wenatchee', name: 'Wenatchee River', type: 'river', lat: 47.42, lng: -120.31, region: 'Central' },
  { id: 'methow', name: 'Methow River', type: 'river', lat: 48.32, lng: -120.10, region: 'Central' },
  { id: 'okanogan', name: 'Okanogan River', type: 'river', lat: 48.36, lng: -119.57, region: 'Northeast' },
  { id: 'cowlitz', name: 'Cowlitz River', type: 'river', lat: 46.45, lng: -122.82, region: 'Southwest' },
  { id: 'lewis', name: 'Lewis River', type: 'river', lat: 45.90, lng: -122.55, region: 'Southwest' },
  { id: 'chehalis', name: 'Chehalis River', type: 'river', lat: 46.99, lng: -123.38, region: 'Coast' },
  { id: 'nooksack', name: 'Nooksack River', type: 'river', lat: 48.74, lng: -122.27, region: 'Northwest' },
  { id: 'stillaguamish', name: 'Stillaguamish River', type: 'river', lat: 48.17, lng: -122.07, region: 'Northwest' },
  { id: 'sauk', name: 'Sauk River', type: 'river', lat: 48.40, lng: -121.57, region: 'Northwest' },
  { id: 'skykomish', name: 'Skykomish River', type: 'river', lat: 47.86, lng: -121.94, region: 'Northwest' },
  { id: 'white', name: 'White River', type: 'river', lat: 47.20, lng: -122.00, region: 'Puget Sound' },
  { id: 'puyallup', name: 'Puyallup River', type: 'river', lat: 47.26, lng: -122.42, region: 'Puget Sound' },
  { id: 'nisqually', name: 'Nisqually River', type: 'river', lat: 47.08, lng: -122.71, region: 'Puget Sound' },
  { id: 'hoh', name: 'Hoh River', type: 'river', lat: 47.87, lng: -124.17, region: 'Olympic' },
  { id: 'quinault-river', name: 'Quinault River', type: 'river', lat: 47.46, lng: -123.85, region: 'Olympic' },
  { id: 'bogachiel', name: 'Bogachiel River', type: 'river', lat: 47.87, lng: -124.25, region: 'Olympic' },
  // Additional Lakes
  { id: 'crescent', name: 'Lake Crescent', type: 'lake', lat: 48.05, lng: -123.80, region: 'Olympic' },
  { id: 'quinault-lake', name: 'Lake Quinault', type: 'lake', lat: 47.46, lng: -123.86, region: 'Olympic' },
  { id: 'ozette', name: 'Lake Ozette', type: 'lake', lat: 48.10, lng: -124.57, region: 'Olympic' },
  { id: 'wenatchee-lake', name: 'Lake Wenatchee', type: 'lake', lat: 47.83, lng: -120.73, region: 'Central' },
  // Marine Areas (Puget Sound)
  { id: 'marine-8-1', name: 'Marine Area 8-1 (Deception Pass / Skagit Bay)', type: 'sound', lat: 48.39, lng: -122.64, region: 'Northwest' },
  { id: 'marine-8-2', name: 'Marine Area 8-2 (Port Susan / Saratoga Passage)', type: 'sound', lat: 48.13, lng: -122.38, region: 'Northwest' },
  { id: 'marine-9', name: 'Marine Area 9 (Admiralty Inlet)', type: 'sound', lat: 48.00, lng: -122.70, region: 'Puget Sound' },
  { id: 'marine-10', name: 'Marine Area 10 (Seattle / Bainbridge / Kingston)', type: 'sound', lat: 47.62, lng: -122.47, region: 'Puget Sound' },

  // ── OLYMPIC PENINSULA RIVERS ─────────────────────────────────────────────────
  { id: 'sol-duc',      name: 'Sol Duc River',       type: 'river', lat: 48.02, lng: -124.00, region: 'Olympic' },
  { id: 'calawah',      name: 'Calawah River',       type: 'river', lat: 47.97, lng: -124.27, region: 'Olympic' },
  { id: 'quillayute',   name: 'Quillayute River',    type: 'river', lat: 47.90, lng: -124.62, region: 'Olympic' },
  { id: 'queets',       name: 'Queets River',        type: 'river', lat: 47.52, lng: -124.24, region: 'Olympic' },
  { id: 'clearwater-op',name: 'Clearwater River (Olympic)', type: 'river', lat: 47.77, lng: -124.18, region: 'Olympic' },
  { id: 'elwha',        name: 'Elwha River',         type: 'river', lat: 48.04, lng: -123.55, region: 'Olympic' },
  { id: 'dungeness',    name: 'Dungeness River',     type: 'river', lat: 48.11, lng: -123.18, region: 'Olympic' },
  { id: 'skokomish',    name: 'Skokomish River',     type: 'river', lat: 47.34, lng: -123.13, region: 'Olympic' },
  { id: 'dosewallips',  name: 'Dosewallips River',   type: 'river', lat: 47.67, lng: -122.97, region: 'Olympic' },
  { id: 'duckabush',    name: 'Duckabush River',     type: 'river', lat: 47.64, lng: -122.93, region: 'Olympic' },
  { id: 'humptulips',   name: 'Humptulips River',    type: 'river', lat: 47.23, lng: -123.97, region: 'Coast' },
  { id: 'wynoochee',    name: 'Wynoochee River',     type: 'river', lat: 47.02, lng: -123.57, region: 'Coast' },
  { id: 'copalis',      name: 'Copalis River',       type: 'river', lat: 47.12, lng: -124.12, region: 'Coast' },

  // ── SOUTHWEST WASHINGTON RIVERS ──────────────────────────────────────────────
  { id: 'toutle',       name: 'Toutle River',        type: 'river', lat: 46.32, lng: -122.64, region: 'Southwest' },
  { id: 'coweeman',     name: 'Coweeman River',      type: 'river', lat: 46.16, lng: -122.91, region: 'Southwest' },
  { id: 'kalama',       name: 'Kalama River',        type: 'river', lat: 46.02, lng: -122.76, region: 'Southwest' },
  { id: 'wind',         name: 'Wind River',          type: 'river', lat: 45.77, lng: -121.93, region: 'Southwest' },
  { id: 'klickitat',    name: 'Klickitat River',     type: 'river', lat: 45.75, lng: -121.22, region: 'Southeast' },
  { id: 'washougal',    name: 'Washougal River',     type: 'river', lat: 45.58, lng: -122.34, region: 'Southwest' },

  // ── NORTH CENTRAL & NORTHEAST RIVERS ─────────────────────────────────────────
  { id: 'entiat',       name: 'Entiat River',        type: 'river', lat: 47.73, lng: -120.24, region: 'Central' },
  { id: 'similkameen',  name: 'Similkameen River',   type: 'river', lat: 48.67, lng: -119.00, region: 'Northeast' },
  { id: 'sanpoil',      name: 'Sanpoil River',       type: 'river', lat: 48.04, lng: -118.70, region: 'Northeast' },
  { id: 'kettle',       name: 'Kettle River',        type: 'river', lat: 48.65, lng: -118.30, region: 'Northeast' },
  { id: 'colville',     name: 'Colville River',      type: 'river', lat: 48.54, lng: -117.90, region: 'Northeast' },
  { id: 'spokane',      name: 'Spokane River',       type: 'river', lat: 47.70, lng: -117.47, region: 'Northeast' },

  // ── PUGET SOUND TRIBUTARIES ───────────────────────────────────────────────────
  { id: 'snoqualmie',   name: 'Snoqualmie River',    type: 'river', lat: 47.53, lng: -121.83, region: 'Puget Sound' },
  { id: 'tolt',         name: 'Tolt River',          type: 'river', lat: 47.65, lng: -121.79, region: 'Puget Sound' },
  { id: 'raging',       name: 'Raging River',        type: 'stream',lat: 47.51, lng: -121.95, region: 'Puget Sound' },
  { id: 'wallace',      name: 'Wallace River',       type: 'stream',lat: 47.87, lng: -121.70, region: 'Northwest' },
  { id: 'sultan',       name: 'Sultan River',        type: 'river', lat: 47.87, lng: -121.80, region: 'Northwest' },
  { id: 'pilchuck',     name: 'Pilchuck River',      type: 'river', lat: 48.02, lng: -121.93, region: 'Northwest' },
  { id: 'sammamish-river', name: 'Sammamish River',  type: 'river', lat: 47.68, lng: -122.10, region: 'Puget Sound' },
  { id: 'issaquah-creek',  name: 'Issaquah Creek',   type: 'stream',lat: 47.53, lng: -122.04, region: 'Puget Sound' },

  // ── ADDITIONAL RIVERS (missing from original list) ────────────────────────────
  { id: 'deschutes',      name: 'Deschutes River',    type: 'river', lat: 46.96, lng: -122.91, region: 'Southwest' },
  { id: 'carbon',         name: 'Carbon River',       type: 'river', lat: 47.07, lng: -121.96, region: 'Southwest' },

  // ── CENTRAL WASHINGTON LAKES ──────────────────────────────────────────────────
  { id: 'rimrock',      name: 'Rimrock Lake (Tieton Reservoir)', type: 'lake', lat: 46.64, lng: -121.14, region: 'Central' },
  { id: 'bumping',      name: 'Bumping Lake',        type: 'lake', lat: 46.86, lng: -121.27, region: 'Central' },
  { id: 'lenice',       name: 'Lenice Lake',         type: 'lake', lat: 46.91, lng: -119.92, region: 'Central' },
  { id: 'nunnally',     name: 'Nunnally Lake',       type: 'lake', lat: 46.89, lng: -119.91, region: 'Central' },
  { id: 'merry',        name: 'Merry Lake',          type: 'lake', lat: 46.87, lng: -119.90, region: 'Central' },

  // ── EASTERN WASHINGTON LAKES ──────────────────────────────────────────────────
  { id: 'amber',        name: 'Amber Lake',          type: 'lake', lat: 47.04, lng: -117.41, region: 'Northeast' },
  { id: 'williams',     name: 'Williams Lake',       type: 'lake', lat: 47.26, lng: -118.57, region: 'Northeast' },
  { id: 'medical',      name: 'Medical Lake',        type: 'lake', lat: 47.57, lng: -117.69, region: 'Northeast' },
  { id: 'silver-cowlitz', name: 'Silver Lake (Cowlitz Co.)', type: 'lake', lat: 46.26, lng: -122.70, region: 'Southwest' },
  { id: 'mineral',      name: 'Mineral Lake',        type: 'lake', lat: 46.73, lng: -122.15, region: 'Southwest' },

  // ── NORTHWEST WASHINGTON LAKES ────────────────────────────────────────────────
  // Baker Lake: WDFW-verified: 4th Sat April – Oct 31; kokanee 10/day 6-18"; rainbow 5/day; sockeye Jul 11-Aug 31 (tentative 2026)
  { id: 'baker-lake',   name: 'Baker Lake',          type: 'lake', lat: 48.63, lng: -121.69, region: 'Northwest' },
  // Lake Shannon: just downstream of Baker, rainbow/kokanee similar to Baker
  { id: 'shannon',      name: 'Lake Shannon',        type: 'lake', lat: 48.60, lng: -121.69, region: 'Northwest' },
  // Diablo Lake: WDFW-verified: year-round, naturally reproducing rainbow; no bull trout
  { id: 'diablo',       name: 'Diablo Lake',         type: 'lake', lat: 48.71, lng: -121.13, region: 'Northwest' },
]

export const REGULATIONS: Regulation[] = [
  // Chinook Salmon
  { id: 'r1', speciesId: 'chinook', waterBodyId: 'skagit', seasonStart: '05-01', seasonEnd: '09-30', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: 'Barbless hooks only', notes: 'Hatchery fish only; adipose fin clipped' },
  { id: 'r2', speciesId: 'chinook', waterBodyId: 'columbia', seasonStart: '04-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: false, gearRestriction: null, notes: 'Check for in-season updates' },
  { id: 'r3', speciesId: 'chinook', waterBodyId: 'puget', seasonStart: '07-01', seasonEnd: '10-15', dailyLimit: 2, minSize: 22, hatcheryOnly: true, gearRestriction: 'Barbless hooks', notes: 'Marine areas 7-13' },
  // Coho Salmon
  { id: 'r4', speciesId: 'coho', waterBodyId: 'snohomish', seasonStart: '08-01', seasonEnd: '11-30', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: null, notes: null },
  { id: 'r5', speciesId: 'coho', waterBodyId: 'puget', seasonStart: '08-15', seasonEnd: '11-15', dailyLimit: 2, minSize: 16, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r6', speciesId: 'coho', waterBodyId: 'green', seasonStart: '09-01', seasonEnd: '11-15', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: 'Barbless hooks only', notes: null },
  // Sockeye Salmon
  { id: 'r6b', speciesId: 'sockeye', waterBodyId: 'skagit', seasonStart: '07-01', seasonEnd: '07-31', dailyLimit: 4, minSize: 12, hatcheryOnly: true, gearRestriction: 'Night closure in effect; 2-rod OK; SGR not required for salmon', notes: 'Open by section — see section rules. Active emergency rule through Jul 31 2026 (WDFW ER 26-126-136780, pub Jul 7 2026, supersedes 26-114-136727). Hatchery fish only (clipped adipose fin). Release all salmon other than sockeye.' },
  { id: 'r7', speciesId: 'sockeye', waterBodyId: 'columbia', seasonStart: '07-01', seasonEnd: '08-15', dailyLimit: 6, minSize: null, hatcheryOnly: true, gearRestriction: null, emergencyClosedFrom: '2026-07-06', emergencyClosedTo: '2026-07-31', notes: '⚠️ 2026 EMERGENCY CLOSURE: Columbia River sockeye severely restricted due to below-forecast returns (WDFW ER 26-113-136726). Most sections closed to sockeye July 6–31. Verify WDFW before fishing — see emergency alerts.' },
  { id: 'r8', speciesId: 'sockeye', waterBodyId: 'chelan', seasonStart: '07-15', seasonEnd: '08-31', dailyLimit: 4, minSize: null, hatcheryOnly: true, gearRestriction: null, notes: 'Hatchery fish only (clipped adipose fin). Season varies — see WDFW regulations.' },
  { id: 'r8b', speciesId: 'sockeye', waterBodyId: 'wenatchee-lake', seasonStart: '07-01', seasonEnd: '08-15', dailyLimit: 4, minSize: null, hatcheryOnly: true, gearRestriction: null, notes: 'Lake Wenatchee sockeye — one of WA\'s top sockeye fisheries. Hatchery fish only (clipped adipose fin). ⚠️ 2026: Fishery contingent on adult passage at Tumwater Dam exceeding spawner target — verify WDFW before fishing.' },
  // Pink Salmon — NOT LISTED. 2026 is an even year; no WA pink salmon fishery exists.
  // Steelhead
  { id: 'r11', speciesId: 'steelhead', waterBodyId: 'skagit', seasonStart: '01-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: 'Single hook, no bait', notes: 'Summer run check regs' },
  { id: 'r12', speciesId: 'steelhead', waterBodyId: 'yakima', seasonStart: '01-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: null },
  { id: 'r13', speciesId: 'steelhead', waterBodyId: 'columbia', seasonStart: '09-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: false, gearRestriction: null, notes: null },
  // Rainbow Trout
  { id: 'r14', speciesId: 'rainbow', waterBodyId: 'yakima', seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r15', speciesId: 'rainbow', waterBodyId: 'chelan', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r16', speciesId: 'rainbow', waterBodyId: 'sammamish', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r17', speciesId: 'rainbow', waterBodyId: 'washington', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },
  // Cutthroat Trout
  { id: 'r18', speciesId: 'cutthroat', waterBodyId: 'cedar', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: 'Catch and release only', notes: null },
  { id: 'r19', speciesId: 'cutthroat', waterBodyId: 'hood', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: null, notes: 'Sea-run cutthroat' },
  // Largemouth Bass
  { id: 'r20', speciesId: 'largemouth', waterBodyId: 'sammamish', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r21', speciesId: 'largemouth', waterBodyId: 'washington', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r22', speciesId: 'largemouth', waterBodyId: 'banks', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },
  // Walleye
  { id: 'r23', speciesId: 'walleye', waterBodyId: 'roosevelt', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 8, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r24', speciesId: 'walleye', waterBodyId: 'banks', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 8, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r25', speciesId: 'walleye', waterBodyId: 'columbia', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 8, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  // Yellow Perch
  { id: 'r26', speciesId: 'perch', waterBodyId: 'sammamish', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 25, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r27', speciesId: 'perch', waterBodyId: 'washington', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 25, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  // Halibut — NOT LISTED. All WA halibut seasons closed as of June 28-30, 2026. Check WDFW/IPHC for future openings.
  // Dungeness Crab
  { id: 'r30', speciesId: 'crab', waterBodyId: 'puget', seasonStart: '07-01', seasonEnd: '09-30', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: 'Crab pots or ring nets', notes: 'Males only, 6.25 in minimum' },
  { id: 'r31', speciesId: 'crab', waterBodyId: 'hood', seasonStart: '07-01', seasonEnd: '08-31', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: 'Crab pots only', notes: 'Males only' },

  // ── ADDITIONAL COLUMBIA RIVER SPECIES ────────────────────────────────────────
  { id: 'r50', speciesId: 'coho', waterBodyId: 'columbia', seasonStart: '08-01', seasonEnd: '11-30', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r51', speciesId: 'smallmouth', waterBodyId: 'columbia', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r52', speciesId: 'perch', waterBodyId: 'columbia', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 25, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── SNAKE RIVER ───────────────────────────────────────────────────────────────
  { id: 'r53', speciesId: 'chinook', waterBodyId: 'snake', seasonStart: '05-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r54', speciesId: 'steelhead', waterBodyId: 'snake', seasonStart: '09-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r55', speciesId: 'sturgeon', waterBodyId: 'snake', seasonStart: '04-01', seasonEnd: '10-31', dailyLimit: null, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'Seasons and retention rules set annually — see WDFW regulations' },
  { id: 'r56', speciesId: 'smallmouth', waterBodyId: 'snake', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r57', speciesId: 'walleye', waterBodyId: 'snake', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 8, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── ADDITIONAL YAKIMA RIVER SPECIES ──────────────────────────────────────────
  { id: 'r58', speciesId: 'brown', waterBodyId: 'yakima', seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r59', speciesId: 'chinook', waterBodyId: 'yakima', seasonStart: '09-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: null, notes: 'Lower Yakima only; see WDFW regulations for current restrictions' },
  { id: 'r60', speciesId: 'smallmouth', waterBodyId: 'yakima', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── ADDITIONAL GREEN RIVER SPECIES ───────────────────────────────────────────
  { id: 'r61', speciesId: 'chinook', waterBodyId: 'green', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: 'Barbless hooks only', notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r62', speciesId: 'steelhead', waterBodyId: 'green', seasonStart: '11-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── ADDITIONAL SNOHOMISH RIVER SPECIES ───────────────────────────────────────
  { id: 'r63', speciesId: 'chinook', waterBodyId: 'snohomish', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: 'Barbless hooks only', notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r64', speciesId: 'steelhead', waterBodyId: 'snohomish', seasonStart: '11-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r65', speciesId: 'chum', waterBodyId: 'snohomish', seasonStart: '10-01', seasonEnd: '12-15', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── WENATCHEE RIVER ───────────────────────────────────────────────────────────
  { id: 'r66', speciesId: 'chinook', waterBodyId: 'wenatchee', seasonStart: '08-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r67', speciesId: 'steelhead', waterBodyId: 'wenatchee', seasonStart: '09-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r68', speciesId: 'rainbow', waterBodyId: 'wenatchee', seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── METHOW RIVER ─────────────────────────────────────────────────────────────
  { id: 'r69', speciesId: 'chinook', waterBodyId: 'methow', seasonStart: '08-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r70', speciesId: 'steelhead', waterBodyId: 'methow', seasonStart: '09-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r71', speciesId: 'rainbow', waterBodyId: 'methow', seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── OKANOGAN RIVER ────────────────────────────────────────────────────────────
  { id: 'r72', speciesId: 'sockeye', waterBodyId: 'okanogan', seasonStart: '07-01', seasonEnd: '08-31', dailyLimit: 6, minSize: null, hatcheryOnly: true, gearRestriction: null, notes: 'Hatchery fish only (clipped adipose fin). See WDFW regulations for current season dates and restrictions' },
  { id: 'r73', speciesId: 'steelhead', waterBodyId: 'okanogan', seasonStart: '09-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r74', speciesId: 'rainbow', waterBodyId: 'okanogan', seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── COWLITZ RIVER ─────────────────────────────────────────────────────────────
  { id: 'r75', speciesId: 'chinook', waterBodyId: 'cowlitz', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r76', speciesId: 'coho', waterBodyId: 'cowlitz', seasonStart: '08-01', seasonEnd: '11-30', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r77', speciesId: 'steelhead', waterBodyId: 'cowlitz', seasonStart: '11-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r78', speciesId: 'rainbow', waterBodyId: 'cowlitz', seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── LEWIS RIVER ───────────────────────────────────────────────────────────────
  { id: 'r79', speciesId: 'chinook', waterBodyId: 'lewis', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r80', speciesId: 'coho', waterBodyId: 'lewis', seasonStart: '08-01', seasonEnd: '11-30', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r81', speciesId: 'steelhead', waterBodyId: 'lewis', seasonStart: '11-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r82', speciesId: 'rainbow', waterBodyId: 'lewis', seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── CHEHALIS RIVER ────────────────────────────────────────────────────────────
  { id: 'r83', speciesId: 'chinook', waterBodyId: 'chehalis', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r84', speciesId: 'coho', waterBodyId: 'chehalis', seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r85', speciesId: 'steelhead', waterBodyId: 'chehalis', seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r86', speciesId: 'cutthroat', waterBodyId: 'chehalis', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── NOOKSACK RIVER ────────────────────────────────────────────────────────────
  // Note: Pink Salmon NOT listed — 2026 is an even year; no WA pink salmon fishery exists
  { id: 'r87', speciesId: 'chinook', waterBodyId: 'nooksack', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: 'Barbless hooks only', notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r88', speciesId: 'coho', waterBodyId: 'nooksack', seasonStart: '08-01', seasonEnd: '11-30', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r89', speciesId: 'steelhead', waterBodyId: 'nooksack', seasonStart: '01-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r90', speciesId: 'chum', waterBodyId: 'nooksack', seasonStart: '10-01', seasonEnd: '12-15', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── STILLAGUAMISH RIVER ───────────────────────────────────────────────────────
  // Note: Pink Salmon NOT listed — 2026 is an even year; no WA pink salmon fishery exists
  { id: 'r91', speciesId: 'chinook', waterBodyId: 'stillaguamish', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: 'Barbless hooks only', notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r92', speciesId: 'coho', waterBodyId: 'stillaguamish', seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r93', speciesId: 'steelhead', waterBodyId: 'stillaguamish', seasonStart: '01-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── SAUK RIVER ────────────────────────────────────────────────────────────────
  { id: 'r94', speciesId: 'chinook', waterBodyId: 'sauk', seasonStart: '05-01', seasonEnd: '09-30', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: 'Barbless hooks only', notes: 'Tributary of Skagit; see WDFW regulations for current restrictions' },
  { id: 'r95', speciesId: 'steelhead', waterBodyId: 'sauk', seasonStart: '01-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r96', speciesId: 'rainbow', waterBodyId: 'sauk', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── SKYKOMISH RIVER ───────────────────────────────────────────────────────────
  // Note: Pink Salmon NOT listed — 2026 is an even year; no WA pink salmon fishery exists
  { id: 'r97', speciesId: 'chinook', waterBodyId: 'skykomish', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: 'Barbless hooks only', notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r98', speciesId: 'coho', waterBodyId: 'skykomish', seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r99', speciesId: 'steelhead', waterBodyId: 'skykomish', seasonStart: '01-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── WHITE RIVER ───────────────────────────────────────────────────────────────
  { id: 'r100', speciesId: 'chinook', waterBodyId: 'white', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: 'Barbless hooks only', notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r101', speciesId: 'steelhead', waterBodyId: 'white', seasonStart: '11-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── PUYALLUP RIVER ────────────────────────────────────────────────────────────
  { id: 'r102', speciesId: 'chinook', waterBodyId: 'puyallup', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: 'Barbless hooks only', notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r103', speciesId: 'coho', waterBodyId: 'puyallup', seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r104', speciesId: 'steelhead', waterBodyId: 'puyallup', seasonStart: '11-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r105', speciesId: 'chum', waterBodyId: 'puyallup', seasonStart: '10-01', seasonEnd: '12-15', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── NISQUALLY RIVER ───────────────────────────────────────────────────────────
  { id: 'r106', speciesId: 'chinook', waterBodyId: 'nisqually', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: 'Barbless hooks only', notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r107', speciesId: 'coho', waterBodyId: 'nisqually', seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r108', speciesId: 'steelhead', waterBodyId: 'nisqually', seasonStart: '11-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── HOH RIVER ─────────────────────────────────────────────────────────────────
  { id: 'r109', speciesId: 'chinook', waterBodyId: 'hoh', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: null, notes: 'Olympic Peninsula; see WDFW regulations for current season dates and restrictions' },
  { id: 'r110', speciesId: 'steelhead', waterBodyId: 'hoh', seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r111', speciesId: 'cutthroat', waterBodyId: 'hoh', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── QUINAULT RIVER ────────────────────────────────────────────────────────────
  { id: 'r112', speciesId: 'chinook', waterBodyId: 'quinault-river', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: null, notes: 'Olympic Peninsula; see WDFW regulations for current season dates and restrictions' },
  { id: 'r113', speciesId: 'steelhead', waterBodyId: 'quinault-river', seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r114', speciesId: 'cutthroat', waterBodyId: 'quinault-river', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── BOGACHIEL RIVER ───────────────────────────────────────────────────────────
  { id: 'r115', speciesId: 'chinook', waterBodyId: 'bogachiel', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: null, notes: 'Olympic Peninsula; see WDFW regulations for current season dates and restrictions' },
  { id: 'r116', speciesId: 'steelhead', waterBodyId: 'bogachiel', seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r117', speciesId: 'cutthroat', waterBodyId: 'bogachiel', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── ADDITIONAL LAKE WASHINGTON SPECIES ───────────────────────────────────────
  { id: 'r118', speciesId: 'chinook', waterBodyId: 'washington', seasonStart: '07-01', seasonEnd: '10-15', dailyLimit: 2, minSize: 22, hatcheryOnly: true, gearRestriction: 'Barbless hooks', notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r119', speciesId: 'sockeye', waterBodyId: 'washington', seasonStart: '07-01', seasonEnd: '08-15', dailyLimit: 6, minSize: null, hatcheryOnly: true, gearRestriction: null, notes: 'Hatchery fish only (clipped adipose fin). Season varies annually — see WDFW regulations' },
  { id: 'r120', speciesId: 'cutthroat', waterBodyId: 'washington', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r121', speciesId: 'smallmouth', waterBodyId: 'washington', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r122', speciesId: 'walleye', waterBodyId: 'washington', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 8, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── ADDITIONAL LAKE SAMMAMISH SPECIES ────────────────────────────────────────
  { id: 'r123', speciesId: 'cutthroat', waterBodyId: 'sammamish', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r124', speciesId: 'smallmouth', waterBodyId: 'sammamish', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r125', speciesId: 'kokanee', waterBodyId: 'sammamish', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── ADDITIONAL LAKE CHELAN SPECIES ───────────────────────────────────────────
  { id: 'r126', speciesId: 'chinook', waterBodyId: 'chelan', seasonStart: '07-15', seasonEnd: '09-30', dailyLimit: 2, minSize: 24, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r127', speciesId: 'lake-trout', waterBodyId: 'chelan', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r128', speciesId: 'burbot', waterBodyId: 'chelan', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 10, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r129', speciesId: 'kokanee', waterBodyId: 'chelan', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── ADDITIONAL BANKS LAKE SPECIES ────────────────────────────────────────────
  { id: 'r130', speciesId: 'rainbow', waterBodyId: 'banks', seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r131', speciesId: 'smallmouth', waterBodyId: 'banks', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r132', speciesId: 'perch', waterBodyId: 'banks', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 25, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── ADDITIONAL LAKE ROOSEVELT SPECIES ────────────────────────────────────────
  { id: 'r133', speciesId: 'rainbow', waterBodyId: 'roosevelt', seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r134', speciesId: 'smallmouth', waterBodyId: 'roosevelt', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r135', speciesId: 'kokanee', waterBodyId: 'roosevelt', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r136', speciesId: 'burbot', waterBodyId: 'roosevelt', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 10, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── LAKE CRESCENT ─────────────────────────────────────────────────────────────
  { id: 'r137', speciesId: 'cutthroat', waterBodyId: 'crescent', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: null, notes: 'Includes Beardslee trout (endemic); see WDFW regulations for current restrictions' },
  { id: 'r138', speciesId: 'rainbow', waterBodyId: 'crescent', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── LAKE QUINAULT ─────────────────────────────────────────────────────────────
  { id: 'r139', speciesId: 'chinook', waterBodyId: 'quinault-lake', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 24, hatcheryOnly: true, gearRestriction: null, notes: 'Olympic Peninsula; see WDFW regulations for current season dates and restrictions' },
  { id: 'r140', speciesId: 'steelhead', waterBodyId: 'quinault-lake', seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r141', speciesId: 'cutthroat', waterBodyId: 'quinault-lake', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── LAKE OZETTE ───────────────────────────────────────────────────────────────
  { id: 'r142', speciesId: 'sockeye', waterBodyId: 'ozette', seasonStart: '07-01', seasonEnd: '08-31', dailyLimit: 3, minSize: null, hatcheryOnly: true, gearRestriction: null, notes: 'Ozette sockeye are ESA-listed; fishery opens only if WDFW issues an emergency opener. Verify current status before fishing.' },
  { id: 'r143', speciesId: 'rainbow', waterBodyId: 'ozette', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r144', speciesId: 'cutthroat', waterBodyId: 'ozette', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── LAKE WENATCHEE ────────────────────────────────────────────────────────────
  { id: 'r145', speciesId: 'rainbow', waterBodyId: 'wenatchee-lake', seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r146', speciesId: 'chinook', waterBodyId: 'wenatchee-lake', seasonStart: '08-01', seasonEnd: '09-30', dailyLimit: 2, minSize: 24, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r147', speciesId: 'kokanee', waterBodyId: 'wenatchee-lake', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── MARINE AREA 8-1 (Deception Pass / Skagit Bay) ────────────────────────────
  // Pink Salmon NOT listed — 2026 is an even year; no WA pink salmon fishery exists
  // Halibut NOT listed — all WA halibut seasons closed as of June 28-30, 2026
  { id: 'r148', speciesId: 'chinook', waterBodyId: 'marine-8-1', seasonStart: '07-01', seasonEnd: '10-15', dailyLimit: 2, minSize: 22, hatcheryOnly: true, gearRestriction: 'Barbless hooks', notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r149', speciesId: 'coho', waterBodyId: 'marine-8-1', seasonStart: '08-15', seasonEnd: '11-15', dailyLimit: 2, minSize: 16, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r150', speciesId: 'crab', waterBodyId: 'marine-8-1', seasonStart: '07-01', seasonEnd: '09-30', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: 'Crab pots or ring nets', notes: 'Males only, 6.25 in minimum; confirm area-specific open dates' },
  { id: 'r151', speciesId: 'rockfish', waterBodyId: 'marine-8-1', seasonStart: '03-01', seasonEnd: '12-31', dailyLimit: 10, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r152', speciesId: 'lingcod', waterBodyId: 'marine-8-1', seasonStart: '03-01', seasonEnd: '11-15', dailyLimit: 2, minSize: 22, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r153', speciesId: 'shrimp', waterBodyId: 'marine-8-1', seasonStart: '05-01', seasonEnd: '05-31', dailyLimit: 80, minSize: null, hatcheryOnly: false, gearRestriction: 'Pot gear only', notes: 'Season varies — see WDFW spot shrimp schedule' },
  { id: 'r154', speciesId: 'chum', waterBodyId: 'marine-8-1', seasonStart: '10-01', seasonEnd: '12-15', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── MARINE AREA 8-2 (Port Susan / Saratoga Passage) ──────────────────────────
  // Pink Salmon NOT listed — 2026 is an even year; no WA pink salmon fishery exists
  // Halibut NOT listed — all WA halibut seasons closed as of June 28-30, 2026
  { id: 'r155', speciesId: 'chinook', waterBodyId: 'marine-8-2', seasonStart: '07-01', seasonEnd: '10-15', dailyLimit: 2, minSize: 22, hatcheryOnly: true, gearRestriction: 'Barbless hooks', notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r156', speciesId: 'coho', waterBodyId: 'marine-8-2', seasonStart: '08-15', seasonEnd: '11-15', dailyLimit: 2, minSize: 16, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r157', speciesId: 'crab', waterBodyId: 'marine-8-2', seasonStart: '07-01', seasonEnd: '09-30', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: 'Crab pots or ring nets', notes: 'Males only, 6.25 in minimum; confirm area-specific open dates' },
  { id: 'r158', speciesId: 'rockfish', waterBodyId: 'marine-8-2', seasonStart: '03-01', seasonEnd: '12-31', dailyLimit: 10, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r159', speciesId: 'lingcod', waterBodyId: 'marine-8-2', seasonStart: '03-01', seasonEnd: '11-15', dailyLimit: 2, minSize: 22, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r160', speciesId: 'shrimp', waterBodyId: 'marine-8-2', seasonStart: '05-01', seasonEnd: '05-31', dailyLimit: 80, minSize: null, hatcheryOnly: false, gearRestriction: 'Pot gear only', notes: 'Season varies — see WDFW spot shrimp schedule' },
  { id: 'r161', speciesId: 'chum', waterBodyId: 'marine-8-2', seasonStart: '10-01', seasonEnd: '12-15', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── MARINE AREA 9 (Admiralty Inlet) ──────────────────────────────────────────
  // Halibut NOT listed — all WA halibut seasons closed as of June 28-30, 2026
  { id: 'r162', speciesId: 'chinook', waterBodyId: 'marine-9', seasonStart: '07-01', seasonEnd: '10-15', dailyLimit: 2, minSize: 22, hatcheryOnly: true, gearRestriction: 'Barbless hooks', notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r163', speciesId: 'coho', waterBodyId: 'marine-9', seasonStart: '08-15', seasonEnd: '11-15', dailyLimit: 2, minSize: 16, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r164', speciesId: 'crab', waterBodyId: 'marine-9', seasonStart: '07-01', seasonEnd: '09-30', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: 'Crab pots or ring nets', notes: 'Males only, 6.25 in minimum; confirm area-specific open dates' },
  { id: 'r165', speciesId: 'rockfish', waterBodyId: 'marine-9', seasonStart: '03-01', seasonEnd: '12-31', dailyLimit: 10, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r166', speciesId: 'lingcod', waterBodyId: 'marine-9', seasonStart: '03-01', seasonEnd: '11-15', dailyLimit: 2, minSize: 22, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r167', speciesId: 'shrimp', waterBodyId: 'marine-9', seasonStart: '05-01', seasonEnd: '05-31', dailyLimit: 80, minSize: null, hatcheryOnly: false, gearRestriction: 'Pot gear only', notes: 'Season varies — see WDFW spot shrimp schedule' },
  { id: 'r168', speciesId: 'sockeye', waterBodyId: 'marine-9', seasonStart: '07-01', seasonEnd: '08-15', dailyLimit: 6, minSize: null, hatcheryOnly: true, gearRestriction: null, notes: 'Hatchery fish only (clipped adipose fin). See WDFW regulations for current season dates and restrictions' },

  // ── MARINE AREA 10 (Seattle / Bainbridge / Kingston) ─────────────────────────
  // Halibut NOT listed — all WA halibut seasons closed as of June 28-30, 2026
  { id: 'r169', speciesId: 'chinook', waterBodyId: 'marine-10', seasonStart: '07-01', seasonEnd: '10-15', dailyLimit: 2, minSize: 22, hatcheryOnly: true, gearRestriction: 'Barbless hooks', notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r170', speciesId: 'coho', waterBodyId: 'marine-10', seasonStart: '08-15', seasonEnd: '11-15', dailyLimit: 2, minSize: 16, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r171', speciesId: 'crab', waterBodyId: 'marine-10', seasonStart: '07-01', seasonEnd: '09-30', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: 'Crab pots or ring nets', notes: 'Males only, 6.25 in minimum; confirm area-specific open dates' },
  { id: 'r172', speciesId: 'rockfish', waterBodyId: 'marine-10', seasonStart: '03-01', seasonEnd: '12-31', dailyLimit: 10, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r173', speciesId: 'lingcod', waterBodyId: 'marine-10', seasonStart: '03-01', seasonEnd: '11-15', dailyLimit: 2, minSize: 22, hatcheryOnly: false, gearRestriction: null, notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r174', speciesId: 'shrimp', waterBodyId: 'marine-10', seasonStart: '05-01', seasonEnd: '05-31', dailyLimit: 80, minSize: null, hatcheryOnly: false, gearRestriction: 'Pot gear only', notes: 'Season varies — see WDFW spot shrimp schedule' },
  { id: 'r175', speciesId: 'sockeye', waterBodyId: 'marine-10', seasonStart: '07-01', seasonEnd: '08-15', dailyLimit: 6, minSize: null, hatcheryOnly: true, gearRestriction: null, notes: 'Hatchery fish only (clipped adipose fin). See WDFW regulations for current season dates and restrictions' },

  // ── SOL DUC RIVER (Quillayute system) ────────────────────────────────────────
  { id: 'r176', speciesId: 'chinook',    waterBodyId: 'sol-duc',    seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only', notes: 'Olympic Peninsula; CRC required; hatchery fish only; see WDFW regulations for current restrictions' },
  { id: 'r177', speciesId: 'coho',       waterBodyId: 'sol-duc',    seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2,  minSize: 16, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r178', speciesId: 'steelhead',  waterBodyId: 'sol-duc',    seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'Winter steelhead; CRC required; hatchery fish only; see WDFW regulations' },
  { id: 'r179', speciesId: 'cutthroat',  waterBodyId: 'sol-duc',    seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: null,                  notes: null },

  // ── CALAWAH RIVER ────────────────────────────────────────────────────────────
  { id: 'r180', speciesId: 'chinook',    waterBodyId: 'calawah',    seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only', notes: 'Tributary of Sol Duc; CRC required; see WDFW regulations for current restrictions' },
  { id: 'r181', speciesId: 'steelhead',  waterBodyId: 'calawah',    seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r182', speciesId: 'cutthroat',  waterBodyId: 'calawah',    seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: null,                  notes: null },

  // ── QUILLAYUTE RIVER ─────────────────────────────────────────────────────────
  { id: 'r183', speciesId: 'chinook',    waterBodyId: 'quillayute', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only', notes: 'Main stem near La Push; CRC required; see WDFW regulations for current restrictions' },
  { id: 'r184', speciesId: 'coho',       waterBodyId: 'quillayute', seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2,  minSize: 16, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r185', speciesId: 'steelhead',  waterBodyId: 'quillayute', seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── QUEETS RIVER ─────────────────────────────────────────────────────────────
  { id: 'r186', speciesId: 'chinook',    waterBodyId: 'queets',     seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only', notes: 'Remote Olympic Peninsula river; CRC required; check WDFW regulations before fishing — Quinault Nation comanagement area' },
  { id: 'r187', speciesId: 'steelhead',  waterBodyId: 'queets',     seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r188', speciesId: 'cutthroat',  waterBodyId: 'queets',     seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: null,                  notes: null },

  // ── CLEARWATER RIVER (Olympic Peninsula) ─────────────────────────────────────
  { id: 'r189', speciesId: 'steelhead',  waterBodyId: 'clearwater-op', seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'Tributary of Queets; see WDFW regulations for current season dates and restrictions' },
  { id: 'r190', speciesId: 'cutthroat',  waterBodyId: 'clearwater-op', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── ELWHA RIVER ──────────────────────────────────────────────────────────────
  // Post-dam-removal restoration fishery; salmon seasons highly restricted; check WDFW
  { id: 'r191', speciesId: 'cutthroat',  waterBodyId: 'elwha',      seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: 'Catch and release only in most sections — verify per section', notes: 'Post-dam-removal restoration river; many sections closed or C&R only; see WDFW regulations for current restrictions' },
  { id: 'r192', speciesId: 'rainbow',    waterBodyId: 'elwha',      seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 12, hatcheryOnly: false, gearRestriction: null,                  notes: 'Elwha restoration river; check section-specific rules; see WDFW regulations' },
  { id: 'r193', speciesId: 'steelhead',  waterBodyId: 'elwha',      seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'Season extent and open sections vary — see WDFW regulations for current rules' },

  // ── DUNGENESS RIVER ──────────────────────────────────────────────────────────
  { id: 'r194', speciesId: 'cutthroat',  waterBodyId: 'dungeness',  seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: null,                  notes: 'Bull trout release required; ESA-listed species present; see WDFW regulations' },
  { id: 'r195', speciesId: 'steelhead',  waterBodyId: 'dungeness',  seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only',  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r196', speciesId: 'chinook',    waterBodyId: 'dungeness',  seasonStart: '09-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only',  notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── SKOKOMISH RIVER ──────────────────────────────────────────────────────────
  { id: 'r197', speciesId: 'chum',       waterBodyId: 'skokomish',  seasonStart: '10-01', seasonEnd: '12-15', dailyLimit: 6,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'Hood Canal chum run; see WDFW regulations for current season dates and restrictions' },
  { id: 'r198', speciesId: 'chinook',    waterBodyId: 'skokomish',  seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only',  notes: 'CRC required; see WDFW regulations for current season dates and restrictions' },
  { id: 'r199', speciesId: 'coho',       waterBodyId: 'skokomish',  seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2,  minSize: 16, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r200', speciesId: 'steelhead',  waterBodyId: 'skokomish',  seasonStart: '11-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── DOSEWALLIPS RIVER ────────────────────────────────────────────────────────
  { id: 'r201', speciesId: 'steelhead',  waterBodyId: 'dosewallips', seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2, minSize: 20, hatcheryOnly: true, gearRestriction: null, notes: 'Hood Canal tributary; see WDFW regulations for current season dates and restrictions' },
  { id: 'r202', speciesId: 'cutthroat',  waterBodyId: 'dosewallips', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: null, notes: 'Release bull trout; see WDFW regulations' },

  // ── DUCKABUSH RIVER ──────────────────────────────────────────────────────────
  { id: 'r203', speciesId: 'steelhead',  waterBodyId: 'duckabush',  seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'Hood Canal tributary; see WDFW regulations for current season dates and restrictions' },
  { id: 'r204', speciesId: 'cutthroat',  waterBodyId: 'duckabush',  seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: null,                  notes: 'Release bull trout; see WDFW regulations' },

  // ── HUMPTULIPS RIVER ─────────────────────────────────────────────────────────
  { id: 'r205', speciesId: 'chinook',    waterBodyId: 'humptulips', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only',  notes: 'Grays Harbor tributary; CRC required; see WDFW regulations for current restrictions' },
  { id: 'r206', speciesId: 'coho',       waterBodyId: 'humptulips', seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2,  minSize: 16, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r207', speciesId: 'steelhead',  waterBodyId: 'humptulips', seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r208', speciesId: 'cutthroat',  waterBodyId: 'humptulips', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: null,                  notes: null },

  // ── WYNOOCHEE RIVER ──────────────────────────────────────────────────────────
  { id: 'r209', speciesId: 'chinook',    waterBodyId: 'wynoochee',  seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only',  notes: 'Chehalis tributary; CRC required; see WDFW regulations for current restrictions' },
  { id: 'r210', speciesId: 'coho',       waterBodyId: 'wynoochee',  seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2,  minSize: 16, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r211', speciesId: 'steelhead',  waterBodyId: 'wynoochee',  seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── COPALIS RIVER ────────────────────────────────────────────────────────────
  { id: 'r212', speciesId: 'cutthroat',  waterBodyId: 'copalis',    seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: 'Catch and release in most sections', notes: 'Small coastal river; primarily C&R for sea-run cutthroat; see WDFW regulations' },
  { id: 'r213', speciesId: 'coho',       waterBodyId: 'copalis',    seasonStart: '10-01', seasonEnd: '11-30', dailyLimit: 2,  minSize: 16, hatcheryOnly: false, gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── TOUTLE RIVER ─────────────────────────────────────────────────────────────
  { id: 'r214', speciesId: 'chinook',    waterBodyId: 'toutle',     seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only',  notes: 'SW WA below Mt. St. Helens; CRC required; see WDFW regulations for current restrictions' },
  { id: 'r215', speciesId: 'coho',       waterBodyId: 'toutle',     seasonStart: '08-01', seasonEnd: '11-30', dailyLimit: 2,  minSize: 16, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r216', speciesId: 'steelhead',  waterBodyId: 'toutle',     seasonStart: '11-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r217', speciesId: 'rainbow',    waterBodyId: 'toutle',     seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: null },

  // ── COWEEMAN RIVER ───────────────────────────────────────────────────────────
  { id: 'r218', speciesId: 'steelhead',  waterBodyId: 'coweeman',   seasonStart: '12-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'Cowlitz tributary; see WDFW regulations for current season dates and restrictions' },
  { id: 'r219', speciesId: 'rainbow',    waterBodyId: 'coweeman',   seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: null },
  { id: 'r220', speciesId: 'cutthroat',  waterBodyId: 'coweeman',   seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: null,                  notes: null },

  // ── KALAMA RIVER ─────────────────────────────────────────────────────────────
  // Source: well-established WDFW multi-species river (Columbia tributary)
  // Note: Kalama has all-year steelhead presence; summer rules require SGR; winter allows bait
  { id: 'r221', speciesId: 'steelhead',  waterBodyId: 'kalama',     seasonStart: '12-01', seasonEnd: '04-30', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'Winter steelhead; CRC required; see WDFW regulations for current season dates and restrictions' },
  { id: 'r222', speciesId: 'steelhead',  waterBodyId: 'kalama',     seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: false, gearRestriction: 'Selective gear rules — lures/flies only, barbless single-point hooks, no bait', notes: 'Summer steelhead; wild fish may be retained when open; check CRC requirement; see WDFW regulations' },
  { id: 'r223', speciesId: 'chinook',    waterBodyId: 'kalama',     seasonStart: '04-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only',  notes: 'CRC required; spring and fall chinook; see WDFW regulations for current season dates and restrictions' },
  { id: 'r224', speciesId: 'coho',       waterBodyId: 'kalama',     seasonStart: '08-01', seasonEnd: '11-30', dailyLimit: 2,  minSize: 16, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r225', speciesId: 'rainbow',    waterBodyId: 'kalama',     seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: null },

  // ── WIND RIVER ───────────────────────────────────────────────────────────────
  { id: 'r226', speciesId: 'steelhead',  waterBodyId: 'wind',       seasonStart: '11-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'Columbia tributary; see WDFW regulations for current season dates and restrictions' },
  { id: 'r227', speciesId: 'rainbow',    waterBodyId: 'wind',       seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'Stocked sections available; see WDFW regulations' },

  // ── KLICKITAT RIVER ──────────────────────────────────────────────────────────
  { id: 'r228', speciesId: 'steelhead',  waterBodyId: 'klickitat',  seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: false, gearRestriction: 'Selective gear rules — lures/flies only, barbless hooks', notes: 'Famous summer/fall steelhead river; CRC required; see WDFW regulations for current season dates and restrictions' },
  { id: 'r229', speciesId: 'chinook',    waterBodyId: 'klickitat',  seasonStart: '08-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only',  notes: 'CRC required; see WDFW regulations for current season dates and restrictions' },
  { id: 'r230', speciesId: 'rainbow',    waterBodyId: 'klickitat',  seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'Upper sections; statewide rules apply; see WDFW regulations' },

  // ── WASHOUGAL RIVER ──────────────────────────────────────────────────────────
  { id: 'r231', speciesId: 'steelhead',  waterBodyId: 'washougal',  seasonStart: '11-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'Columbia tributary; CRC required; see WDFW regulations for current season dates and restrictions' },
  { id: 'r232', speciesId: 'chinook',    waterBodyId: 'washougal',  seasonStart: '08-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only',  notes: 'CRC required; see WDFW regulations for current season dates and restrictions' },
  { id: 'r233', speciesId: 'coho',       waterBodyId: 'washougal',  seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2,  minSize: 16, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r234', speciesId: 'rainbow',    waterBodyId: 'washougal',  seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: null },

  // ── ENTIAT RIVER ─────────────────────────────────────────────────────────────
  { id: 'r235', speciesId: 'chinook',    waterBodyId: 'entiat',     seasonStart: '08-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only',  notes: '⚠️ EMERGENCY OPENER IN EFFECT: Entiat River open for summer Chinook starting Jul 9, 2026 until further notice (WDFW ER 26-125-136777). Emergency rules: limit 6 Chinook/day, min 12", release all other salmon, night closure. Base pamphlet season Aug 1–Oct 31, limit 2, min 24". May close on short notice — verify WDFW before fishing. Upper Columbia tributary; CRC required.' },
  { id: 'r236', speciesId: 'steelhead',  waterBodyId: 'entiat',     seasonStart: '09-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: false, gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r237', speciesId: 'rainbow',    waterBodyId: 'entiat',     seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: null },

  // ── SIMILKAMEEN RIVER ────────────────────────────────────────────────────────
  { id: 'r238', speciesId: 'rainbow',    waterBodyId: 'similkameen', seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'NE WA near Oroville; statewide trout rules; see WDFW regulations' },
  { id: 'r239', speciesId: 'smallmouth', waterBodyId: 'similkameen', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── SANPOIL RIVER ────────────────────────────────────────────────────────────
  { id: 'r240', speciesId: 'rainbow',    waterBodyId: 'sanpoil',    seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'NE WA tributary of Lake Roosevelt; statewide rules; see WDFW regulations' },
  { id: 'r241', speciesId: 'smallmouth', waterBodyId: 'sanpoil',    seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5,  minSize: 12,  hatcheryOnly: false, gearRestriction: null,                 notes: null },

  // ── KETTLE RIVER ─────────────────────────────────────────────────────────────
  { id: 'r242', speciesId: 'rainbow',    waterBodyId: 'kettle',     seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'NE WA; statewide trout rules; see WDFW regulations' },
  { id: 'r243', speciesId: 'smallmouth', waterBodyId: 'kettle',     seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5,  minSize: 12,  hatcheryOnly: false, gearRestriction: null,                 notes: null },
  { id: 'r244', speciesId: 'brown',      waterBodyId: 'kettle',     seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'See WDFW regulations' },

  // ── COLVILLE RIVER ───────────────────────────────────────────────────────────
  { id: 'r245', speciesId: 'rainbow',    waterBodyId: 'colville',   seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'NE WA; statewide rules; see WDFW regulations' },
  { id: 'r246', speciesId: 'smallmouth', waterBodyId: 'colville',   seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5,  minSize: 12,  hatcheryOnly: false, gearRestriction: null,                 notes: null },

  // ── SPOKANE RIVER ────────────────────────────────────────────────────────────
  { id: 'r247', speciesId: 'rainbow',    waterBodyId: 'spokane',    seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'Statewide trout rules; flows through Spokane metro; see WDFW regulations' },
  { id: 'r248', speciesId: 'smallmouth', waterBodyId: 'spokane',    seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5,  minSize: 12,  hatcheryOnly: false, gearRestriction: null,                 notes: null },
  { id: 'r249', speciesId: 'walleye',    waterBodyId: 'spokane',    seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 8,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: null },

  // ── SNOQUALMIE RIVER ─────────────────────────────────────────────────────────
  // Note: Pink Salmon NOT listed — 2026 is an even year; no WA pink salmon fishery exists
  { id: 'r250', speciesId: 'chinook',    waterBodyId: 'snoqualmie', seasonStart: '07-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 24, hatcheryOnly: true,  gearRestriction: 'Barbless hooks only',  notes: 'CRC required; see WDFW regulations for current season dates and restrictions' },
  { id: 'r251', speciesId: 'coho',       waterBodyId: 'snoqualmie', seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2,  minSize: 16, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r252', speciesId: 'steelhead',  waterBodyId: 'snoqualmie', seasonStart: '01-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'See WDFW regulations for current season dates and restrictions' },
  { id: 'r253', speciesId: 'rainbow',    waterBodyId: 'snoqualmie', seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: null },

  // ── TOLT RIVER ───────────────────────────────────────────────────────────────
  { id: 'r254', speciesId: 'steelhead',  waterBodyId: 'tolt',       seasonStart: '01-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'Snoqualmie tributary; see WDFW regulations for current season dates and restrictions' },
  { id: 'r255', speciesId: 'cutthroat',  waterBodyId: 'tolt',       seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: 'Catch and release in upper sections — check per-section rules', notes: 'See WDFW regulations' },

  // ── RAGING RIVER ─────────────────────────────────────────────────────────────
  { id: 'r256', speciesId: 'cutthroat',  waterBodyId: 'raging',     seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: 'Catch and release only in most sections', notes: 'Small Snoqualmie tributary; primarily C&R sea-run cutthroat; see WDFW regulations' },

  // ── WALLACE RIVER ────────────────────────────────────────────────────────────
  { id: 'r257', speciesId: 'steelhead',  waterBodyId: 'wallace',    seasonStart: '01-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'Skykomish tributary; see WDFW regulations for current season dates and restrictions' },
  { id: 'r258', speciesId: 'cutthroat',  waterBodyId: 'wallace',    seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: null,                  notes: null },

  // ── SULTAN RIVER ─────────────────────────────────────────────────────────────
  { id: 'r259', speciesId: 'rainbow',    waterBodyId: 'sultan',     seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'Skykomish tributary; statewide rules; see WDFW regulations' },
  { id: 'r260', speciesId: 'cutthroat',  waterBodyId: 'sultan',     seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: null,                  notes: null },

  // ── PILCHUCK RIVER ───────────────────────────────────────────────────────────
  { id: 'r261', speciesId: 'steelhead',  waterBodyId: 'pilchuck',   seasonStart: '01-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20, hatcheryOnly: true,  gearRestriction: null,                  notes: 'Snohomish tributary; see WDFW regulations for current season dates and restrictions' },
  { id: 'r262', speciesId: 'cutthroat',  waterBodyId: 'pilchuck',   seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14, hatcheryOnly: false, gearRestriction: null,                  notes: null },

  // ── SAMMAMISH RIVER ──────────────────────────────────────────────────────────
  // Flows from Lake Sammamish to Lake Washington through Redmond/Kenmore; urban corridor
  { id: 'r263', speciesId: 'coho',       waterBodyId: 'sammamish-river', seasonStart: '10-01', seasonEnd: '11-15', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: null, notes: 'Urban corridor — closed portions much of year; check section rules; see WDFW regulations' },
  { id: 'r264', speciesId: 'cutthroat',  waterBodyId: 'sammamish-river', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: 'Catch and release only', notes: 'Sea-run cutthroat C&R; see WDFW regulations' },

  // ── ISSAQUAH CREEK ───────────────────────────────────────────────────────────
  { id: 'r265', speciesId: 'coho',       waterBodyId: 'issaquah-creek', seasonStart: '10-01', seasonEnd: '11-15', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: null, notes: 'Tributary of Lake Sammamish; check annual WDFW announcement; most of stream C&R only' },
  { id: 'r266', speciesId: 'cutthroat',  waterBodyId: 'issaquah-creek', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 2, minSize: 14, hatcheryOnly: false, gearRestriction: 'Catch and release only in most sections', notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── RIMROCK LAKE (Tieton Reservoir) ──────────────────────────────────────────
  // Source: WDFW lowland lakes page (verified): year-round, kokanee 10/day, rainbow 5/day no size min, no bull trout
  { id: 'r267', speciesId: 'rainbow',    waterBodyId: 'rimrock',    seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'Open year-round; excellent kokanee and rainbow; closed to bull trout' },
  { id: 'r268', speciesId: 'kokanee',    waterBodyId: 'rimrock',    seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 10, minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'WDFW-verified: kokanee limit 10/day; chumming permitted; best May–Aug; closed to bull trout' },

  // ── BUMPING LAKE ─────────────────────────────────────────────────────────────
  // Source: WDFW lowland lakes page (verified): statewide size/limit; rainbow, cutthroat, brook trout, kokanee; no bull trout
  { id: 'r269', speciesId: 'rainbow',    waterBodyId: 'bumping',    seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'Statewide limits; good to 16 inches; chumming permitted; closed to bull trout' },
  { id: 'r270', speciesId: 'kokanee',    waterBodyId: 'bumping',    seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'Statewide limits; best mid-May start; closed to bull trout' },
  { id: 'r271', speciesId: 'cutthroat',  waterBodyId: 'bumping',    seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'See WDFW regulations' },
  { id: 'r272', speciesId: 'brook',      waterBodyId: 'bumping',    seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: null },

  // ── LENICE LAKE ──────────────────────────────────────────────────────────────
  // Source: WDFW-verified productive quality lake N of Mattawa; selective gear rules, limited retention
  { id: 'r273', speciesId: 'rainbow',    waterBodyId: 'lenice',     seasonStart: '03-01', seasonEnd: '11-30', dailyLimit: 1,  minSize: 12, hatcheryOnly: false, gearRestriction: 'Selective gear rules — artificial lures/flies only, barbless single-point hooks, no bait', notes: 'Walk-in quality lake; very popular with fly fishers; grows large wild rainbow trout; see WDFW regulations for current rules' },

  // ── NUNNALLY LAKE ────────────────────────────────────────────────────────────
  // Adjacent to Lenice; same quality trout fishery / similar selective gear rules
  { id: 'r274', speciesId: 'rainbow',    waterBodyId: 'nunnally',   seasonStart: '03-01', seasonEnd: '11-30', dailyLimit: 1,  minSize: 12, hatcheryOnly: false, gearRestriction: 'Selective gear rules — artificial lures/flies only, barbless single-point hooks, no bait', notes: 'Walk-in quality lake; wild rainbow trout; selective gear rules in effect; see WDFW regulations for current rules' },

  // ── MERRY LAKE ───────────────────────────────────────────────────────────────
  { id: 'r275', speciesId: 'rainbow',    waterBodyId: 'merry',      seasonStart: '03-01', seasonEnd: '11-30', dailyLimit: 1,  minSize: 12, hatcheryOnly: false, gearRestriction: 'Selective gear rules — artificial lures/flies only, barbless single-point hooks, no bait', notes: 'Walk-in quality lake in Columbia Basin; wild rainbow trout; see WDFW regulations for current rules' },

  // ── AMBER LAKE ───────────────────────────────────────────────────────────────
  { id: 'r276', speciesId: 'rainbow',    waterBodyId: 'amber',      seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'E. WA stocked lake; statewide limits; see WDFW regulations' },
  { id: 'r277', speciesId: 'largemouth', waterBodyId: 'amber',      seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5,  minSize: 12,  hatcheryOnly: false, gearRestriction: null,                 notes: null },

  // ── WILLIAMS LAKE ────────────────────────────────────────────────────────────
  { id: 'r278', speciesId: 'rainbow',    waterBodyId: 'williams',   seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'E. WA stocked lake; statewide limits; see WDFW regulations' },
  { id: 'r279', speciesId: 'largemouth', waterBodyId: 'williams',   seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5,  minSize: 12,  hatcheryOnly: false, gearRestriction: null,                 notes: null },
  { id: 'r280', speciesId: 'perch',      waterBodyId: 'williams',   seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 25, minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: null },

  // ── MEDICAL LAKE ─────────────────────────────────────────────────────────────
  { id: 'r281', speciesId: 'rainbow',    waterBodyId: 'medical',    seasonStart: '04-25', seasonEnd: '10-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'Spokane County; stocked lake; statewide limits; see WDFW regulations' },
  { id: 'r282', speciesId: 'perch',      waterBodyId: 'medical',    seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 25, minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: null },
  { id: 'r283', speciesId: 'largemouth', waterBodyId: 'medical',    seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5,  minSize: 12,  hatcheryOnly: false, gearRestriction: null,                 notes: null },

  // ── SILVER LAKE (Cowlitz County) ─────────────────────────────────────────────
  { id: 'r284', speciesId: 'rainbow',    waterBodyId: 'silver-cowlitz', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'SW WA near Toutle; open year-round; see WDFW regulations' },
  { id: 'r285', speciesId: 'largemouth', waterBodyId: 'silver-cowlitz', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5, minSize: 12, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r286', speciesId: 'perch',      waterBodyId: 'silver-cowlitz', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 25, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },
  { id: 'r287', speciesId: 'crappie',    waterBodyId: 'silver-cowlitz', seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 10, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: null },

  // ── MINERAL LAKE ─────────────────────────────────────────────────────────────
  { id: 'r288', speciesId: 'rainbow',    waterBodyId: 'mineral',    seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'Lewis County; open year-round; stocked rainbow trout; see WDFW regulations' },
  { id: 'r289', speciesId: 'perch',      waterBodyId: 'mineral',    seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 25, minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: null },
  { id: 'r290', speciesId: 'largemouth', waterBodyId: 'mineral',    seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5,  minSize: 12,  hatcheryOnly: false, gearRestriction: null,                 notes: null },

  // ── BAKER LAKE ───────────────────────────────────────────────────────────────
  // Source: WDFW lowland lakes page + Baker River sockeye page (verified 2026 season)
  // Open: 4th Sat April – Oct 31. Sockeye: Jul 11–Aug 31, limit 4. Kokanee 10/day, 6-18" size. Rainbow 5/day. CLOSED to bull trout.
  { id: 'r291', speciesId: 'sockeye',    waterBodyId: 'baker-lake', seasonStart: '07-11', seasonEnd: '08-31', dailyLimit: 4,  minSize: null, hatcheryOnly: true, gearRestriction: null,                 notes: 'WDFW-verified 2026 season: Jul 11–Aug 31, limit 4 sockeye. Hatchery fish only (clipped adipose fin). AIS watercraft inspection mandatory. Closed to bull trout.' },
  { id: 'r292', speciesId: 'kokanee',    waterBodyId: 'baker-lake', seasonStart: '04-26', seasonEnd: '10-31', dailyLimit: 10, minSize:    6, hatcheryOnly: false, gearRestriction: null,                 notes: 'WDFW-verified: kokanee limit 10/day, 6-inch minimum, 18-inch maximum size; open 4th Sat April–Oct 31; excellent spring kokanee fishery' },
  { id: 'r293', speciesId: 'rainbow',    waterBodyId: 'baker-lake', seasonStart: '04-26', seasonEnd: '10-31', dailyLimit: 5,  minSize:    6, hatcheryOnly: false, gearRestriction: null,                 notes: 'WDFW-verified: 6-inch minimum, 18-inch maximum size; closed to bull trout/Dolly Varden' },

  // ── LAKE SHANNON ─────────────────────────────────────────────────────────────
  // Just below Baker Lake dam; sockeye fry released here; similar kokanee/rainbow fishery
  { id: 'r294', speciesId: 'kokanee',    waterBodyId: 'shannon',    seasonStart: '04-26', seasonEnd: '10-31', dailyLimit: 10, minSize:    6, hatcheryOnly: false, gearRestriction: null,                 notes: 'Below Baker Lake dam; similar kokanee fishery; sockeye fry released here; see WDFW regulations for current restrictions' },
  { id: 'r295', speciesId: 'rainbow',    waterBodyId: 'shannon',    seasonStart: '04-26', seasonEnd: '10-31', dailyLimit: 5,  minSize:    6, hatcheryOnly: false, gearRestriction: null,                 notes: 'Open 4th Sat April–Oct 31; see WDFW regulations' },

  // ── DIABLO LAKE ──────────────────────────────────────────────────────────────
  // Source: WDFW lowland lakes page (verified): year-round, naturally reproducing rainbow; no bull trout
  { id: 'r296', speciesId: 'rainbow',    waterBodyId: 'diablo',     seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 5,  minSize: null, hatcheryOnly: false, gearRestriction: null,                 notes: 'WDFW-verified: open year-round; naturally reproducing rainbow trout; within North Cascades NP — check NPS access/boat regs; closed to bull trout/Dolly Varden' },
  { id: 'r297', speciesId: 'cutthroat',  waterBodyId: 'diablo',     seasonStart: '01-01', seasonEnd: '12-31', dailyLimit: 2,  minSize: 14,  hatcheryOnly: false, gearRestriction: null,                 notes: 'See WDFW regulations for current season dates and restrictions' },

  // ── PINK SALMON — Puget Sound rivers (ODD YEARS ONLY: 2025, 2027, 2029...) ───
  // 2026 is an even year — no pink run. Status will show CLOSED until Aug 2027.
  { id: 'r298', speciesId: 'pink', waterBodyId: 'skagit',      seasonStart: '08-01', seasonEnd: '09-30', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'ODD YEARS ONLY (2025, 2027, 2029...). No pink run in even years. One of the largest pink salmon runs in WA when open.' },
  { id: 'r299', speciesId: 'pink', waterBodyId: 'snohomish',   seasonStart: '08-01', seasonEnd: '09-30', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'ODD YEARS ONLY (2025, 2027, 2029...). No pink run in even years. Snohomish has one of the biggest pink runs in Puget Sound.' },
  { id: 'r300', speciesId: 'pink', waterBodyId: 'nooksack',    seasonStart: '08-01', seasonEnd: '09-30', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'ODD YEARS ONLY (2025, 2027, 2029...). No pink run in even years.' },
  { id: 'r301', speciesId: 'pink', waterBodyId: 'green',       seasonStart: '08-01', seasonEnd: '09-30', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'ODD YEARS ONLY (2025, 2027, 2029...). No pink run in even years.' },
  { id: 'r302', speciesId: 'pink', waterBodyId: 'puyallup',    seasonStart: '08-01', seasonEnd: '09-30', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'ODD YEARS ONLY (2025, 2027, 2029...). No pink run in even years.' },

  // ── MISSING COHO + CHUM on Skagit ─────────────────────────────────────────
  { id: 'r303', speciesId: 'coho',  waterBodyId: 'skagit',     seasonStart: '08-15', seasonEnd: '11-30', dailyLimit: 2, minSize: 16, hatcheryOnly: true, gearRestriction: 'Barbless hooks only', notes: 'Hatchery fish only (clipped adipose fin). One of the top coho rivers in NW Washington.' },
  { id: 'r304', speciesId: 'chum',  waterBodyId: 'skagit',     seasonStart: '10-01', seasonEnd: '12-15', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'Strong fall chum run. Check WDFW regulations for current season dates.' },

  // ── MISSING CHUM on Green River ───────────────────────────────────────────
  { id: 'r305', speciesId: 'chum',  waterBodyId: 'green',      seasonStart: '10-01', seasonEnd: '12-15', dailyLimit: 6, minSize: null, hatcheryOnly: false, gearRestriction: null, notes: 'Green River chum run. Check WDFW regulations for current season dates.' },

  // ── DESCHUTES RIVER (Thurston County — South Sound tributary) ─────────────────
  { id: 'r306', speciesId: 'coho',       waterBodyId: 'deschutes', seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2,  minSize: 16,  hatcheryOnly: false, gearRestriction: null,              notes: 'Coho salmon into Deschutes estuary. South Sound coho run; see WDFW regulations for current dates.' },
  { id: 'r307', speciesId: 'chum',       waterBodyId: 'deschutes', seasonStart: '10-01', seasonEnd: '12-15', dailyLimit: 4,  minSize: null,hatcheryOnly: false, gearRestriction: null,              notes: 'Chum salmon. South Sound chum run; see WDFW regulations for current season dates.' },
  { id: 'r308', speciesId: 'cutthroat',  waterBodyId: 'deschutes', seasonStart: '06-01', seasonEnd: '10-31', dailyLimit: 2,  minSize: 14,  hatcheryOnly: false, gearRestriction: null,              notes: 'Sea-run cutthroat trout. See WDFW regulations.' },

  // ── CARBON RIVER (Pierce County — Puyallup tributary) ─────────────────────────
  { id: 'r309', speciesId: 'coho',       waterBodyId: 'carbon',    seasonStart: '09-01', seasonEnd: '11-30', dailyLimit: 2,  minSize: 16,  hatcheryOnly: true,  gearRestriction: 'Barbless hooks only', notes: 'Hatchery coho. Puyallup tributary; see WDFW regulations for current season dates.' },
  { id: 'r310', speciesId: 'steelhead',  waterBodyId: 'carbon',    seasonStart: '01-01', seasonEnd: '03-31', dailyLimit: 2,  minSize: 20,  hatcheryOnly: true,  gearRestriction: null,              notes: 'Hatchery winter steelhead. See WDFW regulations for current season dates.' },
  { id: 'r311', speciesId: 'chinook',    waterBodyId: 'carbon',    seasonStart: '07-01', seasonEnd: '09-15', dailyLimit: 2,  minSize: 24,  hatcheryOnly: true,  gearRestriction: 'Barbless hooks only', notes: 'Summer Chinook, hatchery only. See WDFW regulations for current season dates.' },
]

// ─── GEAR ICONS ───────────────────────────────────────────────────────────────

export type GearIconCode =
  | 'SGR'              // Selective Gear Rules: lures/flies only, barbless single-point hooks, no bait
  | 'SINGLE_BARBLESS'  // Single-point barbless hook required
  | 'ANTI_SNAGGING'    // Anti-snagging rule: one hook ≤¾" from point to shank, no weight within 12"
  | 'NIGHT_CLOSURE'    // Closed 1hr after sunset to 1hr before sunrise
  | 'TWO_POLE_OK'      // Two-Pole Endorsement allowed (requires 2PE on license)
  | 'NO_MOTORS'        // Internal combustion motors prohibited
  | 'CATCH_AND_RELEASE'// All fish must be released (except hatchery exceptions)
  | 'CRC'              // Catch Record Card required
  | 'TRIBAL_CLOSURE_RISK' // Periodic tribal fishery closures possible — check before going
  | 'CLOSED_WATERS_SUMMER' // Closed waters June 1 – Sept 15
  | 'EMERGENCY_RULE'   // Active emergency rule modifying base pamphlet

export const GEAR_ICON_INFO: Record<GearIconCode, { label: string; detail: string; color: string; icon: string }> = {
  SGR:                 { label: 'Selective Gear',     detail: 'Lures or flies only · Barbless single-point hooks · No bait',                              color: '#3b82f6', icon: '🎣' },
  SINGLE_BARBLESS:     { label: 'Barbless Hook',      detail: 'Single-point barbless hook required (≤½" from point to shank in some sections)',           color: '#8b5cf6', icon: '🪝' },
  ANTI_SNAGGING:       { label: 'Anti-Snagging',      detail: 'One hook ≤¾" point to shank · No weight within 12" above hook',                           color: '#f59e0b', icon: '⚠️' },
  NIGHT_CLOSURE:       { label: 'Night Closure',      detail: 'Closed from 1hr after sunset to 1hr before sunrise',                                       color: '#6366f1', icon: '🌙' },
  TWO_POLE_OK:         { label: '2-Rod OK',           detail: 'Two-Pole Endorsement allowed — requires 2PE add-on on your license',                       color: '#10b981', icon: '🎏' },
  NO_MOTORS:           { label: 'No Motors',          detail: 'Internal combustion motors prohibited — electric OK',                                       color: '#ef4444', icon: '🚫' },
  CATCH_AND_RELEASE:   { label: 'C&R',                detail: 'Catch-and-release only — except hatchery steelhead where noted',                           color: '#06b6d4', icon: '↩️' },
  CRC:                 { label: 'CRC Required',       detail: 'Catch Record Card #830 required for Skagit salmon/steelhead',                              color: '#f97316', icon: '📋' },
  TRIBAL_CLOSURE_RISK: { label: 'Tribal Closures',   detail: 'Periodic tribal fishery conflict closures — check WDFW emergency rules before every trip',  color: '#dc2626', icon: '🛑' },
  CLOSED_WATERS_SUMMER:{ label: 'Closed Summer',      detail: 'Closed waters June 1 – Sept 15 (Baker River Confluence Zone)',                             color: '#dc2626', icon: '⛔' },
  EMERGENCY_RULE:      { label: 'Emergency Rule',     detail: 'Active WDFW emergency rule modifies base pamphlet — see details below',                    color: '#dc2626', icon: '🚨' },
}

// ─── SKAGIT RIVER SECTIONS ────────────────────────────────────────────────────

export type GearPeriod = {
  dates: string
  rules: string
}

export type SeasonEntry = {
  species: string
  open: string
  dailyLimit?: number | string | null
  notes?: string
  closed?: boolean
}

export type EmergencyOverride = {
  dates: string
  status?: 'OPEN' | 'CLOSED'
  notes: string
  startDate?: string  // ISO date YYYY-MM-DD — for "RIGHT NOW" detection
  endDate?: string    // ISO date YYYY-MM-DD — inclusive
}

export type RiverSection = {
  id: string
  name: string           // short label (shown in list)
  fullName: string       // complete WDFW name
  crc: string
  boundary: string       // exact WDFW boundary description
  downstreamLandmark: string
  upstreamLandmark: string
  mapsLinkDownstream: string
  mapsLinkUpstream: string
  coordsNote: string     // accuracy note
  gearIcons: GearIconCode[]
  gearPeriods: GearPeriod[]
  seasons: SeasonEntry[]
  emergencyRule?: {
    source: string
    effective: string
    url: string
    overrides: EmergencyOverride[]
  }
}

export const SKAGIT_SECTIONS: RiverSection[] = [
  {
    id: 'skagit-mouth-to-hwy536',
    name: 'Mouth → Hwy 536 (Mt. Vernon)',
    fullName: 'Skagit River — Mouth to Hwy. 536 (Memorial Hwy. Bridge) at Mt. Vernon',
    crc: '830',
    boundary: 'From the mouth (line from jetty terminus at McGlinn Island through monuments at Ika Island, Craft Island, Dry Slough levee corner, and Tom Moore Slough east side) to Hwy. 536 Memorial Hwy. Bridge at Mt. Vernon.',
    downstreamLandmark: 'Skagit River mouth / La Conner delta area',
    upstreamLandmark: 'Hwy. 536 Memorial Hwy. Bridge, Mt. Vernon',
    mapsLinkDownstream: 'https://maps.google.com/?q=48.380,-122.550',
    mapsLinkUpstream: 'https://maps.google.com/?q=48.4213,-122.3283',
    coordsNote: 'Coordinates are approximate. Mouth boundary uses physical monuments — verify on a WDFW map.',
    gearIcons: ['SGR', 'NIGHT_CLOSURE'],
    gearPeriods: [
      { dates: 'Mar 1 – Aug 15', rules: 'Selective Gear Rules (barbless single-point lures/flies; no bait). Exception: sturgeon anglers must use bait; hooks ≤½" from point to shank.' },
      { dates: 'Aug 16 – Oct 31', rules: 'Night Closure (1hr after sunset to 1hr before sunrise). No special gear restriction.' },
      { dates: 'Nov 1 – Feb 28', rules: 'Statewide freshwater rules (no special gear restriction).' },
    ],
    seasons: [
      { species: 'Coho Salmon', open: 'Aug 16 – Sep 30', dailyLimit: 4, notes: 'Max 2 wild coho. Release all salmon other than coho. Min 12".' },
      { species: 'Coho Salmon', open: 'Oct 1 – Oct 31', dailyLimit: 2, notes: 'Release all salmon other than coho. Min 12".' },
      { species: 'Dolly Varden / Bull Trout', open: 'Mar 1–Aug 15 & Nov 1–Jan 31', notes: 'Min 20". Closed to retention Aug 16 – Oct 31.' },
      { species: 'Trout (other)', open: 'Mar 1 – Jan 31', notes: 'Statewide limit. Cutthroat & wild rainbow: min 14".' },
      { species: 'Sturgeon', open: 'Year-round', dailyLimit: 'C&R only', notes: 'Catch-and-release. Night closure applies. One barbless hook. Bait allowed for sturgeon.' },
      { species: 'Salmon (all other)', open: '—', closed: true, notes: 'No open season.' },
    ],
  },
  {
    id: 'skagit-hwy536-to-gilligan',
    name: 'Hwy 536 → Gilligan Creek',
    fullName: 'Skagit River — Hwy. 536 (Memorial Hwy. Bridge) to Gilligan Creek',
    crc: '830',
    boundary: 'From Hwy. 536 Memorial Hwy. Bridge at Mt. Vernon upstream to the mouth of Gilligan Creek.',
    downstreamLandmark: 'Hwy. 536 Memorial Hwy. Bridge, Mt. Vernon',
    upstreamLandmark: 'Gilligan Creek confluence (between Mt. Vernon & Hamilton)',
    mapsLinkDownstream: 'https://maps.google.com/?q=48.4213,-122.3283',
    mapsLinkUpstream: 'https://maps.google.com/?q=48.493,-122.020',
    coordsNote: 'Gilligan Creek confluence coordinates are approximate — WDFW does not publish GPS for this point.',
    gearIcons: ['SGR', 'NIGHT_CLOSURE', 'TWO_POLE_OK', 'EMERGENCY_RULE'],
    gearPeriods: [
      { dates: 'Jun 1 – Jun 30', rules: 'Selective Gear Rules — barbless hooks ≤½" from point to shank. Exception: sturgeon bait OK with one single-point barbless hook any size.' },
      { dates: 'Jul 1 – Jul 31', rules: 'Night Closure.' },
      { dates: 'Aug 16 – Oct 31', rules: 'Night Closure.' },
    ],
    seasons: [
      { species: 'Sockeye Salmon', open: 'Jul 1 – Jul 31', dailyLimit: 4, notes: 'Release all salmon other than sockeye. Min 12". ⚠️ Modified by emergency rule through Jul 31 2026 — see below.' },
      { species: 'Coho Salmon', open: 'Aug 16 – Sep 30', dailyLimit: 4, notes: 'Max 2 wild coho. Release all except coho. Min 12".' },
      { species: 'Coho Salmon', open: 'Oct 1 – Oct 31', dailyLimit: 2, notes: 'Release all except coho. Min 12".' },
      { species: 'Dolly Varden / Bull Trout', open: 'Jun 1–Jun 30 / Aug 1–Aug 15 / Nov 1–Jan 31', notes: 'Min 20". Closed Jul 1–31 and Aug 16 – Oct 31.' },
      { species: 'Trout (other)', open: 'Jun 1 – Jan 31', notes: 'Statewide. Cutthroat/wild rainbow: min 14".' },
    ],
    emergencyRule: {
      source: 'WDFW Emergency Rule 26-123-136776, published July 6, 2026 (supersedes ER 26-114-136727)',
      effective: 'In effect through July 31, 2026',
      url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/lower-skagit-river-fishing-updates-2026-07',
      overrides: [
        { dates: 'Immediately – Jul 31 2026', status: 'OPEN', startDate: '2026-07-06', endDate: '2026-07-31', notes: '4 sockeye daily limit. Release all salmon other than sockeye. Min 12". Night Closure in effect. Two-pole endorsement ALLOWED. Selective gear rules NOT in effect for salmon (SGR still applies for game fish). Release Dolly Varden/bull trout.' },
      ],
    },
  },
  {
    id: 'skagit-gilligan-to-dalles',
    name: 'Gilligan Creek → Dalles Bridge (Concrete)',
    fullName: 'Skagit River — Gilligan Creek to Dalles Bridge at Concrete',
    crc: '830',
    boundary: 'From the mouth of Gilligan Creek upstream to the Dalles Bridge at Concrete (Hwy. 20).',
    downstreamLandmark: 'Gilligan Creek confluence',
    upstreamLandmark: 'Dalles Bridge (Hwy. 20), Concrete, WA',
    mapsLinkDownstream: 'https://maps.google.com/?q=48.493,-122.020',
    mapsLinkUpstream: 'https://maps.google.com/?q=48.534,-121.750',
    coordsNote: 'Approximate coordinates — verify against WDFW or USGS map before fishing.',
    gearIcons: ['SGR', 'NIGHT_CLOSURE', 'SINGLE_BARBLESS', 'TWO_POLE_OK', 'EMERGENCY_RULE', 'TRIBAL_CLOSURE_RISK'],
    gearPeriods: [
      { dates: 'Jun 1 – Jun 30', rules: 'Night Closure + Selective Gear Rules — one single-point barbless hook ≤½" from point to shank only.' },
      { dates: 'Jul 1 – Aug 31', rules: 'Night Closure.' },
      { dates: 'Sep 1 – Sep 30', rules: 'Night Closure + Single-point barbless hooks required.' },
      { dates: 'Oct 1 – Oct 31', rules: 'Night Closure.' },
    ],
    seasons: [
      { species: 'Sockeye Salmon', open: 'Jul 1 – Jul 31', dailyLimit: 4, notes: 'Release all salmon other than sockeye. Min 12". ⚠️ Modified by emergency rule — see below.' },
      { species: 'Coho Salmon', open: 'Sep 1 – Sep 30', dailyLimit: 4, notes: 'Max 2 wild coho. Release all except coho. Min 12".' },
      { species: 'Coho Salmon', open: 'Oct 1 – Oct 31', dailyLimit: 2, notes: 'Release all except coho. Min 12".' },
      { species: 'Dolly Varden / Bull Trout', open: 'Jun 1–Jun 30 / Aug 1–Aug 31 / Nov 1–Jan 31', notes: 'Min 20". Closed Jul 1–31 and Sep 1 – Oct 31.' },
      { species: 'Trout (other)', open: 'Jun 1 – Jan 31', notes: 'Statewide. Cutthroat/wild rainbow: min 14".' },
    ],
    emergencyRule: {
      source: 'WDFW Emergency Rule 26-126-136780, published July 7, 2026 (supersedes ER 26-123-136776 / ER 26-114-136727)',
      effective: 'In effect through July 31, 2026',
      url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/lower-skagit-river-fishing-updates-2026-07',
      overrides: [
        { dates: 'Jul 7 – 12:29 p.m. Jul 9', status: 'CLOSED', startDate: '2026-07-07', endDate: '2026-07-09', notes: 'CLOSED to ALL species — tribal fishery conflict avoidance (extended from Jul 8 due to treaty fishery extension).' },
        { dates: '12:30 p.m. Jul 9 – Jul 12', status: 'OPEN', startDate: '2026-07-09', endDate: '2026-07-12', notes: '4 sockeye daily. Release all except sockeye. Min 12". Night Closure. 2-rod OK. SGR not in effect for salmon. Release Dolly Varden/bull trout.' },
        { dates: 'Jul 13 – Jul 15', status: 'CLOSED', startDate: '2026-07-13', endDate: '2026-07-15', notes: 'CLOSED to ALL species — tribal fishery conflict avoidance.' },
        { dates: 'Jul 16 – Jul 31', status: 'OPEN', startDate: '2026-07-16', endDate: '2026-07-31', notes: '4 sockeye daily. Release all except sockeye. Min 12". Night Closure. 2-rod OK. SGR not in effect for salmon. Release Dolly Varden/bull trout.' },
      ],
    },
  },
  {
    id: 'skagit-dalles-to-baker-below',
    name: 'Dalles Bridge → 200\' Below Baker River',
    fullName: 'Skagit River — Dalles Bridge (Concrete) to 200\' Below Baker River',
    crc: '830',
    boundary: 'From the Dalles Bridge at Concrete upstream to 200\' below the mouth of Baker River.',
    downstreamLandmark: 'Dalles Bridge (Hwy. 20), Concrete, WA',
    upstreamLandmark: '200\' below mouth of Baker River',
    mapsLinkDownstream: 'https://maps.google.com/?q=48.534,-121.750',
    mapsLinkUpstream: 'https://maps.google.com/?q=48.509,-121.662',
    coordsNote: 'Approximate coordinates. The "200\' below Baker River mouth" point is a field determination.',
    gearIcons: ['SGR', 'NIGHT_CLOSURE', 'SINGLE_BARBLESS', 'EMERGENCY_RULE', 'TRIBAL_CLOSURE_RISK'],
    gearPeriods: [
      { dates: 'Jun 1 – Sep 15', rules: 'Night Closure + Selective Gear Rules — one single-point barbless hook ≤½" from point to shank only.' },
      { dates: 'Sep 16 – Sep 30', rules: 'Night Closure + Single-point barbless hooks required.' },
      { dates: 'Oct 1 – Oct 31', rules: 'Night Closure.' },
    ],
    seasons: [
      { species: 'Salmon (Jun–Sep 15)', open: '—', closed: true, notes: 'No salmon season in base pamphlet for this section during this period.' },
      { species: 'Coho Salmon', open: 'Sep 16 – Sep 30', dailyLimit: 4, notes: 'Max 2 wild coho. Release all except coho. Min 12".' },
      { species: 'Coho Salmon', open: 'Oct 1 – Oct 31', dailyLimit: 2, notes: 'Release all except coho. Min 12".' },
      { species: 'Dolly Varden / Bull Trout', open: 'Jun 1–Sep 15 / Nov 1–Jan 31', notes: 'Min 20". Closed to retention Sep 16 – Oct 31.' },
    ],
    emergencyRule: {
      source: 'WDFW Emergency Rule 26-126-136780, published July 7, 2026 (supersedes ER 26-123-136776 / ER 26-114-136727)',
      effective: 'In effect through July 31, 2026',
      url: 'https://wdfw.wa.gov/fishing/regulations/emergency-rules/lower-skagit-river-fishing-updates-2026-07',
      overrides: [
        { dates: 'Jul 7 – 12:29 p.m. Jul 9', status: 'CLOSED', startDate: '2026-07-07', endDate: '2026-07-09', notes: 'CLOSED to ALL species — tribal fishery conflict avoidance (extended from Jul 8 due to treaty fishery extension).' },
        { dates: 'Jul 13 – Jul 15', status: 'CLOSED', startDate: '2026-07-13', endDate: '2026-07-15', notes: 'CLOSED to ALL species — tribal fishery conflict avoidance.' },
        { dates: 'All other dates', notes: 'Base pamphlet rules apply (no sockeye season established here).' },
      ],
    },
  },
  {
    id: 'skagit-baker-confluence',
    name: 'Baker River Confluence Zone (±200\')',
    fullName: 'Skagit River — Baker River Confluence Zone (200\' Above to 200\' Below)',
    crc: '830',
    boundary: 'Between a line projected across the river 200\' above the east bank of the Baker River and a line 200\' below the west bank of the Baker River. Narrow ~400\' zone.',
    downstreamLandmark: '200\' below Baker River mouth (west bank)',
    upstreamLandmark: '200\' above Baker River mouth (east bank)',
    mapsLinkDownstream: 'https://maps.google.com/?q=48.509,-121.658',
    mapsLinkUpstream: 'https://maps.google.com/?q=48.509,-121.658',
    coordsNote: 'Both ends near Baker River mouth. This is a narrow field-measured zone — verify on-site.',
    gearIcons: ['NIGHT_CLOSURE', 'SINGLE_BARBLESS', 'CLOSED_WATERS_SUMMER'],
    gearPeriods: [
      { dates: 'Jun 1 – Sep 15', rules: '⛔ CLOSED WATERS — all species.' },
      { dates: 'Sep 16 – Sep 30', rules: 'Night Closure + Single-point barbless hooks required.' },
      { dates: 'Oct 1 – Oct 31', rules: 'Night Closure.' },
    ],
    seasons: [
      { species: 'All species', open: 'Jun 1 – Sep 15', closed: true, notes: 'CLOSED WATERS.' },
      { species: 'Coho Salmon', open: 'Sep 16 – Sep 30', dailyLimit: 4, notes: 'Max 2 wild coho. Release all except coho. Min 12".' },
      { species: 'Coho Salmon', open: 'Oct 1 – Oct 31', dailyLimit: 2, notes: 'Release all except coho. Min 12".' },
      { species: 'Dolly Varden / Bull Trout', open: 'Nov 1 – Jan 31', notes: 'Min 20". Closed to retention Sep 16 – Oct 31.' },
    ],
  },
  {
    id: 'skagit-baker-above-to-rockport',
    name: '200\' Above Baker River → Hwy 530 (Rockport)',
    fullName: 'Skagit River — 200\' Above Baker River to Hwy. 530 Bridge (Rockport)',
    crc: '830',
    boundary: 'From 200\' upstream of the mouth of Baker River to the Hwy. 530 Bridge at Rockport.',
    downstreamLandmark: '200\' above Baker River mouth',
    upstreamLandmark: 'Hwy. 530 Bridge, Rockport, WA',
    mapsLinkDownstream: 'https://maps.google.com/?q=48.509,-121.658',
    mapsLinkUpstream: 'https://maps.google.com/?q=48.489,-121.598',
    coordsNote: 'Approximate coordinates.',
    gearIcons: ['SGR', 'NIGHT_CLOSURE', 'SINGLE_BARBLESS'],
    gearPeriods: [
      { dates: 'Jun 1 – Sep 15', rules: 'Selective Gear Rules — one single-point barbless hook ≤½". Night Closure.' },
      { dates: 'Sep 16 – Sep 30', rules: 'Single-point barbless hooks required. Night Closure.' },
      { dates: 'Oct 1 – Oct 31', rules: 'Night Closure.' },
    ],
    seasons: [
      { species: 'Salmon', open: 'Jun 1 – Sep 15', closed: true, notes: 'No salmon season listed in base pamphlet.' },
      { species: 'Coho Salmon', open: 'Sep 16 – Sep 30', dailyLimit: 4, notes: 'Max 2 wild coho. Release all except coho. Min 12".' },
      { species: 'Coho Salmon', open: 'Oct 1 – Oct 31', dailyLimit: 2, notes: 'Release all except coho. Min 12".' },
      { species: 'Dolly Varden / Bull Trout', open: 'Jun 1–Sep 15 / Nov 1–Jan 31', notes: 'Min 20". Closed to retention Sep 16 – Oct 31.' },
    ],
  },
  {
    id: 'skagit-rockport-to-marblemount',
    name: 'Hwy 530 (Rockport) → Marblemount Bridge',
    fullName: 'Skagit River — Hwy. 530 Bridge (Rockport) to Cascade River Rd. (Marblemount Bridge)',
    crc: '830',
    boundary: 'From the Hwy. 530 Bridge at Rockport upstream to the Cascade River Rd. (Marblemount Bridge).',
    downstreamLandmark: 'Hwy. 530 Bridge, Rockport, WA',
    upstreamLandmark: 'Cascade River Rd. Bridge, Marblemount, WA',
    mapsLinkDownstream: 'https://maps.google.com/?q=48.489,-121.598',
    mapsLinkUpstream: 'https://maps.google.com/?q=48.527,-121.444',
    coordsNote: 'Approximate coordinates.',
    gearIcons: ['ANTI_SNAGGING', 'SGR', 'NIGHT_CLOSURE', 'SINGLE_BARBLESS'],
    gearPeriods: [
      { dates: 'Jun 1 – Jul 15', rules: 'Anti-snagging rule + Night Closure.' },
      { dates: 'Jul 16 – Sep 15', rules: 'Night Closure + Selective Gear Rules — one single-point barbless hook ≤½" from point to shank.' },
      { dates: 'Sep 16 – Sep 30', rules: 'Night Closure + Single-point barbless hooks required.' },
      { dates: 'Oct 1 – Oct 31', rules: 'Night Closure.' },
    ],
    seasons: [
      { species: 'Hatchery Chinook Salmon', open: 'Jul 1 – Jul 15', dailyLimit: 4, notes: 'Max 2 adults. Hatchery fish only (clipped adipose fin). Release all salmon except hatchery Chinook. Min 12".' },
      { species: 'Coho Salmon', open: 'Sep 16 – Sep 30', dailyLimit: 4, notes: 'Max 2 wild coho. Release all except coho. Min 12".' },
      { species: 'Coho Salmon', open: 'Oct 1 – Oct 31', dailyLimit: 2, notes: 'Release all except coho. Min 12".' },
      { species: 'All Game Fish', open: 'Jun 1 – Jan 31', notes: 'Statewide limits.' },
    ],
  },
  {
    id: 'skagit-marblemount-to-newhalem',
    name: 'Marblemount Bridge → Gorge Powerhouse (Newhalem)',
    fullName: 'Skagit River — Marblemount Bridge to Gorge Powerhouse at Newhalem',
    crc: '830',
    boundary: 'From the Cascade River Rd. (Marblemount Bridge) upstream to the Gorge powerhouse at Newhalem.',
    downstreamLandmark: 'Cascade River Rd. Bridge, Marblemount, WA',
    upstreamLandmark: 'Gorge Powerhouse, Newhalem, WA (Gorge Dam area)',
    mapsLinkDownstream: 'https://maps.google.com/?q=48.527,-121.444',
    mapsLinkUpstream: 'https://maps.google.com/?q=48.678,-121.244',
    coordsNote: 'Approximate coordinates.',
    gearIcons: ['SGR', 'NO_MOTORS', 'CATCH_AND_RELEASE'],
    gearPeriods: [
      { dates: 'Year-round when open', rules: 'Internal combustion motors PROHIBITED. Selective Gear Rules (barbless single-point lures/flies; no bait).' },
    ],
    seasons: [
      { species: 'All Game Fish (incl. Steelhead)', open: 'Jun 1 – Jan 31', dailyLimit: 'C&R (up to 2 hatchery steelhead retained)', notes: 'Hatchery steelhead = clipped adipose or ventral fin.' },
      { species: 'Salmon', open: '—', closed: true, notes: 'No salmon season listed. Treat as closed.' },
    ],
  },
]

// ─── REGULATION HELPERS ───────────────────────────────────────────────────────

/** Check if a species is open on a given date at a given water body */
export function isOpenOn(reg: Regulation, date: Date): boolean {
  // Emergency closure takes priority — if today falls in the closed window, always return false
  if (reg.emergencyClosedFrom) {
    const from = new Date(reg.emergencyClosedFrom)
    const to   = reg.emergencyClosedTo ? new Date(reg.emergencyClosedTo) : null
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const fromOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate())
    if (dateOnly >= fromOnly && (to === null || dateOnly <= new Date(to.getFullYear(), to.getMonth(), to.getDate()))) {
      return false
    }
  }
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const today = `${mm}-${dd}`
  const { seasonStart, seasonEnd } = reg
  // Handle year-wrap (e.g., 09-01 to 03-31)
  if (seasonStart <= seasonEnd) {
    return today >= seasonStart && today <= seasonEnd
  } else {
    return today >= seasonStart || today <= seasonEnd
  }
}

/** Get all open regulations for a given date */
export function getOpenRegulations(date: Date): Regulation[] {
  return REGULATIONS.filter(r => isOpenOn(r, date))
}

/** Get open species for a given date */
export function getOpenSpeciesForDate(date: Date): Species[] {
  const openRegs = getOpenRegulations(date)
  const openIds = new Set(openRegs.map(r => r.speciesId))
  return SPECIES.filter(s => openIds.has(s.id))
}

/** Days until a species next opens (from today). Returns null if already open or no future reg found. */
export function daysUntilOpen(speciesId: string, fromDate: Date = new Date()): number | null {
  const regs = REGULATIONS.filter(r => r.speciesId === speciesId)
  if (regs.length === 0) return null
  // If any reg is already open, return null
  if (regs.some(r => isOpenOn(r, fromDate))) return null

  let minDays = Infinity
  for (const reg of regs) {
    const [sm, sd] = reg.seasonStart.split('-').map(Number)
    const year = fromDate.getFullYear()
    let nextOpen = new Date(year, sm - 1, sd)
    if (nextOpen <= fromDate) nextOpen = new Date(year + 1, sm - 1, sd)
    const days = Math.ceil((nextOpen.getTime() - fromDate.getTime()) / 86400000)
    if (days < minDays) minDays = days
  }
  return minDays === Infinity ? null : minDays
}

/** Get top N species to target today by peakMonths proximity */
export function getWhatsHot(date: Date, limit = 4): Species[] {
  const month = date.getMonth() + 1
  const openRegs = getOpenRegulations(date)
  const openIds = new Set(openRegs.map(r => r.speciesId))
  return SPECIES
    .filter(s => openIds.has(s.id))
    .sort((a, b) => {
      const aHot = a.peakMonths.includes(month) ? 0 : 1
      const bHot = b.peakMonths.includes(month) ? 0 : 1
      return aHot - bHot
    })
    .slice(0, limit)
}