-- ============================================================
-- SPECIES SEED DATA
-- ============================================================

insert into species (common_name, scientific_name, category, description) values
-- Salmon
('Chinook Salmon', 'Oncorhynchus tshawytscha', 'salmon',
  'The largest Pacific salmon, also called King Salmon. Prized for their size and rich flavor. Found in major WA river systems.'),
('Coho Salmon', 'Oncorhynchus kisutch', 'salmon',
  'Also called Silver Salmon. Aggressive fighters popular with anglers. Enter rivers in fall.'),
('Sockeye Salmon', 'Oncorhynchus nerka', 'salmon',
  'Brilliant red when spawning. Okanogan and Lake Wenatchee runs are significant. Bright lures work well.'),
('Pink Salmon', 'Oncorhynchus gorbuscha', 'salmon',
  'Smallest Pacific salmon, runs in odd-numbered years in large numbers. Great for fly fishing.'),
('Chum Salmon', 'Oncorhynchus keta', 'salmon',
  'Also called Dog Salmon. Large and powerful. Important for Puget Sound tribes. Late season runs.'),

-- Steelhead
('Steelhead', 'Oncorhynchus mykiss', 'steelhead',
  'Anadromous rainbow trout. Winter steelhead (Oct-Apr) and summer steelhead runs. Washington''s state fish. Catch-and-release for wild fish.'),

-- Trout
('Rainbow Trout', 'Oncorhynchus mykiss', 'trout',
  'Resident form of steelhead. Heavily stocked across WA lakes and rivers. Takes flies, spinners, and bait.'),
('Brown Trout', 'Salmo trutta', 'trout',
  'Introduced species, nocturnal feeders. Large specimens in the Yakima River. Wary and challenging to catch.'),
('Brook Trout', 'Salvelinus fontinalis', 'trout',
  'Technically a char. Beautiful coloring. Found in cold, high-elevation lakes and streams in WA.'),
('Cutthroat Trout', 'Oncorhynchus clarkii', 'trout',
  'Native to WA. Coastal cutthroat in lowland streams, westslope cutthroat in eastern WA. Red slash marks on jaw.'),
('Bull Trout', 'Salvelinus confluentus', 'trout',
  'Native char, threatened species. Requires extremely cold, clean water. Catch-and-release only in most waters.'),

-- Bass
('Largemouth Bass', 'Micropterus salmoides', 'bass',
  'Dominant in warm, weedy lowland lakes. Found in Banks Lake, Columbia Basin lakes. Best on warm summer days.'),
('Smallmouth Bass', 'Micropterus dolomieu', 'bass',
  'Prefer clear, rocky habitat. Excellent in the Columbia River and Snake River. Pound-for-pound great fighters.'),

-- Panfish / Other Freshwater
('Walleye', 'Sander vitreus', 'other',
  'Prime waters include Banks Lake, Lake Roosevelt. Excellent table fare. Best in low light conditions.'),
('Yellow Perch', 'Perca flavescens', 'panfish',
  'Abundant in eastern WA lakes. Easy to catch, excellent eating. Good winter ice fishing target.'),
('Crappie', 'Pomoxis spp.', 'panfish',
  'Black and white crappie found in Columbia Basin. Spawn in May-June near structure.'),
('Bluegill', 'Lepomis macrochirus', 'panfish',
  'Warm water lakes in western and central WA. Fun light tackle fishing. Good for beginners.'),

-- Marine
('Pacific Halibut', 'Hippoglossus stenolepis', 'marine',
  'Largest flatfish. Found in Puget Sound, Strait of Juan de Fuca, ocean. IPHC manages quota. 32-inch minimum.'),
('Lingcod', 'Ophiodon elongatus', 'marine',
  'Aggressive predator on rocky reefs. Puget Sound, Strait of Juan de Fuca, Pacific Ocean. Delicious white flesh.'),
('Rockfish', 'Sebastes spp.', 'marine',
  'Multiple species (yelloweye, canary, quillback). Some live 100+ years. Many conservation restrictions.'),
('Dungeness Crab', 'Metacarcinus magister', 'marine',
  'Washington''s iconic crab. Puget Sound, Pacific coast. Male crabs only, 6.25-inch minimum carapace width.'),
