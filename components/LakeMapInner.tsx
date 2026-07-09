'use client'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import type { GeoJsonObject } from 'geojson'

interface Props {
  waterName: string
  lat: number
  lng: number
  /** Optional fill color for the polygon (defaults to '#3b82f6' — blue). */
  fillColor?: string
}

/** Fit the map to the polygon bounds once it arrives. */
function FitToPolygon({ geojson }: { geojson: GeoJsonObject }) {
  const map = useMap()
  useEffect(() => {
    // Delay slightly so the map container is fully sized before we call
    // fitBounds — otherwise Leaflet may only see a 0×0 or partial viewport.
    const timer = setTimeout(() => {
      try {
        map.invalidateSize()          // force Leaflet to recalculate container size
        const layer = L.geoJSON(geojson)
        const bounds = layer.getBounds()
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [40, 40],        // generous padding so edges aren't clipped
            maxZoom: 14,              // don't zoom in too tight on tiny ponds
            animate: false,
          })
        }
      } catch { /* ignore invalid geometry */ }
    }, 100)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojson])
  return null
}

/**
 * Fetches the water-body polygon from Nominatim and renders it as a filled
 * GeoJSON overlay on an OSM tile layer.
 *
 * Falls back to a plain centred view (zoom 12) if Nominatim returns no
 * polygon — the OSM tiles will still show the lake shape naturally.
 */
export default function LakeMapInner({ waterName, lat, lng, fillColor = '#3b82f6' }: Props) {
  const [geojson, setGeojson] = useState<GeoJsonObject | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchPolygon() {
      try {
        const q = encodeURIComponent(waterName)
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${q}&format=json&polygon_geojson=1&limit=3&countrycodes=us`

        const res = await fetch(url, {
          headers: { 'User-Agent': 'CastWA/1.0 (castwa.com)' },
          // No caching needed — called once per sheet open
        })
        if (!res.ok) return

        const data: Array<{ geojson?: GeoJsonObject & { type: string } }> = await res.json()

        // Pick the first result that has actual polygon geometry (not a Point)
        const feature = data.find(
          d => d.geojson && d.geojson.type !== 'Point' && d.geojson.type !== 'MultiPoint'
        )

        if (!cancelled && feature?.geojson) {
          setGeojson(feature.geojson)
        }
      } catch {
        // Silently fall through to tile-only fallback
      }
    }

    fetchPolygon()
    return () => { cancelled = true }
  }, [waterName])

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={10}
      style={{ height: '100%', width: '100%', background: '#b8d8ea' }}
      zoomControl={false}
      attributionControl={false}
    >
      {/* OSM tiles — show lake shape naturally even if Nominatim fails */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {geojson && (
        <>
          <FitToPolygon geojson={geojson} />
          <GeoJSON
            key={waterName}
            data={geojson}
            style={() => ({
              color: fillColor,
              weight: 2.5,
              opacity: 0.9,
              fillColor,
              fillOpacity: 0.28,
            })}
          />
        </>
      )}
    </MapContainer>
  )
}
