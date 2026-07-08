export type GearItem = {
  name: string
  amazonUrl: string
}

export type GearInfo = {
  lures: GearItem[]
  bait: GearItem[]
  rodSetup: string
  technique: string[]
  bestTimes: string
}

// Set NEXT_PUBLIC_AMAZON_TAG in Vercel env vars to earn affiliate commissions
// e.g. NEXT_PUBLIC_AMAZON_TAG=castwa-20
function g(name: string): GearItem {
  const tag = process.env.NEXT_PUBLIC_AMAZON_TAG
  const base = `https://www.amazon.com/s?k=${encodeURIComponent(name + ' fishing')}`
  return { name, amazonUrl: tag ? `${base}&tag=${tag}` : base }
}

export const GEAR: Record<string, GearInfo> = {
  chinook: {
    lures: [g('Kwikfish K15–16 plug'), g('Blue Fox spinner #5–6'), g('Coyote spoon'), g('Cut-plug herring rig'), g('Spin-N-Glo')],
    bait: [g('Cured salmon eggs'), g('Whole or cut herring'), g('Canned shrimp'), g('Sand shrimp')],
    rodSetup: '9–10.5 ft heavy action · 20–30 lb fluorocarbon leader · 40–65 lb braid mainline',
    technique: [
      'Back-troll plugs at 1–2 mph near the bottom in deep runs',
      'Drift cure eggs through tailouts and current seams',
      'Fish 6–8 inches off bottom — Chinook hug the floor',
      'Target deep holes below riffles, especially at low-light periods',
      'Use barbless hooks on the Skagit; hatchery fish only (look for clipped adipose fin)',
    ],
    bestTimes: 'July–September (Puget Sound); May–September (rivers)',
  },
  coho: {
    lures: [g('Mepps Aglia #4–5 spinner'), g('Blue Fox Vibrax'), g('Pixee spoon'), g('Pink/chartreuse 1/2 oz jig'), g('Flasher + Coho fly')],
    bait: [g('Cured salmon eggs'), g('Sand shrimp'), g('Cut herring')],
    rodSetup: '8–9 ft medium-heavy · 12–20 lb mono or 20–30 lb braid · 15–20 lb leader',
    technique: [
      'Twitch jigs aggressively near the surface — Coho are aggressive mid-water strikers',
      'Troll with a flasher + coho fly combo at 3–4 mph in salt water',
      'Fresh-run fish hold near tidewater — target river mouths first',
      'Cast spinners across-and-downstream, retrieve at medium speed',
    ],
    bestTimes: 'August–November (rivers); September–October (Puget Sound)',
  },
  steelhead: {
    lures: [g('Corky & yarn pink/orange'), g('Blue Fox Vibrax #3–5'), g('Chartreuse 1/4 oz jig'), g('Little Cleo spoon'), g('Spin-N-Glo')],
    bait: [g('Cured salmon eggs'), g('Sand shrimp whole or tail'), g('Nightcrawlers'), g('Prawn')],
    rodSetup: '9–11 ft medium-heavy · 8–12 lb fluorocarbon leader · 10–20 lb braid or mono',
    technique: [
      'Drift bait or corky through the seam where fast water meets slow',
      'Float fishing: set leader 4–8 ft, drift through runs at current speed',
      'Side-drifting: drag bait from the boat slightly faster than current',
      'Steelhead face upstream — present from downstream, cast quartering up-current',
      'Winter fish hold deeper in slower water; summer fish are shallower and more active',
    ],
    bestTimes: 'December–March (winter run); June–August (summer run)',
  },
  rainbow: {
    lures: [g('Rooster Tail spinner black/yellow'), g('Mepps Aglia #1–2'), g('Thomas Cyclone spoon'), g('PowerBait chartreuse/rainbow'), g('Z-Man grub')],
    bait: [g('Nightcrawlers'), g('PowerBait floating dough'), g('Pautzke salmon eggs red'), g('Corn + PowerBait combo')],
    rodSetup: '6–7 ft light-medium · 4–8 lb mono or fluorocarbon',
    technique: [
      'Still fish PowerBait off a sliding sinker rig — let it float 6" off bottom',
      'Cast spinners across current, retrieve at steady medium pace',
      'Troll at 1.5 mph along shoreline structure in lakes',
      'Fish near inlets and outlets in stocked lakes — trout congregate there',
    ],
    bestTimes: 'Year-round; best April–June and September–October',
  },
  cutthroat: {
    lures: [g('Small Rooster Tail #1'), g('Mepps Aglia #0–1'), g('Small Kastmaster spoon'), g('Elk hair caddis dry fly'), g('Wooly bugger streamer')],
    bait: [g('Small nightcrawlers'), g('Pautzke salmon eggs'), g('Small worm pieces')],
    rodSetup: '6–7 ft light · 4–6 lb mono — or — 5-wt fly rod with floating line',
    technique: [
      'Work undercut banks and seams where fast and slow water meet',
      'Cast spinners upstream, retrieve slightly faster than current',
      'On fly: drift a nymph through deep pools; dry fly on calm evenings',
      'Many WA cutthroat waters are catch-and-release — check regs before keeping',
    ],
    bestTimes: 'April–October (freshwater); November–March (sea-run in tidal rivers)',
  },
  bull: {
    lures: [g('Large streamer fly'), g('Minnow-style lure'), g('Spoon 1/4 oz')],
    bait: [g('Prohibited in most bull trout waters — check regs')],
    rodSetup: '6–7 ft medium · 6–10 lb fluorocarbon · 5-6 wt fly rod',
    technique: [
      'Bull trout are catch-and-release only in most WA waters — handle gently',
      'Often found in cold, clear mountain streams above 3,500 ft elevation',
      'Fish deep pools and the head of runs near log jams',
    ],
    bestTimes: 'July–September in mountain streams',
  },
  brook: {
    lures: [g('Tiny spinner #0–1'), g('Small fishing spoon'), g('Dry fly ant or beetle pattern')],
    bait: [g('Small worm pieces'), g('Pautzke salmon eggs'), g('Grasshoppers')],
    rodSetup: '5–6 ft ultra-light · 2–4 lb mono · or 3-4 wt fly rod',
    technique: [
      'Brook trout are aggressive — almost any small lure will work',
      'Wade slowly, approach pools from downstream to avoid spooking fish',
      'In alpine lakes, cast around rocky shoreline structure',
    ],
    bestTimes: 'June–October (high mountain streams and lakes)',
  },
  brown: {
    lures: [g('Rapala Original Floating #5–7'), g('Mepps Aglia #2–3'), g('Kastmaster 1/4 oz'), g('Wooly bugger streamer fly')],
    bait: [g('Large nightcrawlers'), g('Fathead minnows'), g('Crayfish tails')],
    rodSetup: '6.5–7.5 ft medium · 6–10 lb fluorocarbon',
    technique: [
      'Brown trout are nocturnal — fish 30 minutes before and after sunrise/sunset',
      'Target large pools with heavy cover; browns hide under undercut banks',
      'Slow and stealthy approach; they spook easily in clear water',
      'Match the hatch on fly rod; streamers work great at dusk',
    ],
    bestTimes: 'Spring and fall; nocturnal feeding all summer',
  },
  'lake-trout': {
    lures: [g('Swedish Pimple 1–2 oz heavy spoon'), g('Large swimbait'), g('Tube jig 1–2 oz'), g('Deep trolling spoon')],
    bait: [g('Live or dead smelt'), g('Cut cisco or whitefish'), g('Sucker meat')],
    rodSetup: '7 ft medium-heavy · 10–17 lb mono or 30–50 lb braid with lead core or downrigger',
    technique: [
      'Lake trout live deep — 60–200 ft in summer; use downrigger or lead-core',
      'Vertical jigging over structure in 80–150 ft is productive in winter',
      'Ice fishing in December–February is highly effective',
      'Troll at 2–3 mph along deep-water structure',
    ],
    bestTimes: 'Year-round; ice fishing in winter; trolling in fall',
  },
  whitefish: {
    lures: [g("Tiny jig 1/32 oz"), g("Small fishing spoon"), g("Hare's ear nymph"), g("Pheasant tail nymph")],
    bait: [g("Maggots fishing bait"), g("Small worm pieces"), g("Corn fishing bait")],
    rodSetup: '6–7 ft light · 4–6 lb mono · or 3-4 wt fly rod',
    technique: [
      'Mountain whitefish school up in winter near deep pools below riffles',
      'Float fish tiny bait close to the bottom',
      'They\'re an underrated fly rod fish — nymphs under an indicator work great',
    ],
    bestTimes: 'Year-round; winter months when other rivers slow down',
  },
  largemouth: {
    lures: [g('Senko worm Texas rig 5–7 inch'), g('Topwater frog lure'), g('Spinnerbait 3/8 oz'), g('Rapala DT-6 crankbait'), g('Swimbait 3–4 inch')],
    bait: [g('Live nightcrawlers'), g('Waterdogs mudpuppies'), g('Crayfish')],
    rodSetup: '6.5–7 ft medium-heavy · 12–20 lb fluorocarbon or 30–50 lb braid in heavy cover',
    technique: [
      'Target structure — docks, lily pads, fallen logs, rocky points',
      'Topwater frogs and poppers are deadly early morning and late evening',
      'In heat of summer, bass go deep — slow down your presentation',
      'Texas rig a Senko in heavy cover and let it sink with no action (drop shot style)',
    ],
    bestTimes: 'May–October; peak in warm months (June–August)',
  },
  smallmouth: {
    lures: [g('Ned rig Zman TRD 3 inch'), g('Drop shot finesse worm'), g('Rapala Shad Rap 5 crankbait'), g('Tube jig 3–4 inch'), g('Hair jig')],
    bait: [g('Crayfish'), g('Nightcrawlers'), g('Leeches fishing bait')],
    rodSetup: '6.5–7 ft medium · 8–12 lb fluorocarbon (lighter = more bites in clear water)',
    technique: [
      'Target gravel bars, rocky points, and current breaks in rivers',
      'Smallmouth prefer clear, cooler water than largemouth',
      'Ned rig on a dragging, slow retrieve along rocky bottom',
      'In rivers, cast upstream and let the bait drift naturally past structure',
    ],
    bestTimes: 'May–October; peak June–August in warm rivers',
  },
  walleye: {
    lures: [g('Jig head curly tail chartreuse/white 1/4–1/2 oz'), g('Swedish Pimple blade bait'), g('Rapala Shad Rap #7 crankbait')],
    bait: [g('Nightcrawler harness rig'), g('Leeches Lindy rig'), g('Fathead minnows')],
    rodSetup: '6.5–7 ft medium sensitive · 8–12 lb mono or fluorocarbon',
    technique: [
      'Walleye are low-light feeders — best fishing is at dawn, dusk, and night',
      'Troll crankbaits along structure at 1–1.5 mph in 10–20 ft of water',
      'Vertical jig near bottom in deep water (30–50 ft) during summer days',
      'Wind-blown points concentrate baitfish and walleye',
    ],
    bestTimes: 'Year-round; best May–June (spawn) and September–October',
  },
  perch: {
    lures: [g('Tube jig 1/32–1/16 oz'), g('Small blade spinner'), g('Beetle spin'), g('Ice fishing jigging spoon')],
    bait: [g('Small worm pieces'), g('Minnows'), g('Maggots fishing bait'), g('Small shrimp')],
    rodSetup: '5–6 ft ultra-light · 2–6 lb mono',
    technique: [
      'Find a school — where you catch one, you catch many',
      'Drop bait to the bottom, lift 6–12 inches, let it fall',
      'Perch school by size — keep moving if you\'re only catching small ones',
      'Great from a dock in Lake Sammamish or Lake Washington',
    ],
    bestTimes: 'Year-round; summer and winter ice fishing (east WA)',
  },
  crappie: {
    lures: [g('Small tube jig 1/32–1/16 oz'), g('Rooster Tail #0'), g('Curly tail grub white/pink'), g('Small inline spinner')],
    bait: [g('Small minnows 1–2 inch'), g('Small worm pieces')],
    rodSetup: '5.5–7 ft light · 4–8 lb mono',
    technique: [
      'Crappie suspend — fish at multiple depths until you find the school',
      'Cast to dock pilings, brush piles, submerged timber',
      'Night fishing under a dock light in summer is extremely productive',
    ],
    bestTimes: 'April–June (spawn, most aggressive); year-round',
  },
  bluegill: {
    lures: [g('Tiny jig 1/64–1/32 oz'), g('Fly rod small topwater popper'), g('Ant pattern fly fishing')],
    bait: [g('Red worms'), g('Crickets'), g('Bread balls'), g('Small nightcrawler pieces')],
    rodSetup: '5–6 ft ultra-light · 2–4 lb mono · or 3 wt fly rod',
    technique: [
      'Easiest beginner fish — nearly any bait under a bobber works',
      'Spawning beds in spring: visible saucer-shaped depressions in shallow flats',
      'Great from a dock; fish 1–4 ft deep near weeds',
    ],
    bestTimes: 'May–August; peak during spawn in May–June',
  },
  carp: {
    lures: [g('Hair rig boilies carp'), g('Method feeder ground bait'), g('Bread crust surface fishing')],
    bait: [g('Boilies carp bait'), g('Sweet corn fishing'), g('Bread carp bait'), g('Tiger nuts fishing'), g('Worms fishing bait')],
    rodSetup: '10–13 ft carp/float rod · 12–20 lb mono · hair rig presentation',
    technique: [
      'Carp are cautious — free-line bait in areas where they are actively feeding',
      'Look for carp "mudding" in shallows — they stir up silt while rooting',
      'Surface fishing with bread crust during warm evenings can be deadly',
      'Pre-bait an area with corn or boilies 1–2 days before fishing',
    ],
    bestTimes: 'May–October; peak in summer heat',
  },
  sturgeon: {
    lures: [g('Not applicable — bait fishing only')],
    bait: [g('Sand shrimp whole circle hook'), g('Lamprey chunk'), g('Shad belly strip'), g('Nightcrawler cluster'), g('Smelt fishing bait')],
    rodSetup: '8–9 ft heavy (or extra-heavy) · 30–50 lb braid · 50–80 lb mono/fluoro leader · 5–8 oz sliding sinker',
    technique: [
      'Anchor above a deep hole (20–60 ft) in the Columbia River',
      'Sliding sinker rig: bait rests on bottom while sinker slides freely',
      'Let the rod tip load slowly — circle hooks set themselves; don\'t jerk',
      'Check slot limits: many sturgeon must be released (42–54 inch slot on Columbia)',
    ],
    bestTimes: 'April–May and October–November on the Columbia River',
  },
  crab: {
    lures: [g('Crab pot ring net fishing')],
    bait: [g('Chicken leg quarters crab bait'), g('Turkey neck crab bait'), g('Tuna frame canned tuna crab'), g('Herring crab bait'), g('Salmon carcass crab bait')],
    rodSetup: 'Crab pot or ring net · minimum 14 in diameter · drop line with float marker',
    technique: [
      'Set pots in 30–80 ft of water near eelgrass beds or sand/mud bottom',
      'Soak 4–6 hours per check; check every few hours to stay legal',
      'Males only — measure across the widest point of the shell (6.25 in minimum)',
      'Mark your pot with your name/address on the float per WA law',
      'Puget Sound season typically July 1 – September 30; check exact dates by area',
    ],
    bestTimes: 'July–September (Puget Sound summer season)',
  },
  rockfish: {
    lures: [g('Lead head jig curly tail white/chartreuse 2–4 oz'), g('Dropper loop tube jig'), g('Swimbait 3–4 inch'), g('Swedish Pimple metal jig 2–3 oz')],
    bait: [g('Cut herring strips'), g('Squid strips 2–3 inch'), g('Whole smelt')],
    rodSetup: '7 ft medium-heavy · 20–40 lb braid · 20–30 lb fluorocarbon leader · 2–6 oz sinker',
    technique: [
      'Drop to rocky bottom structure — rockfish rarely leave their home rock',
      'Jig at or near bottom; short hops work better than big sweeps',
      'Use a dropper loop rig with 2 jigs to double up',
      'Rockfish have a gas bladder issue — they can\'t swim back down; use a descender to release deep if not keeping',
    ],
    bestTimes: 'Year-round; best April–October from charter boats',
  },
  lingcod: {
    lures: [g('Lead head jig white/chartreuse/pink 6–10 oz'), g('Large swimbait 5–7 inch'), g('Krocodile spoon 3 oz'), g('Large cut bait rig')],
    bait: [g('Large cut herring'), g('Squid or octopus chunk'), g('Live rockfish bait')],
    rodSetup: '7–8 ft heavy · 50–65 lb braid · 40–50 lb fluorocarbon leader · 4–10 oz jig head',
    technique: [
      'Lings are ambush predators near rocky bottom — pound the structure',
      'Big aggressive jigging motions trigger reaction strikes',
      'If a ling grabs a fish you\'re reeling in, keep reeling slowly — they often follow to the surface',
      'Fish tide changes and current rips near points and ledges',
    ],
    bestTimes: 'November–April (prime); open season check required after summer closure',
  },
  surfperch: {
    lures: [g('Shrimp-fly rig size #4–6'), g('Gulp sand shrimp 1.5–2 inch'), g('Gulp sandworm'), g('Curly tail jig 1/8–1/4 oz surf')],
    bait: [g('Sand crabs mole crabs surf fishing'), g('Sandworms pile worms'), g('Fresh shrimp pieces'), g('Mussel bait')],
    rodSetup: '8–11 ft surf rod or medium spinning rod · 10–17 lb mono · dropper loop rig with 2–4 oz pyramid sinker',
    technique: [
      'Wade out and cast into the wash zone (white water behind breaking waves)',
      'Fish the incoming tide — perch follow food into shallower water',
      'Digging sand crabs right from the beach is free bait; look for v-shaped burrows',
      'Great for beginners — fish close, no need for long casts',
    ],
    bestTimes: 'April–September on WA coast beaches',
  },
  kokanee: {
    lures: [g('Needlefish spoon 1.5–2 inch kokanee'), g("Sep's Pro Cure dodger small fly"), g('Dick Nite spoon'), g('Wedding Ring spinner pink/red')],
    bait: [g('White corn canned shoepeg kokanee'), g('Maggots back hook'), g('Small worm piece')],
    rodSetup: '7–8 ft light · 6–10 lb mono · 18–24 in leader behind a dodger',
    technique: [
      'Troll very slowly (1–1.5 mph) — kokanee are picky about speed',
      'Use a fish finder to locate the school depth (often 30–70 ft in summer)',
      'Add a scent to your lure — garlic, anise, or shrimp oil',
      'Dodger creates action; adjust leader length to 8–12 in behind dodger',
    ],
    bestTimes: 'May–August; best before water warms (May–June)',
  },
  halibut: {
    lures: [g('Large jig 8–16 oz curly tail halibut'), g('Large spoon 4+ oz halibut'), g('Swimbait 7–9 inch halibut')],
    bait: [g('Octopus whole or pieces halibut'), g('Salmon belly strips halibut'), g('Large herring whole'), g('Squid herring combo halibut')],
    rodSetup: '7–8 ft heavy trolling/bottom rod · 80–100 lb braid · 60–100 lb fluorocarbon leader · 8–24 oz sinker (enough to hold bottom)',
    technique: [
      'Halibut season is currently CLOSED in WA (closed June 28-30, 2026) — check IPHC/WDFW for next opening',
      'Fish flat sandy or muddy bottom in 100–300 ft of water near offshore banks',
      'Anchor or drift over structure; bait rests on bottom on a slider or spreader bar',
      'Halibut are ambush predators — large bait = large fish',
    ],
    bestTimes: 'Typically May–September when WA quota season is open',
  },
  flounder: {
    lures: [g('Small jig 1/4 oz curly tail flounder'), g('Blade bait flounder')],
    bait: [g('Worm and clam combo'), g('Small shrimp pieces'), g('Small herring chunk')],
    rodSetup: '6–7 ft medium light · 8–12 lb mono',
    technique: [
      'Flatfish sit on the bottom in sandy estuaries and bays',
      'Slow drag along the bottom triggers strikes — barely any action needed',
      'Fish incoming and outgoing tides in shallow bays near channels',
    ],
    bestTimes: 'April–October in Puget Sound bays and estuaries',
  },
  shrimp: {
    lures: [g('Spot shrimp pot fishing')],
    bait: [g('Cat food tuna flavor shrimp pot bait'), g('Herring pieces shrimp bait'), g('Clam necks shrimp bait')],
    rodSetup: 'Spot shrimp pot · 100–600 ft of rope depending on depth',
    technique: [
      'Set pots in 100–400 ft of water near underwater structure',
      'Soak overnight or 4–12 hours',
      'Puget Sound season is typically 1–2 days in May — check exact dates by management area',
      'Add ice to cooler immediately — spot shrimp go bad fast',
    ],
    bestTimes: 'May (annual short Puget Sound season)',
  },
  razorclam: {
    lures: [g('Clam gun tube digger razor clam')],
    bait: [g('Not applicable — razor clam digging')],
    rodSetup: 'Clam gun (tube digger) or clam shovel · mesh bag or bucket',
    technique: [
      'Look for a "show" — small hole or dimple in sand when a wave recedes',
      'Insert clam gun directly over the show, push down and twist, pull up fast',
      'Razor clams burrow fast — work quickly once you spot the show',
      'Best during a minus tide (−1.0 ft or lower) — check WDFW dig schedule',
    ],
    bestTimes: 'October–April coastal digs (WDFW announces specific dates)',
  },
  muskie: {
    lures: [g('Large bucktail spinner 1–2 oz muskie'), g('Large glide bait muskie'), g('Believer crankbait muskie'), g('Jake crankbait muskie')],
    bait: [g('Large suckers live bait muskie'), g('Large chub live bait')],
    rodSetup: '8–9 ft heavy muskie rod · 80–100 lb superbraid · 100 lb steel or fluorocarbon leader',
    technique: [
      'Cast to weedlines, rock piles, and points; muskies are territorial',
      'Always do a figure-8 at boatside — many strikes happen right at the boat',
      'Muskies are catch-and-release only in most WA waters; handle with wet hands',
      'Long casts, slow retrieves, big lures — this is a trophy fishery',
    ],
    bestTimes: 'May–November; fall months produce biggest fish',
  },
  pike: {
    lures: [g('Large spinnerbait pike'), g('Dardevle spoon 5 inch'), g('Large swimbait pike'), g('Jerkbait pike')],
    bait: [g('Large sucker or chub live bait'), g('Cut fish pike bait')],
    rodSetup: '7–8 ft medium-heavy · 30–50 lb braid · 12–18 in wire leader (their teeth cut mono)',
    technique: [
      'Northern pike are invasive in WA — no size or bag limits; keep all fish you catch',
      'Fish weed edges, inlets, and shallow flats in eastern WA reservoirs',
      'MUST use a wire leader — pike teeth will cut through any mono or fluoro',
    ],
    bestTimes: 'Year-round; active even in cold water',
  },
  catfish: {
    lures: [g('Not applicable — scent bait fishing catfish')],
    bait: [g('Chicken liver catfish bait'), g('Prepared stink bait catfish'), g('Nightcrawlers'), g('Shrimp catfish bait'), g('Cut carp or sucker catfish bait')],
    rodSetup: '7 ft medium-heavy · 15–25 lb mono · 1–3 oz egg sinker rig',
    technique: [
      'Fish after dark — catfish are most active at night',
      'Bottom fish with scented bait near structure in warm, slow rivers and reservoirs',
      'Allow the fish to run briefly before setting the hook',
    ],
    bestTimes: 'June–September in eastern WA warm-water rivers',
  },
  sockeye: {
    lures: [g('Small red/pink spinner sockeye salmon'), g('Sockeye fly red/orange'), g('Ketchum Release jig')],
    bait: [g("Sockeye don't eat in freshwater — saltwater trolling only")],
    rodSetup: '9 ft medium · 12–17 lb mono · barbless single hook required in most WA waters',
    technique: [
      'Sockeye floss (snag) fishing is how most river fish are taken legally in WA',
      'In the Columbia, dip netting is allowed at Kettle Falls area when runs are strong',
      'In salt water, small flashy spinners trolled at 2–3 mph can work during ocean residency',
    ],
    bestTimes: 'July–August (Columbia/Okanogan runs); July (Lake Chelan)',
  },
  burbot: {
    lures: [g('Heavy jigging spoon 1–3 oz burbot'), g('Large tube jig'), g('Blade bait burbot')],
    bait: [g('Live or cut minnow'), g('Nightcrawler cluster'), g('Fish guts bait')],
    rodSetup: '7 ft medium-heavy · 15–20 lb mono',
    technique: [
      'Burbot are most active in winter, especially during ice-fishing season',
      'Fish deep (40–100 ft) at night near rocky bottom',
      'Aggressive jigging works; reel down fast and pause to trigger strikes',
    ],
    bestTimes: 'January–March (peak ice fishing period in eastern WA)',
  },
}