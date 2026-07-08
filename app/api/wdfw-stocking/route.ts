import { NextResponse } from 'next/server'

// WDFW Hatchery Stocking data via Washington State data.wa.gov (Socrata API)
// Dataset: WDFW Fish Stocking Reports
// https://data.wa.gov/resource/ezwb-gqqn.json
const STOCKING_API = 'https://data.wa.gov/resource/ezwb-gqqn.json'

export interface StockingRecord {
  stocking_date: string
  water_body: string
  county: string
  species: string
  number_of_fish: number
  average_weight_lbs: number
  hatchery: string
  watershed: string
}

// Cache for 6 hours — stocking data doesn't change by the minute
let cache: { records: StockingRecord[]; fetchedAt: number } | null = null
const CACHE_TTL = 6 * 60 * 60 * 1000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const county = searchParams.get('county')
  const species = searchParams.get('species')
  const days = parseInt(searchParams.get('days') ?? '90') // default: last 90 days

  try {
    const now = Date.now()
    
    // Build Socrata SoQL query
    const cutoffDate = new Date(now - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    let soql = `$where=stocking_date >= '${cutoffDate}'&$order=stocking_date DESC&$limit=500`
    if (county) soql += `&county=${encodeURIComponent(county.toUpperCase())}`
    if (species) soql += `&$where=stocking_date >= '${cutoffDate}' AND UPPER(species) LIKE '%25${encodeURIComponent(species.toUpperCase())}%25'`

    const url = `${STOCKING_API}?${soql}`

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CastWA/1.0 (castwa.com; WA fishing guide app)',
      },
      next: { revalidate: 21600 }, // 6hr Next.js cache
    })

    if (!res.ok) {
      throw new Error(`data.wa.gov returned ${res.status}`)
    }

    const data = await res.json()

    // Normalize fields
    const records: StockingRecord[] = (data as Record<string, string>[]).map(r => ({
      stocking_date: r.stocking_date ?? '',
      water_body: r.water_body_name ?? r.water_body ?? '',
      county: r.county ?? '',
      species: r.species ?? '',
      number_of_fish: parseInt(r.number_of_fish ?? '0') || 0,
      average_weight_lbs: parseFloat(r.average_weight ?? '0') || 0,
      hatchery: r.hatchery ?? '',
      watershed: r.watershed ?? '',
    }))

    return NextResponse.json({
      records,
      count: records.length,
      source: 'data.wa.gov',
      dataset: 'WDFW Fish Stocking',
      datasetUrl: 'https://data.wa.gov/resource/ezwb-gqqn',
      fetchedAt: now,
      query: { days, county, species },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      {
        records: [],
        error: message,
        fallbackMessage: 'Could not reach stocking data. Check data.wa.gov for WDFW stocking records.',
        source: 'data.wa.gov',
      },
      { status: 200 }
    )
  }
}
