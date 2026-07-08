export interface NOAASpecies {
  id: string
  scientific_name: string
  common_name: string
  population: string
  region: string
  status: string
  habitat: string
}

export async function getNOAAMarineSpeciesForWA(): Promise<NOAASpecies[]> {
  // NOAA Fisheries Species of Concern in WA coastal waters
  const url = 'https://apps-st.fisheries.noaa.gov/ods/foss/species/?q={"state_name":"Washington"}&offset=0&limit=50'

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return getStaticMarineSpecies()
    const data = await res.json()
    const items = data?.items ?? []

    return items.map((item: Record<string, string>) => ({
      id: item.species_code ?? item.id ?? '',
      scientific_name: item.scientific_name ?? '',
      common_name: item.common_name ?? item.species_name ?? '',
      population: item.stock_name ?? '',
      region: 'Pacific Northwest',
      status: item.stock_status ?? 'Unknown',
      habitat: item.habitat_type ?? 'Marine',
    }))
  } catch {
    return getStaticMarineSpecies()
  }
}

export async function getNOAAHalibutQuota(): Promise<{ year: number; quota_lbs: number; notes: string } | null> {
  try {
    const url = 'https://apps-st.fisheries.noaa.gov/ods/foss/annual_catch_limits/?q={"stock_name":"Pacific Halibut"}&offset=0&limit=5'
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    const latest = data?.items?.[0]
    if (!latest) return null
    return {
      year: parseInt(latest.year ?? '2025'),
      quota_lbs: parseFloat(latest.catch_limit ?? '0'),
      notes: latest.notes ?? '',
    }
  } catch {
    return null
  }
}

function getStaticMarineSpecies(): NOAASpecies[] {
  return [
    {
      id: 'halibut-wa',
      scientific_name: 'Hippoglossus stenolepis',
      common_name: 'Pacific Halibut',
      population: 'Pacific Coast',
      region: 'Pacific Northwest',
      status: 'Not overfished',
      habitat: 'Demersal, nearshore',
    },
    {
      id: 'lingcod-wa',
      scientific_name: 'Ophiodon elongatus',
      common_name: 'Lingcod',
      population: 'Pacific Coast',
      region: 'Pacific Northwest',
      status: 'Rebuilt',
      habitat: 'Rocky reef',
    },
    {
      id: 'rockfish-wa',
      scientific_name: 'Sebastes spp.',
      common_name: 'Rockfish',
      population: 'Various stocks',
      region: 'Pacific Northwest',
      status: 'Varies by species',
      habitat: 'Rocky reef, deepwater',
    },
  ]
}
