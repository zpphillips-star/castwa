-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Water bodies
create table if not exists water_bodies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('river','lake','stream','ocean','reservoir')),
  wria text,
  county text,
  usgs_site_id text,
  geometry jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_water_bodies_name on water_bodies using gin(to_tsvector('english', name));
create index if not exists idx_water_bodies_type on water_bodies(type);
create index if not exists idx_water_bodies_county on water_bodies(county);
create index if not exists idx_water_bodies_usgs on water_bodies(usgs_site_id) where usgs_site_id is not null;

-- Species
create table if not exists species (
  id uuid primary key default gen_random_uuid(),
  common_name text not null,
  scientific_name text,
  category text check (category in ('salmon','trout','steelhead','bass','panfish','marine','other')),
  image_url text,
  description text
);

create index if not exists idx_species_name on species using gin(to_tsvector('english', common_name));
create index if not exists idx_species_category on species(category);

-- Species present in water bodies
create table if not exists water_species (
  id uuid primary key default gen_random_uuid(),
  water_body_id uuid references water_bodies(id) on delete cascade,
  species_id uuid references species(id) on delete cascade,
  source text,
  confidence text check (confidence in ('confirmed','likely','historical')),
  unique(water_body_id, species_id)
);

create index if not exists idx_water_species_water on water_species(water_body_id);
create index if not exists idx_water_species_species on water_species(species_id);

-- Regulations
create table if not exists regulations (
  id uuid primary key default gen_random_uuid(),
  water_body_id uuid references water_bodies(id) on delete cascade,
  species_id uuid references species(id) on delete cascade,
  year int not null default 2025,
  season_open date,
  season_close date,
  daily_limit int,
  size_min_inches numeric,
  hatchery_only boolean default false,
  wild_release_required boolean default false,
  bait_allowed boolean,
  barbless_required boolean default false,
  night_fishing_allowed boolean,
  gear_restrictions text,
  closed_sections text,
  notes text,
  source_url text,
  updated_at timestamptz default now(),
  unique(water_body_id, species_id, year)
);

create index if not exists idx_regulations_water on regulations(water_body_id);
create index if not exists idx_regulations_species on regulations(species_id);
create index if not exists idx_regulations_season on regulations(season_open, season_close);

-- Emergency closures
create table if not exists emergency_closures (
  id uuid primary key default gen_random_uuid(),
  water_body_id uuid references water_bodies(id) on delete cascade,
  species_id uuid references species(id) on delete cascade,
  reason text not null,
  starts_at date not null,
  ends_at date not null,
  source_url text,
  created_at timestamptz default now()
);

create index if not exists idx_closures_water on emergency_closures(water_body_id);
create index if not exists idx_closures_active on emergency_closures(ends_at) where ends_at >= current_date;

-- Helpful views
create or replace view open_regulations as
select r.*,
  case
    when r.season_open is null or r.season_close is null then false
    when current_date >= r.season_open and current_date <= r.season_close then true
    else false
  end as is_open,
  wb.name as water_body_name, s.common_name as species_name, s.category
from regulations r
join water_bodies wb on r.water_body_id = wb.id
join species s on r.species_id = s.id
where current_date >= r.season_open and current_date <= r.season_close;

create or replace view active_closures as
select ec.*, wb.name as water_body_name, s.common_name as species_name
from emergency_closures ec
join water_bodies wb on ec.water_body_id = wb.id
left join species s on ec.species_id = s.id
where current_date between ec.starts_at and ec.ends_at;