('Razor Clam', 'Siliqua patula', 'marine',
  'Pacific coast beaches. WDFW opens specific beaches for limited seasons. Check biotoxin status before digging.');

-- ============================================================
-- WATER BODIES SEED DATA
-- ============================================================

insert into water_bodies (name, type, wria, county, usgs_site_id) values
('Skagit River', 'river', '04', 'Skagit', '12200500'),
('Snoqualmie River', 'river', '07', 'King', '12149000'),
('Green River', 'river', '09', 'King', '12113000'),
('Skykomish River', 'river', '07', 'Snohomish', '12134500'),
('Lake Washington', 'lake', '08', 'King', '12119000'),
('Lake Sammamish', 'lake', '08', 'King', '12122000'),
('Banks Lake', 'lake', '44', 'Grant', null),
('Lake Chelan', 'lake', '47', 'Chelan', '12447390'),
('Ross Lake', 'reservoir', '04', 'Whatcom', null),
('Columbia River', 'river', '55', 'Various', '14105700'),
('Snake River', 'river', '35', 'Various', '13334300'),
('Yakima River', 'river', '39', 'Yakima', '12500060'),
('Methow River', 'river', '48', 'Okanogan', '12448500'),
('Wenatchee River', 'river', '45', 'Chelan', '12462500'),
('Puget Sound', 'ocean', null, 'Various', null),
('Hood Canal', 'ocean', null, 'Mason', null),
('Willapa Bay', 'ocean', null, 'Pacific', null),
('Grays Harbor', 'ocean', null, 'Grays Harbor', null),
('Spokane River', 'river', '57', 'Spokane', '12417000'),
('Pend Oreille River', 'river', '62', 'Pend Oreille', '12395500');

-- ============================================================
-- WATER-SPECIES ASSOCIATIONS
-- ============================================================

-- Skagit River: famous for Chinook, Coho, Steelhead, Pink, Cutthroat
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Skagit River'
  and s.common_name in ('Chinook Salmon','Coho Salmon','Steelhead','Pink Salmon','Cutthroat Trout','Bull Trout','Rainbow Trout');

-- Snoqualmie River: Chinook, Coho, Steelhead, Cutthroat
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Snoqualmie River'
  and s.common_name in ('Chinook Salmon','Coho Salmon','Steelhead','Cutthroat Trout','Rainbow Trout')
on conflict do nothing;

-- Green River: Chinook, Coho, Steelhead
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Green River'
  and s.common_name in ('Chinook Salmon','Coho Salmon','Steelhead','Cutthroat Trout')
on conflict do nothing;

-- Skykomish River: all salmon species + steelhead
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Skykomish River'
  and s.common_name in ('Chinook Salmon','Coho Salmon','Steelhead','Pink Salmon','Cutthroat Trout','Bull Trout')
on conflict do nothing;

-- Lake Washington: Rainbow Trout, Cutthroat, Sockeye, Largemouth Bass, Yellow Perch, Smallmouth Bass
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Lake Washington'
  and s.common_name in ('Rainbow Trout','Cutthroat Trout','Sockeye Salmon','Largemouth Bass','Smallmouth Bass','Yellow Perch')
on conflict do nothing;

-- Lake Sammamish: Rainbow Trout, Cutthroat, Yellow Perch, Largemouth Bass
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Lake Sammamish'
  and s.common_name in ('Rainbow Trout','Cutthroat Trout','Yellow Perch','Largemouth Bass')
on conflict do nothing;

-- Banks Lake: Walleye, Largemouth Bass, Smallmouth Bass, Yellow Perch, Rainbow Trout
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Banks Lake'
  and s.common_name in ('Walleye','Largemouth Bass','Smallmouth Bass','Yellow Perch','Rainbow Trout','Crappie')
on conflict do nothing;

-- Lake Chelan: Rainbow Trout, Cutthroat, Chinook, Brown Trout
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Lake Chelan'
  and s.common_name in ('Rainbow Trout','Cutthroat Trout','Chinook Salmon','Brown Trout')
on conflict do nothing;

-- Columbia River: Chinook, Steelhead, Walleye, Smallmouth Bass
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Columbia River'
  and s.common_name in ('Chinook Salmon','Coho Salmon','Steelhead','Sockeye Salmon','Walleye','Smallmouth Bass')
