export type WaterBodyType = 'river' | 'lake' | 'stream' | 'ocean' | 'reservoir'
export type SpeciesCategory = 'salmon' | 'trout' | 'steelhead' | 'bass' | 'panfish' | 'marine' | 'other'
export type ConfidenceLevel = 'confirmed' | 'likely' | 'historical'
export type WaterSource = 'stocking_report' | 'usgs' | 'manual'

export interface WaterBody {
  id: string
  name: string
  type: WaterBodyType
  wria: string | null
  county: string | null
  usgs_site_id: string | null
  geometry: GeoJSON.Geometry | null
  created_at: string
}

export interface Species {
  id: string
  common_name: string
  scientific_name: string | null
  category: SpeciesCategory
  image_url: string | null
  description: string | null
}

export interface WaterSpecies {
  id: string
  water_body_id: string
  species_id: string
  source: WaterSource
  confidence: ConfidenceLevel
  species?: Species
  water_body?: WaterBody
}

export interface Regulation {
  id: string
  water_body_id: string
  species_id: string
  year: number
  season_open: string | null
  season_close: string | null
  daily_limit: number | null
  size_min_inches: number | null
  hatchery_only: boolean
  wild_release_required: boolean
  bait_allowed: boolean | null
  barbless_required: boolean
  night_fishing_allowed: boolean | null
  gear_restrictions: string | null
  closed_sections: string | null
  notes: string | null
  is_open: boolean | null
  source_url: string | null
  updated_at: string
  species?: Species
  water_body?: WaterBody
}

export interface EmergencyClosure {
  id: string
  water_body_id: string
  species_id: string | null
  reason: string
  starts_at: string
  ends_at: string
  source_url: string | null
  created_at: string
}

export interface USGSConditions {
  flow_cfs: number | null
  temp_celsius: number | null
  timestamp: string | null
  site_id: string
  site_name: string | null
}

export interface RegulationStatus {
  allowed: boolean
  label: string
  icon: string
  variant: 'green' | 'red' | 'yellow'
}

export interface WaterBodyWithDetails extends WaterBody {
  species: WaterSpecies[]
  regulations: Regulation[]
  emergency_closures: EmergencyClosure[]
  conditions?: USGSConditions
}

export interface SpeciesWithWaters extends Species {
  waters: (WaterSpecies & { water_body: WaterBody; regulation?: Regulation })[]
}
