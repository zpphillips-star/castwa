import { NextResponse } from 'next/server'

export const revalidate = 3600 // cache 1 hour

export async function GET() {
  try {
    // Fetch active WA monitoring sites (streams + lakes) with coordinates
    const url = 'https://waterservices.usgs.gov/nwis/site/?format=rdb&stateCd=wa&siteType=ST,LK&hasDataTypeCd=iv&siteStatus=active&siteOutput=expanded'
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const text = await res.text()

    // Parse RDB format (tab-separated, skip comment lines starting with #)
    const lines = text.split('\n').filter(l => !l.startsWith('#') && l.trim())
    if (lines.length < 3) return NextResponse.json({ sites: [] })

    const headers = lines[0].split('\t')
    // Skip the format-descriptor line (lines[1])
    const siteNoIdx = headers.indexOf('site_no')
    const nameIdx = headers.indexOf('station_nm')
    const latIdx = headers.indexOf('dec_lat_va')
    const lngIdx = headers.indexOf('dec_long_va')
    const typeIdx = headers.indexOf('site_tp_cd')

    const sites = lines.slice(2).map(line => {
      const cols = line.split('\t')
      return {
        id: cols[siteNoIdx],
        name: cols[nameIdx],
        lat: parseFloat(cols[latIdx]),
        lng: parseFloat(cols[lngIdx]),
        type: cols[typeIdx], // ST = stream, LK = lake
      }
    }).filter(s => !isNaN(s.lat) && !isNaN(s.lng) && s.id)

    return NextResponse.json({ sites })
  } catch (e) {
    return NextResponse.json({ sites: [], error: String(e) }, { status: 500 })
  }
}