on conflict do nothing;

-- Snake River: Chinook, Steelhead, Smallmouth Bass, Walleye
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Snake River'
  and s.common_name in ('Chinook Salmon','Steelhead','Smallmouth Bass','Walleye','Rainbow Trout')
on conflict do nothing;

-- Yakima River: Rainbow Trout, Brown Trout, Chinook, Steelhead
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Yakima River'
  and s.common_name in ('Rainbow Trout','Brown Trout','Chinook Salmon','Steelhead','Cutthroat Trout')
on conflict do nothing;

-- Methow River: Chinook, Steelhead, Rainbow Trout, Bull Trout
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Methow River'
  and s.common_name in ('Chinook Salmon','Steelhead','Rainbow Trout','Bull Trout','Cutthroat Trout')
on conflict do nothing;

-- Wenatchee River: Chinook, Steelhead, Rainbow, Cutthroat
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Wenatchee River'
  and s.common_name in ('Chinook Salmon','Steelhead','Rainbow Trout','Cutthroat Trout')
on conflict do nothing;

-- Puget Sound: Chinook, Coho, Steelhead, Halibut, Lingcod, Rockfish, Dungeness Crab
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Puget Sound'
  and s.common_name in ('Chinook Salmon','Coho Salmon','Pink Salmon','Chum Salmon','Pacific Halibut','Lingcod','Rockfish','Dungeness Crab')
on conflict do nothing;

-- Hood Canal: Chum Salmon, Pink Salmon, Dungeness Crab
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Hood Canal'
  and s.common_name in ('Chum Salmon','Pink Salmon','Chinook Salmon','Dungeness Crab','Lingcod')
on conflict do nothing;

-- Willapa Bay: Razor Clam, Dungeness Crab, Coho Salmon, Chinook
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Willapa Bay'
  and s.common_name in ('Razor Clam','Dungeness Crab','Coho Salmon','Chinook Salmon')
on conflict do nothing;

-- Grays Harbor: Razor Clam, Dungeness Crab, Chinook, Steelhead
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Grays Harbor'
  and s.common_name in ('Razor Clam','Dungeness Crab','Chinook Salmon','Steelhead','Coho Salmon')
on conflict do nothing;

-- Spokane River: Rainbow Trout, Brown Trout, Smallmouth Bass
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Spokane River'
  and s.common_name in ('Rainbow Trout','Brown Trout','Smallmouth Bass','Cutthroat Trout')
on conflict do nothing;

-- Pend Oreille River: Rainbow Trout, Bull Trout, Largemouth Bass, Walleye
insert into water_species (water_body_id, species_id, source, confidence)
select wb.id, s.id, 'manual', 'confirmed'
from water_bodies wb, species s
where wb.name = 'Pend Oreille River'
  and s.common_name in ('Rainbow Trout','Bull Trout','Largemouth Bass','Walleye','Smallmouth Bass')
on conflict do nothing;

-- ============================================================
-- SAMPLE REGULATIONS (2025 season — representative)
-- ============================================================

-- Yakima River: Rainbow Trout catch-and-release fly fishing only
insert into regulations (water_body_id, species_id, year, season_open, season_close, daily_limit, size_min_inches, hatchery_only, wild_release_required, bait_allowed, barbless_required, night_fishing_allowed, gear_restrictions, notes, source_url)
select wb.id, s.id, 2025, '2025-01-01', '2025-12-31', 0, 0, false, true, false, true, false,
  'Fly fishing only in designated sections', 'Catch-and-release only. Barbless hooks required. Selective gear rules apply.',
  'https://wdfw.wa.gov/fishing/regulations'
from water_bodies wb, species s
where wb.name = 'Yakima River' and s.common_name = 'Rainbow Trout';

-- Skagit River: Chinook Salmon (hatchery only, summer run)
insert into regulations (water_body_id, species_id, year, season_open, season_close, daily_limit, size_min_inches, hatchery_only, wild_release_required, bait_allowed, barbless_required, notes, source_url)
select wb.id, s.id, 2025, '2025-06-01', '2025-08-31', 2, 12, true, true, true, false,
  'Hatchery Chinook only. Wild Chinook must be released. Adipose fin clip required.',
  'https://wdfw.wa.gov/fishing/regulations/salmon'
