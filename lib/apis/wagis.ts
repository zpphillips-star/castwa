export interface WAGISFeature {
  attributes: Record<string, string | number | null>
  geometry?: {
    rings?: number[][][]
    paths?: number[][][]
    x?: number
    y?: number
  }
}

export async function getWAWaterBodies(county?: string): Promise<WAGISFeature[]> {
  const where = county ? `COUNTY_NM='${county.toUpperCase()}'` : '1=1'
  const url = new URL('https://services.arcgis.com/jsIt88o7nu5hqodr/arcgis/rest/services/WA_Major_Water_Features/FeatureServer/0/query')
  url.searchParams.set('where', where)
  url.searchParams.set('outFields', 'GNIS_NAME,FEATURE_TYPE,COUNTY_NM,WRIA_NR')
  url.searchParams.set('returnGeometry', 'true')
  url.searchParams.set('f', 'json')
  url.searchParams.set('resultRecordCount', '200')

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.features ?? []
  } catch {
    return []
  }
}

export async function searchWAWaterByName(name: string): Promise<WAGISFeature[]> {
  const url = new URL('https://services.arcgis.com/jsIt88o7nu5hqodr/arcgis/rest/services/WA_Major_Water_Features/FeatureServer/0/query')
  url.searchParams.set('where', `GNIS_NAME LIKE '%${name.toUpperCase()}%'`)
  url.searchParams.set('outFields', '*')
  url.searchParams.set('returnGeometry', 'false')
  url.searchParams.set('f', 'json')
  url.searchParams.set('resultRecordCount', '50')

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.features ?? []
  } catch {
    return []
  }
}
