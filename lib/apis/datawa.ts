export interface StockingRecord {
  water_body: string
  county: string
  species: string
  num_fish: number
  weight_lbs: number
  date: string
  source: string
}

export async function getRecentStockingData(limit = 100): Promise<StockingRecord[]> {
  const url = `https://data.wa.gov/resource/4w4d-n3nb.json?$limit=${limit}&$order=date DESC`

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    const raw = await res.json()

    return raw.map((r: Record<string, string>) => ({
      water_body: r.waterbody_name ?? r.water_body ?? '',
      county: r.county ?? '',
      species: r.species ?? '',
      num_fish: parseInt(r.number_of_fish ?? '0', 10),
      weight_lbs: parseFloat(r.total_weight ?? '0'),
      date: r.stocking_date ?? r.date ?? '',
      source: 'WDFW Stocking Report',
    }))
  } catch {
    return []
  }
}

export async function getStockingByWater(waterName: string): Promise<StockingRecord[]> {
  const encoded = encodeURIComponent(waterName)
  const url = `https://data.wa.gov/resource/4w4d-n3nb.json?waterbody_name=${encoded}&$limit=50&$order=date DESC`

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    const raw = await res.json()

    return raw.map((r: Record<string, string>) => ({
      water_body: r.waterbody_name ?? '',
      county: r.county ?? '',
      species: r.species ?? '',
      num_fish: parseInt(r.number_of_fish ?? '0', 10),
      weight_lbs: parseFloat(r.total_weight ?? '0'),
      date: r.stocking_date ?? '',
      source: 'WDFW Stocking Report',
    }))
  } catch {
    return []
  }
}
