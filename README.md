# CastWA — Washington State Fishing Guide

A production-quality fishing app for Washington State built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## What CastWA Does

- **Species Search** — Find any of 22 WA species with autocomplete; see every confirmed water body it appears in
- **Regulation Cards** — Per-species, per-water body 2025 regulations: daily limits, size minimums, bait rules, barbless requirements, wild-fish release rules
- **Season Badges** — Real-time open/closing countdown with urgency indicators
- **USGS Live Conditions** — Flow rate (cfs) and water temperature pulled live for rivers with USGS gauges
- **Interactive Map** — Leaflet + OpenStreetMap showing all 20 seed water bodies color-coded by season status
- **Emergency Closures** — Display active emergency closures prominently on water body pages
- **External API Integrations** — USGS Water Services, WA GIS, data.wa.gov stocking reports, NOAA Fisheries

---

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **anon public key** from Settings → API
3. Also copy your **service role key** (keep this secret)

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_MAPBOX_TOKEN=   # Leave blank to use OpenStreetMap (free)
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Migrations

### Option A: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Option B: Supabase Dashboard SQL Editor

1. Open your project → SQL Editor
2. Paste and run `supabase/migrations/001_initial.sql`
3. Paste and run `supabase/migrations/002_seed.sql`

### Option C: psql Direct

```bash
psql "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" \
  -f supabase/migrations/001_initial.sql \
  -f supabase/migrations/002_seed.sql
```

---

## External API Documentation

| API | Purpose | Revalidation |
|-----|---------|-------------|
| [USGS Water Services](https://waterservices.usgs.gov/) | Real-time flow & temp for gauged rivers | 1 hour |
| [WA GIS ArcGIS](https://www.arcgis.com/home/item.html?id=WA_Major_Water_Features) | Water body geometries and attributes | 24 hours |
| [data.wa.gov Stocking](https://data.wa.gov/resource/4w4d-n3nb.json) | WDFW fish stocking reports | 24 hours |
| [NOAA Fisheries](https://apps-st.fisheries.noaa.gov/ods/foss/) | Marine species status & catch limits | 24 hours |

All external fetch calls use Next.js `{ next: { revalidate } }` for ISR caching.

---

## Annual Regulation Update Process

Each year (typically January), WDFW publishes new fishing regulations. To update CastWA:

1. Visit [wdfw.wa.gov/fishing/regulations](https://wdfw.wa.gov/fishing/regulations)
2. Update the regulation rows in `supabase/migrations/002_seed.sql` with the new year and rule changes
3. Or, insert directly into Supabase:

```sql
-- Example: update Yakima River rainbow trout regulations for 2026
UPDATE regulations
SET season_open = '2026-01-01', season_close = '2026-12-31', updated_at = now()
WHERE water_body_id = (SELECT id FROM water_bodies WHERE name = 'Yakima River')
  AND species_id = (SELECT id FROM species WHERE common_name = 'Rainbow Trout')
  AND year = 2025;

-- Or insert new year's regulations
INSERT INTO regulations (water_body_id, species_id, year, season_open, season_close, ...)
SELECT wb.id, s.id, 2026, ...
FROM water_bodies wb, species s
WHERE wb.name = '...' AND s.common_name = '...';
```

4. For emergency closures, insert into `emergency_closures` table with `ends_at` date.

---

## Project Structure

```
castwa/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout with nav + footer
│   ├── page.tsx                # Homepage: hero, search, popular waters, all species
│   ├── globals.css             # Tailwind base + custom component classes
│   ├── species/[id]/page.tsx   # Species detail: where found + regulations
│   ├── water/[id]/page.tsx     # Water body: USGS conditions + regulations
│   └── map/page.tsx            # Full-screen interactive map
│
├── components/
│   ├── RegulationCard.tsx      # Renders regulation rows with color coding
│   ├── SpeciesCard.tsx         # Species link card (full and compact modes)
│   ├── WaterBodyCard.tsx       # Water body link card (full and compact modes)
│   ├── SearchBar.tsx           # Client-side species autocomplete
│   ├── MapView.tsx             # Server wrapper + sidebar panel
│   ├── MapInner.tsx            # Actual Leaflet map (dynamic import, no SSR)
│   └── SeasonBadge.tsx         # Season open/close countdown badge
│
├── lib/
│   ├── supabase.ts             # Browser Supabase client
│   ├── supabase-server.ts      # Server Supabase client (cookies-based)
│   ├── utils.ts                # Date helpers, flow formatting, season status
│   └── apis/
│       ├── usgs.ts             # USGS Water Services API
│       ├── wagis.ts            # WA GIS ArcGIS REST API
│       ├── datawa.ts           # data.wa.gov stocking reports
│       └── noaa.ts             # NOAA Fisheries API
│
├── types/
│   └── index.ts                # All TypeScript types and interfaces
│
└── supabase/
    └── migrations/
        ├── 001_initial.sql     # Schema: tables, indexes, views
        └── 002_seed.sql        # 22 species, 20 water bodies, regulations
```

---

## Deployment to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

Or connect your GitHub repo to Vercel for automatic deployments on push.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Add regulation data, new species, or new water bodies via SQL migrations
4. Submit a PR with a description of what data you added and the WDFW source URL

### Adding a New Water Body

```sql
-- 1. Insert the water body
INSERT INTO water_bodies (name, type, wria, county, usgs_site_id)
VALUES ('Nooksack River', 'river', '01', 'Whatcom', '12205000');

-- 2. Associate species
INSERT INTO water_species (water_body_id, species_id, source, confidence)
SELECT wb.id, s.id, 'manual', 'confirmed'
FROM water_bodies wb, species s
WHERE wb.name = 'Nooksack River'
  AND s.common_name IN ('Chinook Salmon', 'Coho Salmon', 'Steelhead');

-- 3. Add coordinates to WATER_COORDS in components/MapView.tsx and components/MapInner.tsx
```

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, RSC, ISR)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom `water` and `forest` color palettes
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Auth**: Supabase Auth (ready to enable)
- **Maps**: Leaflet + OpenStreetMap (no API key required)
- **External Data**: USGS, WA GIS, data.wa.gov, NOAA

---

*Always verify fishing regulations with [WDFW](https://wdfw.wa.gov/fishing/regulations) before heading out. Emergency closures and in-season adjustments may apply.*
