'use client'

import { useEffect, useRef, useState } from 'react'
import type { WaterBody } from '@/types'

const WATER_COORDS: Record<string, [number, number]> = {
  'Skagit River': [48.4932, -121.8],
  'Snoqualmie River': [47.5293, -121.8309],
  'Green River': [47.3607, -122.0566],
  'Skykomish River': [47.8593, -121.6066],
  'Lake Washington': [47.6200, -122.2571],
  'Lake Sammamish': [47.5924, -122.0855],
  'Banks Lake': [47.8200, -119.2900],
  'Lake Chelan': [47.8400, -120.0200],
  'Ross Lake': [48.7300, -121.0600],
  'Columbia River': [46.2000, -119.2000],
  'Snake River': [46.4000, -118.4000],
  'Yakima River': [46.6400, -120.5100],
  'Methow River': [48.5500, -119.9900],
  'Wenatchee River': [47.6800, -120.4400],
  'Puget Sound': [47.6588, -122.4190],
  'Hood Canal': [47.6200, -123.0200],
  'Willapa Bay': [46.6800, -123.9500],
  'Grays Harbor': [46.9500, -124.1000],
  'Spokane River': [47.6588, -117.4260],
  'Pend Oreille River': [48.5000, -117.0000],
}

interface UsgsSite {
  id: string
  name: string
  lat: number
  lng: number
  type: string
}

interface WaterBodyWithStatus extends WaterBody {
  hasOpenSeason: boolean
}

interface Props {
  waters: WaterBodyWithStatus[]
  coords: Record<string, [number, number]>
  onSelect: (water: WaterBodyWithStatus) => void
}

export default function MapInner({ waters, onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null)
  const [usgsLoading, setUsgsLoading] = useState(true)

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    async function initMap() {
      const L = (await import('leaflet')).default

      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [47.5, -120.5],
        zoom: 7,
        zoomControl: true,
      })
      leafletMapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map)

      // Add tooltip styles
      const style = document.createElement('style')
      style.innerHTML = `.castwa-tooltip {
        background: #0c2a3e;
        border: 1px solid #0369a1;
        color: #e0f2fe;
        font-size: 12px;
        border-radius: 6px;
        padding: 4px 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      }
      .castwa-tooltip::before { display: none; }
      .leaflet-tooltip-top::before { border-top-color: #0369a1; }`
      document.head.appendChild(style)

      // Add Supabase water markers (green/grey by open season status)
      for (const water of waters) {
        const coords = WATER_COORDS[water.name]
        if (!coords) continue

        const color = water.hasOpenSeason ? '#22c55e' : '#6b7280'

        const svgIcon = L.divIcon({
          className: '',
          html: `<div style="
            width: 14px; height: 14px;
            border-radius: 50%;
            background: ${color};
            border: 2px solid ${water.hasOpenSeason ? '#16a34a' : '#4b5563'};
            box-shadow: 0 0 6px ${water.hasOpenSeason ? '#22c55e88' : '#00000044'};
            cursor: pointer;
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })

        const marker = L.marker(coords, { icon: svgIcon })
        marker.bindTooltip(water.name, {
          permanent: false,
          className: 'castwa-tooltip',
          direction: 'top',
          offset: [0, -8],
        })
        marker.on('click', () => onSelect(water))
        marker.addTo(map)
      }

      // Fetch and render live USGS sites
      try {
        const res = await fetch('/api/usgs-sites')
        const data: { sites: UsgsSite[] } = await res.json()
        setUsgsLoading(false)

        for (const site of data.sites) {
          const color = site.type === 'LK' ? '#3b82f6' : '#14b8a6'
          const border = site.type === 'LK' ? '#1d4ed8' : '#0f766e'

          const dotIcon = L.divIcon({
            className: '',
            html: `<div style="
              width: 10px; height: 10px;
              border-radius: 50%;
              background: ${color};
              border: 1.5px solid ${border};
              box-shadow: 0 0 4px ${color}88;
              cursor: pointer;
            "></div>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          })

          const marker = L.marker([site.lat, site.lng], { icon: dotIcon })
          marker.bindTooltip(site.name, {
            permanent: false,
            className: 'castwa-tooltip',
            direction: 'top',
            offset: [0, -6],
          })
          marker.bindPopup(`
            <div style="font-family:sans-serif; color:#e0f2fe; background:#0c2a3e; padding:4px;">
              <strong style="color:#fff">${site.name}</strong><br/>
              <span style="color:#7dd3fc; font-size:11px;">${site.type === 'LK' ? '🏞️ Lake' : '🌊 Stream'}</span><br/>
              <a href="https://waterdata.usgs.gov/monitoring-location/${site.id}" target="_blank" rel="noopener"
                style="color:#38bdf8; font-size:11px; text-decoration:underline;">
                View USGS data →
              </a>
            </div>
          `, {
            className: 'castwa-popup',
          })
          marker.addTo(map)
        }

        // Style the popup
        const popupStyle = document.createElement('style')
        popupStyle.innerHTML = `.castwa-popup .leaflet-popup-content-wrapper {
          background: #0c2a3e;
          border: 1px solid #0369a1;
          border-radius: 8px;
          color: #e0f2fe;
          box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        }
        .castwa-popup .leaflet-popup-tip { background: #0c2a3e; }`
        document.head.appendChild(popupStyle)
      } catch {
        setUsgsLoading(false)
      }
    }

    initMap()

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
      {usgsLoading && (
        <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 rounded-lg bg-water-950/80 px-3 py-1.5 text-xs text-water-300 backdrop-blur">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-water-400" />
          Loading USGS monitoring sites…
        </div>
      )}
    </div>
  )
}