from water_bodies wb, species s
where wb.name = 'Skagit River' and s.common_name = 'Chinook Salmon';

-- Skagit River: Steelhead (hatchery only, winter run)
insert into regulations (water_body_id, species_id, year, season_open, season_close, daily_limit, size_min_inches, hatchery_only, wild_release_required, bait_allowed, barbless_required, notes, source_url)
select wb.id, s.id, 2025, '2025-01-01', '2025-04-30', 2, 20, true, true, true, false,
  'Hatchery steelhead only. Wild steelhead must be released unharmed. Check for emergency closures.',
  'https://wdfw.wa.gov/fishing/regulations/steelhead'
from water_bodies wb, species s
where wb.name = 'Skagit River' and s.common_name = 'Steelhead';

-- Banks Lake: Walleye (open year-round, generous limits)
insert into regulations (water_body_id, species_id, year, season_open, season_close, daily_limit, size_min_inches, hatchery_only, wild_release_required, bait_allowed, barbless_required, night_fishing_allowed, notes, source_url)
select wb.id, s.id, 2025, '2025-01-01', '2025-12-31', 8, 12, false, false, true, false, true,
  'Year-round walleye fishing. Excellent troll or jig bite. Best in early morning and evening.',
  'https://wdfw.wa.gov/fishing/regulations/walleye'
from water_bodies wb, species s
where wb.name = 'Banks Lake' and s.common_name = 'Walleye';

-- Columbia River: Chinook Salmon
insert into regulations (water_body_id, species_id, year, season_open, season_close, daily_limit, size_min_inches, hatchery_only, wild_release_required, bait_allowed, barbless_required, notes, source_url)
select wb.id, s.id, 2025, '2025-05-01', '2025-09-30', 2, 12, true, true, true, false,
  'Hatchery Chinook only on Columbia. Wild fish must be released. Check for in-season adjustments.',
  'https://wdfw.wa.gov/fishing/regulations/salmon'
from water_bodies wb, species s
where wb.name = 'Columbia River' and s.common_name = 'Chinook Salmon';

-- Puget Sound: Pacific Halibut
insert into regulations (water_body_id, species_id, year, season_open, season_close, daily_limit, size_min_inches, hatchery_only, wild_release_required, bait_allowed, barbless_required, notes, source_url)
select wb.id, s.id, 2025, '2025-05-01', '2025-10-31', 1, 32, false, false, true, false,
  'IPHC managed. One fish per day, 32-inch minimum. Check annual IPHC quota before season.',
  'https://wdfw.wa.gov/fishing/regulations/halibut'
from water_bodies wb, species s
where wb.name = 'Puget Sound' and s.common_name = 'Pacific Halibut';

-- Puget Sound: Dungeness Crab
insert into regulations (water_body_id, species_id, year, season_open, season_close, daily_limit, size_min_inches, hatchery_only, wild_release_required, bait_allowed, notes, source_url)
select wb.id, s.id, 2025, '2025-10-01', '2026-02-28', 5, 0, false, false, true,
  'Male crabs only, 6.25-inch minimum carapace width. Check for biotoxin closures. Pot, ring, or recreational gear.',
  'https://wdfw.wa.gov/fishing/regulations/crab'
from water_bodies wb, species s
where wb.name = 'Puget Sound' and s.common_name = 'Dungeness Crab';

-- Methow River: Steelhead (summer run)
insert into regulations (water_body_id, species_id, year, season_open, season_close, daily_limit, size_min_inches, hatchery_only, wild_release_required, bait_allowed, barbless_required, gear_restrictions, notes, source_url)
select wb.id, s.id, 2025, '2025-07-01', '2025-10-31', 1, 20, true, true, false, true,
  'Selective gear rules. Fly or lure only in upper sections.',
  'Summer steelhead run. Hatchery fish only. All wild steelhead must be released immediately.',
  'https://wdfw.wa.gov/fishing/regulations/steelhead'
from water_bodies wb, species s
where wb.name = 'Methow River' and s.common_name = 'Steelhead';
