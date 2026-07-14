'use client'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { sliceRiverBetween } from '@/lib/river-regulation-segments'
import { SKAGIT_COORDS } from '@/lib/river-coords-generated'

export type RiverSectionStatus = 'open' | 'closed' | 'emergency' | 'restricted'

export interface RiverSectionMapInnerProps {
  sectionName: string
  startLabel: string
  endLabel: string
  coordinates: [number, number][]
  status: RiverSectionStatus
  detail?: string
  /** Which river's OSM trace to slice from (e.g. 'skagit') */
  riverId?: string
  /** Boundary landmark coord for the start of this section */
  startCoord?: [number, number]
  /** Boundary landmark coord for the end of this section */
  endCoord?: [number, number]
}

/** Map child that re-fits bounds whenever the sliced coords change */
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(
        L.latLngBounds(coords.map(c => [c[0], c[1]] as [number, number])),
        { padding: [40, 40] }
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords])
  return null
}

const STATUS_COLOR: Record<RiverSectionStatus, string> = {
  open:       '#4ade80',
  closed:     '#ef4444',
  emergency:  '#f97316',
  restricted: '#fbbf24',
}

function makeLabelIcon(text: string, color: string, anchor: 'start' | 'end') {
  // Pill label centered horizontally above the marker point
  const html = `
    <div style="
      display:inline-block;
      background:#111118;
      border:2px solid ${color};
      color:#fff;
      padding:3px 8px;
      border-radius:6px;
      font-size:11px;
      font-weight:700;
      white-space:nowrap;
      box-shadow:0 2px 10px rgba(0,0,0,0.85);
      transform:translate(-50%, -110%);
    ">${text}</div>
  `
  return L.divIcon({
    className: '',
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

function makeDotIcon(color: string) {
  const html = `
    <div style="
      width:12px;height:12px;
      background:${color};
      border:3px solid #111118;
      border-radius:50%;
      box-shadow:0 0 6px ${color};
      margin-top:-6px;margin-left:-6px;
    "></div>
  `
  return L.divIcon({
    className: '',
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

export default function RiverSectionMapInner({
  startLabel,
  endLabel,
  coordinates,
  status,
  riverId,
  startCoord,
  endCoord,
}: RiverSectionMapInnerProps) {
  const color = STATUS_COLOR[status]

  // Slice the real OSM river trace instead of drawing a straight line
  const polylineCoords = useMemo<[number, number][]>(() => {
    if (riverId === 'skagit' && startCoord && endCoord) {
      const sliced = sliceRiverBetween(SKAGIT_COORDS, startCoord, endCoord)
      if (sliced.length > 1) return sliced
    }
    return coordinates
  }, [riverId, startCoord, endCoord, coordinates])

  // Compute initial bounds from the sliced polyline (will also be re-fit by FitBounds)
  const bounds = L.latLngBounds(
    polylineCoords.map(c => [c[0], c[1]] as [number, number])
  )

  // Pin markers stay at the exact section boundary coords
  const startPin = startCoord ?? coordinates[0]
  const endPin   = endCoord   ?? coordinates[coordinates.length - 1]

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [40, 40] }}
      style={{ height: '100%', width: '100%', background: '#b8d8ea' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {/* Fit bounds to the sliced polyline with ~20% padding */}
      <FitBounds coords={polylineCoords} />

      {/* Section polyline — real OSM river trace */}
      <Polyline
        positions={polylineCoords}
        pathOptions={{
          color,
          weight: 7,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {/* Start dot + label */}
      <Marker position={[startPin[0], startPin[1]]} icon={makeDotIcon(color)} />
      <Marker position={[startPin[0], startPin[1]]} icon={makeLabelIcon(startLabel, color, 'start')} />

      {/* End dot + label */}
      <Marker position={[endPin[0], endPin[1]]} icon={makeDotIcon(color)} />
      <Marker position={[endPin[0], endPin[1]]} icon={makeLabelIcon(endLabel, color, 'end')} />
    </MapContainer>
  )
}
