interface USGSValue {
  value: string
  dateTime: string
}

interface USGSTimeSeries {
  variable: { variableCode: { value: string }[] }
  values: { value: USGSValue[] }[]
  sourceInfo: { siteName: string }
}

interface USGSResponse {
  value: { timeSeries: USGSTimeSeries[] }
}

export async function getUSGSSiteConditions(siteId: string) {
  const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${siteId}&parameterCd=00060,00010&siteStatus=active`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null

    const data: USGSResponse = await res.json()
    const timeSeries = data.value?.timeSeries ?? []

    let flow_cfs: number | null = null
    let temp_celsius: number | null = null
    let timestamp: string | null = null
    let site_name: string | null = null

    for (const ts of timeSeries) {
      const paramCode = ts.variable?.variableCode?.[0]?.value
      const latestValue = ts.values?.[0]?.value?.[ts.values[0].value.length - 1]
      site_name = ts.sourceInfo?.siteName ?? null

      if (!latestValue) continue
      const val = parseFloat(latestValue.value)
      if (isNaN(val)) continue

      if (paramCode === '00060') {
        flow_cfs = val
        timestamp = latestValue.dateTime
      } else if (paramCode === '00010') {
        temp_celsius = val
        if (!timestamp) timestamp = latestValue.dateTime
      }
    }

    return { flow_cfs, temp_celsius, timestamp, site_id: siteId, site_name }
  } catch {
    return null
  }
}

export async function getUSGSMultipleSites(siteIds: string[]) {
  const sites = siteIds.join(',')
  const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${sites}&parameterCd=00060,00010&siteStatus=active`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data: USGSResponse = await res.json()
    return data.value?.timeSeries ?? []
  } catch {
    return []
  }
}
